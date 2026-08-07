"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Jugador { id: string; nombre: string; alias?: string; categoria_id: string; activo: boolean }
interface Categoria { id: string; nombre: string }

export default function AdminJugadoresPage() {
  const [jugadores, setJugadores]   = useState<Jugador[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [filtro, setFiltro]         = useState("");
  const [catFiltro, setCatFiltro]   = useState("todas");
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const init = async () => {
      const [{ data: jugs }, { data: cats }] = await Promise.all([
        supabase.from("jugadores").select("*").eq("activo", true).order("nombre"),
        supabase.from("categorias").select("*").order("nombre"),
      ]);
      setJugadores(jugs ?? []);
      setCategorias(cats ?? []);
      setLoading(false);
    };
    init();
  }, []);

  const catMap = Object.fromEntries(categorias.map((c) => [c.id, c.nombre]));

  const filtrados = jugadores.filter((j) => {
    const matchNombre = j.nombre.toLowerCase().includes(filtro.toLowerCase());
    const matchCat    = catFiltro === "todas" || j.categoria_id === catFiltro;
    return matchNombre && matchCat;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Jugadores</h1>
        <p className="text-gray-500 text-sm mt-1">{jugadores.length} jugadores activos en la academia</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input id="tour-jugadores-busqueda" value={filtro} onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar jugador..." className="flex-1 min-w-48 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-pantera-green/50" />
        <select id="tour-jugadores-categoria" value={catFiltro} onChange={(e) => setCatFiltro(e.target.value)}
          className="bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-pantera-green/50">
          <option value="todas">Todas las categorías</option>
          {categorias.map((c) => <option key={c.id} value={c.id} style={{ background: "#0a0a0a" }}>{c.nombre}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div id="tour-jugadores-tabla" className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 px-5 py-2.5 text-gray-600 text-[10px] uppercase tracking-wider border-b border-white/[0.04]">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Nombre</div>
            <div className="col-span-4">Categoría</div>
            <div className="col-span-2">Alias</div>
          </div>
          {filtrados.length === 0 ? (
            <div className="text-center py-12 text-gray-600 text-sm">Sin resultados</div>
          ) : (
            filtrados.map((j, i) => (
              <div key={j.id} className="grid grid-cols-12 px-5 py-3 border-b border-white/[0.03] last:border-0 hover:bg-white/[0.02] items-center">
                <div className="col-span-1 text-gray-700 text-sm">{i + 1}</div>
                <div className="col-span-5 text-white text-sm font-medium truncate">{j.nombre}</div>
                <div className="col-span-4">
                  <span className="text-[10px] bg-white/[0.06] border border-white/10 text-gray-400 px-2 py-0.5 rounded-full">{catMap[j.categoria_id] ?? "—"}</span>
                </div>
                <div className="col-span-2 text-pantera-green text-xs">{j.alias ? `"${j.alias}"` : ""}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
