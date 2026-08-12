"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import toast from "react-hot-toast";

const CLUB_LOGO = process.env.NEXT_PUBLIC_CLUB_LOGO_URL || "/icon-192.png";
const CLUB_NOMBRE = process.env.NEXT_PUBLIC_CLUB_NOMBRE || "Panteras Saltillo";

interface Partido {
  id: string;
  fecha: string | null;
  hora_juego: string | null;
  rival?: string;
  lugar?: string;
  liga?: string;
  uniforme?: string;
  goles_favor?: number | null;
  goles_contra?: number | null;
  categoria_nombre?: string;
  confirmacion: "pendiente" | "asiste" | "no_asiste";
  confirmadas: number;
  total_padres: number;
  hijo_asistio: boolean | null;
}

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const fmtFecha = (f: string | null) => {
  if (!f) return "Fecha por confirmar";
  const [, m, d] = f.split("-");
  return `${parseInt(d)} ${MESES[parseInt(m) - 1]}`;
};

const fmtHora = (h: string | null) => {
  if (!h) return "";
  const [hr, min] = h.split(":");
  const n = parseInt(hr);
  return `${n > 12 ? n - 12 : n}:${min} ${n >= 12 ? "PM" : "AM"}`;
};

const resultTipo = (gf: number, gc: number) =>
  gf > gc ? "victoria" : gf === gc ? "empate" : "derrota";

const uniformeDot = (uni: string | undefined) => {
  if (uni === "verde")  return "bg-pantera-green";
  if (uni === "blanco") return "bg-white border border-gray-600";
  if (uni === "negro")  return "bg-gray-800 border border-gray-500";
  return "bg-gray-600";
};

