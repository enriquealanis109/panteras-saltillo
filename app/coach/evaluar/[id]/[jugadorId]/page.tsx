"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Jugador } from "@/lib/supabase";
import { useClub } from "@/lib/club-context";

const BIMESTRES = [
  "Enero-Febrero", "Marzo-Abril", "Mayo-Junio",
  "Julio-Agosto", "Septiembre-Octubre", "Noviembre-Diciembre",
];
const POSICIONES = ["Portero", "Defensa", "Medios", "Delantero"];
const TACTICAS: Record<string, string[]> = {
  Portero:   ["Juego Aéreo", "Juego de Pies", "Reacción", "Comunicación", "Ubicación"],
  Defensa:   ["Lectura de Juego", "Coberturas", "Duelo 1 vs 1", "Juego Aéreo", "Liderazgo"],
  Medios:    ["Lectura de Juego", "Movimiento de Desmarque", "Competitividad", "Anticipo", "Definición"],
  Delantero: ["Definición", "Retención de Balón", "Movimientos de Desmarque", "Lectura de Juego", "Ambición"],
};
const ESCALA = ["1 - Excelente", "2 - Muy Bien", "3 - Bien", "4 - Satisfactorio/Proceso de Avance", "5 - Requiere Mayor Apoyo"];
const selectCls = "bg-[var(--bg-page)] border border-[var(--border-strong)] rounded-lg px-2 py-1 text-[var(--text-primary)] text-sm focus:outline-none focus:border-pantera-green/50";
const optStyle = { background: "var(--bg-page)", color: "var(--text-primary)" };

interface Evaluacion {
  id: string; bimestre: string; posicion: string; created_at: string;
  conduccion: number; control: number; pase: number; golpeo: number;
  coordinacion: number; resistencia: number; fuerza: number; velocidad: number;
  tacticas: Record<string, number>; observaciones: string;
}

function ScoreSelect({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
      <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))} className={selectCls}>
        <option value={0} style={optStyle}>—</option>
        {[1,2,3,4,5].map((n) => <option key={n} value={n} style={optStyle}>{n}</option>)}
      </select>
    </div>
  );
}

