"use client";
import { useEffect, useRef, useState } from "react";
import { supabase, authHeaders, type Mensaje, type Rol } from "@/lib/supabase";
import { useClub } from "@/lib/club-context";

interface CoachRow { id: string; nombre: string; conversacion_id: string | null; ultimo_texto: string; no_leidos: number; ultimo_at: string }

const fmtHora = (iso: string) => new Date(iso).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });

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
  const [notifOk, setNotifOk] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const { data: creada } = await supabase.from("conversaciones").insert({ entrenador_id: yo.id }).select("id").single();
      if (creada) setMiConversacionId(creada.id);
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
    let ultimosPorConv: Record<string, { texto: string; created_at: string }> = {};
    let noLeidosPorConv: Record<string, number> = {};
    if (convIds.length > 0) {
      const { data: msgs } = await supabase.from("mensajes").select("conversacion_id, texto, created_at, leido_por_admin, autor_id")
        .in("conversacion_id", convIds).order("created_at", { ascending: true });
      (msgs ?? []).forEach((m) => {
        ultimosPorConv[m.conversacion_id] = { texto: m.texto, created_at: m.created_at };
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

  // ── Realtime: mensajes nuevos ──
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

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [mensajes]);

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
      alert("En iPhone, primero agrega esta app a tu pantalla de inicio (Compartir → Agregar a pantalla de inicio) para poder activar notificaciones.");
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
      await supabase.from("push_subscriptions").insert({ entrenador_id: yo.id, subscription: sub.toJSON() });
      setNotifOk(true);
    } catch { /* silencioso */ }
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
      leido_por_coach: !esAdmin,
      leido_por_admin: esAdmin,
    });
    if (!error) {
      await supabase.from("conversaciones").update({ ultimo_mensaje_at: new Date().toISOString() }).eq("id", conversacionActivaId);
      fetch("/api/notificar-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ conversacion_id: conversacionActivaId, texto: cuerpo }),
      }).catch(() => {});
    }
    setEnviando(false);
  };

  const abrirConCoach = async (c: CoachRow) => {
    if (!c.conversacion_id) {
      const { data } = await supabase.from("conversaciones").insert({ entrenador_id: c.id }).select("id").single();
      if (data) c = { ...c, conversacion_id: data.id };
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
        <div className="w-[92vw] max-w-sm h-[70vh] max-h-[520px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden"
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
                  return (
                    <div key={m.id} className={`flex ${esMio ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${esMio ? "bg-pantera-green text-white" : ""}`}
                        style={!esMio ? { background: "var(--bg-surface-1)", color: "var(--text-primary)" } : undefined}>
                        <p className="text-sm whitespace-pre-wrap break-words">{m.texto}</p>
                        <p className={`text-[10px] mt-0.5 ${esMio ? "text-white/70" : ""}`} style={!esMio ? { color: "var(--text-muted)" } : undefined}>
                          {fmtHora(m.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="p-2.5 border-t flex items-center gap-2" style={{ borderColor: "var(--border-subtle)" }}>
                <input value={texto} onChange={(e) => setTexto(e.target.value)}
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
