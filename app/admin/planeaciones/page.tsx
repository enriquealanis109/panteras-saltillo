"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Planeacion } from "@/lib/supabase";

interface CatMini { id: string; nombre: string }
interface PlaneacionRow extends Planeacion {
  categoria_nombre: string;
  entrenador_nombre: string;
}

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const fmtFecha = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]} ${y}`;
};

export default function AdminPlaneacionesPage() {
  const router = useRouter();
  const [cats, setCats] = useState<CatMini[]>([]);
  const [catId, setCatId] = useState("");
  const [planes, setPlanes] = useState<PlaneacionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: catsData } = await supabase.from("categorias").select("id, nombre").order("nombre");
      const cats = catsData ?? [];
      setCats(cats);
      if (cats.length === 0) { setLoading(false); return; }

      const { data: planesData } = await supabase
        .from("planeaciones").select("*")
        .in("categoria_id", cats.map((c) => c.id))
        .order("fecha", { ascending: false });

      const entrenadorIds = Array.from(new Set((planesData ?? []).map((p) => p.entrenador_id)));
      const { data: entData } = entrenadorIds.length > 0
        ? await supabase.from("entrenadores").select("id, nombre").in("id", entrenadorIds)
        : { data: [] as { id: string; nombre: string }[] };

      const catMap: Record<string, string> = {};
      cats.forEach((c) => { catMap[c.id] = c.nombre; });
      const entMap: Record<string, string> = {};
      (entData ?? []).forEach((e) => { entMap[e.id] = e.nombre; });

      setPlanes((planesData ?? []).map((p) => ({
        ...p,
        categoria_nombre: catMap[p.categoria_id] ?? "",
        entrenador_nombre: entMap[p.entrenador_id] ?? "—",
      })));
      setLoading(false);
    };
    load();
  }, []);

  const visibles = catId ? planes.filter((p) => p.categoria_id === catId) : planes;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Planeaciones</h1>
        <p className="text-gray-500 text-sm mt-1">Seguimiento de las planeaciones de todos tus coaches</p>
      </div>

      {cats.length > 1 && (
        <select value={catId} onChange={(e) => setCatId(e.target.value)}
          className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-pantera-green/50 mb-5"
          style={{ backgroundImage: "none" }}>
          <option value="" style={{ background: "#0a0a0a" }}>Todas las categorías</option>
          {cats.map((c) => <option key={c.id} value={c.id} style={{ background: "#0a0a0a" }}>{c.nombre}</option>)}
        </select>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visibles.length === 0 ? (
        <p className="text-gray-600 text-sm">Todavía no hay planeaciones registradas.</p>
      ) : (
        <div className="space-y-2">
          {visibles.map((p) => (
            <button key={p.id} onClick={() => router.push(`/coach/planeaciones/${p.id}`)}
              className="w-full text-left bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 hover:border-pantera-green/30 hover:bg-white/[0.05] transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-pantera-green">{fmtFecha(p.fecha)}</span>
                <span className="text-[10px] text-gray-500">{p.categoria_nombre} · {p.entrenador_nombre}</span>
              </div>
              <p className="text-white text-sm font-semibold">{p.objetivo?.trim() || "Sin objetivo definido"}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
