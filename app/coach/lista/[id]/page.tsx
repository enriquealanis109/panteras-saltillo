"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Jugador, type Asistencia, type Estado } from "@/lib/supabase";
import { PanelTour } from "@/components/admin/PanelTour";
import { LISTA_STEPS } from "@/lib/coach-tours";

const ESTADOS: { value: Estado; label: string; selected: string; unselected: string }[] = [
  { value: "presente", label: "Presente", selected: "bg-green-500 text-white border-green-500", unselected: "link-muted-theme border-[var(--border-strong)] hover:border-green-500/40 hover:text-[var(--status-good)]" },
  { value: "tarde",    label: "Tarde",    selected: "bg-[var(--status-neutral)] text-white border-[var(--status-neutral)]", unselected: "link-muted-theme border-[var(--border-strong)] hover:border-[var(--status-neutral)]/60 hover:text-[var(--status-neutral)]" },
  { value: "permiso",  label: "Permiso",  selected: "bg-blue-500 text-white border-blue-500", unselected: "link-muted-theme border-[var(--border-strong)] hover:border-blue-500/40 hover:text-blue-400" },
  { value: "ausente",  label: "Ausente",  selected: "bg-red-600 text-white border-red-600", unselected: "link-muted-theme border-[var(--border-strong)] hover:border-red-500/40 hover:text-red-400" },
];

const inputCls = "input-theme text-sm";

type ModalMode = "add" | "edit" | null;

function IconEdit() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/>
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
    </svg>
  );
}

