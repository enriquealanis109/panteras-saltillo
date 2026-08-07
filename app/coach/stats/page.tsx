"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface EventoCount { tipo: string; total: number }
interface CitaDetalle  { id: string; nino: string; dia: string; categoria: string; fecha: string; estado: string }

const LABELS: Record<string, string> = {
  clic_inscribir:      "Clicks en Inscribir",
  clic_ver_categorias: "Clicks en Ver categorías",
  chatbot_abierto:     "Chatbot abierto",
  cita_agendada:       "Citas agendadas",
};

const COLORS: Record<string, string> = {
  clic_inscribir:      "text-[var(--status-good)]",
  clic_ver_categorias: "text-blue-400",
  chatbot_abierto:     "text-[var(--status-neutral)]",
  cita_agendada:       "text-pantera-green",
};

export default function StatsPage() {
  const router = useRouter();

  const [totales, setTotales]         = useState<EventoCount[]>([]);
  const [citas, setCitas]             = useState<CitaDetalle[]>([]);
  const [jugadores, setJugadores]     = useState<{ categoria: string; total: number }[]>([]);
  const [loading, setLoading]         = useState(true);
  const [periodo, setPeriodo]         = useState<"7" | "30" | "90">("30");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/coach/login"); return; }

      const { data: ent } = await supabase.from("entrenadores").select("rol").eq("id", user.id).single();
      if (ent?.rol !== "admin") { router.push("/coach"); return; }

      cargar(periodo);
    };
    init();
  }, []); // eslint-disable-line

  const cargar = async (dias: string) => {
    setLoading(true);
    const desde = new Date();
    desde.setDate(desde.getDate() - parseInt(dias));
    const desdeISO = desde.toISOString();

    // Conteo de eventos
    const { data: evs } = await supabase
      .from("eventos").select("tipo")
      .gte("created_at", desdeISO);

    const map: Record<string, number> = {};
    (evs ?? []).forEach((e: { tipo: string }) => { map[e.tipo] = (map[e.tipo] ?? 0) + 1; });
    setTotales(Object.entries(map).map(([tipo, total]) => ({ tipo, total })));

    // Detalle de citas
    const { data: citasData } = await supabase
      .from("eventos").select("id, metadata, created_at, estado")
      .eq("tipo", "cita_agendada")
      .gte("created_at", desdeISO)
      .order("created_at", { ascending: false });

    setCitas((citasData ?? []).map((c: { id: string; metadata: Record<string, string>; created_at: string; estado: string }) => ({
      id:        c.id,
      nino:      c.metadata?.nino ?? "—",
      dia:       c.metadata?.dia ?? "—",
      categoria: c.metadata?.categoria ?? "—",
      fecha:     new Date(c.created_at).toLocaleDateString("es-MX"),
      estado:    c.estado ?? "pendiente",
    })));

    // Jugadores por categoría
    const { data: cats } = await supabase.from("categorias").select("id, nombre");
    const { data: jugs } = await supabase.from("jugadores").select("categoria_id").eq("activo", true);

    const catMap: Record<string, number> = {};
    (jugs ?? []).forEach((j: { categoria_id: string }) => {
      catMap[j.categoria_id] = (catMap[j.categoria_id] ?? 0) + 1;
    });

    setJugadores(
      (cats ?? [])
        .map((c: { id: string; nombre: string }) => ({ categoria: c.nombre, total: catMap[c.id] ?? 0 }))
        .filter((c) => c.total > 0)
        .sort((a, b) => b.total - a.total)
    );

    setLoading(false);
  };

  const cambiarPeriodo = (p: "7" | "30" | "90") => { setPeriodo(p); cargar(p); };

  const eliminarCita = async (id: string) => {
    await supabase.from("eventos").delete().eq("id", id);
    setCitas((prev) => prev.filter((c) => c.id !== id));
    setTotales((prev) => prev.map((t) =>
      t.tipo === "cita_agendada" ? { ...t, total: Math.max(0, t.total - 1) } : t
    ));
  };

  const toggleEstado = async (id: string, estadoActual: string) => {
    const nuevoEstado = estadoActual === "pendiente" ? "realizada" : "pendiente";
    await supabase.from("eventos").update({ estado: nuevoEstado }).eq("id", id);
    setCitas((prev) => prev.map((c) => c.id === id ? { ...c, estado: nuevoEstado } : c));
  };

  const totalCitas = totales.find((t) => t.tipo === "cita_agendada")?.total ?? 0;
  const totalJugadores = jugadores.reduce((s, j) => s + j.total, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden w-full pb-12" style={{ background: "var(--bg-page)" }}>

      {/* Header */}
      <header className="border-b px-5 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="link-muted-theme w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-90 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 className="font-bold" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>Métricas</h1>
        </div>
        {/* Selector de período */}
        <div className="flex gap-1">
          {(["7", "30", "90"] as const).map((p) => (
            <button key={p} onClick={() => cambiarPeriodo(p)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                periodo === p
                  ? "bg-pantera-green text-white font-bold"
                  : "link-muted-theme border"
              }`}
              style={periodo !== p ? { borderColor: "var(--border-strong)" } : undefined}>
              {p}d
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Resumen rápido */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card-theme p-4" style={{ padding: "1rem" }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-secondary)" }}>Jugadores activos</p>
            <p className="text-3xl font-black" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>{totalJugadores}</p>
          </div>
          <div className="card-theme p-4" style={{ padding: "1rem" }}>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-secondary)" }}>Citas en {periodo} días</p>
            <p className="text-pantera-green text-3xl font-black" style={{ fontFamily: "Syne, sans-serif" }}>{totalCitas}</p>
          </div>
        </div>

        {/* Eventos */}
        <div className="card-theme p-5" style={{ padding: "1.25rem" }}>
          <p className="font-bold mb-4" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
            Actividad últimos {periodo} días
          </p>
          {totales.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Sin datos en este período.</p>
          ) : (
            <div className="space-y-3">
              {Object.keys(LABELS).map((tipo) => {
                const count = totales.find((t) => t.tipo === tipo)?.total ?? 0;
                const max   = Math.max(...totales.map((t) => t.total), 1);
                return (
                  <div key={tipo}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{LABELS[tipo]}</span>
                      <span className={`font-bold text-sm ${COLORS[tipo] ?? "text-[var(--text-primary)]"}`}>{count}</span>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ background: "var(--border-subtle)" }}>
                      <div className="h-1.5 rounded-full bg-pantera-green transition-all"
                        style={{ width: `${(count / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Citas recientes */}
        {citas.length > 0 && (
          <div className="card-theme p-5" style={{ padding: "1.25rem" }}>
            <p className="font-bold mb-4" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
              Citas agendadas
            </p>
            <div className="space-y-2">
              {citas.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0 gap-2" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{c.nino}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{c.categoria} · {c.dia} · {c.fecha}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => toggleEstado(c.id, c.estado)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                        c.estado === "realizada"
                          ? "bg-green-500/20 border-green-500/30 text-[var(--status-good)]"
                          : "bg-[var(--bg-surface-2)] border-[var(--border-strong)] text-[var(--status-neutral)]"
                      }`}>
                      {c.estado === "realizada" ? "Realizada" : "Pendiente"}
                    </button>
                    <button onClick={() => eliminarCita(c.id)}
                      className="transition-colors p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 active:scale-90" style={{ color: "var(--text-muted)" }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Jugadores por categoría */}
        {jugadores.length > 0 && (
          <div className="card-theme p-5" style={{ padding: "1.25rem" }}>
            <p className="font-bold mb-4" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
              Jugadores por categoría
            </p>
            <div className="space-y-2">
              {jugadores.map((j) => (
                <div key={j.categoria} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{j.categoria}</span>
                  <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>{j.total}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
