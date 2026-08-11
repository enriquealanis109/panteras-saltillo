"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, authHeaders } from "@/lib/supabase";
import { Toaster, toast } from "react-hot-toast";
import { PanelTour } from "@/components/admin/PanelTour";
import { PARTIDOS_COACH_STEPS } from "@/lib/coach-tours";
import { computeLigaStats } from "@/lib/liga-stats";
import { useClub } from "@/lib/club-context";

interface PartidoItem {
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
  jornada: string | null;
  categoria_id: string;
  cat_nombre: string;
  total: number;
  presentes: number;
  confirmaronPadres: number;
}

interface LigaItem { id: string; nombre: string; tipo: string; activo: boolean; categoria_id: string }

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES_LARGO = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const fmtFecha = (f: string | null) => {
  if (!f) return "—";
  const [, m, d] = f.split("-");
  return `${parseInt(d)} ${MESES[parseInt(m) - 1]}`;
};

const fmtFechaLargo = (f: string | null) => {
  if (!f) return "—";
  const [, m, d] = f.split("-");
  return `${parseInt(d)} de ${MESES_LARGO[parseInt(m) - 1]}`;
};

export default function PartidosPage() {
  const router = useRouter();
  const { logoUrl } = useClub();
  const [partidos, setPartidos] = useState<PartidoItem[]>([]);
  const [ligas, setLigas]       = useState<LigaItem[]>([]);
  const [cats, setCats]         = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading]   = useState(true);

  // Modal editar
  const [editPartido, setEditPartido] = useState<PartidoItem | null>(null);
  const [editLigaId, setEditLigaId] = useState("");
  const [editRival, setEditRival] = useState("");
  const [editLugar, setEditLugar] = useState("");
  const [editFecha, setEditFecha] = useState("");
  const [editHora, setEditHora]   = useState("");
  const [editUni, setEditUni]     = useState("verde");
  const [editSaving, setEditSaving] = useState(false);

  // Modal eliminar
  const [deletePartido, setDeletePartido] = useState<PartidoItem | null>(null);
  const [eliminando, setEliminando]       = useState(false);

  // Compartir PDF
  const [compartiendo, setCompartiendo] = useState<string | null>(null);
  const [reporteando, setReporteando] = useState<string | null>(null);

  // Notificar padres
  const [notificando, setNotificando] = useState<string | null>(null);

  // Modal gestionar ligas/copas
  const [manageLigas, setManageLigas]   = useState(false);
  const [catIdLigas, setCatIdLigas]     = useState("");
  const [nuevaLigaNombre, setNuevaLigaNombre] = useState("");
  const [nuevaLigaTipo, setNuevaLigaTipo]     = useState<"liga" | "copa">("liga");
  const [creandoLiga, setCreandoLiga]   = useState(false);
  const [errNuevaLiga, setErrNuevaLiga] = useState("");
  const [renombrando, setRenombrando]   = useState<string | null>(null);
  const [renombreValor, setRenombreValor] = useState("");
  const [avisoLiga, setAvisoLiga]       = useState<{ liga: LigaItem; count: number } | null>(null);

  const cargar = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: rels } = await supabase
      .from("entrenador_categorias").select("categoria_id").eq("entrenador_id", user.id);
    const catIds = (rels ?? []).map((r: { categoria_id: string }) => r.categoria_id);
    if (catIds.length === 0) { setLoading(false); return; }

    const { data: catsData } = await supabase.from("categorias").select("id, nombre").in("id", catIds).order("nombre");
    const catMap: Record<string, string> = {};
    (catsData ?? []).forEach((c: { id: string; nombre: string }) => { catMap[c.id] = c.nombre; });
    setCats(catsData ?? []);
    if ((catsData ?? []).length === 1) setCatIdLigas(catsData![0].id);

    const { data: ligasData } = await supabase.from("ligas").select("*").in("categoria_id", catIds).order("nombre");
    setLigas(ligasData ?? []);

    const { data: parts } = await supabase.from("partidos").select("*")
      .in("categoria_id", catIds)
      .order("fecha", { ascending: false })
      .order("created_at", { ascending: false });

    if (!parts || parts.length === 0) { setLoading(false); return; }

    const partIds = parts.map((p: { id: string }) => p.id);
    const [{ data: asist }, { data: confsData }] = await Promise.all([
      supabase.from("asistencia_partidos").select("partido_id, asistio").in("partido_id", partIds),
      supabase.from("confirmaciones_partido").select("partido_id, estado").in("partido_id", partIds),
    ]);

    const countMap: Record<string, { total: number; presentes: number }> = {};
    (asist ?? []).forEach((a: { partido_id: string; asistio: boolean | null }) => {
      if (!countMap[a.partido_id]) countMap[a.partido_id] = { total: 0, presentes: 0 };
      countMap[a.partido_id].total++;
      if (a.asistio === true) countMap[a.partido_id].presentes++;
    });

    const confMap: Record<string, number> = {};
    (confsData ?? []).forEach((c: { partido_id: string; estado: string }) => {
      if (c.estado === "asiste") confMap[c.partido_id] = (confMap[c.partido_id] ?? 0) + 1;
    });

    setPartidos(parts.map((p: any) => ({
      ...p,
      cat_nombre:        catMap[p.categoria_id] ?? "—",
      total:             countMap[p.id]?.total    ?? 0,
      presentes:         countMap[p.id]?.presentes ?? 0,
      confirmaronPadres: confMap[p.id]            ?? 0,
    })));
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []); // eslint-disable-line

  const nombreLiga = (ligaId: string | null) => ligas.find((l) => l.id === ligaId)?.nombre ?? "Sin liga";

  const grupos = useMemo(() => {
    const map = new Map<string, PartidoItem[]>();
    partidos.forEach((p) => {
      const key = p.liga_id ?? "sin-liga";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    const result: { liga: LigaItem | null; partidos: PartidoItem[] }[] = [];
    ligas.forEach((l) => {
      if (map.has(l.id)) result.push({ liga: l, partidos: map.get(l.id)! });
    });
    if (map.has("sin-liga")) result.push({ liga: null, partidos: map.get("sin-liga")! });
    return result.sort((a, b) => {
      const fa = a.partidos[0]?.fecha ?? "";
      const fb = b.partidos[0]?.fecha ?? "";
      return fb.localeCompare(fa);
    });
  }, [partidos, ligas]);

  const abrirEdit = (e: React.MouseEvent, p: PartidoItem) => {
    e.stopPropagation();
    setEditLigaId(p.liga_id ?? "");
    setEditRival(p.rival ?? "");
    setEditLugar(p.lugar ?? "");
    setEditFecha(p.fecha ?? "");
    setEditHora((p.hora_juego ?? "").slice(0, 5));
    setEditUni(p.uniforme ?? "verde");
    setEditPartido(p);
  };

  const guardarEdicion = async () => {
    if (!editPartido) return;
    setEditSaving(true);
    const updates = {
      liga_id:    editLigaId || null,
      rival:      editRival.trim() || null,
      lugar:      editLugar.trim() || null,
      fecha:      editFecha || null,
      hora_juego: editHora || null,
      uniforme:   editUni,
    };
    await supabase.from("partidos").update(updates).eq("id", editPartido.id);
    setPartidos((prev) => prev.map((p) => p.id === editPartido.id ? { ...p, ...updates } : p));
    setEditSaving(false);
    setEditPartido(null);
    toast.success("Partido actualizado");
  };

  const abrirDelete = (e: React.MouseEvent, p: PartidoItem) => {
    e.stopPropagation();
    setDeletePartido(p);
  };

  const confirmarDelete = async () => {
    if (!deletePartido) return;
    setEliminando(true);
    await supabase.from("partidos").delete().eq("id", deletePartido.id);
    setPartidos((prev) => prev.filter((p) => p.id !== deletePartido.id));
    setEliminando(false);
    setDeletePartido(null);
    toast.success("Partido eliminado");
  };

  const notificarPadres = async (e: React.MouseEvent, p: PartidoItem) => {
    e.stopPropagation();
    setNotificando(p.id);
    try {
      const rival   = p.rival   ? `vs ${p.rival}` : "Partido";
      const fecha   = p.fecha   ? fmtFechaLargo(p.fecha) : "fecha por confirmar";
      const hora    = p.hora_juego ? p.hora_juego.slice(0, 5) : "";
      const lugar   = p.lugar   ? ` en ${p.lugar}` : "";

      const res = await fetch("/api/notificar", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({
          categoria_id: p.categoria_id,
          partido_id:   p.id,
          titulo:       `Panteras ${p.cat_nombre} — ${rival}`,
          cuerpo:       `${fecha}${hora ? ` a las ${hora}` : ""}${lugar}. Confirma tu asistencia.`,
        }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(`Error: ${data.detalle ?? data.error}`);
      } else if (data.enviados === 0) {
        toast("No hay padres con notificaciones activas aun", { icon: "ℹ️" });
      } else {
        toast.success(`Notificacion enviada a ${data.enviados} papa${data.enviados !== 1 ? "s" : ""}`);
      }
    } catch {
      toast.error("Error al enviar notificacion");
    }
    setNotificando(null);
  };

  const compartirPDF = async (e: React.MouseEvent, p: PartidoItem) => {
    e.stopPropagation();
    setCompartiendo(p.id);

    const { data: asistData } = await supabase
      .from("asistencia_partidos")
      .select("asistio, jugadores(nombre)")
      .eq("partido_id", p.id);

    const presentesLista = (asistData ?? [])
      .filter((a: any) => a.asistio === true)
      .map((a: any) => ({ nombre: a.jugadores?.nombre ?? "—" }))
      .sort((a: any, b: any) => a.nombre.localeCompare(b.nombre));

    const gp = p.goles_favor;
    const gr = p.goles_contra;
    const tieneMarcador = gp !== null && gr !== null;
    const ganamos = tieneMarcador && gp! > gr!;
    const empate  = tieneMarcador && gp === gr;
    const ligaNombre = nombreLiga(p.liga_id);

    try {
      const { jsPDF } = await import("jspdf");
      const { autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210;
      const margin = 14;

      // Logo
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
      const logoX = (W - logoSize) / 2;
      if (logoBase64) doc.addImage(logoBase64, "PNG", logoX, 8, logoSize, logoSize);

      let y = logoBase64 ? 8 + logoSize + 6 : 14;

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94);
      doc.text("Panteras Saltillo", W / 2, y, { align: "center" });
      y += 6;

      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.5);
      doc.line(margin + 20, y, W - margin - 20, y);
      y += 8;

      doc.setFontSize(17);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(ligaNombre, W / 2, y, { align: "center" });
      y += 8;

      const detalles: string[] = [];
      if (p.rival)      detalles.push(`vs ${p.rival}`);
      if (p.fecha)      detalles.push(fmtFechaLargo(p.fecha));
      if (p.lugar)      detalles.push(p.lugar);
      if (p.hora_juego) detalles.push(p.hora_juego.slice(0, 5) + " h");

      if (detalles.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(detalles.join("   ·   "), W / 2, y, { align: "center" });
        y += 7;
      }

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, y, W - margin, y);
      y += 7;

      // Marcador
      if (tieneMarcador) {
        const [cr, cg, cb] = ganamos ? [34, 197, 94] : empate ? [234, 179, 8] : [239, 68, 68];
        const label = ganamos ? "VICTORIA" : empate ? "EMPATE" : "DERROTA";
        const rivalNombre = (p.rival || "Rival").toUpperCase();

        doc.setFillColor(245, 245, 245);
        doc.roundedRect(margin, y, W - margin * 2, 32, 3, 3, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(cr, cg, cb);
        doc.text(label, W / 2, y + 9, { align: "center" });

        doc.setFontSize(15);
        doc.setTextColor(20, 20, 20);
        doc.text(`Panteras  ${gp}  —  ${gr}  ${rivalNombre}`, W / 2, y + 23, { align: "center" });

        y += 42;
      }

      // Lista
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(
        `Asistencia al partido — ${presentesLista.length} jugador${presentesLista.length !== 1 ? "es" : ""}`,
        margin, y
      );
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["#", "Jugador"]],
        body: presentesLista.map((j: any, i: number) => [String(i + 1), j.nombre]),
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 11, cellPadding: 4 },
        columnStyles: {
          0: { halign: "center", cellWidth: 12 },
          1: { textColor: [0, 0, 0] },
        },
        margin: { left: margin, right: margin },
      });

      // Footer
      const pages = doc.getNumberOfPages();
      const hoy = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.text(`Generado el ${hoy} · Panteras Saltillo`, margin, 290);
        doc.text(`${i} / ${pages}`, W - margin, 290, { align: "right" });
      }

      const slug = ligaNombre.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `partido_${slug}_${p.fecha ?? "sin_fecha"}.pdf`;
      const pdfBlob = doc.output("blob");

      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], fileName, { type: "application/pdf" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Partido ${ligaNombre}`, text: detalles.join(" · ") });
          setCompartiendo(null);
          return;
        }
      }
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al generar PDF");
    }
    setCompartiendo(null);
  };

  const FASE_LABEL: Record<string, string> = {
    amistoso: "Amistoso", cuartos: "4tos Final", semifinal: "Semifinal", final: "Final", repechaje: "Repechaje",
  };

  const compartirReporteLiga = async (e: React.MouseEvent, liga: LigaItem | null, grupo: PartidoItem[]) => {
    e.preventDefault();
    e.stopPropagation();
    const ligaKey = liga?.id ?? "sin-liga";
    setReporteando(ligaKey);

    const ligaNombre = liga ? liga.nombre : "Sin liga";
    const catNombre = grupo[0]?.cat_nombre ?? "";
    const ordenados = [...grupo].sort((a, b) => {
      const ja = a.fase === "jornada" && a.jornada ? parseInt(a.jornada) : null;
      const jb = b.fase === "jornada" && b.jornada ? parseInt(b.jornada) : null;
      if (ja !== null && jb !== null) return ja - jb;
      return (a.fecha ?? "").localeCompare(b.fecha ?? "");
    });
    const stats = computeLigaStats(ordenados);

    const rows = ordenados.map((p) => {
      const jornada = p.fase === "jornada" ? `J${p.jornada ?? "?"}` : p.fase ? (FASE_LABEL[p.fase] ?? p.fase) : "—";
      const tieneMarcador = p.goles_favor !== null && p.goles_contra !== null;
      const resultado = tieneMarcador
        ? `Panteras ${p.goles_favor} - ${p.goles_contra} ${(p.rival ?? "Rival").toUpperCase()}`
        : "Sin resultado";
      const estado = !tieneMarcador
        ? "—"
        : p.goles_favor! > p.goles_contra! ? "Ganado" : p.goles_favor === p.goles_contra ? "Empatado" : "Perdido";
      return [jornada, fmtFecha(p.fecha), resultado, estado];
    });

    try {
      const { jsPDF } = await import("jspdf");
      const { autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210;
      const margin = 14;

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
      const logoSize = 26;
      const logoX = (W - logoSize) / 2;
      if (logoBase64) doc.addImage(logoBase64, "PNG", logoX, 8, logoSize, logoSize);

      let y = logoBase64 ? 8 + logoSize + 6 : 14;

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94);
      doc.text("Panteras Saltillo", W / 2, y, { align: "center" });
      y += 6;

      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.5);
      doc.line(margin + 20, y, W - margin - 20, y);
      y += 8;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(ligaNombre, W / 2, y, { align: "center" });
      y += 6;

      if (catNombre) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(catNombre, W / 2, y, { align: "center" });
        y += 7;
      } else {
        y += 3;
      }

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, y, W - margin, y);
      y += 8;

      // Tabla de estadísticas acumuladas
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("Estadísticas a la fecha", margin, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["PJ", "PG", "PE", "PP", "GF", "GC", "DG", "Pts"]],
        body: [[
          String(stats.pj), String(stats.pg), String(stats.pe), String(stats.pp),
          String(stats.gf), String(stats.gc), `${stats.dg >= 0 ? "+" : ""}${stats.dg}`, String(stats.pts),
        ]],
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold", halign: "center" },
        bodyStyles: { fontSize: 12, cellPadding: 4, halign: "center", fontStyle: "bold", textColor: [0, 0, 0] },
        columnStyles: {
          7: { textColor: [22, 163, 74] },
        },
        margin: { left: margin, right: margin },
      });

      y = ((doc as any).lastAutoTable?.finalY ?? y + 16) + 12;

      // Tabla de partidos por jornada
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("Partidos", margin, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Jornada", "Fecha", "Resultado", "Estado"]],
        body: rows,
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold", halign: "center" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 10, cellPadding: 3.5, halign: "center" },
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 22 },
          3: { cellWidth: 26, fontStyle: "bold" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 3) {
            const v = String(data.cell.raw);
            if (v === "Ganado")   data.cell.styles.textColor = [22, 163, 74];
            else if (v === "Perdido") data.cell.styles.textColor = [220, 38, 38];
            else if (v === "Empatado") data.cell.styles.textColor = [120, 120, 120];
          }
        },
        margin: { left: margin, right: margin },
      });

      const pages = doc.getNumberOfPages();
      const hoy = new Date().toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.text(`Generado el ${hoy} · Panteras Saltillo`, margin, 290);
        doc.text(`${i} / ${pages}`, W - margin, 290, { align: "right" });
      }

      const slug = ligaNombre.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `reporte_${slug}.pdf`;
      const pdfBlob = doc.output("blob");

      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], fileName, { type: "application/pdf" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Reporte ${ligaNombre}` });
          setReporteando(null);
          return;
        }
      }
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Error al generar reporte");
    }
    setReporteando(null);
  };

  const crearLigaModal = async () => {
    const nombre = nuevaLigaNombre.trim();
    if (!nombre || !catIdLigas || creandoLiga) return;
    setCreandoLiga(true);
    setErrNuevaLiga("");
    const { data, error } = await supabase.from("ligas")
      .insert({ categoria_id: catIdLigas, nombre, tipo: nuevaLigaTipo })
      .select("*").single();
    setCreandoLiga(false);
    if (error) { setErrNuevaLiga("Esa liga ya existe en esta categoría"); return; }
    if (data) {
      setLigas((prev) => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNuevaLigaNombre("");
    }
  };

  const iniciarRenombre = (l: LigaItem) => { setRenombrando(l.id); setRenombreValor(l.nombre); };

  const guardarRenombre = async (l: LigaItem) => {
    const nombre = renombreValor.trim();
    if (!nombre) return;
    await supabase.from("ligas").update({ nombre }).eq("id", l.id);
    setLigas((prev) => prev.map((x) => x.id === l.id ? { ...x, nombre } : x).sort((a, b) => a.nombre.localeCompare(b.nombre)));
    setRenombrando(null);
  };

  const archivarLiga = async (l: LigaItem) => {
    await supabase.from("ligas").update({ activo: !l.activo }).eq("id", l.id);
    setLigas((prev) => prev.map((x) => x.id === l.id ? { ...x, activo: !l.activo } : x));
  };

  const intentarEliminarLiga = async (l: LigaItem) => {
    const { count } = await supabase.from("partidos").select("*", { count: "exact", head: true }).eq("liga_id", l.id);
    if (count && count > 0) { setAvisoLiga({ liga: l, count }); return; }
    await supabase.from("ligas").delete().eq("id", l.id);
    setLigas((prev) => prev.filter((x) => x.id !== l.id));
    toast.success("Liga eliminada");
  };

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

      <header className="border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="link-muted-theme w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-90 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <h1 className="font-bold" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>Partidos</h1>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Historial y asistencia</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setManageLigas(true)}
            className="link-muted-theme text-xs font-semibold border rounded-lg px-3 py-2 transition-all" style={{ borderColor: "var(--border-strong)" }}>
            + Liga/Copa
          </button>
          <PanelTour steps={PARTIDOS_COACH_STEPS} storageKey="tour_coach_partidos" />
        </div>
      </header>

      <div id="tour-coach-partidos-lista" className="max-w-lg mx-auto px-4 pt-5 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : partidos.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No hay partidos registrados aún.</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Se crean automáticamente al generar un aviso de partido.</p>
          </div>
        ) : (
          grupos.map(({ liga, partidos: partidosGrupo }) => {
            const stats = computeLigaStats(partidosGrupo);
            return (
              <details key={liga?.id ?? "sin-liga"} open
                className="group rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border-subtle)" }}>
                <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3" style={{ background: "var(--bg-surface-1)" }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm truncate" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
                        {liga ? `${liga.tipo === "copa" ? "🏆 " : ""}${liga.nombre}` : "Sin liga"}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ color: "var(--text-muted)", background: "var(--bg-surface-2)" }}>
                        {partidosGrupo.length}
                      </span>
                    </div>
                    {stats.pj > 0 && (
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        PJ {stats.pj} · {stats.pg}G-{stats.pe}E-{stats.pp}P · GF:GC {stats.gf}:{stats.gc} ·{" "}
                        <span className="font-bold text-[var(--status-good)]">{stats.pts} pts</span>
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={(e) => compartirReporteLiga(e, liga, partidosGrupo)}
                      disabled={reporteando === (liga?.id ?? "sin-liga")}
                      className="link-muted-theme flex items-center gap-1.5 text-[11px] font-semibold border rounded-lg px-2.5 py-1.5 transition-all disabled:opacity-50" style={{ borderColor: "var(--border-strong)" }}>
                      {reporteando === (liga?.id ?? "sin-liga") ? (
                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                          <polyline points="16 6 12 2 8 6"/>
                          <line x1="12" y1="2" x2="12" y2="15"/>
                        </svg>
                      )}
                      Reporte
                    </button>
                    <svg className="flex-shrink-0 transition-transform group-open:rotate-180" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-muted)" }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </summary>

                <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {partidosGrupo.map((p) => {
                    const pct = p.total > 0 ? Math.round((p.presentes / p.total) * 100) : null;
                    const sinLista = p.total > 0 && p.presentes === 0;
                    const esCompartiendo = compartiendo === p.id;

                    return (
                      <div key={p.id}
                        onClick={() => router.push(`/coach/partidos/${p.id}`)}
                        className="cursor-pointer transition-all active:scale-[0.99]" style={{ background: "var(--bg-page)" }}>

                        {/* Contenido principal */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                {p.rival && <span className="font-bold text-sm" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>vs {p.rival}</span>}
                                {p.cat_nombre && (
                                  <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border" style={{ color: "var(--text-muted)", background: "var(--bg-surface-2)", borderColor: "var(--border-subtle)" }}>
                                    {p.cat_nombre}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                                {fmtFecha(p.fecha)}{p.lugar ? ` · ${p.lugar}` : ""}
                              </p>
                            </div>

                            <div className="text-right flex-shrink-0 space-y-1">
                              {p.goles_favor !== null && p.goles_contra !== null ? (
                                <p className="text-pantera-green font-black text-lg leading-none" style={{ fontFamily: "Syne, sans-serif" }}>
                                  {p.goles_favor}-{p.goles_contra}
                                </p>
                              ) : (
                                <span className="text-[10px] text-[var(--status-neutral)] bg-[var(--bg-surface-2)] border border-[var(--border-strong)] px-2 py-0.5 rounded-full">
                                  Sin resultado
                                </span>
                              )}
                              {pct !== null && (
                                <p className={`text-xs font-bold ${
                                  sinLista ? "" : pct >= 80 ? "text-[var(--status-good)]" : pct >= 60 ? "text-[var(--status-neutral)]" : "text-orange-400"
                                }`} style={sinLista ? { color: "var(--text-muted)" } : undefined}>
                                  {sinLista ? "Sin pasar lista" : `${pct}% asistencia`}
                                </p>
                              )}
                            </div>
                          </div>

                          {p.total > 0 && (
                            <div className="w-full rounded-full h-1 mb-2" style={{ background: "var(--border-subtle)" }}>
                              <div className={`h-1 rounded-full transition-all ${
                                sinLista ? "" : pct !== null && pct >= 80 ? "bg-green-500" : pct !== null && pct >= 60 ? "bg-[var(--status-neutral)]" : "bg-orange-500"
                              }`} style={{ width: `${sinLista ? 0 : (pct ?? 0)}%`, background: sinLista ? "var(--border-strong)" : undefined }} />
                            </div>
                          )}

                          {p.confirmaronPadres > 0 && (
                            <div className="flex items-center gap-1.5 mb-1">
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                              </svg>
                              <span className="text-pantera-green text-[10px] font-semibold">
                                {p.confirmaronPadres} familia{p.confirmaronPadres !== 1 ? "s" : ""} confirmaron asistencia
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Acciones */}
                        <div className="border-t grid grid-cols-3" style={{ borderColor: "var(--border-subtle)" }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => abrirEdit(e, p)}
                            className="link-muted-theme flex items-center justify-center gap-1.5 py-2.5 transition-all text-[11px] font-medium">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Editar
                          </button>
                          <button
                            onClick={(e) => compartirPDF(e, p)}
                            disabled={esCompartiendo}
                            className="flex items-center justify-center gap-1.5 py-2.5 text-pantera-green/70 hover:text-pantera-green hover:bg-pantera-green/5 transition-all text-[11px] font-medium border-x disabled:opacity-50" style={{ borderColor: "var(--border-subtle)" }}>
                            {esCompartiendo ? (
                              <div className="w-3 h-3 border border-pantera-green border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                                <polyline points="16 6 12 2 8 6"/>
                                <line x1="12" y1="2" x2="12" y2="15"/>
                              </svg>
                            )}
                            {esCompartiendo ? "Generando..." : "Compartir"}
                          </button>
                          <button
                            onClick={(e) => notificarPadres(e, p)}
                            disabled={notificando === p.id}
                            className="flex items-center justify-center gap-1.5 py-2.5 text-blue-400/70 hover:text-blue-400 hover:bg-blue-500/5 transition-all text-[11px] font-medium border-x disabled:opacity-50" style={{ borderColor: "var(--border-subtle)" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
                            </svg>
                            {notificando === p.id ? "Enviando..." : "Notificar"}
                          </button>
                          <button
                            onClick={(e) => abrirDelete(e, p)}
                            className="link-muted-theme flex items-center justify-center gap-1.5 py-2.5 hover:text-red-400 hover:bg-red-500/5 transition-all text-[11px] font-medium">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                              <path d="M10 11v6M14 11v6"/>
                            </svg>
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })
        )}
      </div>

      {/* Modal Editar */}
      {editPartido && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => !editSaving && setEditPartido(null)}>
          <div className="w-full sm:max-w-md border-t sm:border sm:rounded-2xl rounded-t-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto" style={{ background: "var(--bg-alt)", borderColor: "var(--border-strong)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>Editar partido</h2>
              <button onClick={() => setEditPartido(null)} disabled={editSaving} className="link-muted-theme text-xl w-8 h-8">×</button>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Liga / Copa</label>
              <select className={inputCls} value={editLigaId} onChange={(e) => setEditLigaId(e.target.value)} style={{ backgroundImage: "none" }}>
                <option value="" style={{ background: "var(--bg-alt)" }}>Sin liga</option>
                {ligas.filter((l) => l.categoria_id === editPartido.categoria_id).map((l) => (
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
                {[{ value: "verde", label: "Verde" }, { value: "blanco", label: "Blanco" }].map((u) => (
                  <button key={u.value} onClick={() => setEditUni(u.value)}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all active:scale-95 ${
                      editUni === u.value
                        ? u.value === "verde" ? "bg-green-600 border-green-600 text-white" : "bg-white border-white text-black"
                        : "link-muted-theme"
                    }`}
                    style={editUni !== u.value ? { borderColor: "var(--border-strong)" } : undefined}>
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${u.value === "verde" ? "bg-green-400" : "bg-gray-200 border border-gray-300"}`} />
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setEditPartido(null)} disabled={editSaving}
                className="link-muted-theme py-3 rounded-xl border text-sm font-bold" style={{ borderColor: "var(--border-strong)" }}>Cancelar</button>
              <button onClick={guardarEdicion} disabled={editSaving}
                className="py-3 rounded-xl bg-pantera-green text-white text-sm font-bold disabled:opacity-60">
                {editSaving ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {deletePartido && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => !eliminando && setDeletePartido(null)}>
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
              Se eliminará <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{nombreLiga(deletePartido.liga_id)}</span>
              {deletePartido.rival ? <> vs <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{deletePartido.rival}</span></> : null}
              {" "}y toda su lista de asistencia.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setDeletePartido(null)} disabled={eliminando}
                className="link-muted-theme py-3 rounded-xl border text-sm font-bold" style={{ borderColor: "var(--border-strong)" }}>Cancelar</button>
              <button onClick={confirmarDelete} disabled={eliminando}
                className="py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold disabled:opacity-60">
                {eliminando ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal gestionar ligas/copas */}
      {manageLigas && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setManageLigas(false)}>
          <div className="w-full sm:max-w-md border-t sm:border sm:rounded-2xl rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto" style={{ background: "var(--bg-alt)", borderColor: "var(--border-strong)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>Ligas y copas</h2>
              <button onClick={() => setManageLigas(false)} className="link-muted-theme text-xl w-8 h-8">×</button>
            </div>

            {cats.length > 1 && (
              <div>
                <label className="text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Categoría</label>
                <select className={inputCls} value={catIdLigas} onChange={(e) => setCatIdLigas(e.target.value)} style={{ backgroundImage: "none" }}>
                  <option value="" style={{ background: "var(--bg-alt)" }}>Selecciona una categoría</option>
                  {cats.map((c) => <option key={c.id} value={c.id} style={{ background: "var(--bg-alt)" }}>{c.nombre}</option>)}
                </select>
              </div>
            )}

            <div className="rounded-xl border p-3 space-y-2" style={{ borderColor: "var(--border-subtle)" }}>
              <input className={inputCls} placeholder="Nombre de la liga o copa" value={nuevaLigaNombre}
                onChange={(e) => { setNuevaLigaNombre(e.target.value); setErrNuevaLiga(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); crearLigaModal(); } }} />
              <div className="flex items-center gap-2">
                <div className="grid grid-cols-2 gap-2 flex-1">
                  {(["liga", "copa"] as const).map((t) => (
                    <button key={t} onClick={() => setNuevaLigaTipo(t)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        nuevaLigaTipo === t ? "bg-pantera-green/20 border-pantera-green/40 text-pantera-green" : "link-muted-theme"
                      }`}
                      style={nuevaLigaTipo !== t ? { borderColor: "var(--border-strong)" } : undefined}>
                      {t === "liga" ? "Liga" : "🏆 Copa"}
                    </button>
                  ))}
                </div>
                <button onClick={crearLigaModal} disabled={!nuevaLigaNombre.trim() || !catIdLigas || creandoLiga}
                  className="flex-shrink-0 px-4 py-2 rounded-lg bg-pantera-green text-white text-xs font-bold disabled:opacity-50">
                  {creandoLiga ? "..." : "Crear"}
                </button>
              </div>
              {errNuevaLiga && <p className="text-[11px] text-red-400">{errNuevaLiga}</p>}
            </div>

            <div className="space-y-2">
              {ligas.filter((l) => !catIdLigas || l.categoria_id === catIdLigas).length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: "var(--text-muted)" }}>Sin ligas registradas.</p>
              ) : (
                ligas.filter((l) => !catIdLigas || l.categoria_id === catIdLigas).map((l) => (
                  <div key={l.id} className="flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: "var(--border-subtle)", opacity: l.activo ? 1 : 0.5 }}>
                    {renombrando === l.id ? (
                      <>
                        <input className={`${inputCls} flex-1`} value={renombreValor} onChange={(e) => setRenombreValor(e.target.value)} autoFocus
                          onKeyDown={(e) => { if (e.key === "Enter") guardarRenombre(l); if (e.key === "Escape") setRenombrando(null); }} />
                        <button onClick={() => guardarRenombre(l)} className="text-pantera-green text-xs font-bold flex-shrink-0">Guardar</button>
                      </>
                    ) : (
                      <>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm truncate" style={{ color: "var(--text-primary)" }}>
                            {l.tipo === "copa" ? "🏆 " : ""}{l.nombre}
                          </span>
                          {!l.activo && <span className="text-[9px] ml-1.5" style={{ color: "var(--text-muted)" }}>(archivada)</span>}
                        </div>
                        <button onClick={() => iniciarRenombre(l)} className="link-muted-theme text-[11px] flex-shrink-0">Renombrar</button>
                        <button onClick={() => archivarLiga(l)} className="link-muted-theme text-[11px] flex-shrink-0">{l.activo ? "Archivar" : "Activar"}</button>
                        <button onClick={() => intentarEliminarLiga(l)} className="text-red-500/70 hover:text-red-400 text-[11px] flex-shrink-0">Eliminar</button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Aviso: liga con partidos no se puede eliminar */}
      {avisoLiga && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setAvisoLiga(null)}>
          <div className="w-full max-w-sm rounded-2xl p-5 space-y-4 border" style={{ background: "var(--bg-alt)", borderColor: "var(--border-strong)" }} onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>No se puede eliminar</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              "{avisoLiga.liga.nombre}" tiene {avisoLiga.count} partido{avisoLiga.count !== 1 ? "s" : ""} registrado{avisoLiga.count !== 1 ? "s" : ""}. Archívala en vez de eliminarla — desaparece de los selectores pero conserva el historial.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setAvisoLiga(null)} className="link-muted-theme py-3 rounded-xl border text-sm font-bold" style={{ borderColor: "var(--border-strong)" }}>Cerrar</button>
              <button onClick={() => { archivarLiga(avisoLiga.liga); setAvisoLiga(null); }} className="py-3 rounded-xl bg-pantera-green text-white text-sm font-bold">Archivar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