export default function ListaPage({ params }: { params: { id: string } }) {
  const categoriaId = params.id;
  const router = useRouter();

  const [categoria, setCategoria]         = useState("");
  const [jugadores, setJugadores]         = useState<Jugador[]>([]);
  const [asistencias, setAsistencias]     = useState<Record<string, Estado>>({});
  const [notas, setNotas]                 = useState<Record<string, string>>({});
  const [loading, setLoading]             = useState(true);
  const [guardando, setGuardando]         = useState(false);
  const [guardado, setGuardado]           = useState(false);
  const [toast, setToast]                 = useState<{ msg: string; type: "ok" | "info" } | null>(null);
  const [userId, setUserId]               = useState("");

  const [modal, setModal]                 = useState<ModalMode>(null);
  const [jugadorEdit, setJugadorEdit]     = useState<Jugador | null>(null);
  const [formNombre, setFormNombre]       = useState("");
  const [formAlias, setFormAlias]         = useState("");
  const [savingJugador, setSavingJugador] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Jugador | null>(null);
  const [todosModal, setTodosModal]       = useState(false);

  const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Monterrey" });

  const cargarJugadores = async (catId: string) => {
    const { data } = await supabase.from("jugadores").select("*").eq("categoria_id", catId).eq("activo", true).order("nombre");
    return data ?? [];
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: cat } = await supabase.from("categorias").select("nombre").eq("id", categoriaId).single();
      setCategoria(cat?.nombre ?? "");

      const jug = await cargarJugadores(categoriaId);
      setJugadores(jug);

      const { data: asist } = await supabase.from("asistencias").select("*").eq("fecha", hoy)
        .in("jugador_id", jug.map((j) => j.id));

      const map: Record<string, Estado> = {};
      const notasMap: Record<string, string> = {};
      (asist ?? []).forEach((a: Asistencia) => {
        map[a.jugador_id] = a.estado;
        if (a.nota) notasMap[a.jugador_id] = a.nota;
      });
      setAsistencias(map);
      setNotas(notasMap);
      setLoading(false);
    };
    init();
  }, [categoriaId, hoy]);

  const showToast = (msg: string, type: "ok" | "info" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const setEstado = (jugadorId: string, estado: Estado) =>
    setAsistencias((prev) => ({ ...prev, [jugadorId]: estado }));

  const marcarTodosPresentes = () => {
    const map: Record<string, Estado> = {};
    jugadores.forEach((j) => { map[j.id] = "presente"; });
    setAsistencias(map);
    setTodosModal(false);
    showToast("Todos marcados como presentes", "info");
  };

  const guardar = async () => {
    setGuardando(true);
    const registros = jugadores.map((j) => ({
      jugador_id: j.id, entrenador_id: userId, fecha: hoy,
      estado: asistencias[j.id] ?? "ausente",
      nota: notas[j.id] ?? null,
    }));
    await supabase.from("asistencias").upsert(registros, { onConflict: "jugador_id,fecha" });
    setGuardando(false);
    setGuardado(true);
    showToast("Lista guardada correctamente");
    setTimeout(() => setGuardado(false), 2500);
  };

  const abrirAgregar = () => { setFormNombre(""); setFormAlias(""); setJugadorEdit(null); setModal("add"); };
  const abrirEditar  = (j: Jugador) => { setFormNombre(j.nombre); setFormAlias(j.alias ?? ""); setJugadorEdit(j); setModal("edit"); };

  const guardarJugador = async () => {
    if (!formNombre.trim()) return;
    setSavingJugador(true);
    if (modal === "add") {
      await supabase.from("jugadores").insert({ nombre: formNombre.trim(), alias: formAlias.trim() || null, categoria_id: categoriaId, activo: true });
    } else if (modal === "edit" && jugadorEdit) {
      await supabase.from("jugadores").update({ nombre: formNombre.trim(), alias: formAlias.trim() || null }).eq("id", jugadorEdit.id);
    }
    setJugadores(await cargarJugadores(categoriaId));
    setSavingJugador(false);
    setModal(null);
  };

  const eliminarJugador = async (id: string) => {
    await supabase.from("jugadores").update({ activo: false }).eq("id", id);
    setJugadores(await cargarJugadores(categoriaId));
    setConfirmDelete(null);
  };

  const totalPresente = Object.values(asistencias).filter((e) => e === "presente" || e === "tarde").length;
  const totalAusente  = Object.values(asistencias).filter((e) => e === "ausente").length;
  const marcados      = Object.keys(asistencias).length;
  const sinMarcar     = jugadores.length - marcados;
  const pctProgreso   = jugadores.length > 0 ? Math.round((marcados / jugadores.length) * 100) : 0;
  const listaCompleta = sinMarcar === 0 && jugadores.length > 0;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
      <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen pb-28 overflow-x-hidden w-full" style={{ background: "var(--bg-page)" }}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-xl text-sm font-semibold shadow-xl transition-all ${
          toast.type === "ok" ? "bg-green-600 text-white shadow-green-900/40" : "bg-blue-600 text-white shadow-blue-900/40"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header sticky */}
      <header className="border-b px-4 py-3 sticky top-0 z-10" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <button onClick={() => router.back()} className="link-muted-theme w-8 h-8 flex items-center justify-center rounded-lg transition-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              </button>
              <div>
                <h1 className="font-bold leading-tight" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>{categoria}</h1>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {listaCompleta
                    ? <span className="text-[var(--status-good)] font-semibold">✓ Lista completa</span>
                    : <>{marcados}/{jugadores.length} marcados · {sinMarcar} sin registrar</>
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PanelTour steps={LISTA_STEPS} storageKey="tour_coach_lista" />
              <button onClick={abrirAgregar}
                className="flex items-center gap-1.5 bg-pantera-green text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg shadow-green-900/30 active:scale-95 transition-all">
                + Agregar
              </button>
            </div>
          </div>

          {/* Barra de progreso de la lista */}
          <div className="w-full rounded-full h-1.5" style={{ background: "var(--border-subtle)" }}>
            <div
              className={`h-1.5 rounded-full transition-all duration-500 ${listaCompleta ? "bg-green-500" : "bg-pantera-green"}`}
              style={{ width: `${pctProgreso}%` }}
            />
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto">
        {/* Barra de resumen — 3 columnas */}
        <div id="tour-lista-resumen" className="grid grid-cols-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="py-3.5 text-center border-r" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-[var(--status-good)] text-xl font-black leading-none" style={{ fontFamily: "Syne, sans-serif" }}>{totalPresente}</p>
            <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "var(--text-muted)" }}>Presentes</p>
          </div>
          <div className="py-3.5 text-center border-r" style={{ borderColor: "var(--border-subtle)" }}>
            <p className="text-xl font-black leading-none" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-muted)" }}>
              {sinMarcar}
            </p>
            <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "var(--text-muted)" }}>Sin marcar</p>
          </div>
          <div className="py-3.5 text-center">
            <p className="text-red-400 text-xl font-black leading-none" style={{ fontFamily: "Syne, sans-serif" }}>{totalAusente}</p>
            <p className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: "var(--text-muted)" }}>Ausentes</p>
          </div>
        </div>

        {/* Acceso rápido: todos presentes */}
        {jugadores.length > 0 && !listaCompleta && (
          <div id="tour-lista-todos" className="px-4 pt-3 pb-1">
            <button onClick={() => setTodosModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-green-500/20 bg-green-500/[0.06] text-[var(--status-good)] text-xs font-bold hover:bg-green-500/10 active:scale-[0.98] transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              Marcar todos presentes
            </button>
          </div>
        )}

        {/* Lista de jugadores */}
        {jugadores.length === 0 ? (
          <div className="text-center py-20 px-5">
            <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Sin jugadores en esta categoría</p>
            <button onClick={abrirAgregar} className="btn-primary px-8 py-3 mt-3 text-sm">+ Agregar jugador</button>
          </div>
        ) : (
          <div id="tour-lista-jugadores" className="divide-y mt-2" style={{ borderColor: "var(--border-subtle)" }}>
            {jugadores.map((j, idx) => {
              const estadoActual = asistencias[j.id];
              const sinRegistrar = !estadoActual;
              return (
                <div key={j.id}
                  className={`px-4 py-3 transition-colors ${sinRegistrar ? "border-l-2 border-[var(--border-strong)]" : ""}`}>

                  <div className="flex flex-col md:flex-row md:items-center gap-2.5 md:gap-4">

                    {/* Nombre + acciones */}
                    <div className="flex items-center justify-between md:flex-1 md:min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs w-5 flex-shrink-0 font-medium" style={{ color: "var(--text-muted)" }}>{idx + 1}</span>
                        <div className="min-w-0 flex items-baseline gap-1.5">
                          <p className="font-semibold text-sm truncate leading-tight" style={{ color: "var(--text-primary)" }}>
                            {j.nombre}
                          </p>
                          {j.alias && (
                            <p className="text-pantera-green text-[10px] font-medium leading-tight flex-shrink-0">"{j.alias}"</p>
                          )}
                        </div>
                        {sinRegistrar && (
                          <span className="flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full border" style={{ color: "var(--text-muted)", background: "var(--bg-surface-2)", borderColor: "var(--border-strong)" }}>
                            Sin marcar
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2 md:hidden">
                        <button onClick={() => abrirEditar(j)}
                          className="link-muted-theme w-8 h-8 rounded-lg border flex items-center justify-center active:scale-90 transition-all" style={{ borderColor: "var(--border-subtle)" }}>
                          <IconEdit />
                        </button>
                        <button onClick={() => setConfirmDelete(j)}
                          className="w-8 h-8 rounded-lg border flex items-center justify-center hover:text-red-400 hover:border-red-500/30 active:scale-90 transition-all" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                          <IconTrash />
                        </button>
                      </div>
                    </div>

                    {/* Botones de estado */}
                    <div className="grid grid-cols-4 md:flex gap-1.5 flex-shrink-0">
                      {ESTADOS.map((e) => (
                        <button key={e.value} onClick={() => setEstado(j.id, e.value)}
                          className={`py-2.5 md:py-1.5 md:px-3.5 rounded-xl border text-xs font-bold active:scale-95 transition-all whitespace-nowrap ${
                            estadoActual === e.value ? e.selected : e.unselected
                          }`}>
                          {e.label}
                        </button>
                      ))}
                    </div>

                    {/* Acciones (desktop) */}
                    <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => abrirEditar(j)}
                        className="link-muted-theme w-8 h-8 rounded-lg border flex items-center justify-center active:scale-90 transition-all" style={{ borderColor: "var(--border-subtle)" }}>
                        <IconEdit />
                      </button>
                      <button onClick={() => setConfirmDelete(j)}
                        className="w-8 h-8 rounded-lg border flex items-center justify-center hover:text-red-400 hover:border-red-500/30 active:scale-90 transition-all" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                        <IconTrash />
                      </button>
                    </div>
                  </div>

                  {/* Nota */}
                  {estadoActual && estadoActual !== "presente" && (
                    <input
                      placeholder="Agregar nota..."
                      value={notas[j.id] ?? ""}
                      onChange={(ev) => setNotas((prev) => ({ ...prev, [j.id]: ev.target.value }))}
                      className="mt-2.5 w-full md:max-w-sm rounded-xl px-3 py-2.5 text-xs focus:outline-none transition-colors border"
                      style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Botón guardar fijo */}
      <div id="tour-lista-guardar" className="fixed bottom-0 left-0 right-0 p-4 backdrop-blur-sm border-t" style={{ background: "var(--bg-page)", borderColor: "var(--border-subtle)" }}>
        {sinMarcar > 0 && !guardado && (
          <p className="text-center text-xs mb-2 font-medium" style={{ color: "var(--text-muted)" }}>
            {sinMarcar} jugador{sinMarcar > 1 ? "es" : ""} sin registrar — se guardarán como ausente
          </p>
        )}
        <button onClick={guardar} disabled={guardando || jugadores.length === 0}
          className={`w-full max-w-lg mx-auto block py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
            guardado
              ? "bg-green-600 text-white"
              : "btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          }`}>
          {guardando ? "Guardando..." : guardado ? "✓ Lista guardada" : "Guardar lista"}
        </button>
      </div>

      {/* Modal: confirmar todos presentes */}
      {todosModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="border rounded-2xl w-full max-w-sm p-6 space-y-4" style={{ background: "var(--bg-alt)", borderColor: "var(--border-strong)" }}>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>¿Marcar todos presentes?</p>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{jugadores.length} jugadores serán marcados como presentes. Puedes ajustar individualmente después.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setTodosModal(false)} className="flex-1 btn-outline-theme py-3 text-sm">Cancelar</button>
              <button onClick={marcarTodosPresentes} className="flex-1 py-3 text-sm font-bold rounded-xl bg-green-600 text-white hover:bg-green-700 active:scale-95 transition-all">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar/editar jugador */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="border rounded-2xl w-full max-w-sm p-6 space-y-4" style={{ background: "var(--bg-alt)", borderColor: "var(--border-strong)" }}>
            <h3 className="font-bold text-lg" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
              {modal === "add" ? "Agregar jugador" : "Editar jugador"}
            </h3>
            <div>
              <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Nombre completo</label>
              <input className={inputCls} placeholder="Carlos García" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Alias <span className="normal-case tracking-normal" style={{ color: "var(--text-muted)" }}>(opcional)</span>
              </label>
              <input className={inputCls} placeholder="Ej: Charly, Messi, El Rápido..." value={formAlias} onChange={(e) => setFormAlias(e.target.value)} />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setModal(null)} className="flex-1 btn-outline-theme py-3 text-sm">Cancelar</button>
              <button onClick={guardarJugador} disabled={savingJugador || !formNombre.trim()}
                className="flex-1 btn-primary py-3 text-sm disabled:opacity-50 disabled:transform-none">
                {savingJugador ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="border rounded-2xl w-full max-w-xs p-6 space-y-4" style={{ background: "var(--bg-alt)", borderColor: "var(--border-strong)" }}>
            <div className="text-center">
              <p className="font-bold text-base mb-1" style={{ color: "var(--text-primary)" }}>Eliminar jugador</p>
              <p className="text-pantera-green font-semibold text-sm">{confirmDelete.nombre}</p>
              <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>El historial de asistencias se conserva.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 btn-outline-theme py-3 text-sm">Cancelar</button>
              <button onClick={() => eliminarJugador(confirmDelete.id)}
                className="flex-1 py-3 text-sm font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-all">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
