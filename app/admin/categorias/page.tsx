"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, authHeaders, type Categoria } from "@/lib/supabase";

export default function AdminCategoriasPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [stats, setStats] = useState<Record<string, { jugadores: number; docs: number }>>({});
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nombreNueva, setNombreNueva] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const cargar = async () => {
    const { data: cats } = await supabase.from("categorias").select("*").order("nombre");
    const lista = cats ?? [];
    setCategorias(lista);

    const { data: jugs } = await supabase.from("jugadores").select("id, categoria_id").eq("activo", true);
    const { data: docs } = await supabase.from("documentos").select("jugador_id");
    const docsMap: Record<string, number> = {};
    (docs ?? []).forEach((d) => { docsMap[d.jugador_id] = (docsMap[d.jugador_id] ?? 0) + 1; });

    const s: Record<string, { jugadores: number; docs: number }> = {};
    lista.forEach((cat) => {
      const jugscat = (jugs ?? []).filter((j) => j.categoria_id === cat.id);
      const docsPend = jugscat.filter((j) => (docsMap[j.id] ?? 0) < 4).length;
      s[cat.id] = { jugadores: jugscat.length, docs: docsPend };
    });
    setStats(s);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setNombreNueva(""); setError(""); setModalAbierto(true);
  };

  const guardarCrear = async () => {
    if (!nombreNueva.trim()) { setError("El nombre es obligatorio."); return; }
    setSaving(true); setError("");
    const res = await fetch("/api/admin/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ nombre: nombreNueva.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error al crear la categoría."); setSaving(false); return; }
    setModalAbierto(false);
    await cargar();
    setSaving(false);
    showToast("Categoría creada");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-xl">
          {toast}
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => !saving && setModalAbierto(false)}>
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg" style={{ fontFamily: "Syne, sans-serif" }}>Nueva categoría</h2>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Nombre</label>
              <input value={nombreNueva} onChange={(e) => setNombreNueva(e.target.value)}
                placeholder="Ej: CAT 2015"
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-pantera-green/50 transition-colors text-sm" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={guardarCrear} disabled={saving}
                className="flex-1 bg-pantera-green text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-50 transition-opacity">
                {saving ? "Guardando..." : "Crear categoría"}
              </button>
              <button onClick={() => setModalAbierto(false)} disabled={saving}
                className="px-4 py-3 text-sm text-gray-500 hover:text-white border border-white/10 rounded-xl transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Categorías</h1>
          <p className="text-gray-500 text-sm mt-1">Gestiona el contenido público de cada categoría</p>
        </div>
        <button onClick={abrirCrear}
          className="bg-pantera-green text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-pantera-green/90 transition-all active:scale-95">
          + Nueva categoría
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categorias.length === 0 ? (
        <p className="text-gray-600 text-sm">Aún no hay categorías. Crea la primera con el botón de arriba.</p>
      ) : (
        <div id="tour-cats-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorias.map((cat) => {
            const s = stats[cat.id];
            return (
              <button key={cat.id} onClick={() => router.push(`/admin/categorias/${cat.id}`)}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-left hover:border-pantera-green/30 hover:bg-white/[0.05] transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-pantera-green/10 border border-pantera-green/20 flex items-center justify-center">
                    <span className="text-pantera-green font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
                      {cat.nombre.replace("CAT ", "")}
                    </span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-pantera-green transition-colors">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
                <h3 className="text-white font-bold text-base mb-1" style={{ fontFamily: "Syne, sans-serif" }}>{cat.nombre}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-gray-600 text-xs">{s?.jugadores ?? 0} jugadores</span>
                  {s?.docs > 0 && (
                    <span className="text-gray-400 text-xs">{s.docs} docs pendientes</span>
                  )}
                </div>
                <p className="text-gray-700 text-[10px] mt-2 uppercase tracking-wider">Palmarés · Plantel · Galería · Staff</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
