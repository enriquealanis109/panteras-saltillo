"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  supabase,
  type Jugador,
  type ConceptoCobro,
  type EstatusPago,
  type TipoCobro,
} from "@/lib/supabase";
import { PanelTour } from "@/components/admin/PanelTour";
import { COBROS_STEPS } from "@/lib/coach-tours";

interface PagoDato { estatus: EstatusPago; monto_pagado: number }
type PagoMap = Record<string, Record<string, PagoDato>>;

// Helper: rectángulo con esquinas redondeadas en canvas
function rRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const TIPOS_COBRO: { value: TipoCobro; label: string }[] = [
  { value: "torneo",    label: "Torneo"    },
  { value: "copa",      label: "Copa"      },
  { value: "actividad", label: "Actividad" },
  { value: "otro",      label: "Otro"      },
];

const TIPO_COBRO_STYLE: Record<TipoCobro, string> = {
  torneo:    "bg-blue-500/20 text-blue-400",
  copa:      "bg-purple-500/20 text-purple-400",
  actividad: "bg-orange-500/20 text-orange-400",
  otro:      "bg-[var(--bg-surface-2)] text-[var(--text-secondary)]",
};

function siguienteEstatus(actual: EstatusPago): EstatusPago {
  if (actual === "pendiente") return "completo";
  if (actual === "completo")  return "na";
  return "pendiente";
}

