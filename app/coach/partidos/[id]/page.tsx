"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Toaster, toast } from "react-hot-toast";
import { computeLigaStats } from "@/lib/liga-stats";
import { useClub } from "@/lib/club-context";

interface Jugador {
  id: string;
  nombre: string;
  asistId: string | null;
  asistio: boolean | null;
}

interface ConfPadre {
  id: string;
  padre_nombre: string;
  jugador_ids: string[];
  estado: "pendiente" | "asiste" | "no_asiste";
}

interface Partido {
  id: string;
  liga_id: string | null;
  rival: string | null;
  lugar: string | null;
  fecha: string | null;
  hora_juego: string | null;
  uniforme: string | null;
  goles_favor: number | null;
  goles_contra: number | null;
  fase: string | null;
  categoria_id: string;
}

interface LigaItem { id: string; nombre: string; tipo: string; categoria_id: string }
interface SiblingPartido { id: string; goles_favor: number | null; goles_contra: number | null; fase: string | null }

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_LARGO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const fmtFecha = (f: string | null) => {
  if (!f) return "—";
  const [, m, d] = f.split("-");
  return `${parseInt(d)} de ${MESES[parseInt(m) - 1]}`;
};

const fmtFechaLargo = (f: string | null) => {
  if (!f) return "—";
  const [, m, d] = f.split("-");
  return `${parseInt(d)} de ${MESES_LARGO[parseInt(m) - 1]}`;
};

