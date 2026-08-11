"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PanelTour } from "@/components/admin/PanelTour";
import { AVISOS_STEPS } from "@/lib/coach-tours";

type TipoAviso    = "partido" | "cancelacion" | "general";
type FasePartido  = "amistoso" | "jornada" | "cuartos" | "semifinal" | "final" | "repechaje" | "";

interface Jugador { id: string; nombre: string; alias: string | null }
interface Liga { id: string; nombre: string; tipo: string }

interface Partido {
  liga_id: string;
  rival: string;
  fase: FasePartido;
  jornada: string;
  dia: string;
  horaCita: string;
  horaJuego: string;
  lugar: string;
  uniforme: string;
  nota: string;
  convocatoria: boolean;
  convocados: string[];
}

const DIAS = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
const UNIFORMES = [
  { value: "verde",  label: "Verde",  emoji: "🟢" },
  { value: "blanco", label: "Blanco", emoji: "⚪" },
];
const FASES: { value: FasePartido; label: string; emoji?: string }[] = [
  { value: "amistoso",  label: "Amistoso"       },
  { value: "jornada",   label: "Jornada"         },
  { value: "repechaje", label: "Repechaje"       },
  { value: "cuartos",   label: "4tos de Final"   },
  { value: "semifinal", label: "Semifinal"       },
  { value: "final",     label: "Final", emoji: "🏆" },
];

const DEFAULT_PARTIDO: Partido = {
  liga_id: "", rival: "", fase: "", jornada: "1",
  dia: "Viernes", horaCita: "16:30", horaJuego: "17:00", lugar: "", uniforme: "verde", nota: "",
  convocatoria: false, convocados: [],
};

const nextDate = (dayName: string): string => {
  const names = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const target = names.indexOf(dayName);
  const today = new Date();
  let diff = target - today.getDay();
  if (diff < 0) diff += 7;
  const d = new Date(today);
  d.setDate(today.getDate() + diff);
  return d.toISOString().split("T")[0];
};

