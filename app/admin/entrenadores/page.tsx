"use client";
import { useEffect, useState } from "react";
import { supabase, authHeaders } from "@/lib/supabase";
import type { Rol } from "@/lib/supabase";

interface Entrenador { id: string; nombre: string; rol: Rol }
interface Categoria   { id: string; nombre: string }

type FiltroRol = "todos" | Rol;
type Modal =
  | { type: "cerrado" }
  | { type: "crear" }
  | { type: "editar"; e: Entrenador }
  | { type: "eliminar"; e: Entrenador };

const ROL_COLORS: Record<Rol, string> = {
  admin:       "bg-white/10 border-white/30 text-white",
  entrenador:  "bg-pantera-green/10 border-pantera-green/30 text-pantera-green",
  coordinador: "bg-blue-400/10 border-blue-400/30 text-blue-400",
  ambos:       "bg-purple-400/10 border-purple-400/30 text-purple-400",
};

const ROL_LABELS: Record<Rol, string> = {
  admin: "Admin", entrenador: "Entrenador", coordinador: "Coordinador", ambos: "Ambos",
};

const ROL_DESC: Record<Rol, string> = {
  admin:       "Acceso completo al panel admin",
  entrenador:  "Pasa lista y envía reportes",
  coordinador: "Gestiona documentos de jugadores",
  ambos:       "Entrenador + gestión de documentos",
};

const inputCls = "w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-pantera-green/50 transition-colors text-sm";

