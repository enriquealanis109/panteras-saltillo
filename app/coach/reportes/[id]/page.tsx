"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Jugador, type Asistencia, type Estado } from "@/lib/supabase";
import { PanelTour } from "@/components/admin/PanelTour";
import { REPORTES_STEPS } from "@/lib/coach-tours";
import { useClub } from "@/lib/club-context";

const BADGE: Record<Estado, { label: string; clase: string }> = {
  presente: { label: "P",  clase: "bg-green-500/20 text-[var(--status-good)] border-green-500/30" },
  tarde:    { label: "T",  clase: "bg-[var(--bg-surface-2)] text-[var(--status-neutral)] border-[var(--border-strong)]" },
  permiso:  { label: "Pe", clase: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  ausente:  { label: "A",  clase: "bg-red-500/20 text-red-400 border-red-500/30" },
};

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const LABELS_DIA = ["Lun","Mar","Mié","Jue"];

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}
function toISO(date: Date) { return date.toLocaleDateString("sv-SE", { timeZone: "America/Monterrey" }); }

function calcPct(estados: (Estado | null)[]) {
  // Solo cuenta días donde se pasó lista (no son null)
  // Presente + Tarde = asistencia | Ausente = falta | Permiso = no cuenta
  const conLista = estados.filter((e) => e !== null);
  if (conLista.length === 0) return null;
  const asistidos = conLista.filter((e) => e === "presente" || e === "tarde").length;
  const contables = conLista.filter((e) => e !== "permiso").length;
  if (contables === 0) return null;
  return Math.round((asistidos / contables) * 100);
}