export default function AvisosPage() {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoAviso>("partido");
  const [partidos, setPartidos] = useState<Partido[]>([{ ...DEFAULT_PARTIDO }]);

  const [diaCan, setDiaCan]    = useState("Lunes");
  const [motivoCan, setMotivo] = useState("");
  const [proximoDia, setProx]  = useState("Lunes");
  const [textoGen, setTextoGen] = useState("");
  const [copiado, setCopiado]   = useState(false);

  const [cats, setCats]       = useState<{ id: string; nombre: string }[]>([]);
  const [catId, setCatId]     = useState("");
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado]   = useState(false);
  const [errGuardado, setErrGuardado] = useState("");

  const [ligas, setLigas]         = useState<Liga[]>([]);
  const [nuevaLiga, setNuevaLiga] = useState("");
  const [creandoLiga, setCreandoLiga] = useState(false);
  const [errLiga, setErrLiga]     = useState("");

  useEffect(() => { setGuardado(false); setErrGuardado(""); }, [partidos, catId]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: rels } = await supabase.from("entrenador_categorias").select("categoria_id").eq("entrenador_id", user.id);
      const ids = (rels ?? []).map((r: { categoria_id: string }) => r.categoria_id);
      if (ids.length === 0) return;
      const { data } = await supabase.from("categorias").select("id, nombre").in("id", ids).order("nombre");
      const loaded = data ?? [];
      setCats(loaded);
      if (loaded.length === 1) setCatId(loaded[0].id);
    };
    load();
  }, []);

  // Carga jugadores cuando cambia la categoría seleccionada
  useEffect(() => {
    const selectedCat = cats.length === 1 ? cats[0]?.id : catId;
    if (!selectedCat) { setJugadores([]); return; }
    const fetchJugs = async () => {
      const { data } = await supabase
        .from("jugadores").select("id, nombre, alias")
        .eq("categoria_id", selectedCat).eq("activo", true).order("nombre");
      setJugadores(data ?? []);
    };
    fetchJugs();
  }, [catId, cats]);

  // Carga ligas/copas de la categoría seleccionada
  useEffect(() => {
    const selectedCat = cats.length === 1 ? cats[0]?.id : catId;
    if (!selectedCat) { setLigas([]); return; }
    const fetchLigas = async () => {
      const { data } = await supabase
        .from("ligas").select("id, nombre, tipo")
        .eq("categoria_id", selectedCat).eq("activo", true).order("nombre");
      setLigas(data ?? []);
    };
    fetchLigas();
  }, [catId, cats]);

  const crearLiga = async () => {
    const nombre = nuevaLiga.trim();
    const selectedCat = cats.length === 1 ? cats[0]?.id : catId;
    if (!nombre || !selectedCat || creandoLiga) return;
    setCreandoLiga(true);
    setErrLiga("");
    const { data, error } = await supabase.from("ligas")
      .insert({ categoria_id: selectedCat, nombre, tipo: "liga" })
      .select("id, nombre, tipo").single();
    setCreandoLiga(false);
    if (error) { setErrLiga("Esa liga ya existe"); return; }
    if (data) {
      setLigas((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNuevaLiga("");
    }
  };

  const updatePartido = (i: number, field: keyof Partido, value: string) =>
    setPartidos((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));

  const toggleConvocatoria = (i: number) =>
    setPartidos((prev) => prev.map((p, idx) => idx === i ? { ...p, convocatoria: !p.convocatoria, convocados: [] } : p));

  const toggleConvocado = (i: number, jugId: string) =>
    setPartidos((prev) => prev.map((p, idx) => {
      if (idx !== i) return p;
      const convocados = p.convocados.includes(jugId)
        ? p.convocados.filter((id) => id !== jugId)
        : [...p.convocados, jugId];
      return { ...p, convocados };
    }));

  const seleccionarTodos = (i: number) =>
    setPartidos((prev) => prev.map((p, idx) =>
      idx === i ? { ...p, convocados: jugadores.map((j) => j.id) } : p
    ));

  const quitarTodos = (i: number) =>
    setPartidos((prev) => prev.map((p, idx) =>
      idx === i ? { ...p, convocados: [] } : p
    ));

  const addPartido    = () => setPartidos((prev) => [...prev, { ...DEFAULT_PARTIDO }]);
  const removePartido = (i: number) => setPartidos((prev) => prev.filter((_, idx) => idx !== i));

  const fmtHora = (h: string) => {
    const [hh, mm] = h.split(":");
    const num = parseInt(hh);
    return `${num > 12 ? num - 12 : num === 0 ? 12 : num}:${mm} ${num >= 12 ? "PM" : "AM"}`;
  };

  const fmtFase = (p: Partido): string => {
    switch (p.fase) {
      case "amistoso":  return "AMISTOSO";
      case "jornada":   return `JORNADA ${p.jornada || "1"}`;
      case "repechaje": return "REPECHAJE";
      case "cuartos":   return "CUARTOS DE FINAL";
      case "semifinal": return "SEMIFINAL";
      case "final":     return "🏆 FINAL 🏆";
      default:          return "";
    }
  };

  const fmtPartido = (p: Partido) => {
    const uni  = UNIFORMES.find((u) => u.value === p.uniforme)!;
    const fase = fmtFase(p);
    const lines: string[] = [];

    const ligaNombre = ligas.find((l) => l.id === p.liga_id)?.nombre;

    if (fase) lines.push(fase);
    if (ligaNombre) lines.push(ligaNombre.toUpperCase());
    if (p.rival) lines.push(`vs ${p.rival.toUpperCase()}`);
    lines.push("");
    lines.push(p.dia.toUpperCase());
    lines.push("");
    lines.push(`CITA: ${fmtHora(p.horaCita)}`);
    lines.push(`Hora: ${fmtHora(p.horaJuego)}`);
    lines.push(`Lugar: ${p.lugar ? p.lugar.toUpperCase() : "[LUGAR]"}`);
    lines.push("");
    lines.push(`UNIFORME ${uni.label.toUpperCase()} ${uni.emoji}`);

    if (p.nota.trim()) {
      lines.push("", `*${p.nota.trim()}*`);
    }

    if (p.convocatoria && p.convocados.length > 0) {
      const ordenados = jugadores.filter((j) => p.convocados.includes(j.id));
      lines.push("", "CONVOCADOS:");
      ordenados.forEach((j, idx) => { lines.push(`${idx + 1}. ${j.nombre}`); });
    }

    return lines.join("\n");
  };

  const generarMensaje = (): string => {
    if (tipo === "partido") {
      const hayFinal = partidos.length === 1 && partidos[0].fase === "final";
      const header   = partidos.length > 1
        ? `❗️AVISO PARTIDOS❗️`
        : hayFinal
          ? `🏆 AVISO PARTIDO 🏆`
          : `❗️AVISO PARTIDO❗️`;
      const bloques = partidos.map(fmtPartido).join("\n\n————————————\n\n");
      return `${header}\n\n${bloques}\n\n1.-`;
    }
    if (tipo === "cancelacion") {
      return [
        `❗️AVISO CANCELACIÓN❗️`,
        ``,
        `Se cancela el entrenamiento del ${diaCan}.`,
        motivoCan ? `\n${motivoCan}` : "",
        ``,
        `Nos vemos el ${proximoDia}. ✅`,
      ].join("\n").replace(/\n{3,}/g, "\n\n");
    }
    return `📢 AVISO\n\n${textoGen}`;
  };

  const guardarEnBD = async () => {
    if (guardado || guardando) return;
    const selectedCat = cats.length === 1 ? cats[0].id : catId;
    if (!selectedCat) { setErrGuardado("Selecciona una categoría primero"); return; }

    setGuardando(true);
    setErrGuardado("");
    try {
      const { data: jugsData } = await supabase
        .from("jugadores").select("id")
        .eq("categoria_id", selectedCat).eq("activo", true);
      const todosJugIds = (jugsData ?? []).map((j: { id: string }) => j.id);

      for (const p of partidos) {
        const { data: part } = await supabase.from("partidos").insert({
          categoria_id: selectedCat,
          liga_id:    p.liga_id || null,
          rival:      p.rival || null,
          lugar:      p.lugar || null,
          fecha:      nextDate(p.dia),
          hora_juego: p.horaJuego,
          uniforme:   p.uniforme,
          fase:       p.fase || null,
          jornada:    p.fase === "jornada" ? p.jornada : null,
        }).select("id").single();

        // Si hay convocatoria activa, solo registrar los convocados; si no, registrar todos
        const jugIdsRegistrar = (p.convocatoria && p.convocados.length > 0)
          ? p.convocados
          : todosJugIds;

        if (part && jugIdsRegistrar.length > 0) {
          await supabase.from("asistencia_partidos").insert(
            jugIdsRegistrar.map((jid) => ({ partido_id: part.id, jugador_id: jid, asistio: null }))
          );
        }
      }
      setGuardado(true);
    } catch {
      setErrGuardado("Error al guardar. Inténtalo de nuevo.");
    }
    setGuardando(false);
  };

  const mensaje = generarMensaje();

  const copiar = async () => {
    await navigator.clipboard.writeText(mensaje);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const enviarWhatsApp = async () => {
    if (tipo === "partido") await guardarEnBD();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  const input = "input-theme min-w-0 text-sm";

  return (
    <div className="min-h-screen overflow-x-hidden pb-10" style={{ background: "var(--bg-page)" }}>

      <header className="border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="link-muted-theme w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-90 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 className="font-bold" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>Generar Aviso</h1>
        </div>
        <PanelTour steps={AVISOS_STEPS} storageKey="tour_coach_avisos" />
      </header>

      <div className="w-full max-w-lg mx-auto px-4 pt-5 space-y-5" style={{ minWidth: 0 }}>

        {/* Tipo */}
        <div id="tour-avisos-tipo" className="grid grid-cols-3 gap-2">
          {([
            { value: "partido",     label: "Partido"     },
            { value: "cancelacion", label: "Cancelación" },
            { value: "general",     label: "General"     },
          ] as { value: TipoAviso; label: string }[]).map((t) => (
            <button key={t.value} onClick={() => setTipo(t.value)}
              className={`py-3 rounded-xl border text-sm font-bold transition-all ${
                tipo === t.value
                  ? "bg-pantera-green border-pantera-green text-white"
                  : "link-muted-theme"
              }`}
              style={tipo !== t.value ? { borderColor: "var(--border-strong)" } : undefined}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── PARTIDOS ── */}
        {tipo === "partido" && (
          <div id="tour-avisos-form" className="space-y-5">

            {/* Selector de categoría (solo si tiene más de una) */}
            {cats.length > 1 && (
              <div>
                <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Categoría</label>
                <select className={input} value={catId} onChange={(e) => setCatId(e.target.value)}
                  style={{ backgroundImage: "none" }}>
                  <option value="" style={{ background: "var(--bg-alt)" }}>Selecciona una categoría</option>
                  {cats.map((c) => <option key={c.id} value={c.id} style={{ background: "var(--bg-alt)" }}>{c.nombre}</option>)}
                </select>
              </div>
            )}

            {/* Alta rápida de liga/copa */}
            {(cats.length <= 1 || catId) && (
              <div>
                <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Nueva liga / copa <span className="normal-case tracking-normal" style={{ color: "var(--text-muted)" }}>(opcional)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input className={input} placeholder="Ej: Liga Rayados"
                    value={nuevaLiga} onChange={(e) => { setNuevaLiga(e.target.value); setErrLiga(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); crearLiga(); } }} />
                  <button onClick={crearLiga} disabled={!nuevaLiga.trim() || creandoLiga}
                    className="flex-shrink-0 px-4 py-3 rounded-xl text-sm font-bold link-muted-theme border disabled:opacity-50 transition-all"
                    style={{ borderColor: "var(--border-strong)" }}>
                    {creandoLiga ? "..." : "Crear"}
                  </button>
                </div>
                {errLiga && <p className="text-[11px] mt-1.5 text-red-400">{errLiga}</p>}
              </div>
            )}

            {partidos.map((p, i) => (
              <div key={i} className="rounded-2xl border p-4 space-y-4" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface-1)" }}>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-pantera-green">
                    Partido{partidos.length > 1 ? ` ${i + 1}` : ""}
                  </span>
                  {partidos.length > 1 && (
                    <button onClick={() => removePartido(i)}
                      className="text-xs text-red-500/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 px-2.5 py-1 rounded-lg transition-colors">
                      Quitar
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Liga / Copa</label>
                  <select className={input} value={p.liga_id} onChange={(e) => updatePartido(i, "liga_id", e.target.value)}
                    style={{ backgroundImage: "none" }}>
                    <option value="" style={{ background: "var(--bg-alt)" }}>Sin liga</option>
                    {ligas.map((l) => (
                      <option key={l.id} value={l.id} style={{ background: "var(--bg-alt)" }}>
                        {l.tipo === "copa" ? "🏆 " : ""}{l.nombre}
                      </option>
                    ))}
                  </select>
                  {ligas.length === 0 && (
                    <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                      Aún no tienes ligas registradas para esta categoría — créala abajo.
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Rival <span className="normal-case tracking-normal" style={{ color: "var(--text-muted)" }}>(opcional)</span>
                  </label>
                  <input className={input} placeholder="Ej: Tigres FC"
                    value={p.rival} onChange={(e) => updatePartido(i, "rival", e.target.value)} />
                </div>

                {/* Fase / Clasificación del partido */}
                <div>
                  <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>
                    Tipo de partido <span className="normal-case tracking-normal" style={{ color: "var(--text-muted)" }}>(opcional)</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {FASES.map((f) => (
                      <button key={f.value} onClick={() => updatePartido(i, "fase", p.fase === f.value ? "" : f.value)}
                        className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all active:scale-95 text-center ${
                          p.fase === f.value
                            ? "bg-pantera-green/20 border-pantera-green/40 text-pantera-green"
                            : "link-muted-theme"
                        }`}
                        style={p.fase !== f.value ? { borderColor: "var(--border-strong)" } : undefined}>
                        {f.emoji ? `${f.emoji} ${f.label}` : f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Número de jornada (solo cuando fase = jornada) */}
                {p.fase === "jornada" && (
                  <div>
                    <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Jornada</label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {Array.from({ length: 18 }, (_, x) => x + 1).map((n) => (
                        <button key={n} onClick={() => updatePartido(i, "jornada", String(n))}
                          className={`py-2 rounded-lg text-sm font-bold border transition-all active:scale-95 ${
                            p.jornada === String(n)
                              ? "bg-pantera-green/20 border-pantera-green/40 text-pantera-green"
                              : "link-muted-theme"
                          }`}
                          style={p.jornada !== String(n) ? { borderColor: "var(--border-strong)" } : undefined}>
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Día</label>
                  <select className={input} value={p.dia} onChange={(e) => updatePartido(i, "dia", e.target.value)}
                    style={{ backgroundImage: "none" }}>
                    {DIAS.map((d) => <option key={d} value={d} style={{ background: "var(--bg-alt)" }}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Uniforme</label>
                  <div className="grid grid-cols-2 gap-2">
                    {UNIFORMES.map((u) => (
                      <button key={u.value} onClick={() => updatePartido(i, "uniforme", u.value)}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all active:scale-95 ${
                          p.uniforme === u.value
                            ? u.value === "verde"
                              ? "bg-green-600 border-green-600 text-white"
                              : "bg-white border-white text-black"
                            : "link-muted-theme"
                        }`}
                        style={p.uniforme !== u.value ? { borderColor: "var(--border-strong)" } : undefined}>
                        <span className={`w-3 h-3 rounded-full flex-shrink-0 ${u.value === "verde" ? "bg-green-400" : "bg-white border border-gray-300"}`} />
                        {u.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Hora de cita</label>
                  <input type="time" className={input}
                    value={p.horaCita} onChange={(e) => updatePartido(i, "horaCita", e.target.value)} />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Hora de juego</label>
                  <input type="time" className={input}
                    value={p.horaJuego} onChange={(e) => updatePartido(i, "horaJuego", e.target.value)} />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Lugar</label>
                  <input className={input} placeholder="Ej: CANCHA INTER"
                    value={p.lugar} onChange={(e) => updatePartido(i, "lugar", e.target.value)} />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Nota <span className="normal-case tracking-normal" style={{ color: "var(--text-muted)" }}>(opcional)</span>
                  </label>
                  <textarea rows={2} className={`${input} resize-none`} placeholder="Ej: Llevar los dos uniformes"
                    value={p.nota} onChange={(e) => updatePartido(i, "nota", e.target.value)} />
                  <p className="text-[11px] mt-1.5" style={{ color: "var(--text-muted)" }}>
                    Se agrega al final del mensaje, resaltada en negritas.
                  </p>
                </div>

                {/* ── CONVOCATORIA ── */}
                <div className="pt-1">
                  <button
                    onClick={() => toggleConvocatoria(i)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold transition-all active:scale-[0.98] ${
                      p.convocatoria
                        ? "bg-pantera-green/10 border-pantera-green/30 text-pantera-green"
                        : "link-muted-theme"
                    }`}
                    style={!p.convocatoria ? { borderColor: "var(--border-strong)" } : undefined}>
                    <div className="flex items-center gap-2.5">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                        <path d="M16 3.13a4 4 0 010 7.75"/>
                      </svg>
                      {p.convocatoria
                        ? `Convocatoria (${p.convocados.length} seleccionados)`
                        : "Agregar convocatoria"}
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transform: p.convocatoria ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {p.convocatoria && (
                    <div className="mt-2 rounded-xl border overflow-hidden" style={{ borderColor: "var(--border-subtle)" }}>

                      {/* Encabezado con atajos */}
                      <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {p.convocados.length === 0
                            ? "Ninguno seleccionado"
                            : `${p.convocados.length} de ${jugadores.length} convocados`}
                        </span>
                        <div className="flex gap-3">
                          <button onClick={() => seleccionarTodos(i)}
                            className="text-xs text-pantera-green font-semibold hover:text-pantera-green/80 transition-colors">
                            Todos
                          </button>
                          <button onClick={() => quitarTodos(i)}
                            className="link-muted-theme text-xs font-semibold transition-colors">
                            Ninguno
                          </button>
                        </div>
                      </div>

                      {jugadores.length === 0 ? (
                        <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>
                          {cats.length > 1 && !catId ? "Selecciona una categoría primero" : "Sin jugadores en esta categoría"}
                        </p>
                      ) : (
                        <div className="divide-y max-h-72 overflow-y-auto" style={{ borderColor: "var(--border-subtle)" }}>
                          {jugadores.map((j) => {
                            const sel = p.convocados.includes(j.id);
                            return (
                              <button key={j.id} onClick={() => toggleConvocado(i, j.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors active:scale-[0.99] ${
                                  sel ? "bg-pantera-green/[0.06]" : ""
                                }`}>
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  sel ? "border-pantera-green bg-pantera-green" : ""
                                }`}
                                  style={!sel ? { borderColor: "var(--border-strong)" } : undefined}>
                                  {sel && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm leading-tight" style={{ color: "var(--text-primary)" }}>{j.nombre}</p>
                                  {j.alias && <p className="text-pantera-green text-[10px] leading-tight">"{j.alias}"</p>}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            <button onClick={addPartido}
              className="link-muted-theme w-full py-3 rounded-xl border border-dashed hover:border-pantera-green/40 hover:text-pantera-green text-sm font-semibold transition-all" style={{ borderColor: "var(--border-strong)" }}>
              + Agregar partido
            </button>
          </div>
        )}

        {/* ── CANCELACIÓN ── */}
        {tipo === "cancelacion" && (
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Día cancelado</label>
              <select className={input} value={diaCan} onChange={(e) => setDiaCan(e.target.value)}
                style={{ backgroundImage: "none" }}>
                {DIAS.map((d) => <option key={d} value={d} style={{ background: "var(--bg-alt)" }}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Motivo <span className="normal-case tracking-normal" style={{ color: "var(--text-muted)" }}>(opcional)</span>
              </label>
              <input className={input} placeholder="Ej: Lluvia, mantenimiento..."
                value={motivoCan} onChange={(e) => setMotivo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Próxima práctica</label>
              <select className={input} value={proximoDia} onChange={(e) => setProx(e.target.value)}
                style={{ backgroundImage: "none" }}>
                {DIAS.map((d) => <option key={d} value={d} style={{ background: "var(--bg-alt)" }}>{d}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* ── GENERAL ── */}
        {tipo === "general" && (
          <div>
            <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Mensaje</label>
            <textarea rows={5} className={`${input} resize-none`}
              placeholder="Escribe el aviso aquí..."
              value={textoGen} onChange={(e) => setTextoGen(e.target.value)} />
          </div>
        )}

        {/* Vista previa */}
        <div id="tour-avisos-preview">
          <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Vista previa</label>
          <div className="rounded-2xl border p-4 overflow-hidden" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
            <pre className="text-sm leading-relaxed whitespace-pre-wrap break-words font-sans" style={{ color: "var(--text-primary)" }}>
              {mensaje}
            </pre>
          </div>
        </div>

        {/* Estado guardado */}
        {tipo === "partido" && (guardado || errGuardado) && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${
            guardado
              ? "bg-green-500/10 border-green-500/20 text-[var(--status-good)]"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {guardado
              ? "Partido registrado — la lista de asistencia está lista"
              : errGuardado}
          </div>
        )}

        {/* Botones */}
        <div id="tour-avisos-botones" className="grid grid-cols-2 gap-3 pb-6">
          <button onClick={copiar}
            className={`py-4 rounded-xl border text-sm font-bold transition-all ${
              copiado
                ? "bg-green-600 border-green-600 text-white"
                : "link-muted-theme"
            }`}
            style={!copiado ? { borderColor: "var(--border-strong)" } : undefined}>
            {copiado ? "Copiado" : "Copiar"}
          </button>
          <button onClick={enviarWhatsApp} disabled={guardando}
            className="py-4 rounded-xl text-white text-sm font-bold disabled:opacity-60 transition-all"
            style={{ background: "#25D366" }}>
            {guardando ? "Guardando..." : "Enviar por WhatsApp"}
          </button>
        </div>
      </div>
    </div>
  );
}
