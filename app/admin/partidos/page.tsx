"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface PartidoItem {
  id: string;
  liga: string;
  rival: string | null;
  lugar: string | null;
  fecha: string | null;
  resultado: string | null;
  categoria_id: string;
  cat_nombre: string;
  total: number;
  presentes: number;
}

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const fmtFecha = (f: string | null) => {
  if (!f) return "—";
  const [, m, d] = f.split("-");
  return `${parseInt(d)} ${MESES[parseInt(m) - 1]}`;
};

export default function AdminPartidosPage() {
  const router = useRouter();
  const [partidos, setPartidos] = useState<PartidoItem[]>([]);
  const [cats, setCats]   = useState<{ id: string; nombre: string }[]>([]);
  const [filtro, setFiltro] = useState("todas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: catsData } = await supabase.from("categorias").select("id, nombre").order("nombre");
      setCats(catsData ?? []);
      const catMap: Record<string, string> = {};
      (catsData ?? []).forEach((c: { id: string; nombre: string }) => { catMap[c.id] = c.nombre; });

      const { data: parts } = await supabase.from("partidos").select("*")
        .order("fecha", { ascending: false })
        .order("created_at", { ascending: false });

      if (!parts || parts.length === 0) { setLoading(false); return; }

      const partIds = parts.map((p: { id: string }) => p.id);
      const { data: asist } = await supabase
        .from("asistencia_partidos").select("partido_id, asistio").in("partido_id", partIds);

      const countMap: Record<string, { total: number; presentes: number }> = {};
      (asist ?? []).forEach((a: { partido_id: string; asistio: boolean | null }) => {
        if (!countMap[a.partido_id]) countMap[a.partido_id] = { total: 0, presentes: 0 };
        countMap[a.partido_id].total++;
        if (a.asistio === true) countMap[a.partido_id].presentes++;
      });

      setPartidos(parts.map((p: PartidoItem) => ({
        ...p,
        cat_nombre: catMap[p.categoria_id] ?? "—",
        total:     countMap[p.id]?.total    ?? 0,
        presentes: countMap[p.id]?.presentes ?? 0,
      })));
      setLoading(false);
    };
    load();
  }, []);

  const filtered    = filtro === "todas" ? partidos : partidos.filter((p) => p.categoria_id === filtro);
  const conResultado = filtered.filter((p) => p.resultado).length;
  const totalAsist   = filtered.reduce((s, p) => s + p.total, 0);
  const totalPres    = filtered.reduce((s, p) => s + p.presentes, 0);
  const pctGlobal    = totalAsist > 0 ? Math.round((totalPres / totalAsist) * 100) : null;

  return (
    <div className="p-6 max-w-4xl mx-auto">

      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Partidos</h1>
        <p className="text-gray-500 text-sm mt-1">
          {filtered.length} partidos · {conResultado} con resultado
          {pctGlobal !== null ? ` · ${pctGlobal}% asistencia promedio` : ""}
        </p>
      </div>

      {/* Filtro */}
      <div id="tour-partidos-filtro" className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setFiltro("todas")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
            filtro === "todas"
              ? "bg-pantera-green border-pantera-green text-white"
              : "border-white/10 text-gray-500 hover:text-gray-300"
          }`}>
          Todas
        </button>
        {cats.map((c) => (
          <button key={c.id} onClick={() => setFiltro(c.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              filtro === c.id
                ? "bg-pantera-green border-pantera-green text-white"
                : "border-white/10 text-gray-500 hover:text-gray-300"
            }`}>
            {c.nombre}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-sm">No hay partidos registrados.</p>
          <p className="text-gray-700 text-xs mt-1">Se crean al generar avisos de partido desde el portal de entrenadores.</p>
        </div>
      ) : (
        <div id="tour-partidos-lista" className="space-y-3">
          {filtered.map((p) => {
            const pct = p.total > 0 ? Math.round((p.presentes / p.total) * 100) : null;
            const sinLista = p.total > 0 && p.presentes === 0 && !p.resultado;
            return (
              <div key={p.id}
                onClick={() => router.push(`/coach/partidos/${p.id}`)}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 hover:border-white/15 cursor-pointer transition-all">

                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-white font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
                        {p.liga}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-gray-600 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.06]">
                        {p.cat_nombre}
                      </span>
                    </div>
                    {p.rival && <p className="text-gray-500 text-xs">vs {p.rival}</p>}
                    <p className="text-gray-700 text-[10px] mt-0.5">
                      {fmtFecha(p.fecha)}{p.lugar ? ` · ${p.lugar}` : ""}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0 space-y-1">
                    {p.resultado ? (
                      <p className="text-pantera-green font-black text-lg leading-none" style={{ fontFamily: "Syne, sans-serif" }}>
                        {p.resultado}
                      </p>
                    ) : (
                      <span className="text-[10px] text-gray-600">Sin resultado</span>
                    )}
                    {pct !== null && (
                      <p className={`text-xs font-bold ${
                        sinLista ? "text-gray-600"
                        : pct >= 80 ? "text-green-400"
                        : pct >= 60 ? "text-gray-400"
                        : "text-orange-400"
                      }`}>
                        {sinLista ? "Sin lista" : `${pct}% (${p.presentes}/${p.total})`}
                      </p>
                    )}
                  </div>
                </div>

                {p.total > 0 && (
                  <div className="w-full bg-white/[0.05] rounded-full h-1">
                    <div className={`h-1 rounded-full transition-all ${
                      sinLista ? "bg-white/10"
                      : pct !== null && pct >= 80 ? "bg-green-500"
                      : pct !== null && pct >= 60 ? "bg-gray-400"
                      : "bg-orange-500"
                    }`} style={{ width: `${sinLista ? 0 : (pct ?? 0)}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
