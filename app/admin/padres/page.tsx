"use client";
import { useEffect, useState } from "react";
import { supabase, authHeaders } from "@/lib/supabase";
import toast from "react-hot-toast";

interface Categoria { id: string; nombre: string; }
interface Padre { id: string; nombre: string; telefono: string; activo: boolean; categorias?: { nombre: string }; created_at: string; }
interface Codigo { id: string; codigo: string; usado: boolean; expira_en: string; categorias?: { nombre: string }; }

const selectStyle: React.CSSProperties = {
  colorScheme: "dark",
  backgroundColor: "#111",
  color: "white",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  padding: "8px 12px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  fontFamily: "Space Grotesk, sans-serif",
};

export default function PadresPage() {
  const [categorias,          setCategorias]          = useState<Categoria[]>([]);
  const [padres,              setPadres]              = useState<Padre[]>([]);
  const [codigos,             setCodigos]             = useState<Codigo[]>([]);
  const [catFiltro,           setCatFiltro]           = useState("todos");
  const [loadingCode,         setLoadingCode]         = useState(false);
  const [genCatId,            setGenCatId]            = useState("");
  const [tab,                 setTab]                 = useState<"padres" | "codigos">("padres");
  const [confirmDelete,       setConfirmDelete]       = useState<string | null>(null);
  const [eliminandoPadre,     setEliminandoPadre]     = useState<string | null>(null);
  const [confirmDeleteCodigo, setConfirmDeleteCodigo] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [{ data: cats }, { data: pads }, { data: codes }] = await Promise.all([
      supabase.from("categorias").select("id, nombre").order("nombre"),
      supabase.from("padres").select("*, categorias(nombre)").order("created_at", { ascending: false }),
      supabase.from("codigos_invitacion").select("*, categorias(nombre)").order("created_at", { ascending: false }).limit(50),
    ]);
    setCategorias(cats ?? []);
    setPadres(pads ?? []);
    setCodigos(codes ?? []);
    if (cats?.length) setGenCatId(cats[0].id);
  };

  const generarCodigo = async () => {
    if (!genCatId) return;
    setLoadingCode(true);
    const { data: { user } } = await supabase.auth.getUser();
    const expira_en = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("codigos_invitacion")
      .insert({ categoria_id: genCatId, created_by: user?.id, expira_en })
      .select("*, categorias(nombre)")
      .single();
    if (error) { toast.error(error.message); setLoadingCode(false); return; }
    setCodigos((p) => [data, ...p]);
    toast.success(`Código generado: ${data.codigo}`);
    setLoadingCode(false);
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    const { error } = await supabase.from("padres").update({ activo: !activo }).eq("id", id);
    if (error) { toast.error("Error"); return; }
    setPadres((p) => p.map((x) => x.id === id ? { ...x, activo: !activo } : x));
    toast.success(activo ? "Acceso desactivado" : "Acceso activado");
  };

  const eliminarPadre = async (id: string) => {
    setEliminandoPadre(id);
    const res  = await fetch(`/api/admin/padres/${id}`, { method: "DELETE", headers: await authHeaders() });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error ?? "Error al eliminar"); setEliminandoPadre(null); return; }
    setPadres((p) => p.filter((x) => x.id !== id));
    setConfirmDelete(null);
    setEliminandoPadre(null);
    toast.success("Cuenta eliminada");
  };

  const eliminarCodigo = async (id: string) => {
    const { error } = await supabase.from("codigos_invitacion").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    setCodigos((c) => c.filter((x) => x.id !== id));
    setConfirmDeleteCodigo(null);
    toast.success("Código eliminado");
  };

  const copiarLink = (codigo: string) => {
    const url = `${window.location.origin}/registro/${codigo}`;
    navigator.clipboard.writeText(url);
    toast.success("Link de registro copiado");
  };

  const filtrados = catFiltro === "todos"
    ? padres
    : padres.filter((p) => (p.categorias as any)?.nombre === categorias.find(c => c.id === catFiltro)?.nombre);

  const activos   = padres.filter((p) => p.activo).length;
  const inactivos = padres.filter((p) => !p.activo).length;
  const codsDisp  = codigos.filter((c) => !c.usado).length;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <p className="text-pantera-green text-xs font-bold uppercase tracking-widest mb-1">Sistema de padres</p>
        <h1 className="text-white font-bold text-2xl" style={{ fontFamily: "Syne, sans-serif" }}>
          Padres y Notificaciones
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Gestiona accesos, genera códigos de invitación y controla notificaciones push
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Padres activos",   value: activos,   color: "text-pantera-green" },
          { label: "Padres inactivos", value: inactivos, color: "text-red-400" },
          { label: "Códigos sin usar", value: codsDisp,  color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`} style={{ fontFamily: "Syne, sans-serif" }}>{s.value}</p>
            <p className="text-gray-500 text-xs mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Generar código */}
      <div id="tour-padres-generar" className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <p className="text-white text-sm font-semibold">Generar código de invitación</p>
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex-1 min-w-[180px]">
            <select value={genCatId} onChange={(e) => setGenCatId(e.target.value)} style={selectStyle}>
              {categorias.map((c) => (
                <option key={c.id} value={c.id} style={{ backgroundColor: "#111", color: "white" }}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={generarCodigo}
            disabled={loadingCode}
            className="bg-pantera-green hover:bg-pantera-green-dark disabled:opacity-50 text-white font-bold text-sm px-5 py-2 rounded-lg transition-colors whitespace-nowrap">
            {loadingCode ? "Generando..." : "+ Generar código"}
          </button>
        </div>

        <p className="text-gray-600 text-xs mt-3">
          Codigo de un solo uso · Expira en 24 horas · El papa abre el link y crea su cuenta
        </p>
      </div>

      {/* Tabs */}
      <div id="tour-padres-tabs" className="flex gap-1 mb-4 bg-white/[0.03] border border-white/[0.07] rounded-xl p-1">
        {([
          ["padres",  `Padres registrados (${padres.length})`],
          ["codigos", `Codigos (${codigos.length})`],
        ] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? "bg-pantera-green/10 text-pantera-green border border-pantera-green/20"
                : "text-gray-500 hover:text-white"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* TAB: PADRES */}
      {tab === "padres" && (
        <div>
          <div className="flex gap-2 flex-wrap mb-4">
            <button onClick={() => setCatFiltro("todos")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                catFiltro === "todos"
                  ? "bg-pantera-green text-white"
                  : "text-gray-500 border border-white/10 hover:text-white"
              }`}>
              Todos
            </button>
            {categorias.map((c) => (
              <button key={c.id} onClick={() => setCatFiltro(c.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  catFiltro === c.id
                    ? "bg-pantera-green text-white"
                    : "text-gray-500 border border-white/10 hover:text-white"
                }`}>
                {c.nombre}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filtrados.length === 0 ? (
              <div className="text-center py-12 text-gray-600 text-sm">
                No hay padres registrados todavia.
              </div>
            ) : filtrados.map((p) => (
              <div key={p.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.activo ? "bg-pantera-green" : "bg-red-500/60"}`} />
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{p.nombre}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {p.telefono} · {(p.categorias as any)?.nombre ?? "Sin categoria"}
                    </p>
                  </div>
                </div>

                {confirmDelete === p.id ? (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="text-xs text-gray-500 hover:text-white px-2 py-1 transition-colors">
                      Cancelar
                    </button>
                    <button
                      onClick={() => eliminarPadre(p.id)}
                      disabled={eliminandoPadre === p.id}
                      className="text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 px-3 py-1 rounded-lg transition-all disabled:opacity-50">
                      {eliminandoPadre === p.id ? "..." : "Confirmar"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActivo(p.id, p.activo)}
                      className={`text-xs font-medium px-3 py-1 rounded-lg transition-all ${
                        p.activo
                          ? "text-red-400 border border-red-500/20 hover:bg-red-500/10"
                          : "text-pantera-green border border-pantera-green/20 hover:bg-pantera-green/10"
                      }`}>
                      {p.activo ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(p.id)}
                      className="text-gray-700 hover:text-red-400 transition-colors p-1"
                      title="Eliminar cuenta">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: CODIGOS */}
      {tab === "codigos" && (
        <div className="space-y-2">
          {codigos.length === 0 ? (
            <div className="text-center py-12 text-gray-600 text-sm">
              No hay codigos generados.
            </div>
          ) : codigos.map((c) => (
            <div key={c.id} className="bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.usado ? "bg-white/20" : "bg-pantera-green"}`} />
                <div>
                  <p className="text-white text-sm font-mono font-bold tracking-wider">{c.codigo}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {(c.categorias as any)?.nombre ?? "Sin categoria"} · Expira {new Date(c.expira_en).toLocaleDateString("es-MX")}
                  </p>
                </div>
              </div>

              {confirmDeleteCodigo === c.id ? (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setConfirmDeleteCodigo(null)}
                    className="text-xs text-gray-500 hover:text-white px-2 py-1 transition-colors">
                    Cancelar
                  </button>
                  <button
                    onClick={() => eliminarCodigo(c.id)}
                    className="text-xs text-red-400 border border-red-500/30 hover:bg-red-500/10 px-3 py-1 rounded-lg transition-all">
                    Eliminar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-shrink-0">
                  {c.usado ? (
                    <span className="text-xs text-gray-600">Usado</span>
                  ) : (
                    <button onClick={() => copiarLink(c.codigo)}
                      className="text-xs text-pantera-green border border-pantera-green/25 hover:bg-pantera-green/10 px-3 py-1 rounded-lg transition-all">
                      Copiar link
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmDeleteCodigo(c.id)}
                    className="text-gray-700 hover:text-red-400 transition-colors p-1"
                    title="Eliminar código">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