// Celda para conceptos CON monto: muestra cantidad pagada
function CeldaMonto({ dato, monto, onClick, saving }: {
  dato: PagoDato; monto: number; onClick: () => void; saving: boolean;
}) {
  if (dato.estatus === "na") {
    return (
      <button onClick={onClick} disabled={saving}
        className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase min-w-[90px] transition-all active:scale-95 disabled:opacity-60" style={{ background: "var(--bg-surface-2)", color: "var(--text-muted)" }}>
        N/A
      </button>
    );
  }
  const pagado   = dato.monto_pagado ?? 0;
  const completo = pagado >= monto;
  return (
    <button onClick={onClick} disabled={saving}
      className={`px-2.5 py-2 rounded-lg min-w-[90px] w-full text-left transition-all active:scale-95 disabled:opacity-60 ${
        completo ? "bg-green-500/20" : pagado > 0 ? "bg-[var(--bg-surface-2)] border border-[var(--border-strong)]" : "border"
      }`} style={(!completo && pagado === 0) ? { background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" } : undefined}>
      {saving ? (
        <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>...</span>
      ) : pagado === 0 ? (
        <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>Tocar para anotar</span>
      ) : (
        <>
          <p className={`text-[12px] font-bold ${completo ? "text-[var(--status-good)]" : "text-[var(--status-neutral)]"}`}>
            ${pagado.toLocaleString()}
          </p>
          {!completo && (
            <div className="w-full rounded-full h-1 mt-1.5" style={{ background: "var(--border-strong)" }}>
              <div className="h-1 bg-[var(--status-neutral)] rounded-full transition-all"
                style={{ width: `${Math.min(100, (pagado / monto) * 100)}%` }} />
            </div>
          )}
        </>
      )}
    </button>
  );
}

// Celda para conceptos SIN monto: toggle simple
function CeldaEstatus({ estatus, onClick, saving }: {
  estatus: EstatusPago; onClick: () => void; saving: boolean;
}) {
  const cfg = {
    completo:  { bg: "bg-green-500/20",  text: "text-[var(--status-good)]",  label: "COMPLETO"  },
    pendiente: { bg: "bg-[var(--bg-surface-2)]", text: "text-[var(--status-neutral)]", label: "PENDIENTE" },
    na:        { bg: "",  text: "",   label: "N/A"       },
  }[estatus];
  return (
    <button onClick={onClick} disabled={saving}
      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide whitespace-nowrap min-w-[90px] transition-all active:scale-95 disabled:opacity-60 ${cfg.bg} ${cfg.text}`}
      style={estatus === "na" ? { background: "var(--bg-surface-2)", color: "var(--text-muted)" } : undefined}>
      {saving ? "..." : cfg.label}
    </button>
  );
}

export default function CobrosPage({ params }: { params: { id: string } }) {
  const categoriaId = params.id;
  const router      = useRouter();

  const [categoria,     setCategoria]     = useState("");
  const [jugadores,     setJugadores]     = useState<Jugador[]>([]);
  const [conceptos,     setConceptos]     = useState<ConceptoCobro[]>([]);
  const [archivados,    setArchivados]    = useState<ConceptoCobro[]>([]);
  const [pagos,         setPagos]         = useState<PagoMap>({});
  const [saving,        setSaving]        = useState<string | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [verHistorial,  setVerHistorial]  = useState(false);
  const [entrenadorId,  setEntrenadorId]  = useState("");

  // Modal: nuevo concepto
  const [modalNuevo, setModalNuevo] = useState(false);
  const [newNombre,  setNewNombre]  = useState("");
  const [newTipo,    setNewTipo]    = useState<TipoCobro>("torneo");
  const [newMonto,   setNewMonto]   = useState("");
  const [creating,   setCreating]   = useState(false);

  // Modal: anotar abono de jugador
  const [modalMonto,     setModalMonto]     = useState<{ jugador: Jugador; concepto: ConceptoCobro } | null>(null);
  const [inputAbono,     setInputAbono]     = useState("");      // nuevo abono a sumar
  const [inputCorreccion,setInputCorreccion]= useState("");      // total exacto (modo editar)
  const [modoEditar,     setModoEditar]     = useState(false);   // false=abonar, true=corregir total
  const [inputNA,        setInputNA]        = useState(false);
  const [savingMonto,    setSavingMonto]    = useState(false);

  // Modal: opciones del concepto (archivar / eliminar)
  const [modalConcepto, setModalConcepto] = useState<ConceptoCobro | null>(null);
  const [confirmElim,   setConfirmElim]   = useState(false);

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const mostrarToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const cargar = async () => {
    const { data: cat } = await supabase.from("categorias").select("nombre").eq("id", categoriaId).single();
    setCategoria(cat?.nombre ?? "");

    const { data: jugs } = await supabase
      .from("jugadores").select("*")
      .eq("categoria_id", categoriaId).eq("activo", true).order("nombre");
    const jugArr = jugs ?? [];
    setJugadores(jugArr);

    if (jugArr.length === 0) { setLoading(false); return; }

    const jugIds = jugArr.map((j) => j.id);

    const { data: concs } = await supabase
      .from("conceptos_cobro").select("*")
      .eq("categoria_id", categoriaId).eq("activo", true).order("created_at");
    const concArr = (concs ?? []) as ConceptoCobro[];
    setConceptos(concArr);

    const { data: arch } = await supabase
      .from("conceptos_cobro").select("*")
      .eq("categoria_id", categoriaId).eq("activo", false).order("created_at", { ascending: false });
    const archArr = (arch ?? []) as ConceptoCobro[];
    setArchivados(archArr);

    const allIds = [...concArr, ...archArr].map((c) => c.id);
    if (allIds.length > 0) {
      const { data: pags } = await supabase
        .from("pagos_jugador").select("jugador_id, concepto_id, estatus, monto_pagado")
        .in("jugador_id", jugIds).in("concepto_id", allIds);
      const pagMap: PagoMap = {};
      (pags ?? []).forEach((p) => {
        if (!pagMap[p.jugador_id]) pagMap[p.jugador_id] = {};
        pagMap[p.jugador_id][p.concepto_id] = {
          estatus: p.estatus as EstatusPago,
          monto_pagado: p.monto_pagado ?? 0,
        };
      });
      setPagos(pagMap);
    } else {
      setPagos({});
    }

    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/coach/login"); return; }
      setEntrenadorId(user.id);
      await cargar();
    };
    init();
  }, [categoriaId]); // eslint-disable-line

  // Toggle simple para conceptos sin monto
  const toggleEstatus = async (jugadorId: string, conceptoId: string) => {
    const actual    = pagos[jugadorId]?.[conceptoId]?.estatus ?? "pendiente";
    const siguiente = siguienteEstatus(actual);
    const key       = `${jugadorId}-${conceptoId}`;
    setSaving(key);
    setPagos((prev) => ({
      ...prev,
      [jugadorId]: { ...(prev[jugadorId] ?? {}), [conceptoId]: { estatus: siguiente, monto_pagado: 0 } },
    }));
    const { error } = await supabase.from("pagos_jugador").upsert(
      { jugador_id: jugadorId, concepto_id: conceptoId, estatus: siguiente, monto_pagado: 0, updated_by: entrenadorId, updated_at: new Date().toISOString() },
      { onConflict: "jugador_id,concepto_id" }
    );
    if (error) {
      setPagos((prev) => ({
        ...prev,
        [jugadorId]: { ...(prev[jugadorId] ?? {}), [conceptoId]: { estatus: actual, monto_pagado: 0 } },
      }));
      mostrarToast("Error al actualizar", false);
    }
    setSaving(null);
  };

  // Abrir modal de abono
  const abrirModalMonto = (jug: Jugador, conc: ConceptoCobro) => {
    const dato = pagos[jug.id]?.[conc.id];
    setInputNA(dato?.estatus === "na");
    setInputAbono("");
    setInputCorreccion(dato?.monto_pagado ? String(dato.monto_pagado) : "");
    setModoEditar(false);
    setModalMonto({ jugador: jug, concepto: conc });
  };

  // Guardar abono (suma al acumulado) o corrección de total
  const guardarMonto = async () => {
    if (!modalMonto) return;
    setSavingMonto(true);
    const { jugador, concepto } = modalMonto;

    let montoPagado: number;
    if (inputNA) {
      montoPagado = 0;
    } else if (modoEditar) {
      montoPagado = parseFloat(inputCorreccion) || 0;
    } else {
      const acumulado = pagos[jugador.id]?.[concepto.id]?.monto_pagado ?? 0;
      montoPagado     = acumulado + (parseFloat(inputAbono) || 0);
    }

    const nuevoEstatus: EstatusPago = inputNA
      ? "na"
      : (concepto.monto && montoPagado >= concepto.monto) ? "completo" : "pendiente";

    const { error } = await supabase.from("pagos_jugador").upsert(
      {
        jugador_id: jugador.id, concepto_id: concepto.id,
        estatus: nuevoEstatus, monto_pagado: montoPagado,
        updated_by: entrenadorId, updated_at: new Date().toISOString(),
      },
      { onConflict: "jugador_id,concepto_id" }
    );

    if (error) {
      mostrarToast("Error al guardar", false);
    } else {
      setPagos((prev) => ({
        ...prev,
        [jugador.id]: { ...(prev[jugador.id] ?? {}), [concepto.id]: { estatus: nuevoEstatus, monto_pagado: montoPagado } },
      }));
      mostrarToast("Guardado");
      setModalMonto(null);
    }
    setSavingMonto(false);
  };

  // Generar y abrir WhatsApp con resumen del concepto
  const compartirWA = (concepto: ConceptoCobro) => {
    const lines: string[] = [];
    lines.push(`💰 ${concepto.nombre.toUpperCase()} — ${categoria.toUpperCase()}`);
    if (concepto.monto) lines.push(`$${concepto.monto.toLocaleString()} por jugador`);
    lines.push("");

    const completos:  Jugador[] = [];
    const abonados:   Jugador[] = [];
    const pendientes: Jugador[] = [];
    const naJugs:     Jugador[] = [];

    jugadores.forEach((j) => {
      const dato = pagos[j.id]?.[concepto.id] ?? { estatus: "pendiente" as EstatusPago, monto_pagado: 0 };
      if (dato.estatus === "na") {
        naJugs.push(j);
      } else if (concepto.monto) {
        if (dato.monto_pagado >= concepto.monto)  completos.push(j);
        else if (dato.monto_pagado > 0)            abonados.push(j);
        else                                       pendientes.push(j);
      } else {
        if (dato.estatus === "completo") completos.push(j);
        else                             pendientes.push(j);
      }
    });

    if (completos.length > 0) {
      lines.push(`✅ COMPLETO (${completos.length})`);
      completos.forEach((j) => lines.push(`• ${j.nombre}`));
      lines.push("");
    }
    if (abonados.length > 0) {
      lines.push(`⏳ ABONADO (${abonados.length})`);
      abonados.forEach((j) => {
        const dato  = pagos[j.id]?.[concepto.id];
        const falta = (concepto.monto ?? 0) - (dato?.monto_pagado ?? 0);
        lines.push(`• ${j.nombre} — $${(dato?.monto_pagado ?? 0).toLocaleString()} (falta $${falta.toLocaleString()})`);
      });
      lines.push("");
    }
    if (pendientes.length > 0) {
      lines.push(`❌ PENDIENTE (${pendientes.length})`);
      pendientes.forEach((j) => lines.push(`• ${j.nombre}`));
      lines.push("");
    }
    if (naJugs.length > 0) {
      lines.push(`— N/A (${naJugs.length})`);
      naJugs.forEach((j) => lines.push(`• ${j.nombre}`));
      lines.push("");
    }

    if (concepto.monto) {
      const participan = jugadores.filter((j) => pagos[j.id]?.[concepto.id]?.estatus !== "na");
      const recaudado  = participan.reduce((s, j) => s + (pagos[j.id]?.[concepto.id]?.monto_pagado ?? 0), 0);
      const esperado   = participan.length * concepto.monto;
      const pct        = esperado > 0 ? Math.round((recaudado / esperado) * 100) : 0;
      lines.push(`📊 Recaudado: $${recaudado.toLocaleString()} / $${esperado.toLocaleString()} (${pct}%)`);
    }

    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join("\n").trim())}`, "_blank");
  };

  // Genera imagen PNG del resumen y la comparte / descarga
  const generarImagenCobros = async (concepto: ConceptoCobro) => {
    mostrarToast("Generando imagen...");

    const FONT  = "system-ui, -apple-system, Arial, sans-serif";
    const SCALE = 2;
    const W     = 400;
    const PAD   = 20;
    const ROW_H = 52;
    const HEAD  = 128;
    const FOOT  = 88;
    const H     = HEAD + jugadores.length * ROW_H + FOOT;

    const canvas = document.createElement("canvas");
    canvas.width  = W * SCALE;
    canvas.height = H * SCALE;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(SCALE, SCALE);

    // ── Fondo general
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, W, H);

    // ── Header
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, W, HEAD);

    // Título "Panteras Saltillo"
    ctx.font = `500 10px ${FONT}`;
    ctx.fillStyle = "#4b5563";
    ctx.fillText("PANTERAS SALTILLO", PAD, 22);

    // Fecha (derecha)
    const fecha = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
    ctx.font = `400 10px ${FONT}`;
    ctx.fillStyle = "#374151";
    ctx.textAlign = "right";
    ctx.fillText(fecha, W - PAD, 22);
    ctx.textAlign = "left";

    // Nombre concepto
    ctx.font = `bold 20px ${FONT}`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(concepto.nombre.toUpperCase(), PAD, 52);

    // Subtítulo: categoría + monto
    ctx.font = `400 12px ${FONT}`;
    ctx.fillStyle = "#9ca3af";
    let sub = categoria.toUpperCase();
    if (concepto.monto) sub += `  ·  $${concepto.monto.toLocaleString()} por jugador`;
    ctx.fillText(sub, PAD, 72);

    // Badge tipo
    const tipoClr: Record<TipoCobro, string> = {
      torneo: "#3b82f6", copa: "#a855f7", actividad: "#f97316", otro: "#6b7280",
    };
    const clr = tipoClr[concepto.tipo];
    ctx.font = `bold 9px ${FONT}`;
    const badgeW = ctx.measureText(concepto.tipo.toUpperCase()).width + 14;
    ctx.fillStyle = clr + "30";
    rRect(ctx, PAD, 84, badgeW, 17, 8);
    ctx.fill();
    ctx.fillStyle = clr;
    ctx.fillText(concepto.tipo.toUpperCase(), PAD + 7, 96);

    // Línea separadora header
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, HEAD); ctx.lineTo(W, HEAD); ctx.stroke();

    // ── Filas de jugadores
    jugadores.forEach((jug, idx) => {
      const dato = pagos[jug.id]?.[concepto.id] ?? { estatus: "pendiente" as EstatusPago, monto_pagado: 0 };
      const y    = HEAD + idx * ROW_H;

      // Fondo alternado
      if (idx % 2 === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.015)";
        ctx.fillRect(0, y, W, ROW_H);
      }

      // Nombre
      ctx.font = `500 13px ${FONT}`;
      ctx.fillStyle = "#e5e7eb";
      ctx.fillText(jug.nombre, PAD, y + 20, 200);

      // Alias
      if (jug.alias) {
        ctx.font = `400 10px ${FONT}`;
        ctx.fillStyle = "#22c55e";
        ctx.fillText(`"${jug.alias}"`, PAD, y + 35);
      }

      // Estatus / monto (derecha)
      ctx.textAlign = "right";
      if (dato.estatus === "na") {
        ctx.font = `bold 10px ${FONT}`;
        ctx.fillStyle = "#374151";
        ctx.fillText("N/A", W - PAD, y + 22);
      } else if (concepto.monto) {
        const pagado   = dato.monto_pagado;
        const total    = concepto.monto;
        const completo = pagado >= total;
        const parcial  = pagado > 0 && !completo;

        ctx.font = `bold 13px ${FONT}`;
        ctx.fillStyle = completo ? "#22c55e" : parcial ? "#eab308" : "#4b5563";

        if (completo) {
          ctx.fillText(`$${pagado.toLocaleString()}`, W - PAD, y + 22);
          ctx.font = `bold 10px ${FONT}`;
          ctx.fillStyle = "#22c55e";
          ctx.fillText("PAGADO ✓", W - PAD, y + 36);
        } else if (parcial) {
          ctx.fillText(`$${pagado.toLocaleString()}`, W - PAD, y + 18);
          ctx.font = `400 10px ${FONT}`;
          ctx.fillStyle = "#6b7280";
          ctx.fillText(`falta $${(total - pagado).toLocaleString()}`, W - PAD, y + 32);
          // Mini barra de progreso
          const barW = 80;
          const barX = W - PAD - barW;
          ctx.fillStyle = "rgba(255,255,255,0.07)";
          rRect(ctx, barX, y + 40, barW, 3, 1.5); ctx.fill();
          ctx.fillStyle = "#eab308";
          rRect(ctx, barX, y + 40, barW * Math.min(1, pagado / total), 3, 1.5); ctx.fill();
        } else {
          ctx.font = `bold 10px ${FONT}`;
          ctx.fillStyle = "#374151";
          ctx.fillText("PENDIENTE", W - PAD, y + 22);
        }
      } else {
        ctx.font = `bold 11px ${FONT}`;
        ctx.fillStyle = dato.estatus === "completo" ? "#22c55e" : "#4b5563";
        ctx.fillText(dato.estatus === "completo" ? "COMPLETO ✓" : "PENDIENTE", W - PAD, y + 22);
      }
      ctx.textAlign = "left";

      // Separador de fila
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(0, y + ROW_H); ctx.lineTo(W, y + ROW_H); ctx.stroke();
    });

    // ── Footer
    const FY = HEAD + jugadores.length * ROW_H;
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, FY, W, FOOT);
    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, FY); ctx.lineTo(W, FY); ctx.stroke();

    if (concepto.monto) {
      const part      = jugadores.filter((j) => pagos[j.id]?.[concepto.id]?.estatus !== "na");
      const recaudado = part.reduce((s, j) => s + (pagos[j.id]?.[concepto.id]?.monto_pagado ?? 0), 0);
      const esperado  = part.length * concepto.monto;
      const pct       = esperado > 0 ? Math.round((recaudado / esperado) * 100) : 0;
      const fColor    = pct >= 80 ? "#22c55e" : pct >= 40 ? "#eab308" : "#ef4444";

      ctx.font = `500 10px ${FONT}`;
      ctx.fillStyle = "#6b7280";
      ctx.fillText("TOTAL RECAUDADO", PAD, FY + 22);

      ctx.font = `bold 22px ${FONT}`;
      ctx.fillStyle = fColor;
      ctx.fillText(`$${recaudado.toLocaleString()}`, PAD, FY + 50);

      ctx.font = `400 11px ${FONT}`;
      ctx.fillStyle = "#4b5563";
      ctx.fillText(`de $${esperado.toLocaleString()}`, PAD, FY + 66);

      // Barra de progreso
      const barW = W - PAD * 2;
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      rRect(ctx, PAD, FY + 72, barW, 5, 2.5); ctx.fill();
      if (pct > 0) {
        ctx.fillStyle = fColor;
        rRect(ctx, PAD, FY + 72, barW * (pct / 100), 5, 2.5); ctx.fill();
      }

      ctx.font = `bold 16px ${FONT}`;
      ctx.fillStyle = fColor;
      ctx.textAlign = "right";
      ctx.fillText(`${pct}%`, W - PAD, FY + 50);
      ctx.textAlign = "left";
    }

    // Marca de agua
    ctx.font = `400 9px ${FONT}`;
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.textAlign = "center";
    ctx.fillText("panteras-saltillo.vercel.app", W / 2, H - 7);
    ctx.textAlign = "left";

    // ── Compartir o descargar
    canvas.toBlob(async (blob) => {
      if (!blob) { mostrarToast("Error al generar imagen", false); return; }
      const file = new File([blob], `${concepto.nombre}-${categoria}.png`, { type: "image/png" });
      if (typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], title: concepto.nombre }); } catch { /* cancelado */ }
      } else {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement("a");
        a.href    = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, "image/png");
  };

  const crearConcepto = async () => {
    if (!newNombre.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("conceptos_cobro").insert({
      nombre: newNombre.trim(), tipo: newTipo,
      categoria_id: categoriaId,
      monto: newMonto ? parseFloat(newMonto) : null,
      created_by: entrenadorId, activo: true,
    });
    if (error) {
      mostrarToast("Error al crear", false);
    } else {
      mostrarToast("Concepto creado");
      setModalNuevo(false);
      setNewNombre(""); setNewTipo("torneo"); setNewMonto("");
      await cargar();
    }
    setCreating(false);
  };

  const archivarConcepto = async (c: ConceptoCobro) => {
    await supabase.from("conceptos_cobro").update({ activo: false }).eq("id", c.id);
    mostrarToast("Concepto archivado");
    setModalConcepto(null);
    await cargar();
  };

  const eliminarConcepto = async (c: ConceptoCobro) => {
    const { error } = await supabase.from("conceptos_cobro").delete().eq("id", c.id);
    if (error) {
      mostrarToast("Error al eliminar", false);
    } else {
      mostrarToast("Eliminado");
      setModalConcepto(null);
      setConfirmElim(false);
      await cargar();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tableMinWidth = 160 + conceptos.length * 120 + 60;

  return (
    <div className="min-h-screen pb-20 w-full" style={{ background: "var(--bg-page)" }}>

      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl ${
          toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>{toast.msg}</div>
      )}

      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between sticky top-0 z-20" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.back()}
            className="link-muted-theme w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-90 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="min-w-0">
            <h1 className="font-bold leading-tight truncate" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
              Cobros — {categoria}
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{jugadores.length} jugadores</p>
          </div>
        </div>
        <PanelTour steps={COBROS_STEPS} storageKey="tour_coach_cobros" />
      </header>

      {jugadores.length === 0 ? (
        <div className="text-center py-20 px-5">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>No hay jugadores en esta categoría.</p>
        </div>
      ) : (
        <>
          {/* Tabla */}
          <div id="tour-cobros-tabla" className="overflow-x-auto">
            <table style={{ minWidth: tableMinWidth, borderCollapse: "separate", borderSpacing: 0 }} className="w-full">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 text-left px-4 py-2.5 text-[10px] uppercase tracking-wider font-semibold border-b w-44" style={{ background: "var(--bg-alt)", color: "var(--text-secondary)", borderColor: "var(--border-subtle)" }}>
                    Jugador
                  </th>
                  {conceptos.map((c) => (
                    <th key={c.id} className="text-center px-3 py-2 border-b min-w-[120px]" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
                      <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full mb-1 ${TIPO_COBRO_STYLE[c.tipo]}`}>
                        {c.tipo}
                      </span>
                      <p className="text-[11px] font-semibold leading-tight" style={{ color: "var(--text-secondary)" }}>{c.nombre}</p>
                      {c.monto && <p className="text-[9px] mt-0.5" style={{ color: "var(--text-muted)" }}>${c.monto.toLocaleString()} c/u</p>}
                      <button
                        onClick={() => { setModalConcepto(c); setConfirmElim(false); }}
                        className="text-[9px] transition-colors mt-1" style={{ color: "var(--text-muted)" }}
                      >
                        opciones
                      </button>
                    </th>
                  ))}
                  <th id="tour-cobros-nuevo" className="px-3 py-2.5 border-b min-w-[70px] align-middle" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
                    <button onClick={() => setModalNuevo(true)}
                      className="flex items-center gap-1 text-pantera-green text-[11px] font-bold hover:text-green-300 transition-colors whitespace-nowrap">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Nuevo
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {jugadores.map((jug) => (
                  <tr key={jug.id} className="transition-colors">
                    <td className="sticky left-0 z-[5] px-4 py-3 border-b" style={{ background: "var(--bg-page)", borderColor: "var(--border-subtle)" }}>
                      <p className="text-sm font-medium truncate max-w-[150px]" style={{ color: "var(--text-primary)" }}>{jug.nombre}</p>
                      {jug.alias && <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>"{jug.alias}"</p>}
                    </td>
                    {conceptos.map((c) => {
                      const key  = `${jug.id}-${c.id}`;
                      const dato = pagos[jug.id]?.[c.id] ?? { estatus: "pendiente" as EstatusPago, monto_pagado: 0 };
                      return (
                        <td key={c.id} className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                          {c.monto ? (
                            <CeldaMonto dato={dato} monto={c.monto} onClick={() => abrirModalMonto(jug, c)} saving={saving === key} />
                          ) : (
                            <CeldaEstatus estatus={dato.estatus} onClick={() => toggleEstatus(jug.id, c.id)} saving={saving === key} />
                          )}
                        </td>
                      );
                    })}
                    <td className="border-b" style={{ borderColor: "var(--border-subtle)" }} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Estado vacío */}
          {conceptos.length === 0 && (
            <div className="text-center py-14 px-6">
              <div className="w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-4" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--text-muted)" }} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
                </svg>
              </div>
              <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Sin conceptos de cobro</p>
              <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>Crea torneos, copas o actividades para registrar pagos.</p>
              <button onClick={() => setModalNuevo(true)}
                className="inline-flex items-center gap-2 bg-pantera-green/10 border border-pantera-green/30 text-pantera-green text-sm font-bold px-5 py-3 rounded-xl hover:bg-pantera-green/20 active:scale-95 transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Crear primer concepto
              </button>
            </div>
          )}

          {/* Resumen por concepto */}
          {conceptos.length > 0 && (
            <div id="tour-cobros-resumen" className="px-4 mt-6 space-y-3">
              <p className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Resumen</p>
              {conceptos.map((c) => {
                if (c.monto) {
                  const participan = jugadores.filter((j) => pagos[j.id]?.[c.id]?.estatus !== "na");
                  const recaudado  = participan.reduce((s, j) => s + (pagos[j.id]?.[c.id]?.monto_pagado ?? 0), 0);
                  const esperado   = participan.length * c.monto;
                  const completos  = participan.filter((j) => (pagos[j.id]?.[c.id]?.monto_pagado ?? 0) >= c.monto!).length;
                  const pct        = esperado > 0 ? Math.round((recaudado / esperado) * 100) : 0;
                  return (
                    <div key={c.id} className="rounded-xl px-4 py-3 border" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0 ${TIPO_COBRO_STYLE[c.tipo]}`}>{c.tipo}</span>
                          <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{c.nombre}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <p className={`text-base font-black leading-none ${pct >= 80 ? "text-[var(--status-good)]" : pct >= 40 ? "text-[var(--status-neutral)]" : "text-red-400"}`}
                            style={{ fontFamily: "Syne, sans-serif" }}>
                            ${recaudado.toLocaleString()}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>de ${esperado.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="w-full rounded-full h-1.5" style={{ background: "var(--border-subtle)" }}>
                        <div className={`h-1.5 rounded-full transition-all duration-700 ${pct >= 80 ? "bg-green-500" : pct >= 40 ? "bg-[var(--status-neutral)]" : "bg-red-500"}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{completos} completos · {pct}%{participan.length < jugadores.length ? ` · ${jugadores.length - participan.length} N/A` : ""}</p>
                        <div className="flex items-center gap-3">
                          <button onClick={() => generarImagenCobros(c)}
                            className="flex items-center gap-1.5 text-[10px] font-semibold text-pantera-green hover:text-green-300 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                            </svg>
                            Imagen PNG
                          </button>
                          <button onClick={() => compartirWA(c)}
                            className="link-muted-theme flex items-center gap-1.5 text-[10px] font-semibold transition-colors">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Texto WA
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  const participan = jugadores.filter((j) => pagos[j.id]?.[c.id]?.estatus !== "na");
                  const completos  = participan.filter((j) => pagos[j.id]?.[c.id]?.estatus === "completo").length;
                  const pct        = participan.length > 0 ? Math.round((completos / participan.length) * 100) : 0;
                  return (
                    <div key={c.id} className="rounded-xl px-4 py-3 border" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0 ${TIPO_COBRO_STYLE[c.tipo]}`}>{c.tipo}</span>
                          <span className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{c.nombre}</span>
                        </div>
                        <span className={`text-base font-black flex-shrink-0 ml-3 ${pct >= 80 ? "text-[var(--status-good)]" : pct >= 40 ? "text-[var(--status-neutral)]" : "text-red-400"}`}
                          style={{ fontFamily: "Syne, sans-serif" }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full rounded-full h-1.5" style={{ background: "var(--border-subtle)" }}>
                        <div className={`h-1.5 rounded-full transition-all duration-700 ${pct >= 80 ? "bg-green-500" : pct >= 40 ? "bg-[var(--status-neutral)]" : "bg-red-500"}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{completos} de {participan.length} completos</p>
                        <div className="flex items-center gap-3">
                          <button onClick={() => generarImagenCobros(c)}
                            className="flex items-center gap-1.5 text-[10px] font-semibold text-pantera-green hover:text-green-300 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                            </svg>
                            Imagen PNG
                          </button>
                          <button onClick={() => compartirWA(c)}
                            className="link-muted-theme flex items-center gap-1.5 text-[10px] font-semibold transition-colors">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            Texto WA
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}

          {/* Historial archivados */}
          {archivados.length > 0 && (
            <div className="px-4 mt-6 pb-4">
              <button onClick={() => setVerHistorial(!verHistorial)}
                className="link-muted-theme flex items-center gap-2 text-xs font-semibold transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className={`transition-transform ${verHistorial ? "rotate-180" : ""}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
                {verHistorial ? "Ocultar" : "Ver"} historial archivado ({archivados.length})
              </button>
              {verHistorial && (
                <div className="mt-3 space-y-2">
                  {archivados.map((c) => {
                    const recaudado = c.monto
                      ? jugadores.reduce((s, j) => s + (pagos[j.id]?.[c.id]?.monto_pagado ?? 0), 0)
                      : null;
                    return (
                      <div key={c.id} className="rounded-xl px-4 py-3 flex items-center justify-between gap-3 border" style={{ background: "var(--bg-surface-2)", borderColor: "var(--border-subtle)" }}>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0 ${TIPO_COBRO_STYLE[c.tipo]}`}>{c.tipo}</span>
                            <span className="text-sm truncate" style={{ color: "var(--text-secondary)" }}>{c.nombre}</span>
                          </div>
                          {c.monto && <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Meta: ${c.monto.toLocaleString()} c/u</p>}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {recaudado !== null && (
                            <p className="text-sm font-bold" style={{ color: "var(--text-secondary)" }}>${recaudado.toLocaleString()}</p>
                          )}
                          <button
                            onClick={() => { setModalConcepto(c); setConfirmElim(true); }}
                            className="text-[10px] text-red-500/60 hover:text-red-400 transition-colors font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Modal: nuevo concepto ─────────────────────── */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setModalNuevo(false)}>
          <div className="rounded-t-2xl w-full max-w-md p-6 space-y-5 border" style={{ background: "var(--bg-alt)", borderColor: "var(--border-strong)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>Nuevo concepto</h2>
              <button onClick={() => setModalNuevo(false)}
                className="link-muted-theme w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.05]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-secondary)" }}>Nombre *</label>
                <input type="text" value={newNombre} onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Copa Saltillo, Chocolates mayo..." autoFocus
                  className="input-theme text-sm" />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-secondary)" }}>Tipo</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIPOS_COBRO.map((t) => (
                    <button key={t.value} onClick={() => setNewTipo(t.value)}
                      className={`py-2.5 rounded-xl text-[11px] font-bold border transition-all active:scale-95 ${
                        newTipo === t.value
                          ? "bg-pantera-green/20 border-pantera-green/50 text-pantera-green"
                          : "bg-[var(--bg-surface-2)] border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-white/20"
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Monto por jugador <span className="normal-case tracking-normal" style={{ color: "var(--text-muted)" }}>(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-secondary)" }}>$</span>
                  <input type="number" value={newMonto} onChange={(e) => setNewMonto(e.target.value)}
                    placeholder="0.00" min="0"
                    className="input-theme text-sm pl-8" style={{ paddingLeft: "2rem" }} />
                </div>
                <p className="text-[10px] mt-1.5" style={{ color: "var(--text-muted)" }}>Con monto: registras cuánto dio cada papá y se calcula el total recaudado. Sin monto: solo marcas completo/pendiente.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setModalNuevo(false)}
                className="flex-1 py-3 rounded-xl link-muted-theme border transition-all" style={{ borderColor: "var(--border-strong)" }}>
                Cancelar
              </button>
              <button onClick={crearConcepto} disabled={!newNombre.trim() || creating}
                className="flex-1 py-3 rounded-xl bg-pantera-green text-black text-sm font-bold hover:bg-green-400 active:scale-95 transition-all disabled:opacity-50">
                {creating ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: anotar abono de jugador ───────────── */}
      {modalMonto && (() => {
        const acumulado  = pagos[modalMonto.jugador.id]?.[modalMonto.concepto.id]?.monto_pagado ?? 0;
        const nuevoTotal = modoEditar
          ? (parseFloat(inputCorreccion) || 0)
          : acumulado + (parseFloat(inputAbono) || 0);
        const monto      = modalMonto.concepto.monto ?? 0;
        const completo   = monto > 0 && nuevoTotal >= monto;
        const falta      = monto > 0 ? Math.max(0, monto - nuevoTotal) : 0;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setModalMonto(null)}>
            <div className="rounded-2xl w-full max-w-sm border p-6 space-y-4" style={{ background: "var(--bg-alt)", borderColor: "var(--border-strong)" }}
              onClick={(e) => e.stopPropagation()}>

              {/* Header */}
              <div>
                <h2 className="font-bold text-base" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
                  {modalMonto.jugador.nombre}
                </h2>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {modalMonto.concepto.nombre}
                  {monto > 0 && ` · $${monto.toLocaleString()} total`}
                </p>
              </div>

              {/* Acumulado actual */}
              {acumulado > 0 && !inputNA && (
                <div className="rounded-xl px-4 py-3 flex items-center justify-between border" style={{ background: "var(--bg-surface-2)", borderColor: "var(--border-subtle)" }}>
                  <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Acumulado</span>
                  <span className={`text-sm font-bold ${acumulado >= monto && monto > 0 ? "text-[var(--status-good)]" : "text-[var(--status-neutral)]"}`}>
                    ${acumulado.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Tabs: Abonar / Corregir total */}
              {!inputNA && (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setModoEditar(false)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      !modoEditar ? "bg-pantera-green/20 border-pantera-green/40 text-pantera-green" : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-white/20"
                    }`}>
                    + Abonar
                  </button>
                  <button onClick={() => setModoEditar(true)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      modoEditar ? "bg-white/[0.08] border-white/20 text-[var(--text-secondary)]" : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-white/20"
                    }`}>
                    Corregir total
                  </button>
                </div>
              )}

              {/* Input */}
              {!inputNA && (
                <div>
                  <label className="text-[11px] uppercase tracking-wider block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    {modoEditar ? "Total correcto" : "Nuevo abono"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--text-secondary)" }}>$</span>
                    {modoEditar ? (
                      <input type="number" value={inputCorreccion} onChange={(e) => setInputCorreccion(e.target.value)}
                        placeholder="0.00" min="0" autoFocus
                        className="input-theme text-sm pl-8" style={{ paddingLeft: "2rem" }} />
                    ) : (
                      <input type="number" value={inputAbono} onChange={(e) => setInputAbono(e.target.value)}
                        placeholder="0.00" min="0" autoFocus
                        className="input-theme text-sm pl-8" style={{ paddingLeft: "2rem" }} />
                    )}
                  </div>
                  {/* Feedback dinámico */}
                  {monto > 0 && (parseFloat(modoEditar ? inputCorreccion : inputAbono) > 0 || modoEditar) && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {modoEditar ? "Total nuevo" : "Total después del abono"}
                      </span>
                      <span className={`text-[11px] font-bold ${completo ? "text-[var(--status-good)]" : "text-[var(--status-neutral)]"}`}>
                        ${nuevoTotal.toLocaleString()}
                        {!completo && falta > 0 && <span className="font-normal" style={{ color: "var(--text-muted)" }}> (falta ${falta.toLocaleString()})</span>}
                        {completo && " ✓"}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* N/A */}
              <button
                onClick={() => { setInputNA(!inputNA); setInputAbono(""); setInputCorreccion(""); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  inputNA ? "bg-white/[0.05] border-white/20 text-[var(--text-secondary)]" : "border-[var(--border-strong)] text-[var(--text-muted)] hover:border-white/15"
                }`}>
                <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${
                  inputNA ? "bg-white/20 border-white/40" : "border-white/20"
                }`}>
                  {inputNA && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <span className="text-sm">No participa en este cobro (N/A)</span>
              </button>

              <div className="flex gap-3">
                <button onClick={() => setModalMonto(null)}
                  className="flex-1 py-3 rounded-xl link-muted-theme border transition-all" style={{ borderColor: "var(--border-strong)" }}>
                  Cancelar
                </button>
                <button onClick={guardarMonto} disabled={savingMonto}
                  className="flex-1 py-3 rounded-xl bg-pantera-green text-black text-sm font-bold hover:bg-green-400 active:scale-95 transition-all disabled:opacity-50">
                  {savingMonto ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Modal: opciones del concepto ─────────────── */}
      {modalConcepto && !confirmElim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setModalConcepto(null)}>
          <div className="rounded-2xl w-full max-w-sm border p-6 space-y-3" style={{ background: "var(--bg-alt)", borderColor: "var(--border-strong)" }}
            onClick={(e) => e.stopPropagation()}>
            <div className="pb-1">
              <h2 className="font-bold text-base" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>{modalConcepto.nombre}</h2>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>¿Qué quieres hacer con este concepto?</p>
            </div>
            <button onClick={() => archivarConcepto(modalConcepto)}
              className="w-full px-4 py-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-left hover:bg-blue-500/20 active:scale-95 transition-all">
              <p className="text-blue-400 font-bold text-sm">Archivar</p>
              <p className="text-blue-300/70 text-[11px] mt-0.5">Oculta el concepto de la tabla. El historial de pagos se conserva y se puede consultar.</p>
            </button>
            <button onClick={() => setConfirmElim(true)}
              className="w-full px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-left hover:bg-red-500/20 active:scale-95 transition-all">
              <p className="text-red-400 font-bold text-sm">Eliminar</p>
              <p className="text-red-700 text-[11px] mt-0.5">Borra el concepto y todos sus registros de pago. Úsalo solo si fue creado por error.</p>
            </button>
            <button onClick={() => setModalConcepto(null)}
              className="w-full py-3 rounded-xl link-muted-theme border transition-all" style={{ borderColor: "var(--border-strong)" }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Confirmación eliminar ─────────────────────── */}
      {modalConcepto && confirmElim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => { setModalConcepto(null); setConfirmElim(false); }}>
          <div className="rounded-2xl w-full max-w-sm p-6 space-y-4 border border-red-500/30" style={{ background: "var(--bg-alt)" }}
            onClick={(e) => e.stopPropagation()}>
            <h2 className="font-bold text-base" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>Eliminar definitivamente</h2>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              Se borrará <span className="font-semibold" style={{ color: "var(--text-primary)" }}>"{modalConcepto.nombre}"</span> y todos sus registros de pago. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmElim(false)}
                className="flex-1 py-3 rounded-xl link-muted-theme border transition-all" style={{ borderColor: "var(--border-strong)" }}>
                Cancelar
              </button>
              <button onClick={() => eliminarConcepto(modalConcepto)}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-400 active:scale-95 transition-all">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
