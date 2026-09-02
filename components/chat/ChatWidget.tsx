"use client";
import { useEffect, useRef, useState } from "react";
import { supabase, authHeaders, type Mensaje, type Rol, type TipoMensaje } from "@/lib/supabase";
import { useClub } from "@/lib/club-context";
import toast from "react-hot-toast";

interface CoachRow { id: string; nombre: string; conversacion_id: string | null; ultimo_texto: string; no_leidos: number; ultimo_at: string }

const fmtHora = (iso: string) => new Date(iso).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
const MAX_MB = 10;

function CheckIcon({ doble }: { doble: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className={doble ? "opacity-100" : "opacity-60"}>
      <path d="M1 8.5l3 3L10 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      {doble && <path d="M5.5 8.5l3 3L15 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>}
    </svg>
  );
}

export default function ChatWidget() {
  const { modulosActivos } = useClub();
  const [yo, setYo] = useState<{ id: string; nombre: string; rol: Rol } | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [noLeidosTotal, setNoLeidosTotal] = useState(0);

  // Coach: su propia conversación. Admin: bandeja de coaches.
  const [miConversacionId, setMiConversacionId] = useState<string | null>(null);
  const [coaches, setCoaches] = useState<CoachRow[]>([]);
  const [coachActivo, setCoachActivo] = useState<CoachRow | null>(null);

  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [notifOk, setNotifOk] = useState(true);
  const [otroEscribiendo, setOtroEscribiendo] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  const esAdmin = yo?.rol === "admin";
  const conversacionActivaId = esAdmin ? coachActivo?.conversacion_id ?? null : miConversacionId;

  // ── Cargar usuario actual ──
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("entrenadores").select("id, nombre, rol").eq("id", user.id).single();
      if (data && ["entrenador", "ambos", "admin"].includes(data.rol)) setYo(data as any);
    };
    load();
  }, []);

  // ── Coach: asegurar que su conversación exista ──
  useEffect(() => {
    if (!yo || esAdmin) return;
    const ensure = async () => {
      const { data: existente } = await supabase.from("conversaciones").select("id").eq("entrenador_id", yo.id).maybeSingle();
      if (existente) { setMiConversacionId(existente.id); return; }
      const { data: creada, error } = await supabase.from("conversaciones").insert({ entrenador_id: yo.id }).select("id").single();
      if (creada) { setMiConversacionId(creada.id); return; }
      // Carrera: alguien más (ej. el admin) la creó justo antes — la buscamos de nuevo.
      if (error) {
        const { data: retry } = await supabase.from("conversaciones").select("id").eq("entrenador_id", yo.id).maybeSingle();
        if (retry) setMiConversacionId(retry.id);
      }
    };
    ensure();
  }, [yo, esAdmin]);

  // ── Admin: cargar bandeja de coaches ──
  const cargarBandeja = async () => {
    if (!yo) return;
    const { data: ents } = await supabase.from("entrenadores").select("id, nombre").in("rol", ["entrenador", "ambos"]).order("nombre");
    const lista = ents ?? [];
    const { data: convs } = await supabase.from("conversaciones").select("id, entrenador_id, ultimo_mensaje_at");
    const convMap: Record<string, { id: string; ultimo_mensaje_at: string }> = {};
    (convs ?? []).forEach((c) => { convMap[c.entrenador_id] = c; });

    const convIds = (convs ?? []).map((c) => c.id);
    let ultimosPorConv: Record<string, { texto: string; tipo: TipoMensaje; created_at: string }> = {};
    let noLeidosPorConv: Record<string, number> = {};
    if (convIds.length > 0) {
      const { data: msgs } = await supabase.from("mensajes").select("conversacion_id, texto, tipo, created_at, leido_por_admin, autor_id, eliminado")
        .in("conversacion_id", convIds).order("created_at", { ascending: true });
      (msgs ?? []).forEach((m) => {
        ultimosPorConv[m.conversacion_id] = { texto: m.eliminado ? "Mensaje eliminado" : (m.tipo === "imagen" ? "📷 Foto" : m.tipo === "documento" ? "📎 Documento" : m.texto), tipo: m.tipo, created_at: m.created_at };
        if (!m.leido_por_admin && m.autor_id !== yo.id) {
          noLeidosPorConv[m.conversacion_id] = (noLeidosPorConv[m.conversacion_id] ?? 0) + 1;
        }
      });
    }

    const rows: CoachRow[] = lista.map((e) => {
      const conv = convMap[e.id];
      const ultimo = conv ? ultimosPorConv[conv.id] : undefined;
      return {
        id: e.id, nombre: e.nombre,
        conversacion_id: conv?.id ?? null,
        ultimo_texto: ultimo?.texto ?? "Sin mensajes todavía",
        ultimo_at: conv?.ultimo_mensaje_at ?? "",
        no_leidos: conv ? noLeidosPorConv[conv.id] ?? 0 : 0,
      };
    });
    rows.sort((a, b) => (b.ultimo_at || "").localeCompare(a.ultimo_at || ""));
    setCoaches(rows);
    setNoLeidosTotal(rows.reduce((s, r) => s + r.no_leidos, 0));
  };

  useEffect(() => { if (yo && esAdmin) cargarBandeja(); }, [yo, esAdmin]); // eslint-disable-line

  // ── Cargar mensajes de la conversación activa + marcar como leídos ──
  useEffect(() => {
    if (!conversacionActivaId || !yo) { setMensajes([]); return; }
    const load = async () => {
      const { data } = await supabase.from("mensajes").select("*").eq("conversacion_id", conversacionActivaId).order("created_at", { ascending: true });
      setMensajes(data ?? []);
      const campo = esAdmin ? "leido_por_admin" : "leido_por_coach";
      await supabase.from("mensajes").update({ [campo]: true }).eq("conversacion_id", conversacionActivaId).neq("autor_id", yo.id).eq(campo, false);
      if (esAdmin) cargarBandeja();
    };
    load();
  }, [conversacionActivaId, yo, esAdmin]); // eslint-disable-line

  // ── Realtime: mensajes nuevos + actualizados (leído / eliminado) ──
  useEffect(() => {
    if (!yo) return;
    const channel = supabase
      .channel(`chat-${yo.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensajes" }, (payload) => {
        const nuevo = payload.new as Mensaje;
        if (nuevo.conversacion_id === conversacionActivaId && abierto) {
          setMensajes((prev) => [...prev, nuevo]);
          if (nuevo.autor_id !== yo.id) {
            const campo = esAdmin ? "leido_por_admin" : "leido_por_coach";
            supabase.from("mensajes").update({ [campo]: true }).eq("id", nuevo.id).then(() => {});
          }
        } else if (nuevo.autor_id !== yo.id) {
          if (esAdmin) cargarBandeja();
          else setNoLeidosTotal((n) => n + 1);
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "mensajes" }, (payload) => {
        const act = payload.new as Mensaje;
        if (act.conversacion_id === conversacionActivaId) {
          setMensajes((prev) => prev.map((m) => (m.id === act.id ? act : m)));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [yo, conversacionActivaId, abierto, esAdmin]); // eslint-disable-line

  // ── Coach: calcular no leídos iniciales ──
  useEffect(() => {
    if (!yo || esAdmin || !miConversacionId) return;
    supabase.from("mensajes").select("id", { count: "exact", head: true })
      .eq("conversacion_id", miConversacionId).eq("leido_por_coach", false).neq("autor_id", yo.id)
      .then(({ count }) => setNoLeidosTotal(count ?? 0));
  }, [yo, esAdmin, miConversacionId]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [mensajes, otroEscribiendo]);

  // ── "Escribiendo..." — canal efímero por conversación, no se guarda en BD ──
  useEffect(() => {
    setOtroEscribiendo(false);
    if (!conversacionActivaId) { typingChannelRef.current = null; return; }
    const channel = supabase.channel(`typing-${conversacionActivaId}`, { config: { broadcast: { self: false } } });
    channel.on("broadcast", { event: "typing" }, () => {
      setOtroEscribiendo(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setOtroEscribiendo(false), 3000);
    }).subscribe();
    typingChannelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [conversacionActivaId]);

  const onCambioTexto = (v: string) => {
    setTexto(v);
    const now = Date.now();
    if (now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      typingChannelRef.current?.send({ type: "broadcast", event: "typing", payload: {} });
    }
  };

  // ── Estado de notificaciones ──
  useEffect(() => {
    if (!yo) return;
    if (!("Notification" in window)) { setNotifOk(true); return; }
    setNotifOk(Notification.permission === "granted");
  }, [yo]);

  const activarNotificaciones = async () => {
    if (!yo) return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isPWA = (navigator as any).standalone === true || window.matchMedia("(display-mode: standalone)").matches;
    if (isIOS && !isPWA) {
      toast("En iPhone, primero agrega esta app a tu pantalla de inicio (Compartir → Agregar a pantalla de inicio) para poder activar notificaciones.");
      return;
    }
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      const { error } = await supabase.from("push_subscriptions").insert({ entrenador_id: yo.id, subscription: sub.toJSON() });
      if (error) { toast.error("No se pudo activar la notificación. Inténtalo de nuevo o avisa al administrador."); return; }
      setNotifOk(true);
      toast.success("Notificaciones activadas");
    } catch {
      toast.error("No se pudo activar la notificación en este navegador.");
    }
  };

  const avisarNuevoMensaje = async (cuerpoPreview: string) => {
    if (!conversacionActivaId) return;
    const headers = await authHeaders();
    fetch("/api/notificar-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ conversacion_id: conversacionActivaId, texto: cuerpoPreview }),
    }).catch(() => {});
  };

  const enviar = async () => {
    if (!texto.trim() || !yo || !conversacionActivaId || enviando) return;
    setEnviando(true);
    const cuerpo = texto.trim();
    setTexto("");
    const { error } = await supabase.from("mensajes").insert({
      conversacion_id: conversacionActivaId,
      autor_id: yo.id,
      texto: cuerpo,
      tipo: "texto",
      leido_por_coach: !esAdmin,
      leido_por_admin: esAdmin,
    });
    if (!error) {
      await supabase.from("conversaciones").update({ ultimo_mensaje_at: new Date().toISOString() }).eq("id", conversacionActivaId);
      avisarNuevoMensaje(cuerpo);
    } else {
      toast.error("No se pudo enviar el mensaje.");
    }
    setEnviando(false);
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !yo || !conversacionActivaId) return;
    if (file.size > MAX_MB * 1024 * 1024) { toast.error(`El archivo no puede pesar más de ${MAX_MB}MB.`); return; }

    setSubiendo(true);
    const tipo: TipoMensaje = file.type.startsWith("image/") ? "imagen" : "documento";
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${conversacionActivaId}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage.from("chat").upload(path, file, { contentType: file.type || "application/octet-stream" });
    if (upErr) { toast.error("No se pudo subir el archivo."); setSubiendo(false); return; }
    const url = supabase.storage.from("chat").getPublicUrl(path).data.publicUrl;

    const cuerpo = texto.trim();
    setTexto("");
    const { error } = await supabase.from("mensajes").insert({
      conversacion_id: conversacionActivaId,
      autor_id: yo.id,
      texto: cuerpo,
      tipo, archivo_url: url, archivo_nombre: file.name,
      leido_por_coach: !esAdmin,
      leido_por_admin: esAdmin,
    });
    if (!error) {
      await supabase.from("conversaciones").update({ ultimo_mensaje_at: new Date().toISOString() }).eq("id", conversacionActivaId);
      avisarNuevoMensaje(tipo === "imagen" ? "📷 Foto" : `📎 ${file.name}`);
    } else {
      toast.error("No se pudo enviar el archivo.");
    }
    setSubiendo(false);
  };

  const eliminarMensaje = async (id: string) => {
    const { error } = await supabase.from("mensajes").update({ eliminado: true }).eq("id", id);
    if (error) { toast.error("No se pudo eliminar el mensaje."); return; }
    setMensajes((prev) => prev.map((m) => (m.id === id ? { ...m, eliminado: true } : m)));
  };

  const abrirConCoach = async (c: CoachRow) => {
    if (!c.conversacion_id) {
      const { data, error } = await supabase.from("conversaciones").insert({ entrenador_id: c.id }).select("id").single();
      if (data) { c = { ...c, conversacion_id: data.id }; }
      else if (error) {
        const { data: retry } = await supabase.from("conversaciones").select("id").eq("entrenador_id", c.id).maybeSingle();
        if (retry) c = { ...c, conversacion_id: retry.id };
      }
    }
    setCoachActivo(c);
  };

  if (!yo || !modulosActivos.includes("chat")) return null;

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-24 z-40">
      {!abierto && (
        <button onClick={() => setAbierto(true)}
          className="relative w-14 h-14 rounded-full bg-pantera-green shadow-xl flex items-center justify-center active:scale-90 transition-transform">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
          </svg>
          {noLeidosTotal > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-[var(--bg-page,#0a0a0a)]">
              {noLeidosTotal > 9 ? "9+" : noLeidosTotal}
            </span>
          )}
        </button>
      )}

      {abierto && (
        <div className="w-[92vw] max-w-sm h-[70vh] max-h-[560px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden"
          style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>

          <header className="px-4 py-3 flex items-center justify-between border-b bg-pantera-green" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2 min-w-0">
              {esAdmin && coachActivo && (
                <button onClick={() => setCoachActivo(null)} className="text-white/90 hover:text-white flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
              )}
              <p className="text-white font-bold text-sm truncate" style={{ fontFamily: "Syne, sans-serif" }}>
                {esAdmin ? (coachActivo ? coachActivo.nombre : "Mensajes") : "Administración"}
              </p>
            </div>
            <button onClick={() => setAbierto(false)} className="text-white/90 hover:text-white flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </header>

          {!notifOk && (
            <button onClick={activarNotificaciones}
              className="px-4 py-2 text-xs font-semibold text-left bg-pantera-green/10 text-pantera-green border-b flex items-center justify-between gap-2"
              style={{ borderColor: "var(--border-subtle)" }}>
              Activar notificaciones para no perderte mensajes
              <span className="underline flex-shrink-0">Activar</span>
            </button>
          )}

          {esAdmin && !coachActivo ? (
            <div className="flex-1 overflow-y-auto">
              {coaches.length === 0 ? (
                <p className="text-sm text-center py-10 px-4" style={{ color: "var(--text-muted)" }}>No hay entrenadores registrados.</p>
              ) : coaches.map((c) => (
                <button key={c.id} onClick={() => abrirConCoach(c)}
                  className="w-full text-left px-4 py-3 border-b flex items-center justify-between gap-2 hover:bg-white/[0.03] transition-colors"
                  style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{c.nombre}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{c.ultimo_texto}</p>
                  </div>
                  {c.no_leidos > 0 && (
                    <span className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-pantera-green text-white text-[10px] font-bold flex items-center justify-center">
                      {c.no_leidos}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {mensajes.length === 0 ? (
                  <p className="text-xs text-center py-8" style={{ color: "var(--text-muted)" }}>
                    Manda el primer mensaje.
                  </p>
                ) : mensajes.map((m) => {
                  const esMio = m.autor_id === yo.id;
                  const otroLeyo = esAdmin ? m.leido_por_coach : m.leido_por_admin;
                  return (
                    <div key={m.id} className={`flex ${esMio ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${esMio ? "bg-pantera-green text-white" : ""}`}
                        style={!esMio ? { background: "var(--bg-surface-1)", color: "var(--text-primary)" } : undefined}>
                        {m.eliminado ? (
                          <p className="text-sm italic opacity-70">Mensaje eliminado</p>
                        ) : (
                          <>
                            {m.tipo === "imagen" && m.archivo_url && (
                              <a href={m.archivo_url} target="_blank" rel="noreferrer">
                                <img src={m.archivo_url} alt="" className="rounded-lg max-w-full max-h-52 object-cover mb-1" />
                              </a>
                            )}
                            {m.tipo === "documento" && m.archivo_url && (
                              <a href={m.archivo_url} target="_blank" rel="noreferrer"
                                className={`flex items-center gap-2 rounded-lg px-2 py-2 mb-1 ${esMio ? "bg-white/15" : ""}`}
                                style={!esMio ? { background: "var(--bg-surface-2)" } : undefined}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                </svg>
                                <span className="text-xs truncate">{m.archivo_nombre}</span>
                              </a>
                            )}
                            {m.texto && <p className="text-sm whitespace-pre-wrap break-words">{m.texto}</p>}
                          </>
                        )}
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          {esMio && !m.eliminado && (
                            <button onClick={() => eliminarMensaje(m.id)} title="Eliminar"
                              className={`mr-0.5 ${esMio ? "text-white/60 hover:text-white" : ""}`}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                              </svg>
                            </button>
                          )}
                          <p className={`text-[10px] ${esMio ? "text-white/70" : ""}`} style={!esMio ? { color: "var(--text-muted)" } : undefined}>
                            {fmtHora(m.created_at)}
                          </p>
                          {esMio && <CheckIcon doble={!!otroLeyo} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {otroEscribiendo && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl px-3 py-2 text-xs italic" style={{ background: "var(--bg-surface-1)", color: "var(--text-muted)" }}>
                      Escribiendo...
                    </div>
                  </div>
                )}
              </div>
              <div className="p-2.5 border-t flex items-center gap-2" style={{ borderColor: "var(--border-subtle)" }}>
                <input ref={fileInputRef} type="file" accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" className="hidden" onChange={onFileSelected} />
                <button onClick={() => fileInputRef.current?.click()} disabled={subiendo}
                  title="Adjuntar archivo"
                  className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center link-muted-theme disabled:opacity-40 transition-colors">
                  {subiendo ? (
                    <div className="w-4 h-4 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                    </svg>
                  )}
                </button>
                <input value={texto} onChange={(e) => onCambioTexto(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviar(); } }}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 min-w-0 bg-transparent border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-pantera-green/50"
                  style={{ borderColor: "var(--border-strong)", color: "var(--text-primary)" }} />
                <button onClick={enviar} disabled={!texto.trim() || enviando}
                  className="flex-shrink-0 w-9 h-9 rounded-full bg-pantera-green text-white flex items-center justify-center disabled:opacity-40 transition-opacity">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
