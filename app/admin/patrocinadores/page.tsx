"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Patrocinador { id: string; nombre: string; logo_url: string; website_url: string | null; orden: number; activo: boolean }

const inputCls = "w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-pantera-green/50";

export default function PatrocinadoresPage() {
  const router = useRouter();
  const [patrocinadores, setPatrocinadores] = useState<Patrocinador[]>([]);
  const [nombre, setNombre]     = useState("");
  const [website, setWebsite]   = useState("");
  const [logo, setLogo]         = useState<File | null>(null);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState<{ msg: string; ok: boolean } | null>(null);
  const fileRef                 = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500); };

  const cargar = async () => {
    const { data } = await supabase.from("patrocinadores").select("*").order("orden");
    setPatrocinadores(data ?? []);
  };

  useEffect(() => { cargar(); }, []);

  const agregar = async () => {
    if (!nombre.trim() || !logo) return;
    setSaving(true);
    const ext  = logo.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { data: uploaded, error: uploadError } = await supabase.storage.from("patrocinadores").upload(path, logo, { upsert: true });
    if (uploadError || !uploaded) {
      showToast(`Error: ${uploadError?.message ?? "No se pudo subir"}`, false);
      setSaving(false); return;
    }
    const { data: { publicUrl } } = supabase.storage.from("patrocinadores").getPublicUrl(uploaded.path);
    const orden = patrocinadores.length;
    const { error: dbError } = await supabase.from("patrocinadores").insert({
      nombre: nombre.trim(),
      logo_url: publicUrl,
      website_url: website.trim() || null,
      orden,
    });
    if (dbError) { showToast(`Error BD: ${dbError.message}`, false); setSaving(false); return; }
    setNombre(""); setWebsite(""); setLogo(null);
    if (fileRef.current) fileRef.current.value = "";
    setSaving(false); await cargar(); showToast("Patrocinador agregado");
  };

  const eliminar = async (p: Patrocinador) => {
    const oldPath = p.logo_url.split("/object/public/patrocinadores/")[1];
    if (oldPath) await supabase.storage.from("patrocinadores").remove([decodeURIComponent(oldPath)]);
    await supabase.from("patrocinadores").delete().eq("id", p.id);
    await cargar(); showToast("Eliminado");
  };

  const toggleActivo = async (p: Patrocinador) => {
    await supabase.from("patrocinadores").update({ activo: !p.activo }).eq("id", p.id);
    await cargar();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] overflow-x-hidden w-full pb-10">

      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl ${toast.ok ? "bg-green-600" : "bg-red-600"} text-white`}>
          {toast.msg}
        </div>
      )}

      <header className="bg-[#0f0f0f] border-b border-white/[0.07] px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-500 hover:text-white w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/[0.05] transition-all active:scale-90 flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h1 className="text-white font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Patrocinadores</h1>
          <p className="text-gray-600 text-xs">{patrocinadores.length} registrados</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Formulario */}
        <div id="tour-pat-form" className="card p-4 space-y-3">
          <p className="text-white font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Agregar patrocinador</p>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del patrocinador" className={inputCls} />
          <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://sitioweb.com (opcional)" className={inputCls} />
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1.5">Logo (PNG o JPG)</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
              className="w-full text-gray-400 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-white/[0.06] file:text-white file:text-xs" />
          </div>
          <button onClick={agregar} disabled={saving || !nombre.trim() || !logo}
            className="btn-primary w-full text-sm py-3 disabled:opacity-50 active:scale-[0.98] transition-transform">
            {saving ? "Subiendo..." : "Agregar patrocinador"}
          </button>
        </div>

        {/* Lista */}
        {patrocinadores.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">Sin patrocinadores registrados.</p>
        ) : (
          <div id="tour-pat-lista" className="space-y-2">
            {patrocinadores.map((p) => (
              <div key={p.id} className={`card p-4 flex items-center gap-3 ${!p.activo ? "opacity-40" : ""}`}>
                <img src={p.logo_url} alt={p.nombre} className="w-14 h-10 object-contain flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-white font-semibold text-sm truncate">{p.nombre}</p>
                  {p.website_url && (
                    <p className="text-gray-600 text-xs truncate">{p.website_url}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActivo(p)}
                    className={`text-xs px-2.5 py-1 rounded-full border font-bold transition-all active:scale-95 ${
                      p.activo
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-white/[0.04] border-white/10 text-gray-600"
                    }`}>
                    {p.activo ? "Activo" : "Oculto"}
                  </button>
                  <button onClick={() => eliminar(p)} className="text-red-400 hover:text-red-300 text-xs border border-red-500/20 hover:border-red-500/40 px-2.5 py-1 rounded-full transition-all active:scale-95">Borrar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
