"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Tab = "palmares" | "ligas" | "galeria" | "staff" | "portada";

const TABS: { id: Tab; label: string }[] = [
  { id: "portada",  label: "Foto equipo" },
  { id: "palmares", label: "Palmarés" },
  { id: "ligas",    label: "Ligas" },
  { id: "galeria",  label: "Galería" },
  { id: "staff",    label: "Staff" },
];

const TIPOS_PALMARES = ["campeonato", "subcampeonato", "torneo"];

const inputCls = "w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-pantera-green/50 transition-colors";
const selectCls = "w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-pantera-green/50";

// ── Subir archivo a Supabase Storage ──
async function subirArchivo(bucket: string, file: File): Promise<string | null> {
  const ext  = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type || "application/octet-stream",
  });
  if (error || !data) return null;
  return supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
}

async function borrarArchivo(bucket: string, url: string) {
  const path = url.split(`/object/public/${bucket}/`)[1];
  if (path) await supabase.storage.from(bucket).remove([decodeURIComponent(path)]);
}

export default function AdminCategoriaPage({ params }: { params: { id: string } }) {
  const categoriaId = params.id;
  const router = useRouter();
  const [tab, setTab]             = useState<Tab>("palmares");
  const [categoria, setCategoria] = useState("");
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  // Palmarés
  const [palmares, setPalmares]   = useState<{ id: string; tipo: string; nombre: string; anio: number }[]>([]);
  const [pTipo, setPTipo]         = useState("campeonato");
  const [pNombre, setPNombre]     = useState("");
  const [pAnio, setPAnio]         = useState(new Date().getFullYear());

  // Ligas
  const [ligas, setLigas]         = useState<{ id: string; nombre: string; activo: boolean }[]>([]);
  const [lNombre, setLNombre]     = useState("");

  // Galería
  const [galeria, setGaleria]     = useState<{ id: string; tipo: string; url: string; titulo: string | null }[]>([]);
  const [gTitulo, setGTitulo]     = useState("");
  const [gFile, setGFile]         = useState<File | null>(null);
  const [savingG, setSavingG]     = useState(false);
  const galeriaRef                = useRef<HTMLInputElement>(null);

  // Staff
  const [staff, setStaff]         = useState<{ id: string; nombre: string; rol: string; foto_url: string | null }[]>([]);
  const [sNombre, setSNombre]     = useState("");
  const [sRol, setSRol]           = useState("");
  const [sFoto, setSFoto]         = useState<File | null>(null);
  const [savingS, setSavingS]     = useState(false);
  const staffRef                  = useRef<HTMLInputElement>(null);

  // Foto portada
  const [fotoPortada, setFotoPortada]     = useState<string | null>(null);
  const [savingPortada, setSavingPortada] = useState(false);
  const [posX, setPosX]                  = useState(50);
  const [posY, setPosY]                  = useState(50);
  const [escala, setEscala]              = useState(1);
  const [savingAjuste, setSavingAjuste]  = useState(false);
  const portadaRef                       = useRef<HTMLInputElement>(null);

  const subirPortada = async (file: File) => {
    setSavingPortada(true);
    if (fotoPortada) await borrarArchivo("plantel", fotoPortada);
    const url = await subirArchivo("plantel", file);
    if (!url) { showToast("Error al subir al storage", false); setSavingPortada(false); return; }
    const { error } = await supabase.from("portadas").upsert({ categoria_id: categoriaId, url }, { onConflict: "categoria_id" });
    if (error) {
      showToast(`Error BD: ${error.message}`, false);
    } else {
      setFotoPortada(url);
      showToast("Foto de portada actualizada");
    }
    setSavingPortada(false);
  };

  const guardarAjuste = async () => {
    setSavingAjuste(true);
    const { error } = await supabase.from("portadas")
      .update({ pos_x: posX, pos_y: posY, escala })
      .eq("categoria_id", categoriaId);
    if (error) showToast("Error al guardar ajuste", false);
    else showToast("Ajuste guardado");
    setSavingAjuste(false);
  };

  const eliminarPortada = async () => {
    if (!fotoPortada) return;
    await borrarArchivo("plantel", fotoPortada);
    await supabase.from("portadas").delete().eq("categoria_id", categoriaId);
    setFotoPortada(null);
    showToast("Foto eliminada");
  };

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const cargar = async () => {
    const { data: cat } = await supabase.from("categorias").select("nombre").eq("id", categoriaId).single();
    setCategoria(cat?.nombre ?? "");
    const { data: portada } = await supabase.from("portadas").select("url, pos_x, pos_y, escala").eq("categoria_id", categoriaId).single();
    setFotoPortada(portada?.url ?? null);
    setPosX(portada?.pos_x ?? 50);
    setPosY(portada?.pos_y ?? 50);
    setEscala(portada?.escala ?? 1);
    const [p, l, g, s] = await Promise.all([
      supabase.from("palmares").select("*").eq("categoria_id", categoriaId).order("anio", { ascending: false }),
      supabase.from("ligas").select("*").eq("categoria_id", categoriaId).order("nombre"),
      supabase.from("galeria").select("*").eq("categoria_id", categoriaId).order("created_at", { ascending: false }),
      supabase.from("cuerpo_tecnico").select("*").eq("categoria_id", categoriaId).order("nombre"),
    ]);
    setPalmares(p.data ?? []);
    setLigas(l.data ?? []);
    setGaleria(g.data ?? []);
    setStaff(s.data ?? []);
  };

  useEffect(() => { cargar(); }, [categoriaId]); // eslint-disable-line

  // ── PALMARÉS ──
  const addPalmares = async () => {
    if (!pNombre.trim()) return;
    await supabase.from("palmares").insert({ categoria_id: categoriaId, tipo: pTipo, nombre: pNombre.trim(), anio: pAnio });
    setPNombre(""); await cargar(); showToast("Palmarés agregado");
  };
  const delPalmares = async (id: string) => {
    await supabase.from("palmares").delete().eq("id", id);
    await cargar(); showToast("Eliminado");
  };

  // ── LIGAS ──
  const addLiga = async () => {
    if (!lNombre.trim()) return;
    await supabase.from("ligas").insert({ categoria_id: categoriaId, nombre: lNombre.trim() });
    setLNombre(""); await cargar(); showToast("Liga agregada");
  };
  const delLiga = async (id: string) => {
    await supabase.from("ligas").delete().eq("id", id);
    await cargar();
  };

  // ── GALERÍA ──
  const addGaleria = async () => {
    if (!gFile) return;
    setSavingG(true);
    const tipo = gFile.type.startsWith("video") ? "video" : "foto";
    const url  = await subirArchivo("galeria", gFile);
    if (url) {
      await supabase.from("galeria").insert({ categoria_id: categoriaId, tipo, url, titulo: gTitulo || null });
      showToast("Archivo subido");
    } else showToast("Error al subir", false);
    setGFile(null); setGTitulo("");
    if (galeriaRef.current) galeriaRef.current.value = "";
    setSavingG(false); await cargar();
  };
  const delGaleria = async (id: string, url: string) => {
    await borrarArchivo("galeria", url);
    await supabase.from("galeria").delete().eq("id", id);
    await cargar();
  };

  // ── STAFF ──
  const addStaff = async () => {
    if (!sNombre.trim() || !sRol.trim()) return;
    setSavingS(true);
    let fotoUrl: string | null = null;
    if (sFoto) fotoUrl = await subirArchivo("cuerpo-tecnico", sFoto);
    await supabase.from("cuerpo_tecnico").insert({
      categoria_id: categoriaId, nombre: sNombre.trim(), rol: sRol.trim(), foto_url: fotoUrl,
    });
    setSNombre(""); setSRol(""); setSFoto(null);
    if (staffRef.current) staffRef.current.value = "";
    setSavingS(false); await cargar(); showToast("Staff agregado");
  };
  const delStaff = async (id: string, fotoUrl: string | null) => {
    if (fotoUrl) await borrarArchivo("cuerpo-tecnico", fotoUrl);
    await supabase.from("cuerpo_tecnico").delete().eq("id", id);
    await cargar();
  };

  const TROFEO: Record<string, string> = {
    campeonato: "🥇", subcampeonato: "🥈", torneo: "🏆",
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden w-full pb-10">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl ${toast.ok ? "bg-green-600" : "bg-red-600"} text-white`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="bg-[#0f0f0f] border-b border-white/[0.07] px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-white text-xl w-8 flex-shrink-0">←</button>
        <div>
          <h1 className="text-white font-bold" style={{ fontFamily: "Syne, sans-serif" }}>{categoria}</h1>
          <p className="text-gray-600 text-xs">Gestión de contenido</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.06] overflow-x-auto sticky top-[57px] bg-[#0a0a0a] z-10">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
              tab === t.id ? "border-pantera-green text-white" : "border-transparent text-gray-500 hover:text-gray-300"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* ── FOTO PORTADA ── */}
        {tab === "portada" && (
          <>
            <input ref={portadaRef} type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.heic" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) subirPortada(f); e.target.value = ""; }} />
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 space-y-4">
              <p className="text-white font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Foto del equipo</p>
              <p className="text-gray-500 text-xs">Aparece en la página pública de la categoría como imagen de portada con el color del equipo difuminado encima.</p>
              {fotoPortada ? (
                <div className="space-y-4">
                  {/* Preview en vivo */}
                  <div className="rounded-2xl overflow-hidden relative" style={{ aspectRatio: "16/7" }}>
                    <img src={fotoPortada} alt="Portada" className="absolute inset-0 w-full h-full object-cover"
                      style={{
                        objectPosition: `${posX}% ${posY}%`,
                        transform: `scale(${escala})`,
                        transformOrigin: `${posX}% ${posY}%`,
                      }} />
                  </div>

                  {/* Controles */}
                  <div className="space-y-3 bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <p className="text-white text-xs font-semibold uppercase tracking-widest">Ajustar imagen</p>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-gray-500 text-xs">Horizontal</label>
                        <span className="text-gray-500 text-xs">{posX}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={posX}
                        onChange={(e) => setPosX(Number(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: "#16a34a" }} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-gray-500 text-xs">Vertical</label>
                        <span className="text-gray-500 text-xs">{posY}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={posY}
                        onChange={(e) => setPosY(Number(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: "#16a34a" }} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label className="text-gray-500 text-xs">Zoom</label>
                        <span className="text-gray-500 text-xs">{escala.toFixed(1)}x</span>
                      </div>
                      <input type="range" min="1" max="2.5" step="0.05" value={escala}
                        onChange={(e) => setEscala(Number(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: "#16a34a" }} />
                    </div>
                    <button onClick={guardarAjuste} disabled={savingAjuste}
                      className="w-full bg-pantera-green text-white text-sm font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-opacity">
                      {savingAjuste ? "Guardando..." : "Guardar ajuste"}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => portadaRef.current?.click()} disabled={savingPortada}
                      className="flex-1 text-sm bg-white/[0.06] border border-white/10 text-gray-400 hover:text-white py-2.5 rounded-xl disabled:opacity-50 transition-colors">
                      {savingPortada ? "Subiendo..." : "Cambiar foto"}
                    </button>
                    <button onClick={eliminarPortada} disabled={savingPortada}
                      className="px-4 text-sm text-red-400 hover:text-red-300 border border-white/10 rounded-xl transition-colors">
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => portadaRef.current?.click()} disabled={savingPortada}
                  className="w-full border-2 border-dashed border-white/10 hover:border-pantera-green/40 rounded-2xl py-12 text-center transition-colors group">
                  <p className="text-gray-500 group-hover:text-gray-300 text-sm transition-colors">
                    {savingPortada ? "Subiendo..." : "Toca para subir la foto del equipo"}
                  </p>
                  <p className="text-gray-700 text-xs mt-1">JPG, PNG, WEBP · recomendado 1200×500px</p>
                </button>
              )}
            </div>
          </>
        )}

        {/* ── PALMARÉS ── */}
        {tab === "palmares" && (
          <>
            <div className="card p-4 space-y-3">
              <p className="text-white font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Agregar logro</p>
              <select value={pTipo} onChange={(e) => setPTipo(e.target.value)} className={selectCls}>
                {TIPOS_PALMARES.map((t) => <option key={t} value={t} style={{ background: "#0a0a0a" }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
              <input value={pNombre} onChange={(e) => setPNombre(e.target.value)} placeholder="Nombre del torneo" className={inputCls} />
              <input type="number" value={pAnio} onChange={(e) => setPAnio(Number(e.target.value))} placeholder="Año" className={inputCls} />
              <button onClick={addPalmares} className="btn-primary w-full text-sm py-3">Agregar</button>
            </div>

            {palmares.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">Sin logros registrados aún.</p>
            ) : (
              <div className="space-y-2">
                {palmares.map((p) => (
                  <div key={p.id} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{TROFEO[p.tipo]}</span>
                      <div>
                        <p className="text-white font-semibold text-sm">{p.nombre}</p>
                        <p className="text-gray-600 text-xs">{p.tipo.charAt(0).toUpperCase() + p.tipo.slice(1)} · {p.anio}</p>
                      </div>
                    </div>
                    <button onClick={() => delPalmares(p.id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1">Borrar</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── LIGAS ── */}
        {tab === "ligas" && (
          <>
            <div className="card p-4 space-y-3">
              <p className="text-white font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Agregar liga</p>
              <input value={lNombre} onChange={(e) => setLNombre(e.target.value)} placeholder="Nombre de la liga" className={inputCls} />
              <button onClick={addLiga} className="btn-primary w-full text-sm py-3">Agregar</button>
            </div>
            {ligas.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">Sin ligas registradas.</p>
            ) : (
              <div className="space-y-2">
                {ligas.map((l) => (
                  <div key={l.id} className="card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-pantera-green" />
                      <span className="text-white text-sm">{l.nombre}</span>
                    </div>
                    <button onClick={() => delLiga(l.id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1">Borrar</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── GALERÍA ── */}
        {tab === "galeria" && (
          <>
            <div className="card p-4 space-y-3">
              <p className="text-white font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Subir foto o video</p>
              <input value={gTitulo} onChange={(e) => setGTitulo(e.target.value)} placeholder="Título (opcional)" className={inputCls} />
              <input ref={galeriaRef} type="file" accept="image/*,video/*,.jpg,.jpeg,.png,.webp,.heic,.heif,.mp4,.mov" onChange={(e) => setGFile(e.target.files?.[0] ?? null)}
                className="w-full text-gray-400 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-white/[0.06] file:text-white file:text-xs" />
              <button onClick={addGaleria} disabled={savingG || !gFile} className="btn-primary w-full text-sm py-3 disabled:opacity-50">
                {savingG ? "Subiendo..." : "Subir"}
              </button>
            </div>

            {galeria.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">Sin archivos en la galería.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {galeria.map((g) => (
                  <div key={g.id} className="card p-2 space-y-2">
                    {g.tipo === "foto" ? (
                      <img src={g.url} alt={g.titulo ?? ""} className="w-full h-28 object-cover rounded-xl" />
                    ) : (
                      <video src={g.url} className="w-full h-28 object-cover rounded-xl" controls />
                    )}
                    {g.titulo && <p className="text-gray-400 text-[10px] truncate px-1">{g.titulo}</p>}
                    <button onClick={() => delGaleria(g.id, g.url)}
                      className="w-full text-[10px] border border-red-500/20 text-red-400 hover:text-red-300 py-1 rounded-lg">
                      Borrar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── STAFF ── */}
        {tab === "staff" && (
          <>
            <div className="card p-4 space-y-3">
              <p className="text-white font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Agregar integrante</p>
              <input value={sNombre} onChange={(e) => setSNombre(e.target.value)} placeholder="Nombre completo" className={inputCls} />
              <input value={sRol} onChange={(e) => setSRol(e.target.value)} placeholder="Rol (ej: Entrenador Principal)" className={inputCls} />
              <input ref={staffRef} type="file" accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif" onChange={(e) => setSFoto(e.target.files?.[0] ?? null)}
                className="w-full text-gray-400 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-white/[0.06] file:text-white file:text-xs" />
              <button onClick={addStaff} disabled={savingS} className="btn-primary w-full text-sm py-3 disabled:opacity-50">
                {savingS ? "Guardando..." : "Agregar"}
              </button>
            </div>

            {staff.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-8">Sin staff registrado.</p>
            ) : (
              <div className="space-y-2">
                {staff.map((s) => (
                  <div key={s.id} className="card p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {s.foto_url ? (
                        <img src={s.foto_url} alt={s.nombre} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                          <span className="text-gray-600 text-xs">Sin foto</span>
                        </div>
                      )}
                      <div>
                        <p className="text-white font-semibold text-sm">{s.nombre}</p>
                        <p className="text-gray-500 text-xs">{s.rol}</p>
                      </div>
                    </div>
                    <button onClick={() => delStaff(s.id, s.foto_url)} className="text-red-400 hover:text-red-300 text-xs flex-shrink-0">Borrar</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
