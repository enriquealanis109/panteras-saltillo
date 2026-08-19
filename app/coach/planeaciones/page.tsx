"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Planeacion } from "@/lib/supabase";

interface CatMini { id: string; nombre: string }
interface PlaneacionRow extends Planeacion { categoria_nombre: string }

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const fmtFecha = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]} ${y}`;
};

export default function PlaneacionesPage() {
  const router = useRouter();
  const [cats, setCats] = useState<CatMini[]>([]);
  const [catId, setCatId] = useState("");
  const [planes, setPlanes] = useState<PlaneacionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: rels } = await supabase.from("entrenador_categorias").select("categoria_id").eq("entrenador_id", user.id);
      const ids = (rels ?? []).map((r: { categoria_id: string }) => r.categoria_id);
      if (ids.length === 0) { setLoading(false); return; }
      const { data: catsData } = await supabase.from("categorias").select("id, nombre").in("id", ids).order("nombre");
      setCats(catsData ?? []);

      const { data: planesData } = await supabase
        .from("planeaciones").select("*").in("categoria_id", ids).order("fecha", { ascending: false });

      const catMap: Record<string, string> = {};
      (catsData ?? []).forEach((c) => { catMap[c.id] = c.nombre; });
      setPlanes((planesData ?? []).map((p) => ({ ...p, categoria_nombre: catMap[p.categoria_id] ?? "" })));
      setLoading(false);
    };
    load();
  }, []);

  const visibles = catId ? planes.filter((p) => p.categoria_id === catId) : planes;

  return (
    <div className="min-h-screen pb-10" style={{ background: "var(--bg-page)" }}>
      <header className="border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="link-muted-theme w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-90">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 className="font-bold" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>Planeaciones</h1>
        </div>
        <button onClick={() => router.push("/coach/planeaciones/nueva")}
          className="bg-pantera-green text-white text-sm font-semibold px-4 py-2 rounded-xl active:scale-95 transition-all">
          + Nueva
        </button>
      </header>

      <div className="w-full max-w-lg mx-auto px-4 pt-5 space-y-4">
        {cats.length > 1 && (
          <select value={catId} onChange={(e) => setCatId(e.target.value)}
            className="input-theme text-sm" style={{ backgroundImage: "none" }}>
            <option value="" style={{ background: "var(--bg-alt)" }}>Todas mis categorías</option>
            {cats.map((c) => <option key={c.id} value={c.id} style={{ background: "var(--bg-alt)" }}>{c.nombre}</option>)}
          </select>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cats.length === 0 ? (
          <p className="text-sm text-center py-16" style={{ color: "var(--text-muted)" }}>
            No tienes categorías asignadas todavía.
          </p>
        ) : visibles.length === 0 ? (
          <div className="rounded-2xl text-center py-16 px-5 border" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Sin planeaciones aún</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Crea la primera con el botón de arriba.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibles.map((p) => (
              <button key={p.id} onClick={() => router.push(`/coach/planeaciones/${p.id}`)}
                className="w-full text-left rounded-2xl border p-4 transition-all active:scale-[0.99] hover:border-pantera-green/30"
                style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-pantera-green">{fmtFecha(p.fecha)}</span>
                  {cats.length > 1 && <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{p.categoria_nombre}</span>}
                </div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {p.objetivo?.trim() || "Sin objetivo definido"}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
