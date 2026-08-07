"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Jugador } from "@/lib/supabase";
import { PanelTour } from "@/components/admin/PanelTour";
import { EVALUAR_STEPS } from "@/lib/coach-tours";

export default function EvaluarListaPage({ params }: { params: { id: string } }) {
  const categoriaId = params.id;
  const router = useRouter();

  const [categoria, setCategoria] = useState("");
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: cat } = await supabase.from("categorias").select("nombre").eq("id", categoriaId).single();
      setCategoria(cat?.nombre ?? "");
      const { data: jug } = await supabase
        .from("jugadores").select("*")
        .eq("categoria_id", categoriaId).eq("activo", true).order("nombre");
      setJugadores(jug ?? []);
      setLoading(false);
    };
    init();
  }, [categoriaId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden w-full pb-10" style={{ background: "var(--bg-page)" }}>
      <header className="border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="link-muted-theme w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-90 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div>
            <h1 className="font-bold" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
              Evaluar — {categoria}
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{jugadores.length} jugadores</p>
          </div>
        </div>
        <PanelTour steps={EVALUAR_STEPS} storageKey="tour_coach_evaluar" />
      </header>

      <div id="tour-evaluar-lista" className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
        {jugadores.map((j) => (
          <button key={j.id}
            onClick={() => router.push(`/coach/evaluar/${categoriaId}/${j.id}`)}
            className="w-full flex items-center justify-between px-4 py-4 transition-colors text-left">
            <div>
              <p className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{j.nombre}</p>
              {j.alias && <p className="text-pantera-green text-xs">"{j.alias}"</p>}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--text-muted)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        ))}
      </div>
    </div>
  );
}
