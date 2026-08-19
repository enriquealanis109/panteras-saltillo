"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface CatMini { id: string; nombre: string }

const BLOQUES = [
  { key: "calentamiento", label: "Calentamiento" },
  { key: "tecnica",       label: "Técnica" },
  { key: "tactica",       label: "Táctica" },
  { key: "cierre",        label: "Cierre" },
] as const;

const hoyISO = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Monterrey" });

export default function NuevaPlaneacionPage() {
  const router = useRouter();
  const [cats, setCats] = useState<CatMini[]>([]);
  const [catId, setCatId] = useState("");
  const [fecha, setFecha] = useState(hoyISO());
  const [objetivo, setObjetivo] = useState("");
  const [materiales, setMateriales] = useState("");
  const [bloques, setBloques] = useState<Record<string, { desc: string; min: string }>>({
    calentamiento: { desc: "", min: "" },
    tecnica: { desc: "", min: "" },
    tactica: { desc: "", min: "" },
    cierre: { desc: "", min: "" },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: rels } = await supabase.from("entrenador_categorias").select("categoria_id").eq("entrenador_id", user.id);
      const ids = (rels ?? []).map((r: { categoria_id: string }) => r.categoria_id);
      if (ids.length === 0) { setLoading(false); return; }
      const { data } = await supabase.from("categorias").select("id, nombre").in("id", ids).order("nombre");
      const lista = data ?? [];
      setCats(lista);
      if (lista.length === 1) setCatId(lista[0].id);
      setLoading(false);
    };
    load();
  }, []);

  const setBloque = (key: string, field: "desc" | "min", value: string) =>
    setBloques((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const guardar = async () => {
    const selectedCat = cats.length === 1 ? cats[0].id : catId;
    if (!selectedCat) { setError("Selecciona una categoría."); return; }
    if (!fecha) { setError("Selecciona una fecha."); return; }

    setSaving(true); setError("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Sesión expirada, vuelve a entrar."); setSaving(false); return; }

    const payload: Record<string, unknown> = {
      categoria_id: selectedCat,
      entrenador_id: user.id,
      fecha,
      objetivo: objetivo.trim() || null,
      materiales: materiales.trim() || null,
    };
    for (const b of BLOQUES) {
      payload[`${b.key}_desc`] = bloques[b.key].desc.trim() || null;
      payload[`${b.key}_min`] = bloques[b.key].min ? Number(bloques[b.key].min) : null;
    }

    const { data, error: err } = await supabase.from("planeaciones").insert(payload).select("id").single();
    if (err) { setError("Error al guardar. Inténtalo de nuevo."); setSaving(false); return; }
    router.replace(`/coach/planeaciones/${data.id}`);
  };

  const input = "input-theme text-sm";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <div className="w-7 h-7 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10" style={{ background: "var(--bg-page)" }}>
      <header className="border-b px-4 py-4 flex items-center gap-3 sticky top-0 z-10" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <button onClick={() => router.back()} className="link-muted-theme w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-90">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 className="font-bold" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>Nueva planeación</h1>
      </header>

      <div className="w-full max-w-lg mx-auto px-4 pt-5 space-y-5">
        {cats.length > 1 && (
          <div>
            <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Categoría</label>
            <select className={input} value={catId} onChange={(e) => setCatId(e.target.value)} style={{ backgroundImage: "none" }}>
              <option value="" style={{ background: "var(--bg-alt)" }}>Selecciona una categoría</option>
              {cats.map((c) => <option key={c.id} value={c.id} style={{ background: "var(--bg-alt)" }}>{c.nombre}</option>)}
            </select>
          </div>
        )}

        <div>
          <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Fecha</label>
          <input type="date" className={input} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>

        <div>
          <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>Objetivo de la sesión</label>
          <input className={input} placeholder="Ej: Mejorar control orientado"
            value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
        </div>

        {BLOQUES.map((b) => (
          <div key={b.key} className="rounded-2xl border p-4 space-y-3" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-surface-1)" }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-pantera-green">{b.label}</span>
              <div className="flex items-center gap-1.5">
                <input type="number" min={0} inputMode="numeric" placeholder="0"
                  className="w-14 text-center bg-transparent border rounded-lg py-1 text-sm"
                  style={{ borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
                  value={bloques[b.key].min} onChange={(e) => setBloque(b.key, "min", e.target.value)} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>min</span>
              </div>
            </div>
            <textarea rows={3} className={`${input} resize-none`} placeholder={`Describe el bloque de ${b.label.toLowerCase()}...`}
              value={bloques[b.key].desc} onChange={(e) => setBloque(b.key, "desc", e.target.value)} />
          </div>
        ))}

        <div>
          <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Materiales <span className="normal-case tracking-normal" style={{ color: "var(--text-muted)" }}>(opcional)</span>
          </label>
          <input className={input} placeholder="Ej: conos, pecheras, 6 balones"
            value={materiales} onChange={(e) => setMateriales(e.target.value)} />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button onClick={guardar} disabled={saving}
          className="btn-primary w-full disabled:opacity-50">
          {saving ? "Guardando..." : "Guardar planeación"}
        </button>
      </div>
    </div>
  );
}
