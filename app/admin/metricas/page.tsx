"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const LABELS: Record<string, string> = {
  clic_inscribir:      "Clicks en Inscribir",
  clic_ver_categorias: "Clicks en Ver categorías",
  chatbot_abierto:     "Chatbot abierto (histórico)",
  whatsapp_clic:       "WhatsApp abierto",
  cita_agendada:       "Citas agendadas",
};

interface Cita { id: string; nino: string; dia: string; categoria: string; fecha: string; estado: string }

export default function AdminMetricasPage() {
  const [periodo, setPeriodo]   = useState<"7" | "30" | "90">("30");
  const [totales, setTotales]   = useState<{ tipo: string; total: number }[]>([]);
  const [citas, setCitas]       = useState<Cita[]>([]);
  const [loading, setLoading]   = useState(true);

  const cargar = async (dias: string) => {
    setLoading(true);
    const desde = new Date();
    desde.setDate(desde.getDate() - parseInt(dias));

    const { data: evs } = await supabase.from("eventos").select("tipo").gte("created_at", desde.toISOString());
    const map: Record<string, number> = {};
    (evs ?? []).forEach((e: { tipo: string }) => { map[e.tipo] = (map[e.tipo] ?? 0) + 1; });
    setTotales(Object.entries(map).map(([tipo, total]) => ({ tipo, total })));

    const { data: citasData } = await supabase.from("eventos").select("id, metadata, created_at, estado")
      .eq("tipo", "cita_agendada").gte("created_at", desde.toISOString()).order("created_at", { ascending: false });

    setCitas((citasData ?? []).map((c: { id: string; metadata: Record<string, string>; created_at: string; estado: string }) => ({
      id: c.id, nino: c.metadata?.nino ?? "—", dia: c.metadata?.dia ?? "—",
      categoria: c.metadata?.categoria ?? "—",
      fecha: new Date(c.created_at).toLocaleDateString("es-MX"),
      estado: c.estado ?? "pendiente",
    })));
    setLoading(false);
  };

  useEffect(() => { cargar(periodo); }, []); // eslint-disable-line

  const toggleEstado = async (id: string, estadoActual: string) => {
    const nuevo = estadoActual === "pendiente" ? "realizada" : "pendiente";
    await supabase.from("eventos").update({ estado: nuevo }).eq("id", id);
    setCitas((prev) => prev.map((c) => c.id === id ? { ...c, estado: nuevo } : c));
  };

  const eliminarCita = async (id: string) => {
    await supabase.from("eventos").delete().eq("id", id);
    setCitas((prev) => prev.filter((c) => c.id !== id));
  };

  const max = Math.max(...totales.map((t) => t.total), 1);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Métricas</h1>
          <p className="text-gray-500 text-sm mt-1">Actividad e indicadores de conversión</p>
        </div>
        <div id="tour-metricas-periodo" className="flex gap-1">
          {(["7", "30", "90"] as const).map((p) => (
            <button key={p} onClick={() => { setPeriodo(p); cargar(p); }}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                periodo === p ? "bg-pantera-green text-white font-bold" : "text-gray-500 hover:text-white border border-white/10"
              }`}>{p}d</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div id="tour-metricas-actividad" className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
            <p className="text-white font-bold mb-4 text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Actividad últimos {periodo} días</p>
            {totales.length === 0 ? <p className="text-gray-600 text-sm">Sin datos en este período.</p> : (
              <div className="space-y-4">
                {Object.keys(LABELS).map((tipo) => {
                  const count = totales.find((t) => t.tipo === tipo)?.total ?? 0;
                  return (
                    <div key={tipo}>
                      <div className="flex justify-between mb-1.5">
                        <span className="text-gray-400 text-sm">{LABELS[tipo]}</span>
                        <span className="text-white font-bold text-sm">{count}</span>
                      </div>
                      <div className="w-full bg-white/[0.05] rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-pantera-green" style={{ width: `${(count / max) * 100}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {citas.length > 0 && (
            <div id="tour-metricas-citas" className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <p className="text-white font-bold mb-4 text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Citas agendadas</p>
              <div className="space-y-2">
                {citas.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0 gap-2">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium">{c.nino}</p>
                      <p className="text-gray-600 text-xs">{c.categoria} · {c.dia} · {c.fecha}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => toggleEstado(c.id, c.estado)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                          c.estado === "realizada"
                            ? "bg-green-500/20 border-green-500/30 text-green-400"
                            : "bg-gray-500/10 border-gray-500/20 text-gray-400"
                        }`}>
                        {c.estado === "realizada" ? "Realizada" : "Pendiente"}
                      </button>
                      <button onClick={() => eliminarCita(c.id)} className="text-gray-600 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-500/10 active:scale-90">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
