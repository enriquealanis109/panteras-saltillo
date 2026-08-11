"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Categoria, type Rol } from "@/lib/supabase";
import Image from "next/image";
import { PanelTour } from "@/components/admin/PanelTour";
import { DASHBOARD_STEPS } from "@/lib/coach-tours";
import ThemeToggle from "@/components/ThemeToggle";
import { useClub } from "@/lib/club-context";

const DIAS  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

interface KPIs { jugadores: number; presentes: number; totalHoy: number; docsPendientes: number; citas: number }
interface CatStat { cat: Categoria; jugadores: number; presentes: number; pct: number; docPct: number; listaPasada: boolean }

function KPICard({ label, value, sub, color, icon }: {
  label: string; value: string | number; sub?: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-1.5 border" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
      <div style={{ color: "var(--text-muted)" }}>{icon}</div>
      <p className={`text-2xl font-black leading-none ${color}`} style={{ fontFamily: "Syne, sans-serif" }}>{value}</p>
      <p className="text-[10px] uppercase tracking-widest leading-tight" style={{ color: "var(--text-secondary)" }}>{label}</p>
      {sub && <p className="text-[10px] leading-tight" style={{ color: "var(--text-muted)" }}>{sub}</p>}
    </div>
  );
}

export default function CoachDashboard() {
  const router = useRouter();
  const { logoUrl, modulosActivos } = useClub();
  const tiene = (m: string) => modulosActivos.includes(m);
  const [nombre, setNombre]         = useState("");
  const [catStats, setCatStats]     = useState<CatStat[]>([]);
  const [rol, setRol]               = useState<Rol>("entrenador");
  const [kpis, setKpis]             = useState<KPIs>({ jugadores: 0, presentes: 0, totalHoy: 0, docsPendientes: 0, citas: 0 });
  const [loading, setLoading]       = useState(true);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [esPadre, setEsPadre]       = useState(false);
  const [avisoModulo, setAvisoModulo] = useState("");

  const irOModulo = (href: string, modulo: string, label: string) => {
    if (tiene(modulo)) { router.push(href); return; }
    setAvisoModulo(`${label} no está incluido en tu plan. Contacta al administrador del sistema para activarlo.`);
    setTimeout(() => setAvisoModulo(""), 3500);
  };

  const hoy      = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Monterrey" });
  const diaLabel = `${DIAS[new Date().getDay()]} ${new Date().getDate()} de ${MESES[new Date().getMonth()]}`;
  const hora     = new Date().getHours();
  const saludo   = hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";

  const esAdmin       = rol === "admin";
  const esEntrenador  = rol === "entrenador" || rol === "ambos" || esAdmin;
  const esCoordinador = rol === "coordinador" || rol === "ambos" || esAdmin;

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: ent } = await supabase.from("entrenadores").select("nombre, rol").eq("id", user.id).single();

      if (!ent) {
        // No es entrenador — redirigir al panel correcto
        const { data: papaRow } = await supabase.from("padres").select("id, activo").eq("id", user.id).single();
        if (papaRow?.activo) { router.replace("/papa"); return; }
        router.replace("/coach/login");
        return;
      }

      setNombre(ent.nombre ?? "");
      const userRol = (ent.rol as Rol) ?? "entrenador";
      setRol(userRol);
      if (userRol === "admin") { router.push("/admin"); return; }

      // Verificar si también es padre de familia
      const { data: papaRow } = await supabase.from("padres").select("id").eq("id", user.id).eq("activo", true).single();
      setEsPadre(!!papaRow);

      const { data: rels } = await supabase.from("entrenador_categorias").select("categoria_id").eq("entrenador_id", user.id);
      const ids = (rels ?? []).map((r) => r.categoria_id);

      let cats: Categoria[] = [];
      if (ids.length > 0) {
        const { data } = await supabase.from("categorias").select("*").in("id", ids).order("nombre");
        cats = data ?? [];
      }

      let totalJugadores = 0, totalPresentes = 0, totalHoy = 0, docsPend = 0;

      if (ids.length > 0) {
        const { data: jugs } = await supabase.from("jugadores").select("id, categoria_id").in("categoria_id", ids).eq("activo", true);
        const allJugs = jugs ?? [];
        totalJugadores = allJugs.length;

        const { data: asist } = await supabase.from("asistencias").select("jugador_id, estado").eq("fecha", hoy)
          .in("jugador_id", allJugs.map((j) => j.id));
        const asistHoy = asist ?? [];
        totalPresentes = asistHoy.filter((a) => a.estado === "presente" || a.estado === "tarde").length;
        totalHoy = asistHoy.length;

        const { data: docs } = await supabase.from("documentos").select("jugador_id").in("jugador_id", allJugs.map((j) => j.id));
        const docsMap: Record<string, number> = {};
        (docs ?? []).forEach((d) => { docsMap[d.jugador_id] = (docsMap[d.jugador_id] ?? 0) + 1; });
        docsPend = allJugs.filter((j) => (docsMap[j.id] ?? 0) < 4).length;

        const stats: CatStat[] = cats.map((cat) => {
          const jugscat   = allJugs.filter((j) => j.categoria_id === cat.id);
          const asistcat  = asistHoy.filter((a) => jugscat.some((j) => j.id === a.jugador_id));
          const pres      = asistcat.filter((a) => a.estado === "presente" || a.estado === "tarde").length;
          const pct       = jugscat.length > 0 ? Math.round((pres / jugscat.length) * 100) : 0;
          const completos = jugscat.filter((j) => (docsMap[j.id] ?? 0) >= 4).length;
          const docPct    = jugscat.length > 0 ? Math.round((completos / jugscat.length) * 100) : 0;
          const listaPasada = asistcat.length > 0;
          return { cat, jugadores: jugscat.length, presentes: pres, pct, docPct, listaPasada };
        });
        setCatStats(stats);
      }

      const inicio = new Date(); inicio.setDate(1);
      const { count } = await supabase.from("eventos").select("id", { count: "exact", head: true })
        .eq("tipo", "cita_agendada").gte("created_at", inicio.toISOString());

      setKpis({ jugadores: totalJugadores, presentes: totalPresentes, totalHoy, docsPendientes: docsPend, citas: count ?? 0 });
      setLoading(false);
    };
    init();
  }, []); // eslint-disable-line

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/coach/login"); };

  const pctAsistencia    = kpis.totalHoy > 0 ? Math.round((kpis.presentes / kpis.totalHoy) * 100) : null;
  const listasPendientes = catStats.filter((s) => !s.listaPasada && s.jugadores > 0).length;
  const todasListas      = catStats.length > 0 && listasPendientes === 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
      <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden w-full pb-12" style={{ background: "var(--bg-page)" }}>

      {avisoModulo && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl max-w-[90vw] text-center"
          style={{ background: "var(--bg-alt)", border: "1px solid var(--border-strong)", color: "var(--text-primary)" }}>
          {avisoModulo}
        </div>
      )}

      {/* Header sticky */}
      <header className="border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <Image src={logoUrl} alt="" width={36} height={36} className="rounded-full" />
          <div>
            <p className="font-bold text-sm leading-tight" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>{nombre}</p>
            <div className="flex items-center gap-1.5">
              <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${
                esAdmin ? "" :
                esCoordinador && esEntrenador ? "bg-blue-400/10 border-blue-400/30 text-blue-400" :
                esCoordinador ? "bg-purple-400/10 border-purple-400/30 text-purple-400" :
                "bg-pantera-green/10 border-pantera-green/30 text-pantera-green"
              }`}
                style={esAdmin ? { background: "var(--bg-surface-2)", borderColor: "var(--border-strong)", color: "var(--text-primary)" } : undefined}>
                {esAdmin ? "Admin" : esCoordinador && esEntrenador ? "Ambos" : esCoordinador ? "Coordinador" : "Entrenador"}
              </span>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{diaLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PanelTour steps={DASHBOARD_STEPS} storageKey="tour_coach_dashboard" />
          <div className="relative">
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 rounded-xl border flex items-center justify-center transition-all"
            style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-11 border rounded-xl shadow-2xl w-48 py-1 z-50"
              style={{ background: "var(--bg-alt)", borderColor: "var(--border-strong)" }}
              onClick={() => setMenuOpen(false)}>
              {tiene("sitio_publico") ? (
                <a href="/" className="link-muted-theme block px-4 py-3 text-sm transition-colors">Ver sitio</a>
              ) : (
                <button onClick={() => { irOModulo("", "sitio_publico", "Ver sitio"); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors" style={{ color: "var(--text-muted)" }}>
                  <span className="flex-1 text-left">Ver sitio</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </button>
              )}
              {esAdmin && <>
                <button onClick={() => router.push("/admin")} className="link-muted-theme w-full text-left px-4 py-3 text-sm transition-colors">Panel admin</button>
                <button onClick={() => { irOModulo("/coach/stats", "metricas", "Métricas"); setMenuOpen(false); }}
                  className={`w-full flex items-center gap-2 px-4 py-3 text-sm transition-colors ${tiene("metricas") ? "link-muted-theme" : ""}`}
                  style={!tiene("metricas") ? { color: "var(--text-muted)" } : undefined}>
                  <span className="flex-1 text-left">Métricas</span>
                  {!tiene("metricas") && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  )}
                </button>
              </>}
              {esCoordinador && (
                <button onClick={() => window.open("/manual-coordinador.pdf", "_blank")} className="w-full text-left px-4 py-3 text-blue-400 hover:text-blue-300 text-sm transition-colors flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
                  </svg>
                  Guía del coordinador
                </button>
              )}
              <button onClick={() => router.push("/coach/contrasena")} className="link-muted-theme w-full text-left px-4 py-3 text-sm transition-colors">Contraseña</button>
              <div className="w-full flex items-center justify-between px-4 py-3 text-sm">
                <span className="link-muted-theme">Tema</span>
                <ThemeToggle />
              </div>
              {esPadre && (
                <button onClick={() => router.push("/papa")} className="w-full text-left px-4 py-3 text-pantera-green text-sm transition-colors flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                  Mi panel de padre
                </button>
              )}
              <div className="border-t my-1" style={{ borderColor: "var(--border-subtle)" }} />
              <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-red-400 hover:text-red-300 text-sm transition-colors">Cerrar sesión</button>
            </div>
          )}
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">

        {/* Saludo + estado global de listas */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{saludo},</p>
            <h2 className="font-black text-2xl leading-tight" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
              {nombre.split(" ")[0]}
            </h2>
          </div>
          {esEntrenador && catStats.length > 0 && (
            todasListas ? (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                <span className="text-[var(--status-good)] text-xs font-bold">Todo al día</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-shrink-0 border" style={{ background: "var(--bg-surface-2)", borderColor: "var(--border-strong)" }}>
                <div className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: "var(--text-muted)" }} />
                <span className="text-xs font-bold" style={{ color: "var(--text-secondary)" }}>{listasPendientes} lista{listasPendientes > 1 ? "s" : ""} pendiente{listasPendientes > 1 ? "s" : ""}</span>
              </div>
            )
          )}
        </div>

        {/* KPIs */}
        <div id="tour-coach-kpis">
          <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Resumen del día</p>
          {esEntrenador ? (
            <div className="grid grid-cols-3 gap-3">
              <KPICard
                label="Jugadores activos" value={kpis.jugadores} sub="en mis categorías" color="text-[var(--text-primary)]"
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>}
              />
              <KPICard
                label="Asistencia hoy"
                value={pctAsistencia !== null ? `${pctAsistencia}%` : "—"}
                sub={pctAsistencia !== null ? `${kpis.presentes} de ${kpis.totalHoy}` : "Lista no pasada"}
                color={pctAsistencia === null ? "text-[var(--text-muted)]" : pctAsistencia >= 80 ? "text-[var(--status-good)]" : pctAsistencia >= 60 ? "text-[var(--status-neutral)]" : "text-red-400"}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}
              />
              <KPICard
                label="Docs pendientes" value={kpis.docsPendientes} sub="sin docs completos"
                color={kpis.docsPendientes > 0 ? "text-[var(--status-neutral)]" : "text-[var(--status-good)]"}
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
              />
            </div>
          ) : (() => {
            const completos = kpis.jugadores - kpis.docsPendientes;
            const pct = kpis.jugadores > 0 ? Math.round((completos / kpis.jugadores) * 100) : 0;
            return (
              <div className="grid grid-cols-3 gap-3">
                <KPICard label="Jugadores activos" value={kpis.jugadores} sub="en mis categorías" color="text-[var(--text-primary)]"
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} />
                <KPICard label="Docs completos" value={kpis.jugadores > 0 ? `${pct}%` : "—"} sub={`${completos} de ${kpis.jugadores}`}
                  color={pct >= 80 ? "text-[var(--status-good)]" : pct >= 50 ? "text-[var(--status-neutral)]" : "text-red-400"}
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>} />
                <KPICard label="Docs pendientes" value={kpis.docsPendientes} sub="sin docs completos"
                  color={kpis.docsPendientes > 0 ? "text-[var(--status-neutral)]" : "text-[var(--status-good)]"}
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>} />
              </div>
            );
          })()}
        </div>

        {/* Acciones rápidas */}
        {esEntrenador && (
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Acciones rápidas</p>
            <div id="tour-coach-acciones" className="grid grid-cols-4 gap-2">
              <button onClick={() => irOModulo("/coach/avisos", "avisos", "Avisos")}
                className={`relative flex flex-col items-center gap-2 py-4 rounded-xl border active:scale-95 transition-all ${
                  tiene("avisos") ? "bg-pantera-green/10 border-pantera-green/20 hover:bg-pantera-green/20" : "border-white/5 opacity-40"
                }`}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill={tiene("avisos") ? "#22c55e" : "currentColor"} style={!tiene("avisos") ? { color: "var(--text-muted)" } : undefined}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span className={`text-[11px] font-bold ${tiene("avisos") ? "text-pantera-green" : ""}`} style={!tiene("avisos") ? { color: "var(--text-muted)" } : undefined}>Avisos</span>
              </button>
              <button onClick={() => irOModulo("/coach/partidos", "partidos", "Partidos")}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border hover:border-white/15 active:scale-95 transition-all ${!tiene("partidos") ? "opacity-40" : ""}`}
                style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--text-secondary)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 000 20"/><path d="M2 12h20"/></svg>
                <span className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>Partidos</span>
              </button>
              {esAdmin && <>
                <button onClick={() => router.push("/admin")}
                  className="flex flex-col items-center gap-2 py-4 rounded-xl border hover:border-white/15 active:scale-95 transition-all" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--text-secondary)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  <span className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>Admin</span>
                </button>
                <button onClick={() => irOModulo("/coach/stats", "metricas", "Métricas")}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border hover:border-white/15 active:scale-95 transition-all ${!tiene("metricas") ? "opacity-40" : ""}`}
                  style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--text-secondary)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  <span className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>Métricas</span>
                </button>
              </>}
              {!esAdmin && (
                <button onClick={() => tiene("sitio_publico") ? window.open("/", "_blank") : irOModulo("", "sitio_publico", "Sitio web")}
                  className={`flex flex-col items-center gap-2 py-4 rounded-xl border hover:border-white/15 active:scale-95 transition-all ${!tiene("sitio_publico") ? "opacity-40" : ""}`}
                  style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--text-secondary)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                  <span className="text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>Sitio web</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Categorías */}
        <div id="tour-coach-categorias">
          <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>Mis categorías</p>

          {catStats.length === 0 ? (
            <div className="rounded-2xl text-center py-16 px-5 border" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Sin categorías asignadas</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Contacta al administrador para que te asigne categorías.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {catStats.map((stat) => (
                <div key={stat.cat.id} className="rounded-2xl overflow-hidden border" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>

                  {/* Header */}
                  <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-bold text-base leading-tight" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
                          {stat.cat.nombre}
                        </h3>
                        {esEntrenador && (
                          stat.listaPasada ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-green-500/10 text-[var(--status-good)] border border-green-500/20 px-2 py-0.5 rounded-full">
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                              Lista pasada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-[var(--bg-surface-2)] text-[var(--status-neutral)] border border-[var(--border-strong)] px-2 py-0.5 rounded-full">
                              <div className="w-1.5 h-1.5 rounded-full bg-[var(--status-neutral)] animate-pulse" />
                              Pendiente
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {stat.jugadores} jugadores
                        {esEntrenador && stat.listaPasada && ` · ${stat.presentes} presentes hoy`}
                        {!esEntrenador && ` · ${stat.docPct}% docs completos`}
                      </p>
                    </div>
                    {stat.jugadores > 0 && (
                      <div className="text-right flex-shrink-0">
                        {esEntrenador ? (
                          <p className={`text-2xl font-black leading-none ${
                            stat.pct >= 80 ? "text-[var(--status-good)]" : stat.pct >= 60 ? "text-[var(--status-neutral)]" : "text-red-400"
                          }`} style={{ fontFamily: "Syne, sans-serif", color: !stat.listaPasada ? "var(--text-muted)" : undefined }}>
                            {stat.listaPasada ? `${stat.pct}%` : "—"}
                          </p>
                        ) : (
                          <p className={`text-2xl font-black leading-none ${stat.docPct >= 80 ? "text-[var(--status-good)]" : stat.docPct >= 50 ? "text-[var(--status-neutral)]" : "text-red-400"}`}
                            style={{ fontFamily: "Syne, sans-serif" }}>
                            {stat.docPct}%
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Barra de progreso */}
                  <div className="px-4 pb-3">
                    <div className="w-full rounded-full h-1.5" style={{ background: "var(--border-subtle)" }}>
                      {esEntrenador ? (
                        <div className={`h-1.5 rounded-full transition-all duration-700 ${
                          !stat.listaPasada ? "" :
                          stat.pct >= 80 ? "bg-green-500" : stat.pct >= 60 ? "bg-[var(--status-neutral)]" : "bg-red-500"
                        }`} style={{ width: `${stat.listaPasada ? stat.pct : 0}%`, background: !stat.listaPasada ? "var(--border-strong)" : undefined }} />
                      ) : (
                        <div className={`h-1.5 rounded-full transition-all duration-700 ${stat.docPct >= 80 ? "bg-green-500" : stat.docPct >= 50 ? "bg-[var(--status-neutral)]" : "bg-red-500"}`}
                          style={{ width: `${stat.docPct}%` }} />
                      )}
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="border-t px-3 py-2.5 grid gap-2" style={{ borderColor: "var(--border-subtle)",
                    gridTemplateColumns: esEntrenador && esCoordinador ? "repeat(3, 1fr)" : esEntrenador ? "repeat(4, 1fr)" : "repeat(2, 1fr)" }}>

                    {esEntrenador && <>
                      <button onClick={() => router.push(`/coach/lista/${stat.cat.id}`)}
                        className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl bg-pantera-green/10 border border-pantera-green/20 hover:bg-pantera-green/20 active:scale-95 transition-all">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                        </svg>
                        <span className="text-[10px] font-bold text-pantera-green">Lista</span>
                      </button>
                      <button onClick={() => router.push(`/coach/reportes/${stat.cat.id}`)}
                        className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl border hover:border-white/15 active:scale-95 transition-all" style={{ background: "var(--bg-surface-2)", borderColor: "var(--border-subtle)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--text-secondary)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        <span className="text-[10px] font-semibold" style={{ color: "var(--text-secondary)" }}>Semanal</span>
                      </button>
                      <button onClick={() => router.push(`/coach/mensual/${stat.cat.id}`)}
                        className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl border hover:border-white/15 active:scale-95 transition-all" style={{ background: "var(--bg-surface-2)", borderColor: "var(--border-subtle)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--text-secondary)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        <span className="text-[10px] font-semibold" style={{ color: "var(--text-secondary)" }}>Mensual</span>
                      </button>
                      <button onClick={() => router.push(`/coach/evaluar/${stat.cat.id}`)}
                        className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl border hover:border-white/15 active:scale-95 transition-all" style={{ background: "var(--bg-surface-2)", borderColor: "var(--border-subtle)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--text-secondary)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        <span className="text-[10px] font-semibold" style={{ color: "var(--text-secondary)" }}>Evaluar</span>
                      </button>
                    </>}

                    {esCoordinador && <>
                      <button onClick={() => router.push(`/coach/documentos/${stat.cat.id}`)}
                        className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl border hover:border-white/15 active:scale-95 transition-all" style={{ background: "var(--bg-surface-2)", borderColor: "var(--border-subtle)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--text-secondary)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <span className="text-[10px] font-semibold" style={{ color: "var(--text-secondary)" }}>Docs</span>
                      </button>
                      <button onClick={() => router.push(`/coach/cobros/${stat.cat.id}`)}
                        className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl border hover:border-white/15 active:scale-95 transition-all" style={{ background: "var(--bg-surface-2)", borderColor: "var(--border-subtle)" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--text-secondary)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                        </svg>
                        <span className="text-[10px] font-semibold" style={{ color: "var(--text-secondary)" }}>Cobros</span>
                      </button>
                    </>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
