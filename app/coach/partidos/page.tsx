"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, authHeaders } from "@/lib/supabase";
import { Toaster, toast } from "react-hot-toast";
import { PanelTour } from "@/components/admin/PanelTour";
import { PARTIDOS_COACH_STEPS } from "@/lib/coach-tours";

interface PartidoItem {
  id: string;
  liga: string;
  rival: string | null;
  lugar: string | null;
  fecha: string | null;
  hora_juego: string | null;
  uniforme: string | null;
  resultado: string | null;
  categoria_id: string;
  cat_nombre: string;
  total: number;
  presentes: number;
  confirmaronPadres: number;
}

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
  const [partidos, setPartidos] = useState<PartidoItem[]>([]);
  const [loading, setLoading]   = useState(true);

  // Modal editar
  const [editPartido, setEditPartido] = useState<PartidoItem | null>(null);
  const [editLiga, setEditLiga]   = useState("");
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

  // Notificar padres
  const [notificando, setNotificando] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rels } = await supabase
        .from("entrenador_categorias").select("categoria_id").eq("entrenador_id", user.id);
      const catIds = (rels ?? []).map((r: { categoria_id: string }) => r.categoria_id);
      if (catIds.length === 0) { setLoading(false); return; }

      const { data: cats } = await supabase.from("categorias").select("id, nombre").in("id", catIds);
      const catMap: Record<string, string> = {};
      (cats ?? []).forEach((c: { id: string; nombre: string }) => { catMap[c.id] = c.nombre; });

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
    load();
  }, []);

  const abrirEdit = (e: React.MouseEvent, p: PartidoItem) => {
    e.stopPropagation();
    setEditLiga(p.liga);
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
      liga:       editLiga.trim() || editPartido.liga,
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

    const gp = parseInt((p.resultado ?? "").split("-")[0]);
    const gr = parseInt((p.resultado ?? "").split("-")[1]);
    const tieneMarcador = !isNaN(gp) && !isNaN(gr) && !!p.resultado;
    const ganamos = tieneMarcador && gp > gr;
    const empate  = tieneMarcador && gp === gr;

    try {
      const { jsPDF } = await import("jspdf");
      const { autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210;
      const margin = 14;

      // Logo
      let logoBase64 = "";
      try {
        const resp = await fetch("/icon-192.png");
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
      doc.text(p.liga, W / 2, y, { align: "center" });
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

      const slug = p.liga.replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `partido_${slug}_${p.fecha ?? "sin_fecha"}.pdf`;
      const pdfBlob = doc.output("blob");

      if (typeof navigator !== "undefined" && navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], fileName, { type: "application/pdf" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Partido ${p.liga}`, text: detalles.join(" · ") });
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
        <PanelTour steps={PARTIDOS_COACH_STEPS} storageKey="tour_coach_partidos" />
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
          partidos.map((p) => {
            const pct = p.total > 0 ? Math.round((p.presentes / p.total) * 100) : null;
            const sinLista = p.total > 0 && p.presentes === 0;
            const esCompartiendo = compartiendo === p.id;

            return (
              <div key={p.id}
                onClick={() => router.push(`/coach/partidos/${p.id}`)}
                className="rounded-2xl overflow-hidden hover:border-white/15 cursor-pointer transition-all active:scale-[0.99] border" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>

                {/* Contenido principal */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="font-bold text-sm" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
                          {p.liga}
                        </span>
                        {p.cat_nombre && (
                          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border" style={{ color: "var(--text-muted)", background: "var(--bg-surface-2)", borderColor: "var(--border-subtle)" }}>
                            {p.cat_nombre}
                          </span>
                        )}
                      </div>
                      {p.rival && <p className="text-xs" style={{ color: "var(--text-secondary)" }}>vs {p.rival}</p>}
                      <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {fmtFecha(p.fecha)}{p.lugar ? ` · ${p.lugar}` : ""}
                      </p>
                    </div>

                    <div className="text-right flex-shrink-0 space-y-1">
                      {p.resultado ? (
                        <p className="text-pantera-green font-black text-lg leading-none" style={{ fontFamily: "Syne, sans-serif" }}>
                          {p.resultado}
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
              <label className="text-[10px] uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Liga / Torneo</label>
              <input className={inputCls} value={editLiga} onChange={(e) => setEditLiga(e.target.value)} />
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
              Se eliminará <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{deletePartido.liga}</span>
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
    </div>
  );
}
