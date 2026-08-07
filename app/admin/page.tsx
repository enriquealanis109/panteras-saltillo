"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface KPI {
  jugadores: number; asistenciaHoy: number; docsPendientes: number;
  citas: number; categorias: number; entrenadores: number; listasHoy: number;
}

function KPICard({ label, value, sub, color, icon, onClick, accent }: {
  label: string; value: string | number; sub?: string; color: string;
  icon: React.ReactNode; onClick?: () => void; accent?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white/[0.03] border rounded-2xl p-5 flex flex-col gap-2 transition-all ${
        onClick ? "cursor-pointer active:scale-[0.98]" : ""
      } ${accent ? "border-pantera-green/20 hover:border-pantera-green/35" : "border-white/[0.06] hover:border-white/12"}`}
    >
      <div className={accent ? "text-pantera-green" : "text-gray-600"}>{icon}</div>
      <p className={`text-3xl font-black leading-none ${color}`} style={{ fontFamily: "Syne, sans-serif" }}>{value}</p>
      <div>
        <p className="text-gray-500 text-[10px] uppercase tracking-widest leading-tight">{label}</p>
        {sub && <p className="text-gray-700 text-[11px] mt-0.5 leading-tight">{sub}</p>}
      </div>
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    label: "Categorías",
    href: "/admin/categorias",
    primary: true,
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>,
  },
  {
    label: "Jugadores",
    href: "/admin/jugadores",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  },
  {
    label: "Cuerpo técnico",
    href: "/admin/entrenadores",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    label: "Documentos",
    href: "/admin/documentos",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  {
    label: "Partidos",
    href: "/admin/partidos",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 000 20"/><path d="M2 12h20"/></svg>,
  },
  {
    label: "Métricas",
    href: "/admin/metricas",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    label: "Patrocinadores",
    href: "/admin/patrocinadores",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>,
  },
  {
    label: "Padres",
    href: "/admin/padres",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [kpi, setKpi]           = useState<KPI>({ jugadores: 0, asistenciaHoy: 0, docsPendientes: 0, citas: 0, categorias: 0, entrenadores: 0, listasHoy: 0 });
  const [catStats, setCatStats] = useState<{ nombre: string; jugadores: number; pct: number; listaPasada: boolean }[]>([]);
  const [loading, setLoading]   = useState(true);

  const hoy      = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Monterrey" });
  const hora     = new Date().getHours();
  const saludo   = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
  const diaLabel = new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Monterrey" });

  useEffect(() => {
    const init = async () => {
      const [cats, jugs, docs, ents, citas] = await Promise.all([
        supabase.from("categorias").select("id, nombre"),
        supabase.from("jugadores").select("id, categoria_id").eq("activo", true),
        supabase.from("documentos").select("jugador_id"),
        supabase.from("entrenadores").select("id"),
        supabase.from("eventos").select("id", { count: "exact", head: true })
          .eq("tipo", "cita_agendada")
          .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      ]);

      const allJugIds = (jugs.data ?? []).map((j) => j.id);
      const asist = allJugIds.length > 0
        ? await supabase.from("asistencias").select("jugador_id, estado").eq("fecha", hoy).in("jugador_id", allJugIds)
        : { data: [] };

      const allJugs  = jugs.data ?? [];
      const allAsist = asist.data ?? [];
      const docsMap: Record<string, number> = {};
      (docs.data ?? []).forEach((d) => { docsMap[d.jugador_id] = (docsMap[d.jugador_id] ?? 0) + 1; });
      const docsPend  = allJugs.filter((j) => (docsMap[j.id] ?? 0) < 4).length;
      const presentes = allAsist.filter((a) => a.estado === "presente" || a.estado === "tarde").length;

      const stats = (cats.data ?? []).map((cat) => {
        const jugscat  = allJugs.filter((j) => j.categoria_id === cat.id);
        const asistcat = allAsist.filter((a) => jugscat.some((j) => j.id === a.jugador_id));
        const pres     = asistcat.filter((a) => a.estado === "presente" || a.estado === "tarde").length;
        const pct      = jugscat.length > 0 ? Math.round((pres / jugscat.length) * 100) : 0;
        const listaPasada = asistcat.length > 0;
        return { nombre: cat.nombre, jugadores: jugscat.length, pct, listaPasada };
      }).sort((a, b) => b.jugadores - a.jugadores);

      const listasHoy = stats.filter((s) => s.listaPasada).length;

      setKpi({
        jugadores: allJugs.length,
        asistenciaHoy: allAsist.length > 0 ? Math.round((presentes / allAsist.length) * 100) : 0,
        docsPendientes: docsPend,
        citas: citas.count ?? 0,
        categorias: (cats.data ?? []).length,
        entrenadores: (ents.data ?? []).length,
        listasHoy,
      });
      setCatStats(stats);
      setLoading(false);
    };
    init();
  }, []); // eslint-disable-line

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const todasListas = kpi.listasHoy === kpi.categorias && kpi.categorias > 0;

  return (
    <div className="p-5 lg:p-8 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-gray-500 text-sm">{saludo},</p>
          <h1 className="text-white text-2xl font-black leading-tight capitalize" style={{ fontFamily: "Syne, sans-serif" }}>
            Dashboard
          </h1>
          <p className="text-gray-600 text-xs mt-1 capitalize">{diaLabel}</p>
        </div>

        {/* Estado global de listas */}
        {kpi.categorias > 0 && (
          todasListas ? (
            <div id="tour-badge-listas" className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              <span className="text-green-400 text-xs font-bold">Todas las listas pasadas</span>
            </div>
          ) : (
            <div id="tour-badge-listas" className="flex items-center gap-2 bg-gray-500/10 border border-gray-500/20 rounded-xl px-3 py-2 flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse flex-shrink-0" />
              <span className="text-gray-400 text-xs font-bold">{kpi.listasHoy}/{kpi.categorias} listas registradas</span>
            </div>
          )
        )}
      </div>

      {/* KPIs */}
      <div>
        <p className="text-gray-600 text-[10px] uppercase tracking-widest mb-3">Indicadores generales</p>
        <div id="tour-kpis" className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <KPICard
            label="Jugadores activos" value={kpi.jugadores} sub="en toda la academia" color="text-white"
            onClick={() => router.push("/admin/jugadores")}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
          />
          <KPICard
            label="Asistencia hoy" sub="promedio de categorías con lista"
            value={kpi.asistenciaHoy > 0 ? `${kpi.asistenciaHoy}%` : "—"}
            color={kpi.asistenciaHoy >= 80 ? "text-green-400" : kpi.asistenciaHoy >= 60 ? "text-gray-400" : "text-gray-600"}
            onClick={() => router.push("/admin/metricas")}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
          />
          <KPICard
            label="Docs pendientes" sub="jugadores sin expediente completo"
            value={kpi.docsPendientes}
            color={kpi.docsPendientes > 0 ? "text-gray-400" : "text-green-400"}
            onClick={() => router.push("/admin/documentos")}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>}
          />
          <KPICard
            label="Citas este mes" sub="agendadas desde el chatbot" value={kpi.citas} color="text-pantera-green"
            onClick={() => router.push("/admin/metricas")} accent
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
          />
          <KPICard
            label="Categorías" sub="activas en la academia" value={kpi.categorias} color="text-white"
            onClick={() => router.push("/admin/categorias")}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>}
          />
          <KPICard
            label="Cuerpo técnico" sub="coordinadores y entrenadores" value={kpi.entrenadores} color="text-white"
            onClick={() => router.push("/admin/entrenadores")}
            icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
          />
        </div>
      </div>

      {/* Asistencia por categoría */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-gray-600 text-[10px] uppercase tracking-widest">Asistencia hoy por categoría</p>
          <span className="text-gray-700 text-[10px]">{kpi.listasHoy} de {kpi.categorias} registradas</span>
        </div>
        <div id="tour-cat-asistencia" className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
          {catStats.length === 0 ? (
            <p className="text-center text-gray-600 text-sm py-8">Sin categorías registradas</p>
          ) : catStats.map((s, i) => (
            <div key={s.nombre} className={`flex items-center gap-4 px-5 py-3.5 ${i !== catStats.length - 1 ? "border-b border-white/[0.04]" : ""}`}>
              <div className="flex items-center gap-2 w-24 flex-shrink-0">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.listaPasada ? "bg-green-500" : "bg-gray-400 animate-pulse"}`} />
                <span className="text-gray-400 text-xs font-medium truncate" style={{ fontFamily: "Syne, sans-serif" }}>{s.nombre}</span>
              </div>
              <div className="flex-1">
                <div className="w-full bg-white/[0.05] rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full transition-all duration-700 ${
                    !s.listaPasada ? "bg-white/10" :
                    s.pct >= 80 ? "bg-green-500" : s.pct >= 60 ? "bg-gray-400" : "bg-red-500"
                  }`} style={{ width: `${s.listaPasada ? s.pct : 0}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-sm font-bold w-10 text-right ${
                  !s.listaPasada ? "text-gray-700" :
                  s.pct >= 80 ? "text-green-400" : s.pct >= 60 ? "text-gray-400" : "text-red-400"
                }`}>
                  {s.listaPasada ? `${s.pct}%` : "—"}
                </span>
                <span className="text-gray-600 text-xs w-20 text-right">{s.jugadores} jugadores</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accesos rápidos */}
      <div>
        <p className="text-gray-600 text-[10px] uppercase tracking-widest mb-3">Accesos rápidos</p>
        <div id="tour-accesos-rapidos" className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {QUICK_ACTIONS.map((a) => (
            <button key={a.href} onClick={() => router.push(a.href)}
              className={`flex flex-col items-center gap-2 py-4 rounded-xl border active:scale-95 transition-all ${
                a.primary
                  ? "bg-pantera-green/10 border-pantera-green/20 hover:bg-pantera-green/20"
                  : "bg-white/[0.03] border-white/[0.06] hover:border-white/15"
              }`}>
              <span className={a.primary ? "text-pantera-green" : "text-gray-500"}>{a.icon}</span>
              <span className={`text-[10px] font-semibold text-center leading-tight px-1 ${a.primary ? "text-pantera-green" : "text-gray-500"}`}>
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
