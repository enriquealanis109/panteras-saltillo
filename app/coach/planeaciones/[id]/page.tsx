"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase, type Planeacion } from "@/lib/supabase";
import { useClub, hexToRgbArray } from "@/lib/club-context";

const BLOQUES = [
  { key: "calentamiento", label: "Calentamiento" },
  { key: "tecnica",       label: "Técnica" },
  { key: "tactica",       label: "Táctica" },
  { key: "cierre",        label: "Cierre" },
] as const;

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const fmtFechaLargo = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${y}`;
};

type BloqueState = Record<string, { desc: string; min: string }>;

export default function PlaneacionDetallePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { logoUrl, colorAcento, nombre: clubNombre } = useClub();

  const [plan, setPlan] = useState<Planeacion | null>(null);
  const [categoriaNombre, setCategoriaNombre] = useState("");
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [saving, setSaving] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const [error, setError] = useState("");
  const [generando, setGenerando] = useState(false);

  const [fecha, setFecha] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [materiales, setMateriales] = useState("");
  const [bloques, setBloques] = useState<BloqueState>({
    calentamiento: { desc: "", min: "" },
    tecnica: { desc: "", min: "" },
    tactica: { desc: "", min: "" },
    cierre: { desc: "", min: "" },
  });

  const cargar = async () => {
    const { data } = await supabase.from("planeaciones").select("*").eq("id", params.id).single();
    if (!data) { setLoading(false); return; }
    setPlan(data);
    setFecha(data.fecha);
    setObjetivo(data.objetivo ?? "");
    setMateriales(data.materiales ?? "");
    setBloques({
      calentamiento: { desc: data.calentamiento_desc ?? "", min: data.calentamiento_min?.toString() ?? "" },
      tecnica:       { desc: data.tecnica_desc ?? "",       min: data.tecnica_min?.toString() ?? "" },
      tactica:       { desc: data.tactica_desc ?? "",       min: data.tactica_min?.toString() ?? "" },
      cierre:        { desc: data.cierre_desc ?? "",        min: data.cierre_min?.toString() ?? "" },
    });
    const { data: cat } = await supabase.from("categorias").select("nombre").eq("id", data.categoria_id).single();
    setCategoriaNombre(cat?.nombre ?? "");
    setLoading(false);
  };

  useEffect(() => { cargar(); }, [params.id]); // eslint-disable-line

  const setBloque = (key: string, field: "desc" | "min", value: string) =>
    setBloques((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const guardar = async () => {
    if (!plan) return;
    if (!fecha) { setError("Selecciona una fecha."); return; }
    setSaving(true); setError("");

    const payload: Record<string, unknown> = {
      fecha,
      objetivo: objetivo.trim() || null,
      materiales: materiales.trim() || null,
    };
    for (const b of BLOQUES) {
      payload[`${b.key}_desc`] = bloques[b.key].desc.trim() || null;
      payload[`${b.key}_min`] = bloques[b.key].min ? Number(bloques[b.key].min) : null;
    }

    const { error: err } = await supabase.from("planeaciones").update(payload).eq("id", plan.id);
    if (err) { setError("Error al guardar. Inténtalo de nuevo."); setSaving(false); return; }
    setSaving(false);
    setEditando(false);
    await cargar();
  };

  const eliminar = async () => {
    if (!plan) return;
    setBorrando(true);
    await supabase.from("planeaciones").delete().eq("id", plan.id);
    router.replace("/coach/planeaciones");
  };

  const generarPDF = async () => {
    if (!plan) return;
    setGenerando(true);
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const W = 210, margin = 16;
      const [accentR, accentG, accentB] = hexToRgbArray(colorAcento);

      let logoBase64 = "";
      try {
        const resp = await fetch(logoUrl);
        const blob = await resp.blob();
        logoBase64 = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onloadend = () => res(r.result as string);
          r.readAsDataURL(blob);
        });
      } catch {}

      const logoSize = 22;
      let y = 14;
      if (logoBase64) {
        const logoX = (W - logoSize) / 2;
        doc.saveGraphicsState();
        doc.circle(logoX + logoSize / 2, y + logoSize / 2, logoSize / 2 * 0.96, null);
        doc.clip();
        doc.discardPath();
        doc.addImage(logoBase64, "PNG", logoX, y, logoSize, logoSize);
        doc.restoreGraphicsState();
        y += logoSize + 8;
      }

      doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.setTextColor(accentR, accentG, accentB);
      doc.text(clubNombre, W / 2, y, { align: "center" });
      y += 7;

      doc.setDrawColor(accentR, accentG, accentB); doc.setLineWidth(0.5);
      doc.line(margin + 25, y, W - margin - 25, y);
      y += 8;

      doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(0, 0, 0);
      doc.text(`Planeación — ${categoriaNombre}`, W / 2, y, { align: "center" });
      y += 6;
      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(100, 100, 100);
      doc.text(fmtFechaLargo(plan.fecha), W / 2, y, { align: "center" });
      y += 9;

      if (objetivo.trim()) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
        doc.text("OBJETIVO", margin, y);
        y += 5;
        doc.setFont("helvetica", "normal"); doc.setFontSize(10);
        const lines = doc.splitTextToSize(objetivo, W - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 6;
      }

      for (const b of BLOQUES) {
        const desc = bloques[b.key].desc.trim();
        const min = bloques[b.key].min;
        if (!desc && !min) continue;

        doc.setFillColor(245, 245, 245);
        doc.setDrawColor(accentR, accentG, accentB);
        doc.roundedRect(margin, y, W - margin * 2, 5, 1, 1, "F");
        doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(accentR, accentG, accentB);
        doc.text(b.label.toUpperCase() + (min ? `  ·  ${min} min` : ""), margin + 3, y + 3.6);
        y += 9;

        doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(30, 30, 30);
        const lines = doc.splitTextToSize(desc || "—", W - margin * 2);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 7;

        if (y > 265) { doc.addPage(); y = 20; }
      }

      if (materiales.trim()) {
        doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
        doc.text("MATERIALES", margin, y);
        y += 5;
        doc.setFont("helvetica", "normal"); doc.setFontSize(10);
        const lines = doc.splitTextToSize(materiales, W - margin * 2);
        doc.text(lines, margin, y);
      }

      doc.save(`Planeacion_${categoriaNombre}_${plan.fecha}.pdf`);
    } catch {
      setError("Error al generar el PDF.");
    }
    setGenerando(false);
  };

  const input = "input-theme text-sm";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <div className="w-7 h-7 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center" style={{ background: "var(--bg-page)" }}>
        <p style={{ color: "var(--text-muted)" }}>No se encontró esta planeación.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: "var(--bg-page)" }}>
      <header className="border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.push("/coach/planeaciones")} className="link-muted-theme w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-90 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="min-w-0">
            <h1 className="font-bold truncate" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>{categoriaNombre}</h1>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{fmtFechaLargo(plan.fecha)}</p>
          </div>
        </div>
      </header>

      <div className="w-full max-w-lg mx-auto px-4 pt-5 space-y-5">
        {editando ? (
          <>
            <div>
              <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Fecha</label>
              <input type="date" className={input} value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Objetivo de la sesión</label>
              <input className={input} value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
            </div>
            {BLOQUES.map((b) => (
              <div key={b.key} className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface-1)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-pantera-green">{b.label}</span>
                  <div className="flex items-center gap-1.5">
                    <input type="number" min={0} inputMode="numeric" placeholder="0"
                      className="w-14 text-center bg-transparent border rounded-lg py-1 text-sm"
                      style={{ borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
                      value={bloques[b.key].min} onChange={(e) => setBloque(b.key, "min", e.target.value)} />
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>min</span>
                  </div>
                </div>
                <textarea rows={3} className={`${input} resize-none`}
                  value={bloques[b.key].desc} onChange={(e) => setBloque(b.key, "desc", e.target.value)} />
              </div>
            ))}
            <div>
              <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Materiales</label>
              <input className={input} value={materiales} onChange={(e) => setMateriales(e.target.value)} />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={guardar} disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar"}
              </button>
              <button onClick={() => { setEditando(false); cargar(); }} disabled={saving}
                className="py-3 rounded-xl border text-sm font-bold link-muted-theme" style={{ borderColor: "var(--border-strong)" }}>
                Cancelar
              </button>
            </div>
          </>
        ) : (
          <>
            {objetivo && (
              <div>
                <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>Objetivo</p>
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>{objetivo}</p>
              </div>
            )}

            {BLOQUES.map((b) => {
              const desc = bloques[b.key].desc;
              const min = bloques[b.key].min;
              if (!desc && !min) return null;
              return (
                <div key={b.key} className="rounded-2xl border p-4" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface-1)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-pantera-green">{b.label}</span>
                    {min && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{min} min</span>}
                  </div>
                  {desc && <p className="text-sm whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>{desc}</p>}
                </div>
              );
            })}

            {materiales && (
              <div>
                <p className="text-xs uppercase tracking-widest mb-1.5" style={{ color: "var(--text-secondary)" }}>Materiales</p>
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>{materiales}</p>
              </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setEditando(true)}
                className="py-3 rounded-xl border text-sm font-bold link-muted-theme" style={{ borderColor: "var(--border-strong)" }}>
                Editar
              </button>
              <button onClick={generarPDF} disabled={generando} className="btn-primary disabled:opacity-50">
                {generando ? "Generando..." : "Descargar PDF"}
              </button>
            </div>
            <button onClick={() => setConfirmarBorrar(true)}
              className="w-full py-3 rounded-xl border text-sm font-bold text-red-400 border-red-500/20 hover:border-red-500/40 transition-colors">
              Eliminar planeación
            </button>
          </>
        )}
      </div>

      {confirmarBorrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => !borrando && setConfirmarBorrar(false)}>
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg" style={{ fontFamily: "Syne, sans-serif" }}>Eliminar planeación</h2>
            <p className="text-gray-400 text-sm">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 pt-1">
              <button onClick={eliminar} disabled={borrando}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors">
                {borrando ? "Eliminando..." : "Eliminar"}
              </button>
              <button onClick={() => setConfirmarBorrar(false)} disabled={borrando}
                className="px-4 py-3 text-sm text-gray-500 hover:text-white border border-white/10 rounded-xl transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