export default function AdminEntrenadoresPage() {
  const [entrenadores, setEntrenadores] = useState<Entrenador[]>([]);
  const [catMap, setCatMap]             = useState<Record<string, string[]>>({});
  const [catMapIds, setCatMapIds]       = useState<Record<string, string[]>>({});
  const [categorias, setCategorias]     = useState<Categoria[]>([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState("");
  const [filtroRol, setFiltroRol]       = useState<FiltroRol>("todos");
  const [filtrocat, setFiltrocat]       = useState<string>("todas");
  const [modal, setModal]               = useState<Modal>({ type: "cerrado" });

  const [fNombre, setFNombre]     = useState("");
  const [fUsuario, setFUsuario]   = useState("");
  const [fPassword, setFPassword] = useState("");
  const [fRol, setFRol]           = useState<Rol>("entrenador");
  const [fCats, setFCats]         = useState<string[]>([]);
  const [fError, setFError]       = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const cargar = async () => {
    const [{ data: ents }, { data: rels }, { data: cats }] = await Promise.all([
      supabase.from("entrenadores").select("*").order("nombre"),
      supabase.from("entrenador_categorias").select("entrenador_id, categoria_id"),
      supabase.from("categorias").select("id, nombre").order("nombre"),
    ]);

    const catNombres: Record<string, string> = {};
    (cats ?? []).forEach((c: Categoria) => { catNombres[c.id] = c.nombre; });

    const map: Record<string, string[]>    = {};
    const mapIds: Record<string, string[]> = {};
    (rels ?? []).forEach((r: { entrenador_id: string; categoria_id: string }) => {
      if (!map[r.entrenador_id]) { map[r.entrenador_id] = []; mapIds[r.entrenador_id] = []; }
      map[r.entrenador_id].push(catNombres[r.categoria_id] ?? r.categoria_id);
      mapIds[r.entrenador_id].push(r.categoria_id);
    });

    setEntrenadores(ents ?? []);
    setCatMap(map);
    setCatMapIds(mapIds);
    setCategorias(cats ?? []);
    setLoading(false);
  };

  useEffect(() => { cargar(); }, []);

  const abrirCrear = () => {
    setFNombre(""); setFUsuario(""); setFPassword(""); setFRol("entrenador"); setFCats([]); setFError("");
    setModal({ type: "crear" });
  };

  const abrirEditar = (e: Entrenador) => {
    setFNombre(e.nombre); setFRol(e.rol); setFCats(catMapIds[e.id] ?? []); setFError("");
    setModal({ type: "editar", e });
  };

  const toggleCat = (id: string) =>
    setFCats((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const guardarCrear = async () => {
    if (!fNombre.trim() || !fUsuario.trim() || !fPassword.trim()) {
      setFError("Completa todos los campos obligatorios."); return;
    }
    setSaving(true); setFError("");
    const res = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ nombre: fNombre.trim(), usuario: fUsuario.trim(), password: fPassword, rol: fRol, categorias: fCats }),
    });
    const data = await res.json();
    if (!res.ok) { setFError(data.error ?? "Error al crear usuario."); setSaving(false); return; }
    setModal({ type: "cerrado" });
    await cargar();
    setSaving(false);
    showToast("Miembro creado");
  };

  const guardarEditar = async () => {
    if (modal.type !== "editar") return;
    if (!fNombre.trim()) { setFError("El nombre es obligatorio."); return; }
    setSaving(true); setFError("");
    const id = modal.e.id;
    await supabase.from("entrenadores").update({ nombre: fNombre.trim(), rol: fRol }).eq("id", id);
    await supabase.from("entrenador_categorias").delete().eq("entrenador_id", id);
    if (fCats.length > 0) {
      await supabase.from("entrenador_categorias").insert(
        fCats.map((cat_id) => ({ entrenador_id: id, categoria_id: cat_id }))
      );
    }
    setModal({ type: "cerrado" });
    await cargar();
    setSaving(false);
    showToast("Miembro actualizado");
  };

  const confirmarEliminar = async () => {
    if (modal.type !== "eliminar") return;
    setSaving(true);
    setFError("");
    try {
      const res = await fetch(`/api/admin/usuarios/${modal.e.id}`, { method: "DELETE", headers: await authHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFError(data.error ?? `Error ${res.status} al eliminar.`);
        setSaving(false);
        return;
      }
      setModal({ type: "cerrado" });
      await cargar();
      showToast("Miembro eliminado");
    } catch {
      setFError("Error de red. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const filtrados = entrenadores.filter((e) => {
    const rolOk = filtroRol === "todos" || e.rol === filtroRol;
    const catOk = filtrocat === "todas" || (catMapIds[e.id] ?? []).includes(filtrocat);
    return rolOk && catOk;
  });

  const grupos: Record<string, Entrenador[]> = {};
  filtrados.forEach((e) => {
    const label = ROL_LABELS[e.rol];
    if (!grupos[label]) grupos[label] = [];
    grupos[label].push(e);
  });
  const ordenGrupos = ["Admin", "Coordinador", "Ambos", "Entrenador"];

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-5 py-3 rounded-xl text-sm font-semibold shadow-xl">
          {toast}
        </div>
      )}

      {/* Modal */}
      {modal.type !== "cerrado" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4 overflow-y-auto py-8"
          style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => !saving && setModal({ type: "cerrado" })}>
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl w-full max-w-md p-6 space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}>

            {(modal.type === "crear" || modal.type === "editar") && (
              <>
                <h2 className="text-white font-bold text-lg" style={{ fontFamily: "Syne, sans-serif" }}>
                  {modal.type === "crear" ? "Nuevo miembro" : "Editar miembro"}
                </h2>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Nombre completo</label>
                    <input value={fNombre} onChange={(e) => setFNombre(e.target.value)}
                      placeholder="Ej: Carlos García" className={inputCls} />
                  </div>

                  {modal.type === "crear" && (
                    <>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Usuario</label>
                        <div className="flex items-center bg-white/[0.06] border border-white/10 rounded-xl overflow-hidden focus-within:border-pantera-green/50 transition-colors">
                          <input value={fUsuario}
                            onChange={(e) => setFUsuario(e.target.value.toLowerCase().replace(/\s/g, ""))}
                            placeholder="carlos.garcia"
                            className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-600 focus:outline-none text-sm" />
                          <span className="text-gray-600 text-xs pr-4 flex-shrink-0">@panteras.coach</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Contraseña</label>
                        <input type="password" value={fPassword} onChange={(e) => setFPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres" className={inputCls} />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Rol</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(["entrenador", "coordinador", "ambos", "admin"] as Rol[]).map((r) => (
                        <button key={r} type="button" onClick={() => setFRol(r)}
                          className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                            fRol === r
                              ? `${ROL_COLORS[r]} border-opacity-100`
                              : "border-white/10 hover:border-white/20"
                          }`}>
                          <p className={`text-xs font-bold ${fRol === r ? "" : "text-gray-400"}`}>{ROL_LABELS[r]}</p>
                          <p className="text-[10px] text-gray-600 mt-0.5 leading-tight">{ROL_DESC[r]}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2">Categorías asignadas</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {categorias.map((c) => (
                        <button key={c.id} type="button" onClick={() => toggleCat(c.id)}
                          className={`text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                            fCats.includes(c.id)
                              ? "bg-pantera-green/10 border-pantera-green/30 text-pantera-green"
                              : "border-white/10 text-gray-500 hover:border-white/20"
                          }`}>
                          {c.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {fError && <p className="text-red-400 text-sm">{fError}</p>}

                <div className="flex gap-2 pt-1">
                  <button onClick={modal.type === "crear" ? guardarCrear : guardarEditar} disabled={saving}
                    className="flex-1 bg-pantera-green text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-50 transition-opacity">
                    {saving ? "Guardando..." : modal.type === "crear" ? "Crear miembro" : "Guardar cambios"}
                  </button>
                  <button onClick={() => setModal({ type: "cerrado" })} disabled={saving}
                    className="px-4 py-3 text-sm text-gray-500 hover:text-white border border-white/10 rounded-xl transition-colors">
                    Cancelar
                  </button>
                </div>
              </>
            )}

            {modal.type === "eliminar" && (
              <>
                <h2 className="text-white font-bold text-lg" style={{ fontFamily: "Syne, sans-serif" }}>Eliminar miembro</h2>
                <p className="text-gray-400 text-sm">
                  ¿Eliminar a <span className="text-white font-semibold">{modal.e.nombre}</span>?
                  Esta acción eliminará su cuenta y no se puede deshacer.
                </p>
                {fError && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{fError}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={confirmarEliminar} disabled={saving}
                    className="flex-1 bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-50 transition-colors">
                    {saving ? "Eliminando..." : "Sí, eliminar"}
                  </button>
                  <button onClick={() => { setModal({ type: "cerrado" }); setFError(""); }}
                    className="px-4 py-3 text-sm text-gray-500 hover:text-white border border-white/10 rounded-xl transition-colors">
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Cuerpo Técnico</h1>
          <p className="text-gray-500 text-sm mt-1">{entrenadores.length} miembros registrados</p>
        </div>
        <button id="tour-btn-nuevo-miembro" onClick={abrirCrear}
          className="bg-pantera-green text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-pantera-green/90 transition-all active:scale-95">
          + Nuevo miembro
        </button>
      </div>

      {/* Filtros */}
      <div id="tour-filtros-rol" className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-1 flex-wrap">
          {([
            { val: "todos",       label: "Todos" },
            { val: "coordinador", label: "Coordinadores" },
            { val: "entrenador",  label: "Entrenadores" },
            { val: "ambos",       label: "Ambos" },
            { val: "admin",       label: "Admin" },
          ] as { val: FiltroRol; label: string }[]).map((f) => (
            <button key={f.val} onClick={() => setFiltroRol(f.val)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                filtroRol === f.val
                  ? "bg-pantera-green text-white font-bold"
                  : "text-gray-500 hover:text-white border border-white/10"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <select value={filtrocat} onChange={(e) => setFiltrocat(e.target.value)}
          className="bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-1.5 text-gray-400 text-xs focus:outline-none focus:border-pantera-green/50 hover:border-white/20 transition-colors">
          <option value="todas" style={{ background: "#0a0a0a" }}>Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id} style={{ background: "#0a0a0a" }}>{c.nombre}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtrados.length === 0 ? (
        <p className="text-gray-600 text-sm">Sin resultados para este filtro.</p>
      ) : (
        <div id="tour-lista-miembros" className="space-y-6">
          {ordenGrupos.filter((g) => grupos[g]?.length > 0).map((grupo) => (
            <div key={grupo}>
              <p className="text-gray-600 text-[10px] uppercase tracking-widest mb-2">{grupo}s</p>
              <div className="space-y-2">
                {grupos[grupo].map((e) => (
                  <div key={e.id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-white font-semibold text-sm">{e.nombre}</p>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ROL_COLORS[e.rol]}`}>
                            {ROL_LABELS[e.rol]}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(catMap[e.id] ?? []).map((cat) => (
                            <span key={cat} className="text-[10px] text-gray-600 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full">{cat}</span>
                          ))}
                          {(catMap[e.id] ?? []).length === 0 && (
                            <span className="text-[10px] text-gray-700">Sin categorías asignadas</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => abrirEditar(e)}
                          className="text-xs text-gray-500 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-all active:scale-95">
                          Editar
                        </button>
                        <button onClick={() => setModal({ type: "eliminar", e })}
                          className="text-xs text-gray-500 hover:text-red-400 border border-white/10 hover:border-red-500/20 px-3 py-1.5 rounded-lg transition-all active:scale-95">
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
