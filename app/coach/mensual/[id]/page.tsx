"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Jugador, type Asistencia } from "@/lib/supabase";
import { PanelTour } from "@/components/admin/PanelTour";
import { MENSUAL_STEPS } from "@/lib/coach-tours";
import { useClub, hexToRgbArray } from "@/lib/club-context";

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// Obtiene todos los días Lun-Jue del mes
function diasHabilesDelMes(year: number, month: number): string[] {
  const dias: string[] = [];
  const fecha = new Date(year, month, 1);
  while (fecha.getMonth() === month) {
    const dow = fecha.getDay(); // 1=Lun, 2=Mar, 3=Mie, 4=Jue
    if (dow >= 1 && dow <= 4) {
      dias.push(fecha.toLocaleDateString("sv-SE", { timeZone: "America/Monterrey" }));
    }
    fecha.setDate(fecha.getDate() + 1);
  }
  return dias;
}

interface Resumen {
  jugador: Jugador;
  clases: number;
  presente: number;
  tarde: number;
  permiso: number;
  ausente: number;
  pct: number | null;
}

export default function MensualPage({ params }: { params: { id: string } }) {
  const { logoUrl, colorAcento, nombre: clubNombre } = useClub();
  const [accentR, accentG, accentB] = hexToRgbArray(colorAcento);
  const categoriaId = params.id;
  const router = useRouter();

  const hoy = new Date();
  const [year, setYear]           = useState(hoy.getFullYear());
  const [month, setMonth]         = useState(hoy.getMonth());
  const [categoria, setCategoria] = useState("");
  const [resumenes, setResumenes] = useState<Resumen[]>([]);
  const [loading, setLoading]     = useState(true);
  const [compartiendo, setCompartiendo] = useState(false);

  const diasHabiles = diasHabilesDelMes(year, month);

  useEffect(() => {
    const init = async () => {
      const { data: cat } = await supabase.from("categorias").select("nombre").eq("id", categoriaId).single();
      setCategoria(cat?.nombre ?? "");
    };
    init();
  }, [categoriaId]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: jug } = await supabase
        .from("jugadores").select("*")
        .eq("categoria_id", categoriaId).eq("activo", true).order("nombre");

      const jugadores: Jugador[] = jug ?? [];
      if (jugadores.length === 0) { setResumenes([]); setLoading(false); return; }

      const { data: asist } = await supabase
        .from("asistencias").select("*")
        .in("jugador_id", jugadores.map((j) => j.id))
        .gte("fecha", diasHabiles[0])
        .lte("fecha", diasHabiles[diasHabiles.length - 1]);

      const asistencias: Asistencia[] = asist ?? [];

      const res: Resumen[] = jugadores.map((j) => {
        const misAsist = asistencias.filter((a) => a.jugador_id === j.id);
        let presente = 0, tarde = 0, permiso = 0, ausente = 0;
        misAsist.forEach((a) => {
          if (a.estado === "presente") presente++;
          else if (a.estado === "tarde") tarde++;
          else if (a.estado === "permiso") permiso++;
          else if (a.estado === "ausente") ausente++;
        });
        const clases     = misAsist.length; // días donde se pasó lista
        const contables  = clases - permiso;
        const pct        = contables > 0 ? Math.round(((presente + tarde) / contables) * 100) : null;
        return { jugador: j, clases, presente, tarde, permiso, ausente, pct };
      });

      setResumenes(res);
      setLoading(false);
    };
    if (diasHabiles.length > 0) fetchData();
  }, [year, month, categoriaId]); // eslint-disable-line

  const prevMes = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMes = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };

  const generarPDF = async () => {
    setCompartiendo(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const W = 210, margin = 14;
      const logoSize = 30;
      const logoX = (W - logoSize) / 2;
      let logoBase64 = "";
      try {
        const resp = await fetch(logoUrl);
        const blob = await resp.blob();
        logoBase64 = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onloadend = () => res(r.result as string);
          r.readAsDataURL(blob);
        });
        doc.saveGraphicsState();
        doc.circle(logoX + logoSize / 2, 8 + logoSize / 2, logoSize / 2 * 0.96, null);
        doc.clip();
        doc.discardPath();
        doc.addImage(logoBase64, "PNG", logoX, 8, logoSize, logoSize);
        doc.restoreGraphicsState();
      } catch {}
      let y = logoBase64 ? 8 + logoSize + 11 : 14;

      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(accentR, accentG, accentB);
      doc.text(clubNombre, W / 2, y, { align: "center" });
      y += 6;

      doc.setDrawColor(accentR, accentG, accentB);
      doc.setLineWidth(0.5);
      doc.line(margin + 20, y, W - margin - 20, y);
      y += 7;

      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(`Reporte Mensual — ${categoria}`, W / 2, y, { align: "center" });
      y += 7;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`${MESES[month]} ${year}  ·  ${diasHabiles.length} días de práctica`, W / 2, y, { align: "center" });
      y += 6;

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generado: ${new Date().toLocaleDateString("es-MX")}`, W / 2, y, { align: "center" });
      y += 8;

      // Resumen general del grupo
      const conPct = resumenes.filter((r) => r.pct !== null);
      const promedioGrupo = conPct.length > 0 ? Math.round(conPct.reduce((s, r) => s + r.pct!, 0) / conPct.length) : null;
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, y, W - margin * 2, 12, 2, 2, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(0, 0, 0);
      const resumenTxt = `${resumenes.length} jugador${resumenes.length !== 1 ? "es" : ""}`
        + (promedioGrupo !== null ? `   ·   Asistencia general: ${promedioGrupo}%` : "");
      doc.text(resumenTxt, W / 2, y + 7.5, { align: "center" });
      y += 18;

      autoTable(doc, {
        startY: y,
        head: [["#", "Jugador", "Clases", "Pres.", "Tarde", "Perm.", "Aus.", "Asist."]],
        body: resumenes.map((r, i) => [
          i + 1,
          r.jugador.alias ? `${r.jugador.nombre} "${r.jugador.alias}"` : r.jugador.nombre,
          r.clases,
          r.presente,
          r.tarde,
          r.permiso,
          r.ausente,
          r.pct !== null ? `${r.pct}%` : "—",
        ]),
        headStyles: { fillColor: [accentR, accentG, accentB], textColor: 0, fontStyle: "bold", fontSize: 9, valign: "middle" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        styles: { fontSize: 9.5, cellPadding: 3, valign: "middle" },
        columnStyles: {
          0: { halign: "center", cellWidth: 8, cellPadding: { top: 3, bottom: 3, left: 1, right: 1 } },
          1: { cellWidth: 48 },
          2: { halign: "center", cellWidth: 17 },
          3: { halign: "center", cellWidth: 19 },
          4: { halign: "center", cellWidth: 16 },
          5: { halign: "center", cellWidth: 17 },
          6: { halign: "center", cellWidth: 17 },
          7: { halign: "center", cellWidth: 22, fontStyle: "bold" },
        },
      });

      const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
      doc.setFontSize(8); doc.setTextColor(120, 120, 120);
      doc.text("P = Presente  |  T = Tarde  |  Perm = Permiso  |  A = Ausente  |  Asistencia no cuenta permisos", 14, finalY);

      const blob = doc.output("blob");
      const fileName = `Panteras_${categoria}_${MESES[month]}_${year}.pdf`;

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: "application/pdf" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Reporte ${MESES[month]} ${year}` });
          setCompartiendo(false); return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error(err); }
    setCompartiendo(false);
  };

  const totalClases = diasHabiles.length;
  const promedio = resumenes.length > 0 && resumenes.some(r => r.pct !== null)
    ? Math.round(resumenes.filter(r => r.pct !== null).reduce((s, r) => s + r.pct!, 0) / resumenes.filter(r => r.pct !== null).length)
    : null;

  return (
    <div className="min-h-screen overflow-x-hidden w-full" style={{ background: "var(--bg-page)" }}>

      {/* Header */}
      <header className="border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.back()} className="link-muted-theme w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-90 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="min-w-0">
            <h1 className="font-bold truncate" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
              Mensual — {categoria}
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{totalClases} días de práctica</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <PanelTour steps={MENSUAL_STEPS} storageKey="tour_coach_mensual" />
          <button onClick={generarPDF} disabled={compartiendo || resumenes.length === 0}
            className="flex items-center gap-1.5 bg-pantera-green/20 border border-pantera-green/30 text-pantera-green text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-50">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          {compartiendo ? "..." : "PDF"}
          </button>
        </div>
      </header>

      {/* Selector de mes */}
      <div id="tour-mensual-selector" className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <button onClick={prevMes} className="link-muted-theme flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all active:scale-95">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Anterior
        </button>
        <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{MESES[month]} {year}</span>
        <button onClick={nextMes} className="link-muted-theme flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-all active:scale-95">
          Siguiente
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* Resumen general */}
      {promedio !== null && (
        <div className="mx-4 mt-4 p-4 rounded-2xl border" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface-1)" }}>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--text-secondary)" }}>Promedio del grupo</p>
          <p className={`text-3xl font-black ${promedio >= 80 ? "text-[var(--status-good)]" : promedio >= 60 ? "text-[var(--status-neutral)]" : "text-red-400"}`}
            style={{ fontFamily: "Syne, sans-serif" }}>
            {promedio}%
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{resumenes.length} jugadores · {totalClases} clases en {MESES[month]}</p>
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : resumenes.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No hay jugadores en esta categoría.</p>
        </div>
      ) : (
        <div id="tour-mensual-tabla" className="mt-4 divide-y" style={{ borderColor: "var(--border-subtle)" }}>
          {/* Encabezado */}
          <div className="grid grid-cols-6 px-4 py-2 text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            <div className="col-span-2">Jugador</div>
            <div className="text-center">P</div>
            <div className="text-center">T</div>
            <div className="text-center">A</div>
            <div className="text-center font-bold">%</div>
          </div>

          {resumenes.map((r) => (
            <div key={r.jugador.id} className="grid grid-cols-6 px-4 py-3 items-center" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="col-span-2 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{r.jugador.nombre}</p>
                {r.jugador.alias && <p className="text-pantera-green text-xs truncate">"{r.jugador.alias}"</p>}
              </div>
              <div className="text-center text-[var(--status-good)] text-sm font-bold">{r.presente}</div>
              <div className="text-center text-[var(--status-neutral)] text-sm font-bold">{r.tarde}</div>
              <div className="text-center text-red-400 text-sm font-bold">{r.ausente}</div>
              <div className="text-center">
                {r.pct !== null ? (
                  <span className={`text-sm font-black ${r.pct >= 80 ? "text-[var(--status-good)]" : r.pct >= 60 ? "text-[var(--status-neutral)]" : "text-red-400"}`}>
                    {r.pct}%
                  </span>
                ) : (
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Leyenda */}
      {!loading && resumenes.length > 0 && (
        <p className="text-[10px] text-center px-4 pt-6 pb-10" style={{ color: "var(--text-muted)" }}>
          P = Presente · T = Tarde · A = Ausente · Permiso no afecta el porcentaje
        </p>
      )}
    </div>
  );
}