export default function ReportesPage({ params }: { params: { id: string } }) {
  const { logoUrl } = useClub();
  const categoriaId = params.id;
  const router = useRouter();

  const [categoria, setCategoria]     = useState("");
  const [jugadores, setJugadores]     = useState<Jugador[]>([]);
  const [asistencias, setAsistencias] = useState<Asistencia[]>([]);
  const [semana, setSemana]           = useState(startOfWeek(new Date()));
  const [loading, setLoading]         = useState(true);
  const [compartiendo, setCompartiendo] = useState(false);

  const dias = [0, 1, 2, 3].map((d) => {
    const date = new Date(semana);
    date.setDate(semana.getDate() + d);
    return toISO(date);
  });

  const fLun = new Date(dias[0] + "T12:00:00");
  const fJue = new Date(dias[3] + "T12:00:00");
  const semanaLabel = fLun.getMonth() === fJue.getMonth()
    ? `Lun ${fLun.getDate()} al Jue ${fJue.getDate()} de ${MESES[fJue.getMonth()]}`
    : `Lun ${fLun.getDate()} ${MESES[fLun.getMonth()]} – Jue ${fJue.getDate()} ${MESES[fJue.getMonth()]}`;

  useEffect(() => {
    const init = async () => {
      const { data: cat } = await supabase.from("categorias").select("nombre").eq("id", categoriaId).single();
      setCategoria(cat?.nombre ?? "");
      const { data: jug } = await supabase.from("jugadores").select("*")
        .eq("categoria_id", categoriaId).eq("activo", true).order("nombre");
      setJugadores(jug ?? []);
      setLoading(false);
    };
    init();
  }, [categoriaId]);

  useEffect(() => {
    if (jugadores.length === 0) return;
    const fetchAsist = async () => {
      const { data } = await supabase.from("asistencias").select("*")
        .in("jugador_id", jugadores.map((j) => j.id))
        .gte("fecha", dias[0]).lte("fecha", dias[3]);
      setAsistencias(data ?? []);
    };
    fetchAsist();
  }, [semana, jugadores]); // eslint-disable-line

  const getEstado = (jugadorId: string, fecha: string): Estado | null =>
    asistencias.find((a) => a.jugador_id === jugadorId && a.fecha === fecha)?.estado ?? null;

  const prevSemana = () => { const d = new Date(semana); d.setDate(d.getDate() - 7); setSemana(d); };
  const nextSemana = () => { const d = new Date(semana); d.setDate(d.getDate() + 7); setSemana(d); };

  const generarYCompartirPDF = async () => {
    setCompartiendo(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      // Cargar el escudo como base64
      let logoBase64 = "";
      try {
        const resp = await fetch(logoUrl);
        const blob = await resp.blob();
        logoBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch { /* si falla la imagen, continúa sin ella */ }

      const W = 210, margin = 14;
      const logoSize = 30;
      const logoX = (W - logoSize) / 2;
      if (logoBase64) {
        doc.addImage(logoBase64, "PNG", logoX, 8, logoSize, logoSize);
      }
      let y = logoBase64 ? 8 + logoSize + 6 : 14;

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(34, 197, 94);
      doc.text("Panteras Saltillo", W / 2, y, { align: "center" });
      y += 6;

      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.5);
      doc.line(margin + 20, y, W - margin - 20, y);
      y += 7;

      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`Reporte de Asistencia — ${categoria}`, W / 2, y, { align: "center" });
      y += 7;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(semanaLabel, W / 2, y, { align: "center" });
      y += 6;

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generado: ${new Date().toLocaleDateString("es-MX")}`, W / 2, y, { align: "center" });
      y += 9;

      // Tabla
      const head = [["#", "Jugador", "Lun", "Mar", "Mié", "Jue", "Asistencia"]];
      const body = jugadores.map((j, idx) => {
        const estados = dias.map((d) => getEstado(j.id, d));
        const pct = calcPct(estados);
        return [
          String(idx + 1),
          j.alias ? `${j.nombre} "${j.alias}"` : j.nombre,
          ...estados.map((e) => e ? BADGE[e].label : "—"),
          pct !== null ? `${pct}%` : "—",
        ];
      });

      autoTable(doc, {
        head,
        body,
        startY: y,
        headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: "bold", fontSize: 12 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 13, cellPadding: 5 },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          2: { halign: "center" },
          3: { halign: "center" },
          4: { halign: "center" },
          5: { halign: "center" },
          6: { halign: "center", fontStyle: "bold" },
        },
      });

      // Leyenda al pie
      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("P = Presente  |  T = Tarde  |  Pe = Permiso  |  A = Ausente  |  — = Sin registro", 14, finalY);

      const pdfBlob = doc.output("blob");
      const fileName = `Panteras_${categoria}_${dias[0]}.pdf`;

      // Intentar compartir (mobile / Web Share API)
      if (navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], fileName, { type: "application/pdf" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Asistencia ${categoria}`, text: semanaLabel });
          setCompartiendo(false);
          return;
        }
      }
      // Fallback: descarga directa
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
    setCompartiendo(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>

      {/* Header */}
      <header className="border-b px-5 py-4 flex items-center justify-between" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="link-muted-theme w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-90 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <h1 className="font-bold" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
              Reportes — {categoria}
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{jugadores.length} jugadores</p>
          </div>
        </div>

        {/* Botón compartir / descargar PDF */}
        <div className="flex items-center gap-2">
          <PanelTour steps={REPORTES_STEPS} storageKey="tour_coach_reportes" />
          <button
            onClick={generarYCompartirPDF}
            disabled={compartiendo || jugadores.length === 0}
            className="flex items-center gap-2 bg-pantera-green/20 border border-pantera-green/30 text-pantera-green text-xs font-bold px-3 py-2 rounded-lg hover:bg-pantera-green/30 transition-all disabled:opacity-50">
          {compartiendo ? "Generando..." : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Compartir PDF
            </>
          )}
        </button>
        </div>
      </header>

      {/* Selector de semana */}
      <div id="tour-reportes-semana" className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <button onClick={prevSemana}
          className="link-muted-theme flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all active:scale-95">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Anterior
        </button>
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{semanaLabel}</span>
        <button onClick={nextSemana}
          className="link-muted-theme flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all active:scale-95">
          Siguiente
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        {Object.entries(BADGE).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${v.clase}`}>{v.label}</span>
            <span className="text-[10px] capitalize" style={{ color: "var(--text-muted)" }}>{k}</span>
          </div>
        ))}
        <span className="text-[10px] ml-2" style={{ color: "var(--text-muted)" }}>· Tarde cuenta como asistencia</span>
      </div>

      {/* Tabla */}
      <div id="tour-reportes-tabla" className="overflow-x-auto">
        <table className="w-full min-w-[360px]">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
              <th className="text-left px-5 py-3 text-xs uppercase tracking-wider font-medium" style={{ color: "var(--text-secondary)" }}>
                Jugador
              </th>
              {LABELS_DIA.map((l) => (
                <th key={l} className="text-center px-2 py-3 text-xs uppercase tracking-wider font-medium w-12" style={{ color: "var(--text-secondary)" }}>
                  {l}
                </th>
              ))}
              <th className="text-center px-3 py-3 text-xs uppercase tracking-wider font-medium w-14" style={{ color: "var(--text-secondary)" }}>
                Asist.
              </th>
            </tr>
          </thead>
          <tbody>
            {jugadores.map((j) => {
              const estados = dias.map((d) => getEstado(j.id, d));
              const pct = calcPct(estados);

              return (
                <tr key={j.id} className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="px-5 py-3">
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>{j.nombre}</p>
                    {j.alias && <p className="text-pantera-green text-xs">"{j.alias}"</p>}
                  </td>
                  {estados.map((estado, i) => (
                    <td key={i} className="px-2 py-3 text-center">
                      {estado ? (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${BADGE[estado].clase}`}>
                          {BADGE[estado].label}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center">
                    {pct !== null ? (
                      <span className={`text-xs font-bold ${pct >= 80 ? "text-[var(--status-good)]" : pct >= 60 ? "text-[var(--status-neutral)]" : "text-red-400"}`}>
                        {pct}%
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {jugadores.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No hay jugadores en esta categoría.</p>
        </div>
      )}
    </div>
  );
}
