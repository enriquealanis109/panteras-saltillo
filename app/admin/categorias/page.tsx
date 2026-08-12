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

  const [catEditando, setCatEditando] = useState<Categoria | null>(null);
  const [nombreEditar, setNombreEditar] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [errorEdit, setErrorEdit] = useState("");

  const [catBorrando, setCatBorrando] = useState<Categoria | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [errorBorrar, setErrorBorrar] = useState("");

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

  const abrirEditar = (cat: Categoria, e: React.MouseEvent) => {
    e.stopPropagation();
    setCatEditando(cat); setNombreEditar(cat.nombre); setErrorEdit("");
  };

  const guardarEditar = async () => {
    if (!catEditando) return;
    if (!nombreEditar.trim()) { setErrorEdit("El nombre es obligatorio."); return; }
    setSavingEdit(true); setErrorEdit("");
    const res = await fetch(`/api/admin/categorias/${catEditando.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ nombre: nombreEditar.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { setErrorEdit(data.error ?? "Error al editar la categoría."); setSavingEdit(false); return; }
    setCatEditando(null);
    await cargar();
    setSavingEdit(false);
    showToast("Categoría actualizada");
  };

  const pedirBorrar = (cat: Categoria, e: React.MouseEvent) => {
    e.stopPropagation();
    setCatBorrando(cat); setErrorBorrar("");
  };

  const confirmarBorrar = async () => {
    if (!catBorrando) return;
    setBorrando(true); setErrorBorrar("");
    const res = await fetch(`/api/admin/categorias/${catBorrando.id}`, {
      method: "DELETE",
      headers: { ...(await authHeaders()) },
    });
    if (!res.ok) {
      const data = await res.json();
      setErrorBorrar(data.error ?? "Error al eliminar la categoría.");
      setBorrando(false);
      return;
    }
    setCatBorrando(null);
    await cargar();
    setBorrando(false);
    showToast("Categoría eliminada");
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

      {catEditando && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => !savingEdit && setCatEditando(null)}>
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg" style={{ fontFamily: "Syne, sans-serif" }}>Editar categoría</h2>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Nombre</label>
              <input value={nombreEditar} onChange={(e) => setNombreEditar(e.target.value)}
                placeholder="Ej: CAT 2015" autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") guardarEditar(); }}
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-pantera-green/50 transition-colors text-sm" />
            </div>
            {errorEdit && <p className="text-red-400 text-sm">{errorEdit}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={guardarEditar} disabled={savingEdit}
                className="flex-1 bg-pantera-green text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-50 transition-opacity">
                {savingEdit ? "Guardando..." : "Guardar cambios"}
              </button>
              <button onClick={() => setCatEditando(null)} disabled={savingEdit}
                className="px-4 py-3 text-sm text-gray-500 hover:text-white border border-white/10 rounded-xl transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {catBorrando && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => !borrando && setCatBorrando(null)}>
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg" style={{ fontFamily: "Syne, sans-serif" }}>Eliminar categoría</h2>
            <p className="text-gray-400 text-sm">
              ¿Seguro que quieres eliminar <span className="text-white font-semibold">{catBorrando.nombre}</span>? Esta acción no se puede deshacer.
            </p>
            {errorBorrar && <p className="text-red-400 text-sm">{errorBorrar}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={confirmarBorrar} disabled={borrando}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors">
                {borrando ? "Eliminando..." : "Eliminar"}
              </button>
              <button onClick={() => setCatBorrando(null)} disabled={borrando}
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
              <div key={cat.id} onClick={() => router.push(`/admin/categorias/${cat.id}`)} role="button" tabIndex={0}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 text-left hover:border-pantera-green/30 hover:bg-white/[0.05] transition-all group cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-pantera-green/10 border border-pantera-green/20 flex items-center justify-center">
                    <span className="text-pantera-green font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>
                      {cat.nombre.replace("CAT ", "")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => abrirEditar(cat, e)} title="Editar"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-white hover:bg-white/[0.08] transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button onClick={(e) => pedirBorrar(cat, e)} title="Eliminar"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-pantera-green transition-colors ml-1">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </div>
                </div>
                <h3 className="text-white font-bold text-base mb-1" style={{ fontFamily: "Syne, sans-serif" }}>{cat.nombre}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-gray-600 text-xs">{s?.jugadores ?? 0} jugadores</span>
                  {s?.docs > 0 && (
                    <span className="text-gray-400 text-xs">{s.docs} docs pendientes</span>
                  )}
                </div>
                <p className="text-gray-700 text-[10px] mt-2 uppercase tracking-wider">Palmarés · Plantel · Galería · Staff</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