export default function PartidoDetallePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { logoUrl } = useClub();

  const [partido, setPartido]         = useState<Partido | null>(null);
  const [jugadores, setJugadores]     = useState<Jugador[]>([]);
  const [confs, setConfs]             = useState<ConfPadre[]>([]);
  const [golesP, setGolesP]           = useState("");
  const [golesR, setGolesR]           = useState("");
  const [loading, setLoading]         = useState(true);
  const [guardando, setGuardando]     = useState(false);
  const [compartiendo, setCompartiendo] = useState(false);
  const [listaAbierta, setListaAbierta] = useState(false);

  const [ligas, setLigas]             = useState<LigaItem[]>([]);
  const [siblings, setSiblings]       = useState<SiblingPartido[]>([]);

  const [editOpen, setEditOpen]   = useState(false);
  const [editLigaId, setEditLigaId] = useState("");
  const [editRival, setEditRival] = useState("");
  const [editLugar, setEditLugar] = useState("");
  const [editFecha, setEditFecha] = useState("");
  const [editHora, setEditHora]   = useState("");
  const [editUni, setEditUni]     = useState("verde");
  const [editSaving, setEditSaving] = useState(false);

  const [delOpen, setDelOpen]       = useState(false);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: part } = await supabase.from("partidos").select("*").eq("id", id).single();
      if (!part) { setLoading(false); return; }
      setPartido(part);
      setGolesP(part.goles_favor !== null ? String(part.goles_favor) : "");
      setGolesR(part.goles_contra !== null ? String(part.goles_contra) : "");

      const { data: ligasData } = await supabase.from("ligas").select("id, nombre, tipo, categoria_id").eq("categoria_id", part.categoria_id).order("nombre");
      setLigas(ligasData ?? []);

      if (part.liga_id) {
        const { data: sibData } = await supabase.from("partidos").select("id, goles_favor, goles_contra, fase").eq("liga_id", part.liga_id);
        setSiblings(sibData ?? []);
      }

      const { data: asistData } = await supabase
        .from("asistencia_partidos")
        .select("id, asistio, jugador_id, jugadores(id, nombre)")
        .eq("partido_id", id);

      let lista: Jugador[] = [];
      if (asistData && asistData.length > 0) {
        lista = [...asistData]
          .map((a: any) => ({
            id:      a.jugadores?.id ?? a.jugador_id,
            nombre:  a.jugadores?.nombre ?? "—",
            asistId: a.id,
            asistio: a.asistio,
          }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));
      }

      if (lista.length === 0) {
        const { data: jugsData } = await supabase
          .from("jugadores").select("id, nombre")
          .eq("categoria_id", part.categoria_id).eq("activo", true).order("nombre");
        lista = (jugsData ?? []).map((j: any) => ({
          id: j.id, nombre: j.nombre, asistId: null, asistio: null,
        }));
      }

      setJugadores(lista);

      // Confirmaciones de padres (incluye jugador_ids para mostrar nombre del hijo)
      const { data: confData } = await supabase
        .from("confirmaciones_partido")
        .select("id, estado, padres(nombre, jugador_ids)")
        .eq("partido_id", id);

      if (confData) {
        setConfs(confData.map((c: any) => ({
          id:           c.id,
          padre_nombre: c.padres?.nombre ?? "Familia",
          jugador_ids:  c.padres?.jugador_ids ?? [],
          estado:       c.estado,
        })));
      }

      setLoading(false);
    };
    load();
  }, [id]);

  const toggleAsistio = (jugId: string) => {
    setJugadores((prev) => prev.map((j) => {
      if (j.id !== jugId) return j;
      const next = j.asistio === null ? true : j.asistio === true ? false : null;
      return { ...j, asistio: next };
    }));
  };

  const marcarTodos = (valor: boolean) => {
    setJugadores((prev) => prev.map((j) => ({ ...j, asistio: valor })));
  };

  const guardarTodo = async (): Promise<Jugador[]> => {
    if (!partido) return jugadores;
    const gf = golesP !== "" ? parseInt(golesP) : null;
    const gc = golesR !== "" ? parseInt(golesR) : null;
    await supabase.from("partidos").update({ goles_favor: gf, goles_contra: gc }).eq("id", partido.id);
    setSiblings((prev) => {
      const idx = prev.findIndex((s) => s.id === partido.id);
      const patched = { id: partido.id, goles_favor: gf, goles_contra: gc, fase: partido.fase };
      if (idx === -1) return partido.liga_id ? [...prev, patched] : prev;
      const next = [...prev];
      next[idx] = patched;
      return next;
    });

    const updated = [...jugadores];
    for (let i = 0; i < updated.length; i++) {
      const j = updated[i];
      if (j.asistId) {
        await supabase.from("asistencia_partidos").update({ asistio: j.asistio }).eq("id", j.asistId);
      } else {
        const { data: ins } = await supabase.from("asistencia_partidos")
          .insert({ partido_id: id, jugador_id: j.id, asistio: j.asistio })
          .select("id").single();
        if (ins) updated[i] = { ...j, asistId: ins.id };
      }
    }
    setJugadores(updated);
    return updated;
  };

  const guardar = async () => {
    setGuardando(true);
    await guardarTodo();
    setGuardando(false);
    toast.success("Partido guardado", { duration: 2500 });
  };

  const nombreLiga = (ligaId: string | null) => ligas.find((l) => l.id === ligaId)?.nombre ?? "Sin liga";
  const ligaStats = computeLigaStats(siblings);

  const compartirPDF = async () => {
    if (!partido) return;
    setCompartiendo(true);
    const lista = await guardarTodo();
    toast.success("Partido guardado", { duration: 2000 });

    const gp = parseInt(golesP);
    const gr = parseInt(golesR);
    const tieneMarcador = !isNaN(gp) && !isNaN(gr) && golesP !== "" && golesR !== "";
    const ganamos = tieneMarcador && gp > gr;
    const empate  = tieneMarcador && gp === gr;

    const presentesManuales = lista.filter((j) => j.asistio === true);
    const idsPresentesManuales = new Set(presentesManuales.map((j) => j.id));

    // Incluir hijos confirmados por padres que no estén ya en la lista manual
    const confirmadosExtra = confs
      .filter((c) => c.estado === "asiste")
      .flatMap((c) => c.jugador_ids)
      .filter((jid, i, arr) => arr.indexOf(jid) === i)
      .filter((jid) => !idsPresentesManuales.has(jid))
      .map((jid) => lista.find((j) => j.id === jid) ?? jugadores.find((j) => j.id === jid))
      .filter((j): j is Jugador => j !== undefined);

    const presentes = [...presentesManuales, ...confirmadosExtra]
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    try {
      const { jsPDF } = await import("jspdf");
      const { autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210;
      const margin = 14;

      // Logo centrado y grande
      let logoBase64 = "";
      try {
        const resp = await fetch(logoUrl);
        const blob = await resp.blob();
        logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch { /* sin logo */ }

      const logoSize = 30;
      const logoX    = (W - logoSize) / 2;
      if (logoBase64) doc.addImage(logoBase64, "PNG", logoX, 8, logoSize, logoSize);

      let y = logoBase64 ? 8 + logoSize + 5 : 14;

      // "Panteras Saltillo" — centrado, verde, grande
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(22, 163, 74);
      doc.text("Panteras Saltillo", W / 2, y, { align: "center" });
      y += 6;

      // Línea decorativa verde
      doc.setDrawColor(22, 163, 74);
      doc.setLineWidth(0.7);
      doc.line(margin + 20, y, W - margin - 20, y);
      y += 9;

      // Etiqueta "TORNEO"
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(130, 130, 130);
      doc.text("TORNEO", W / 2, y, { align: "center" });
      y += 6;

      // Nombre del torneo/liga — negro, grande, centrado
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.setTextColor(0, 0, 0);
      doc.text(nombreLiga(partido.liga_id), W / 2, y, { align: "center" });
      y += 9;

      // vs RIVAL — negro, muy grande, centrado
      if (partido.rival) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(19);
        doc.setTextColor(0, 0, 0);
        doc.text(`vs ${partido.rival.toUpperCase()}`, W / 2, y, { align: "center" });
        y += 9;
      }

      // Fecha · Hora · Lugar — negro, legible, centrado
      const detalles: string[] = [];
      if (partido.rival)      detalles.push(`vs ${partido.rival}`);
      if (partido.fecha)      detalles.push(fmtFechaLargo(partido.fecha));
      if (partido.lugar)      detalles.push(partido.lugar);
      if (partido.hora_juego) detalles.push(partido.hora_juego.slice(0, 5) + " h");

      const infoItems: string[] = [];
      if (partido.fecha)      infoItems.push(fmtFechaLargo(partido.fecha));
      if (partido.hora_juego) infoItems.push(partido.hora_juego.slice(0, 5) + " h");
      if (partido.lugar)      infoItems.push(partido.lugar);

      if (infoItems.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(infoItems.join("   ·   "), W / 2, y, { align: "center" });
        y += 9;
      }

      // Línea separadora gris
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, y, W - margin, y);
      y += 12;

      // Marcador
      if (tieneMarcador) {
        const [cr, cg, cb] = ganamos ? [22, 163, 74] : empate ? [202, 138, 4] : [220, 38, 38];
        const label = ganamos ? "VICTORIA" : empate ? "EMPATE" : "DERROTA";
        const rivalNombre = (partido.rival || "Rival").toUpperCase();

        doc.setFillColor(245, 245, 245);
        doc.roundedRect(margin, y, W - margin * 2, 36, 3, 3, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(cr, cg, cb);
        doc.text(label, W / 2, y + 11, { align: "center" });

        doc.setFontSize(19);
        doc.setTextColor(10, 10, 10);
        doc.text(`Panteras  ${gp}  —  ${gr}  ${rivalNombre}`, W / 2, y + 27, { align: "center" });

        y += 46;
      }

      // Título lista de asistencia — centrado, negro, grande
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Asistencia al partido — ${presentes.length} jugador${presentes.length !== 1 ? "es" : ""}`,
        W / 2, y, { align: "center" }
      );
      y += 7;

      autoTable(doc, {
        startY: y,
        head: [["#", "Jugador"]],
        body: presentes.map((j, i) => [String(i + 1), j.nombre]),
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold", fontSize: 12 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 13, cellPadding: 5 },
        columnStyles: {
          0: { halign: "center", cellWidth: 15 },
          1: { textColor: [0, 0, 0] },
        },
        margin: { left: margin, right: margin },
      });

      if (presentes.length === 0) {
        const finalY = (doc as any).lastAutoTable?.finalY ?? y + 10;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        doc.text("Sin jugadores registrados como asistentes.", W / 2, finalY + 10, { align: "center" });
      }

      // Footer
      const pages = doc.getNumberOfPages();
      const hoy = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generado el ${hoy} · Panteras Saltillo`, margin, 290);
        doc.text(`${i} / ${pages}`, W - margin, 290, { align: "right" });
      }

      const slug = nombreLiga(partido.liga_id).replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `partido_${slug}_${partido.fecha ?? "sin_fecha"}.pdf`;
      const pdfBlob = doc.output("blob");

      // Web Share API — abre el selector nativo (WhatsApp, etc.)
      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], fileName, { type: "application/pdf" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `Partido ${nombreLiga(partido.liga_id)}`,
            text: detalles.join(" · "),
          });
          setCompartiendo(false);
          return;
        }
      }

      // Fallback: descarga directa
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al generar PDF");
    }
    setCompartiendo(false);
  };

  const abrirEditor = () => {
    if (!partido) return;
    setEditLigaId(partido.liga_id ?? "");
    setEditRival(partido.rival ?? "");
    setEditLugar(partido.lugar ?? "");
    setEditFecha(partido.fecha ?? "");
    setEditHora((partido.hora_juego ?? "").slice(0, 5));
    setEditUni(partido.uniforme ?? "verde");
    setEditOpen(true);
  };

  const guardarEdicion = async () => {
    if (!partido) return;
    setEditSaving(true);
    const updates = {
      liga_id:    editLigaId || null,
      rival:      editRival.trim() || null,
      lugar:      editLugar.trim() || null,
      fecha:      editFecha || null,
      hora_juego: editHora || null,
      uniforme:   editUni,
    };
    await supabase.from("partidos").update(updates).eq("id", partido.id);
    setPartido({ ...partido, ...updates });
    setEditSaving(false);
    setEditOpen(false);
    toast.success("Partido actualizado");
  };

  const eliminarPartido = async () => {
    setEliminando(true);
    await supabase.from("partidos").delete().eq("id", id);
    router.push("/coach/partidos");
  };

  const presentes = jugadores.filter((j) => j.asistio === true).length;
  const ausentes  = jugadores.filter((j) => j.asistio === false).length;

  const marcarDesdeConfirmaciones = () => {
    const confirmadosIds = confs
      .filter((c) => c.estado === "asiste")
      .flatMap((c) => c.jugador_ids);
    if (confirmadosIds.length === 0) return;
    setJugadores((prev) => prev.map((j) => ({
      ...j,
      asistio: confirmadosIds.includes(j.id) ? true : j.asistio,
    })));
    toast.success("Lista pre-llenada desde confirmaciones");
  };

  const gp = parseInt(golesP);
  const gr = parseInt(golesR);
  const tieneMarcador = !isNaN(gp) && !isNaN(gr) && golesP !== "" && golesR !== "";
  const ganamos  = tieneMarcador && gp > gr;
  const empate   = tieneMarcador && gp === gr;
  const perdimos = tieneMarcador && gp < gr;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
      <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!partido) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ background: "var(--bg-page)" }}>
      <p style={{ color: "var(--text-secondary)" }}>Partido no encontrado</p>
      <button onClick={() => router.back()} className="text-pantera-green text-sm">← Volver</button>
    </div>
  );

  const inicial = (n: string) => n.trim().charAt(0).toUpperCase();
  const inputCls = "input-theme text-sm";

  return (
    <div className="min-h-screen pb-10" style={{ background: "var(--bg-page)" }}>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: "#1a1a1a", color: "#fff", border: "1px solid #2a2a2a", fontSize: "14px" },
          success: { iconTheme: { primary: "#2ed573", secondary: "#0a0a0a" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#0a0a0a" } },
        }}
      />

      <header className="border-b px-4 py-4 flex items-center gap-2 sticky top-0 z-10" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <button onClick={() => router.back()} className="link-muted-theme text-lg w-8 flex-shrink-0">←</button>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold leading-tight truncate" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
            {nombreLiga(partido.liga_id)}
          </h1>
          <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
            {partido.rival ? `vs ${partido.rival} · ` : ""}{fmtFecha(partido.fecha)}
            {partido.lugar ? ` · ${partido.lugar}` : ""}
          </p>
        </div>
        <button onClick={abrirEditor}
          className="link-muted-theme w-9 h-9 flex items-center justify-center rounded-lg transition-colors flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button onClick={() => setDelOpen(true)}
          className="w-9 h-9 flex items-center justify-center hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0" style={{ color: "var(--text-muted)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
        </button>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">

        {/* Confirmaciones de padres — arriba porque es info pre-partido */}
        {confs.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                Confirmaciones
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {confs.filter(c => c.estado === "asiste").length} de {confs.length} asisten
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: "Asisten",       color: "green", count: confs.filter(c => c.estado === "asiste").length },
                { label: "No asisten",    color: "red",   count: confs.filter(c => c.estado === "no_asiste").length },
                { label: "Sin respuesta", color: "gray",  count: confs.filter(c => c.estado === "pendiente").length },
              ].map(({ label, color, count }) => (
                <div key={label} className={`rounded-xl p-3 text-center border ${
                  color === "green" ? "bg-green-500/10 border-green-500/20" :
                  color === "red"   ? "bg-red-500/10 border-red-500/20" :
                  ""
                }`} style={color === "gray" ? { background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" } : undefined}>
                  <p className={`font-black text-2xl ${
                    color === "green" ? "text-[var(--status-good)]" : color === "red" ? "text-red-400" : ""
                  }`} style={{ fontFamily: "Syne, sans-serif", color: color === "gray" ? "var(--text-secondary)" : undefined }}>{count}</p>
                  <p className={`text-[9px] uppercase tracking-wider mt-0.5 ${
                    color === "green" ? "text-green-600" : color === "red" ? "text-red-600" : ""
                  }`} style={color === "gray" ? { color: "var(--text-muted)" } : undefined}>{label}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              {confs.map((c) => {
                const hijosNombres = c.jugador_ids
                  .map((jid) => jugadores.find((j) => j.id === jid)?.nombre)
                  .filter(Boolean) as string[];
                const displayName = hijosNombres.length > 0 ? hijosNombres.join(", ") : c.padre_nombre;
                return (
                  <div key={c.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${
                    c.estado === "asiste"    ? "bg-green-500/5 border-green-500/15" :
                    c.estado === "no_asiste" ? "bg-red-500/5 border-red-500/15" :
                    ""
                  }`} style={c.estado === "pendiente" ? { background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" } : undefined}>
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      c.estado === "asiste" ? "bg-green-400" : c.estado === "no_asiste" ? "bg-red-400" : ""
                    }`} style={c.estado === "pendiente" ? { background: "var(--border-strong)" } : undefined} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm block truncate" style={{ color: "var(--text-secondary)" }}>{displayName}</span>
                      {hijosNombres.length > 0 && (
                        <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Fam. {c.padre_nombre}</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold flex-shrink-0 ${
                      c.estado === "asiste" ? "text-[var(--status-good)]" : c.estado === "no_asiste" ? "text-red-400" : ""
                    }`} style={c.estado === "pendiente" ? { color: "var(--text-muted)" } : undefined}>
                      {c.estado === "asiste" ? "Asiste" : c.estado === "no_asiste" ? "No asiste" : "Pendiente"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lista de asistencia manual — colapsable, secundaria */}
        <div className="rounded-2xl overflow-hidden border" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
          {/* Header colapsable */}
          <button
            onClick={() => setListaAbierta((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 transition-colors">
            <div className="flex items-center gap-3">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--text-muted)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Lista de asistencia manual</span>
              {(presentes > 0 || ausentes > 0) && (
                <div className="flex items-center gap-2">
                  <span className="text-[var(--status-good)] text-xs font-bold">{presentes} asist.</span>
                  <span className="text-red-400 text-xs font-bold">{ausentes} faltas</span>
                </div>
              )}
            </div>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--text-muted)" }} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              className={`transition-transform flex-shrink-0 ${listaAbierta ? "rotate-180" : ""}`}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {/* Contenido desplegable */}
          {listaAbierta && (
            <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: "var(--border-subtle)" }}>
              {/* Acciones rápidas */}
              <div className="flex items-center gap-2 flex-wrap">
                {confs.filter(c => c.estado === "asiste" && c.jugador_ids.length > 0).length > 0 && (
                  <button onClick={marcarDesdeConfirmaciones}
                    className="text-[10px] text-pantera-green border border-pantera-green/25 hover:bg-pantera-green/10 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    Pre-llenar desde confirmaciones
                  </button>
                )}
                <button onClick={() => marcarTodos(true)}
                  className="link-muted-theme text-[10px] hover:text-[var(--status-good)] border hover:border-green-500/30 px-2.5 py-1.5 rounded-lg transition-colors" style={{ borderColor: "var(--border-strong)" }}>
                  Todos presentes
                </button>
                <button onClick={() => marcarTodos(false)}
                  className="link-muted-theme text-[10px] hover:text-red-400 border hover:border-red-500/30 px-2.5 py-1.5 rounded-lg transition-colors" style={{ borderColor: "var(--border-strong)" }}>
                  Ninguno
                </button>
              </div>

              {/* Jugadores */}
              {jugadores.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>No hay jugadores en esta categoría.</p>
              ) : (
                <div className="space-y-1.5">
                  {jugadores.map((j) => (
                    <button key={j.id} onClick={() => toggleAsistio(j.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                        j.asistio === true  ? "bg-green-500/10 border-green-500/25" :
                        j.asistio === false ? "bg-red-500/10 border-red-500/25" :
                        "hover:border-white/15"
                      }`} style={j.asistio === null ? { background: "var(--bg-surface-2)", borderColor: "var(--border-subtle)" } : undefined}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        j.asistio === true  ? "bg-green-500/20 text-[var(--status-good)]" :
                        j.asistio === false ? "bg-red-500/20 text-red-400" :
                        ""
                      }`} style={j.asistio === null ? { background: "var(--bg-surface-2)", color: "var(--text-secondary)" } : undefined}>
                        {j.asistio === true
                          ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          : j.asistio === false
                            ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            : inicial(j.nombre)
                        }
                      </div>
                      <span className={`text-sm font-medium flex-1 ${
                        j.asistio === true ? "" : j.asistio === false ? "" : ""
                      }`} style={{ color: j.asistio === true ? "var(--text-primary)" : j.asistio === false ? "var(--text-muted)" : "var(--text-secondary)" }}>{j.nombre}</span>
                      <span className={`text-[10px] font-bold flex-shrink-0 ${
                        j.asistio === true ? "text-[var(--status-good)]" : j.asistio === false ? "text-red-400" : ""
                      }`} style={j.asistio === null ? { color: "var(--text-muted)" } : undefined}>
                        {j.asistio === true ? "ASISTIO" : j.asistio === false ? "FALTO" : "—"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Marcador */}
        <div>
          <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>
            Marcador <span className="normal-case tracking-normal" style={{ color: "var(--text-muted)" }}>(opcional)</span>
          </label>
          <div className="rounded-2xl p-4 border" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="text-center">
                <p className={`text-[10px] uppercase tracking-widest font-bold mb-2 ${ganamos ? "text-pantera-green" : ""}`} style={!ganamos ? { color: "var(--text-secondary)" } : undefined}>Panteras</p>
                <input type="number" min={0} inputMode="numeric"
                  value={golesP} onChange={(e) => setGolesP(e.target.value)} placeholder="0"
                  className={`w-full border rounded-xl px-2 py-3 text-center text-2xl font-black focus:outline-none transition-all ${
                    ganamos ? "border-pantera-green/40 text-pantera-green" : empate ? "border-[var(--status-neutral)]/50 text-[var(--status-neutral)]" : ""
                  }`} style={{ fontFamily: "Syne, sans-serif", background: "var(--bg-surface-2)", borderColor: (ganamos || empate) ? undefined : "var(--border-strong)", color: (ganamos || empate) ? undefined : (perdimos ? "var(--text-muted)" : "var(--text-primary)") }}
                />
              </div>
              <span className="text-xl font-bold pt-6" style={{ color: "var(--text-muted)" }}>—</span>
              <div className="text-center">
                <p className={`text-[10px] uppercase tracking-widest font-bold mb-2 truncate ${perdimos ? "text-red-400" : ""}`} style={!perdimos ? { color: "var(--text-secondary)" } : undefined}>{partido.rival || "Rival"}</p>
                <input type="number" min={0} inputMode="numeric"
                  value={golesR} onChange={(e) => setGolesR(e.target.value)} placeholder="0"
                  className={`w-full border rounded-xl px-2 py-3 text-center text-2xl font-black focus:outline-none transition-all ${
                    perdimos ? "border-red-500/40 text-red-400" : empate ? "border-[var(--status-neutral)]/50 text-[var(--status-neutral)]" : ""
                  }`} style={{ fontFamily: "Syne, sans-serif", background: "var(--bg-surface-2)", borderColor: (perdimos || empate) ? undefined : "var(--border-strong)", color: (perdimos || empate) ? undefined : (ganamos ? "var(--text-muted)" : "var(--text-primary)") }}
                />
              </div>
            </div>
            {tieneMarcador && (
              <div className="mt-4 flex items-center justify-center">
                <span className={`text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${
                  ganamos ? "bg-pantera-green/10 text-pantera-green border-pantera-green/30" :
                  empate  ? "bg-[var(--bg-surface-2)] text-[var(--status-neutral)] border-[var(--status-neutral)]/50" :
                            "bg-red-500/10 text-red-400 border-red-500/30"
                }`}>
                  {ganamos ? "Victoria" : empate ? "Empate" : "Derrota"}
                </span>
              </div>
            )}
          </div>

          {partido.liga_id && ligaStats.pj > 0 && (
            <div className="rounded-2xl p-4 mt-3 border" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--text-secondary)" }}>
                  {nombreLiga(partido.liga_id)}
                </span>
                <span className="text-sm font-black text-[var(--status-good)]" style={{ fontFamily: "Syne, sans-serif" }}>{ligaStats.pts} pts</span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                PJ {ligaStats.pj} · {ligaStats.pg}G-{ligaStats.pe}E-{ligaStats.pp}P · GF:GC {ligaStats.gf}:{ligaStats.gc} ({ligaStats.dg >= 0 ? "+" : ""}{ligaStats.dg})
              </p>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button onClick={guardar} disabled={guardando || compartiendo}
            className="link-muted-theme py-4 rounded-xl text-sm font-bold border disabled:opacity-50 transition-all" style={{ borderColor: "var(--border-strong)" }}>
            {guardando ? "Guardando..." : "Guardar"}
          </button>
          <button onClick={compartirPDF} disabled={guardando || compartiendo}
            className="py-4 rounded-xl text-sm font-bold bg-pantera-green/10 border border-pantera-green/30 text-pantera-green hover:bg-pantera-green/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {compartiendo ? "Generando..." : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                Compartir PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal Editar */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => !editSaving && setEditOpen(false)}>
          <div className="w-full sm:max-w-md border-t sm:border sm:rounded-2xl rounded-t-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-alt)", borderColor: "var(--border-strong)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>Editar partido</h2>
              <button onClick={() => setEditOpen(false)} disabled={editSaving} className="link-muted-theme text-xl w-8 h-8">×</button>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Liga / Copa</label>
              <select className={inputCls} value={editLigaId} onChange={(e) => setEditLigaId(e.target.value)} style={{ backgroundImage: "none" }}>
                <option value="" style={{ background: "var(--bg-alt)" }}>Sin liga</option>
                {ligas.map((l) => (
                  <option key={l.id} value={l.id} style={{ background: "var(--bg-alt)" }}>
                    {l.tipo === "copa" ? "🏆 " : ""}{l.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Rival</label>
              <input className={inputCls} value={editRival} onChange={(e) => setEditRival(e.target.value)} placeholder="Equipo contrario" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Lugar</label>
              <input className={inputCls} value={editLugar} onChange={(e) => setEditLugar(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Fecha</label>
                <input type="date" className={inputCls} value={editFecha} onChange={(e) => setEditFecha(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Hora</label>
                <input type="time" className={inputCls} value={editHora} onChange={(e) => setEditHora(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Uniforme</label>
              <div className="grid grid-cols-2 gap-2">
                {[{ value: "verde", label: "🟢 Verde" }, { value: "blanco", label: "⚪ Blanco" }].map((u) => (
                  <button key={u.value} onClick={() => setEditUni(u.value)}
                    className={`py-2.5 rounded-xl border text-sm font-bold transition-all ${
                      editUni === u.value
                        ? u.value === "verde" ? "bg-green-600 border-green-600 text-white" : "bg-white border-white text-black"
                        : "link-muted-theme"
                    }`}
                    style={editUni !== u.value ? { borderColor: "var(--border-strong)" } : undefined}>{u.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setEditOpen(false)} disabled={editSaving}
                className="link-muted-theme py-3 rounded-xl border text-sm font-bold transition-colors" style={{ borderColor: "var(--border-strong)" }}>Cancelar</button>
              <button onClick={guardarEdicion} disabled={editSaving}
                className="py-3 rounded-xl bg-pantera-green text-white text-sm font-bold disabled:opacity-60 transition-colors">
                {editSaving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {delOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => !eliminando && setDelOpen(false)}>
          <div className="w-full max-w-sm border border-red-500/20 rounded-2xl p-5 space-y-4" style={{ background: "var(--bg-alt)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h2 className="font-bold" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>¿Eliminar partido?</h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Se eliminará <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{nombreLiga(partido.liga_id)}</span>
              {partido.rival ? <> vs <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{partido.rival}</span></> : null}
              {" "}y toda su lista de asistencia.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setDelOpen(false)} disabled={eliminando}
                className="link-muted-theme py-3 rounded-xl border text-sm font-bold transition-colors" style={{ borderColor: "var(--border-strong)" }}>Cancelar</button>
              <button onClick={eliminarPartido} disabled={eliminando}
                className="py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-60 transition-colors">
                {eliminando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