export default function PapaPage() {
  const router = useRouter();
  const [padre,    setPadre]   = useState<{ nombre: string; categoria_id: string; categorias?: { nombre: string } } | null>(null);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [notifOk,  setNotifOk]  = useState(false);
  const [iosGuia,  setIosGuia]  = useState(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let tokenRef = "";

    const fetchPartidos = async (token: string, catNombre?: string) => {
      const res = await fetch("/api/mis-partidos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(`API ${res.status}: ${err.error ?? "error"}`);
        return;
      }
      const { data } = await res.json();
      const mapped: Partido[] = (data as any[] ?? []).map((c) => ({
        id:              c.partido.id,
        fecha:           c.partido.fecha ?? null,
        hora_juego:      c.partido.hora_juego ?? null,
        rival:           c.partido.rival ?? undefined,
        lugar:           c.partido.lugar ?? undefined,
        liga:            c.partido.ligas?.nombre ?? undefined,
        uniforme:        c.partido.uniforme ?? undefined,
        goles_favor:     c.partido.goles_favor ?? null,
        goles_contra:    c.partido.goles_contra ?? null,
        categoria_nombre: catNombre,
        confirmacion:    (c.estado ?? "pendiente") as Partido["confirmacion"],
        confirmadas:     c.confirmadas ?? 0,
        total_padres:    c.total_padres ?? 0,
        hijo_asistio:    c.hijo_asistio ?? null,
      }));
      setPartidos(mapped);
    };

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/coach/login"); return; }

      tokenRef = session.access_token;
      const user = session.user;

      const { data: p } = await supabase
        .from("padres")
        .select("nombre, categoria_id, activo, categorias(nombre)")
        .eq("id", user.id)
        .single();

      if (!p || !p.activo) { router.replace("/coach/login"); return; }
      setPadre(p as any);

      const catNombre = (p.categorias as any)?.nombre;
      await fetchPartidos(tokenRef, catNombre);

      channel = supabase
        .channel(`confirmaciones-${user.id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "confirmaciones_partido",
          filter: `padre_id=eq.${user.id}`,
        }, () => { fetchPartidos(tokenRef, catNombre); })
        .subscribe();

      if ("Notification" in window && "serviceWorker" in navigator) {
        if (Notification.permission === "granted") {
          const { data: subs } = await supabase
            .from("push_subscriptions")
            .select("id")
            .eq("padre_id", user.id)
            .limit(1);

          if (subs && subs.length > 0) {
            try {
              const reg = await navigator.serviceWorker.ready;
              const currentSub = await reg.pushManager.getSubscription();
              const storedEndpoint = (subs[0] as any)?.subscription?.endpoint;
              if (currentSub && storedEndpoint && currentSub.endpoint !== storedEndpoint) {
                const newSub = await reg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
                });
                await supabase.from("push_subscriptions")
                  .update({ subscription: newSub.toJSON() })
                  .eq("padre_id", user.id);
              }
            } catch { /* silencioso */ }
            setNotifOk(true);
          } else {
            try {
              const reg = await navigator.serviceWorker.ready;
              const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
              });
              const { error: subError } = await supabase
                .from("push_subscriptions")
                .insert({ padre_id: user.id, subscription: sub.toJSON() });
              if (!subError) setNotifOk(true);
            } catch { /* silencioso */ }
          }
        }
      }
      setLoading(false);
    };

    init();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, []);

  const confirmar = async (partido_id: string, estado: "asiste" | "no_asiste") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("confirmaciones_partido").upsert({
      partido_id, padre_id: user.id, estado, updated_at: new Date().toISOString(),
    }, { onConflict: "partido_id,padre_id" });
    if (error) { toast.error("Error al confirmar"); return; }
    setPartidos((p) => p.map((pt) => pt.id === partido_id ? { ...pt, confirmacion: estado } : pt));
    toast.success(estado === "asiste" ? "Confirmado — Nos vemos en el partido" : "Registrado — No asistiras");
  };

  const quitarPartido = async (partido_id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("confirmaciones_partido")
      .delete().eq("partido_id", partido_id).eq("padre_id", user.id);
    setPartidos((p) => p.filter((pt) => pt.id !== partido_id));
  };

  const activarNotificaciones = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isPWA = (navigator as any).standalone === true ||
                  window.matchMedia("(display-mode: standalone)").matches;
    if (isIOS && !isPWA) { setIosGuia(true); return; }
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      toast("Las notificaciones no estan disponibles en este navegador");
      return;
    }
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") { toast("Permiso denegado"); return; }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("push_subscriptions").insert({ padre_id: user!.id, subscription: sub.toJSON() });
      setNotifOk(true);
      toast.success("Notificaciones activadas");
    } catch { toast("No se pudieron activar las notificaciones"); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const hoy = new Date().toISOString().split("T")[0];
  const proximos = partidos.filter((p) => !p.fecha || p.fecha >= hoy);
  const pasados  = partidos.filter((p) => !!p.fecha && p.fecha < hoy);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Header */}
      <header className="bg-[#0d0d0d] border-b border-white/[0.06] px-5 py-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Image src={CLUB_LOGO} alt={CLUB_NOMBRE} width={32} height={32} className="rounded-full" />
          <div>
            <p className="text-white font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
              Hola, {padre?.nombre.split(" ")[0]}
            </p>
            <p className="text-pantera-green text-[10px] font-semibold uppercase tracking-widest">
              {(padre?.categorias as any)?.nombre ?? "Panteras"}
            </p>
          </div>
        </div>
        <button onClick={async () => { await supabase.auth.signOut(); router.push("/"); }}
          className="text-xs text-gray-600 hover:text-white transition-colors">Salir</button>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Modal guia iOS */}
        {iosGuia && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0">
            <div className="bg-[#111] border border-white/[0.08] rounded-2xl p-6 w-full max-w-sm space-y-4">
              <div className="text-center">
                <p className="text-white font-bold text-lg" style={{ fontFamily: "Syne, sans-serif" }}>Activa en iPhone</p>
                <p className="text-gray-500 text-sm mt-1">Agrega la app a tu pantalla de inicio para recibir notificaciones</p>
              </div>
              <div className="space-y-3">
                {[
                  { icono: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>, texto: "Toca el boton compartir de Safari (flecha hacia arriba)" },
                  { icono: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>, texto: 'Selecciona "Agregar a pantalla de inicio"' },
                  { icono: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>, texto: "Abre la app desde el Home Screen y activa notificaciones" },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
                    <div className="w-7 h-7 rounded-lg bg-pantera-green/10 border border-pantera-green/20 flex items-center justify-center flex-shrink-0">{s.icono}</div>
                    <p className="text-gray-300 text-sm leading-relaxed">{s.texto}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setIosGuia(false)}
                className="bg-pantera-green hover:bg-pantera-green-dark text-white font-bold py-2.5 rounded-xl transition-colors w-full text-sm">
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Banner notificaciones */}
        {!notifOk && (
          <div className="bg-pantera-green/10 border border-pantera-green/25 rounded-xl p-4 flex items-start gap-3">
            <div className="flex-shrink-0 text-pantera-green mt-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold">Activa las notificaciones</p>
              <p className="text-gray-400 text-xs mt-0.5">Recibe alertas de partidos sin depender de WhatsApp</p>
            </div>
            <button onClick={activarNotificaciones}
              className="bg-pantera-green text-white text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0">
              Activar
            </button>
          </div>
        )}

        {/* Proximos partidos */}
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Proximos partidos</p>

          {proximos.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-10 text-center">
              <p className="text-gray-600 text-sm">No hay partidos programados proximos</p>
            </div>
          ) : proximos.map((pt) => (
            <div key={pt.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 mb-3">

              {/* Liga + convocado */}
              <div className="flex items-center justify-between mb-2.5">
                {pt.liga ? (
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{pt.liga}</span>
                ) : <span />}
                <span className="text-[10px] bg-pantera-green/10 text-pantera-green border border-pantera-green/20 px-2 py-0.5 rounded-full font-semibold">
                  Tu hijo fue convocado
                </span>
              </div>

              {/* Rival + estado de confirmacion */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-white font-bold text-base">
                    {pt.rival ? `vs ${pt.rival}` : "Partido"}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {fmtFecha(pt.fecha)}
                    {pt.hora_juego ? ` · ${fmtHora(pt.hora_juego)}` : ""}
                    {pt.lugar ? ` · ${pt.lugar}` : ""}
                  </p>
                </div>
                {pt.confirmacion === "asiste" && (
                  <span className="text-xs bg-pantera-green/10 text-pantera-green border border-pantera-green/25 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">Confirmado</span>
                )}
                {pt.confirmacion === "no_asiste" && (
                  <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/25 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">No asiste</span>
                )}
              </div>

              {/* Uniforme + confirmaciones */}
              {(pt.uniforme || pt.total_padres > 0) && (
                <div className="flex items-center gap-4 mb-3">
                  {pt.uniforme && (
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${uniformeDot(pt.uniforme)}`} />
                      <span className="text-gray-400 text-xs capitalize">Uniforme {pt.uniforme}</span>
                    </div>
                  )}
                  {pt.total_padres > 0 && (
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                        <path d="M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                      <span className="text-gray-500 text-xs">
                        {pt.confirmadas} de {pt.total_padres} {pt.total_padres === 1 ? "familia" : "familias"} {pt.confirmadas === 1 ? "confirmo" : "confirmaron"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Botones */}
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => confirmar(pt.id, "asiste")}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                    pt.confirmacion === "asiste"
                      ? "bg-pantera-green text-white"
                      : "border border-white/10 text-gray-400 hover:border-pantera-green/40 hover:text-pantera-green"
                  }`}>
                  Si asisto
                </button>
                <button onClick={() => confirmar(pt.id, "no_asiste")}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                    pt.confirmacion === "no_asiste"
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "border border-white/10 text-gray-400 hover:border-red-500/30 hover:text-red-400"
                  }`}>
                  No puedo asistir
                </button>
              </div>

              <div className="flex items-center justify-between mt-2">
                {pt.confirmacion !== "pendiente" && (
                  <button onClick={() => confirmar(pt.id, "pendiente" as any)}
                    className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
                    Restablecer
                  </button>
                )}
                <button onClick={() => quitarPartido(pt.id)}
                  className="text-gray-700 hover:text-red-400 text-xs transition-colors ml-auto">
                  Quitar de mi lista
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Historial de partidos */}
        {pasados.length > 0 && (
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Partidos pasados</p>
            {pasados.map((pt) => {
              const tieneResultado = pt.goles_favor !== null && pt.goles_favor !== undefined && pt.goles_contra !== null && pt.goles_contra !== undefined;
              const tipo = tieneResultado ? resultTipo(pt.goles_favor!, pt.goles_contra!) : null;
              return (
                <div key={pt.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 mb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {pt.liga && (
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-0.5">{pt.liga}</p>
                      )}
                      <p className="text-gray-200 font-semibold text-sm">
                        {pt.rival ? `vs ${pt.rival}` : "Partido"}
                      </p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {fmtFecha(pt.fecha)}
                        {pt.lugar ? ` · ${pt.lugar}` : ""}
                      </p>
                    </div>

                    {tieneResultado && tipo ? (
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xl font-bold tabular-nums ${
                          tipo === "victoria" ? "text-pantera-green"
                          : tipo === "empate"  ? "text-gray-400"
                          : "text-red-400"
                        }`}>
                          {pt.goles_favor} - {pt.goles_contra}
                        </p>
                        <p className={`text-[10px] font-semibold uppercase tracking-wide ${
                          tipo === "victoria" ? "text-pantera-green/70"
                          : tipo === "empate"  ? "text-gray-400/70"
                          : "text-red-400/70"
                        }`}>
                          {tipo === "victoria" ? "Victoria" : tipo === "empate" ? "Empate" : "Derrota"}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-600 text-xs flex-shrink-0">Sin resultado</span>
                    )}
                  </div>

                  {pt.hijo_asistio !== null && (
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-white/[0.05]">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${pt.hijo_asistio ? "bg-pantera-green" : "bg-gray-600"}`} />
                      <span className="text-xs text-gray-500">
                        {pt.hijo_asistio ? "Tu hijo asistio al partido" : "Tu hijo no asistio"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