export default function EvaluarJugadorPage({ params }: { params: { id: string; jugadorId: string } }) {
  const { logoUrl } = useClub();
  const { id: categoriaId, jugadorId } = params;
  const router = useRouter();

  const [jugador, setJugador]             = useState<Jugador | null>(null);
  const [categoria, setCategoria]         = useState("");
  const [entrenadorId, setEntrenadorId]   = useState("");
  const [entrenadorNombre, setEntrenadorNombre] = useState("");
  const [editandoId, setEditandoId]       = useState<string | null>(null);
  const [bimestre, setBimestre]           = useState(BIMESTRES[0]);
  const [anio, setAnio]                   = useState(new Date().getFullYear());
  const [posicion, setPosicion]           = useState("Defensa");
  const [conduccion, setConduccion]       = useState(0);
  const [control, setControl]             = useState(0);
  const [pase, setPase]                   = useState(0);
  const [golpeo, setGolpeo]               = useState(0);
  const [coordinacion, setCoordinacion]   = useState(0);
  const [resistencia, setResistencia]     = useState(0);
  const [fuerza, setFuerza]               = useState(0);
  const [velocidad, setVelocidad]         = useState(0);
  const [tacticas, setTacticas]           = useState<Record<string, number>>({});
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando]         = useState(false);
  const [generando, setGenerando]         = useState<string | null>(null);
  const [guardado, setGuardado]           = useState(false);
  const [historial, setHistorial]         = useState<Evaluacion[]>([]);

  const cargarHistorial = async () => {
    const { data } = await supabase.from("evaluaciones").select("*")
      .eq("jugador_id", jugadorId).order("created_at", { ascending: false });
    setHistorial((data ?? []) as Evaluacion[]);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEntrenadorId(user.id);
        const { data: ent } = await supabase.from("entrenadores").select("nombre").eq("id", user.id).single();
        setEntrenadorNombre(ent?.nombre ?? "");
      }
      const { data: cat } = await supabase.from("categorias").select("nombre").eq("id", categoriaId).single();
      setCategoria(cat?.nombre ?? "");
      const { data: jug } = await supabase.from("jugadores").select("*").eq("id", jugadorId).single();
      setJugador(jug);
      await cargarHistorial();
    };
    init();
  }, [categoriaId, jugadorId]); // eslint-disable-line

  useEffect(() => { if (!editandoId) setTacticas({}); }, [posicion]); // eslint-disable-line

  const setTactica = (skill: string, val: number) =>
    setTacticas((prev) => ({ ...prev, [skill]: val }));

  const cargarEnFormulario = (ev: Evaluacion) => {
    const partes = ev.bimestre.split(" ");
    setBimestre(partes.slice(0, -1).join(" "));
    setAnio(Number(partes[partes.length - 1]));
    setPosicion(ev.posicion);
    setConduccion(ev.conduccion ?? 0);
    setControl(ev.control ?? 0);
    setPase(ev.pase ?? 0);
    setGolpeo(ev.golpeo ?? 0);
    setCoordinacion(ev.coordinacion ?? 0);
    setResistencia(ev.resistencia ?? 0);
    setFuerza(ev.fuerza ?? 0);
    setVelocidad(ev.velocidad ?? 0);
    setTacticas(ev.tacticas ?? {});
    setObservaciones(ev.observaciones ?? "");
    setEditandoId(ev.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setBimestre(BIMESTRES[0]); setAnio(new Date().getFullYear());
    setPosicion("Defensa"); setConduccion(0); setControl(0);
    setPase(0); setGolpeo(0); setCoordinacion(0); setResistencia(0);
    setFuerza(0); setVelocidad(0); setTacticas({}); setObservaciones("");
  };

  const guardar = async () => {
    setGuardando(true);
    const payload = {
      jugador_id: jugadorId, entrenador_id: entrenadorId,
      bimestre: `${bimestre} ${anio}`, posicion,
      conduccion, control, pase, golpeo,
      coordinacion, resistencia, fuerza, velocidad,
      tacticas, observaciones,
    };
    if (editandoId) {
      await supabase.from("evaluaciones").update(payload).eq("id", editandoId);
      setEditandoId(null);
    } else {
      await supabase.from("evaluaciones").insert(payload);
    }
    await cargarHistorial();
    setGuardando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2500);
  };

  const eliminarEvaluacion = async (id: string) => {
    if (!confirm("¿Eliminar esta evaluación?")) return;
    await supabase.from("evaluaciones").delete().eq("id", id);
    await cargarHistorial();
  };

  const generarPDFEvaluacion = async (ev: Evaluacion) => {
    if (!jugador) return;
    setGenerando(ev.id);
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
          const r = new FileReader(); r.onloadend = () => res(r.result as string); r.readAsDataURL(blob);
        });
        doc.addImage(logoBase64, "PNG", logoX, 6, logoSize, logoSize);
      } catch {}
      let headerY = logoBase64 ? 6 + logoSize + 5 : 14;

      doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(0,0,0);
      doc.text("PANTERAS SALTILLO", W/2, headerY, { align: "center" });
      headerY += 8;
      doc.setFontSize(12);
      doc.text("FICHA DE EVALUACIÓN DEL JUGADOR", W/2, headerY, { align: "center" });
      headerY += 8;
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(`FECHA: ${ev.bimestre.toUpperCase()}`, margin, headerY);
      headerY += 8;

      autoTable(doc, {
        startY: headerY,
        body: [
          ["NOMBRE DEL JUGADOR", jugador.nombre.toUpperCase()],
          ["CATEGORÍA", categoria.toUpperCase()],
          ["POSICIÓN", ev.posicion.toUpperCase()],
        ],
        theme: "grid",
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 55, fillColor: [220,220,220] } },
      });

      const y1 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
      doc.setFontSize(9); doc.setFont("helvetica", "bold");
      doc.text("CARACTERÍSTICAS TÉCNICAS", margin, y1 + 4);
      doc.text("ASPECTOS FÍSICOS", W/2 + 5, y1 + 4);

      autoTable(doc, {
        startY: y1 + 7, tableWidth: 85, margin: { left: margin },
        head: [["HABILIDAD", "CALIF."]],
        body: [["Conducción", ev.conduccion||"—"],["Control", ev.control||"—"],["Pase", ev.pase||"—"],["Golpeo de Balón", ev.golpeo||"—"]],
        theme: "grid",
        headStyles: { fillColor: [40,40,40], textColor: 255, fontSize: 8 },
        styles: { fontSize: 9, cellPadding: 2 }, columnStyles: { 1: { halign: "center" } },
      });
      autoTable(doc, {
        startY: y1 + 7, tableWidth: 85, margin: { left: W/2 + 5 },
        head: [["HABILIDAD", "CALIF."]],
        body: [["Coordinación", ev.coordinacion||"—"],["Resistencia", ev.resistencia||"—"],["Fuerza", ev.fuerza||"—"],["Velocidad", ev.velocidad||"—"]],
        theme: "grid",
        headStyles: { fillColor: [40,40,40], textColor: 255, fontSize: 8 },
        styles: { fontSize: 9, cellPadding: 2 }, columnStyles: { 1: { halign: "center" } },
      });

      const y2 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text(`CARACTERÍSTICAS TÁCTICAS — ${ev.posicion.toUpperCase()}`, margin, y2 + 4);
      autoTable(doc, {
        startY: y2 + 7, tableWidth: 85, margin: { left: margin },
        head: [["HABILIDAD", "CALIF."]],
        body: TACTICAS[ev.posicion].map((s) => [s, ev.tacticas?.[s] || "—"]),
        theme: "grid",
        headStyles: { fillColor: [40,40,40], textColor: 255, fontSize: 8 },
        styles: { fontSize: 9, cellPadding: 2 }, columnStyles: { 1: { halign: "center" } },
      });

      const y3 = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(80,80,80);
      doc.text("1=Excelente  |  2=Muy Bien  |  3=Bien  |  4=Satisfactorio/Proceso de Avance  |  5=Requiere Mayor Apoyo", margin, y3);

      const y4 = y3 + 6;
      doc.setTextColor(0,0,0); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text("OBSERVACIONES:", margin, y4);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
      const lines = doc.splitTextToSize(ev.observaciones || "Sin observaciones.", W - margin * 2);
      doc.text(lines, margin, y4 + 5);

      const y5 = Math.min(y4 + 5 + lines.length * 4 + 15, 250);
      const firmaW = 55;
      const x1f = margin, x2f = W/2 - firmaW/2, x3f = W - margin - firmaW;

      try {
        const resp = await fetch("/firma-director.png");
        const blob = await resp.blob();
        const b64 = await new Promise<string>((res) => {
          const r = new FileReader(); r.onloadend = () => res(r.result as string); r.readAsDataURL(blob);
        });
        doc.addImage(b64, "PNG", x3f, y5 - 10, firmaW, 12);
      } catch {}

      doc.setDrawColor(0); doc.setLineWidth(0.3);
      [x1f, x2f, x3f].forEach((x) => doc.line(x, y5 + 2, x + firmaW, y5 + 2));
      doc.setFontSize(7.5);
      doc.text("FIRMA PADRE O TUTOR", x1f + firmaW/2, y5 + 6, { align: "center" });
      doc.text(`FIRMA ENTRENADOR\n${entrenadorNombre.toUpperCase()}`, x2f + firmaW/2, y5 + 6, { align: "center" });
      doc.text("FIRMA DIRECTOR DEPORTIVO\nJOSUE ARRIAGA MATA", x3f + firmaW/2, y5 + 6, { align: "center" });

      const blob = doc.output("blob");
      const fileName = `Evaluacion_${jugador.nombre}_${ev.bimestre}.pdf`;
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: "application/pdf" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: `Evaluación ${jugador.nombre}` });
          setGenerando(null); return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = fileName; a.click();
      URL.revokeObjectURL(url);
    } catch (e) { console.error(e); }
    setGenerando(null);
  };

  if (!jugador) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
      <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden w-full pb-32" style={{ background: "var(--bg-page)" }}>
      <header className="border-b px-4 py-3 flex items-center gap-3 sticky top-0 z-10" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <button onClick={() => router.back()} className="link-muted-theme text-xl w-8 flex-shrink-0">←</button>
        <div className="min-w-0">
          <h1 className="font-bold truncate" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
            {jugador.nombre}
          </h1>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{categoria} {editandoId && "· Editando evaluación"}</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">

        {/* Bimestre y año */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Bimestre</label>
            <select value={bimestre} onChange={(e) => setBimestre(e.target.value)}
              className={`w-full ${selectCls} py-2.5 rounded-xl`}>
              {BIMESTRES.map((b) => <option key={b} value={b} style={optStyle}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Año</label>
            <input type="number" value={anio} onChange={(e) => setAnio(Number(e.target.value))}
              className="w-full bg-[var(--bg-page)] border border-[var(--border-strong)] rounded-xl px-3 py-2.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-pantera-green/50" />
          </div>
        </div>

        {/* Posición */}
        <div>
          <label className="text-xs uppercase tracking-widest block mb-2" style={{ color: "var(--text-secondary)" }}>Posición</label>
          <div className="grid grid-cols-4 gap-2">
            {POSICIONES.map((p) => (
              <button key={p} onClick={() => setPosicion(p)}
                className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                  posicion === p
                    ? "bg-pantera-green text-white border-pantera-green"
                    : "bg-transparent hover:border-white/25 link-muted-theme"
                }`}
                style={posicion !== p ? { borderColor: "var(--border-strong)" } : undefined}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Técnicas */}
        <div className="card-theme p-4" style={{ padding: "1rem" }}>
          <p className="font-bold text-sm mb-3" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>Características Técnicas</p>
          <ScoreSelect label="Conducción"      value={conduccion}  onChange={setConduccion} />
          <ScoreSelect label="Control"         value={control}     onChange={setControl} />
          <ScoreSelect label="Pase"            value={pase}        onChange={setPase} />
          <ScoreSelect label="Golpeo de Balón" value={golpeo}      onChange={setGolpeo} />
        </div>

        {/* Físicas */}
        <div className="card-theme p-4" style={{ padding: "1rem" }}>
          <p className="font-bold text-sm mb-3" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>Aspectos Físicos</p>
          <ScoreSelect label="Coordinación" value={coordinacion} onChange={setCoordinacion} />
          <ScoreSelect label="Resistencia"  value={resistencia}  onChange={setResistencia} />
          <ScoreSelect label="Fuerza"       value={fuerza}       onChange={setFuerza} />
          <ScoreSelect label="Velocidad"    value={velocidad}    onChange={setVelocidad} />
        </div>

        {/* Tácticas */}
        <div className="card-theme p-4" style={{ padding: "1rem" }}>
          <p className="font-bold text-sm mb-3" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
            Características Tácticas — {posicion}
          </p>
          {TACTICAS[posicion].map((skill) => (
            <ScoreSelect key={skill} label={skill} value={tacticas[skill] ?? 0}
              onChange={(v) => setTactica(skill, v)} />
          ))}
        </div>

        {/* Escala */}
        <div className="rounded-xl px-4 py-3" style={{ background: "var(--bg-surface-1)" }}>
          <p className="text-[10px] leading-relaxed" style={{ color: "var(--text-muted)" }}>{ESCALA.join("  ·  ")}</p>
        </div>

        {/* Observaciones */}
        <div>
          <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Observaciones</label>
          <textarea rows={5} value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Escribe las observaciones del jugador..."
            className="input-theme text-sm resize-none" />
        </div>

        {/* Historial */}
        {historial.length > 0 && (
          <div className="card-theme p-4" style={{ padding: "1rem" }}>
            <p className="font-bold text-sm mb-3" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>Evaluaciones anteriores</p>
            <div className="space-y-3">
              {historial.map((h) => (
                <div key={h.id} className="border rounded-xl p-3" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{h.bimestre}</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{h.posicion} · {new Date(h.created_at).toLocaleDateString("es-MX")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => cargarEnFormulario(h)}
                      className="link-muted-theme flex-1 text-xs border hover:border-white/20 py-1.5 rounded-lg transition-all" style={{ borderColor: "var(--border-strong)" }}>
                      Editar
                    </button>
                    <button onClick={() => generarPDFEvaluacion(h)} disabled={generando === h.id}
                      className="flex-1 text-xs border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 py-1.5 rounded-lg transition-all disabled:opacity-50">
                      {generando === h.id ? "..." : "WhatsApp"}
                    </button>
                    <button onClick={() => eliminarEvaluacion(h.id)}
                      className="text-xs border border-red-500/20 text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-all">
                      Borrar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Guardar fijo */}
      <div className="fixed bottom-0 left-0 right-0 p-4 backdrop-blur-sm border-t" style={{ background: "var(--bg-page)", borderColor: "var(--border-subtle)" }}>
        <div className="max-w-lg mx-auto flex gap-3">
          {editandoId && (
            <button onClick={cancelarEdicion}
              className="link-muted-theme flex-1 py-4 rounded-xl font-bold text-sm border transition-all" style={{ borderColor: "var(--border-strong)" }}>
              Cancelar
            </button>
          )}
          <button onClick={guardar} disabled={guardando}
            className={`flex-1 py-4 rounded-xl font-bold text-sm transition-all ${
              guardado ? "bg-green-600 text-white" : "btn-primary disabled:opacity-50"
            }`}>
            {guardando ? "Guardando..." : guardado ? "Guardado" : editandoId ? "Actualizar evaluación" : "Guardar evaluación"}
          </button>
        </div>
      </div>
    </div>
  );
}
