"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, type Planeacion, type PlantillaPlaneacion, type BandaEdad } from "@/lib/supabase";

interface CatMini { id: string; nombre: string; banda_edad: BandaEdad | null }
interface PlaneacionRow extends Planeacion { categoria_nombre: string }

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const BANDA_LABEL: Record<BandaEdad, string> = { menores: "Menores", intermedios: "Intermedios", mayores: "Mayores" };

const fmtFecha = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MESES[m - 1]} ${y}`;
};

const hoyISO = () => new Date().toLocaleDateString("sv-SE", { timeZone: "America/Monterrey" });

export default function PlaneacionesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"mias" | "catalogo">("mias");
  const [cats, setCats] = useState<CatMini[]>([]);
  const [catId, setCatId] = useState("");
  const [planes, setPlanes] = useState<PlaneacionRow[]>([]);
  const [plantillas, setPlantillas] = useState<PlantillaPlaneacion[]>([]);
  const [loading, setLoading] = useState(true);

  const [usando, setUsando] = useState<PlantillaPlaneacion | null>(null);
  const [catUsar, setCatUsar] = useState("");
  const [fechaUsar, setFechaUsar] = useState(hoyISO());
  const [creando, setCreando] = useState(false);
  const [errorUsar, setErrorUsar] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: rels } = await supabase.from("entrenador_categorias").select("categoria_id").eq("entrenador_id", user.id);
      const ids = (rels ?? []).map((r: { categoria_id: string }) => r.categoria_id);
      if (ids.length === 0) { setLoading(false); return; }
      const { data: catsData } = await supabase.from("categorias").select("id, nombre, banda_edad").in("id", ids).order("nombre");
      const lista = catsData ?? [];
      setCats(lista);
      if (lista.length === 1) setCatUsar(lista[0].id);

      const { data: planesData } = await supabase
        .from("planeaciones").select("*").in("categoria_id", ids).order("fecha", { ascending: false });
      const catMap: Record<string, string> = {};
      lista.forEach((c) => { catMap[c.id] = c.nombre; });
      setPlanes((planesData ?? []).map((p) => ({ ...p, categoria_nombre: catMap[p.categoria_id] ?? "" })));

      const bandas = Array.from(new Set(lista.map((c) => c.banda_edad).filter(Boolean))) as BandaEdad[];
      if (bandas.length > 0) {
        const { data: plantillasData } = await supabase
          .from("plantillas_planeacion").select("*").in("banda_edad", bandas).order("banda_edad").order("semana");
        setPlantillas(plantillasData ?? []);
      }

      setLoading(false);
    };
    load();
  }, []);

  const visibles = catId ? planes.filter((p) => p.categoria_id === catId) : planes;

  const abrirUsar = (p: PlantillaPlaneacion) => {
    setUsando(p); setErrorUsar("");
    setFechaUsar(hoyISO());
    if (cats.length === 1) setCatUsar(cats[0].id);
  };

  const confirmarUsar = async () => {
    if (!usando) return;
    const cat = cats.length === 1 ? cats[0].id : catUsar;
    if (!cat) { setErrorUsar("Selecciona una categoría."); return; }
    if (!fechaUsar) { setErrorUsar("Selecciona una fecha."); return; }

    setCreando(true); setErrorUsar("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setErrorUsar("Sesión expirada, vuelve a entrar."); setCreando(false); return; }

    const { data, error } = await supabase.from("planeaciones").insert({
      categoria_id: cat,
      entrenador_id: user.id,
      fecha: fechaUsar,
      objetivo: usando.objetivo,
      calentamiento_desc: usando.calentamiento_desc, calentamiento_min: usando.calentamiento_min,
      tecnica_desc: usando.tecnica_desc, tecnica_min: usando.tecnica_min,
      tactica_desc: usando.tactica_desc, tactica_min: usando.tactica_min,
      cierre_desc: usando.cierre_desc, cierre_min: usando.cierre_min,
      materiales: usando.materiales,
    }).select("id").single();

    if (error) { setErrorUsar("Error al crear la planeación. Inténtalo de nuevo."); setCreando(false); return; }
    router.push(`/coach/planeaciones/${data.id}`);
  };

  return (
    <div className="min-h-screen pb-10" style={{ background: "var(--bg-page)" }}>
      <header className="border-b px-4 py-4 flex items-center justify-between sticky top-0 z-10" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="link-muted-theme w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-90">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 className="font-bold" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>Planeaciones</h1>
        </div>
        {tab === "mias" && (
          <button onClick={() => router.push("/coach/planeaciones/nueva")}
            className="bg-pantera-green text-white text-sm font-semibold px-4 py-2 rounded-xl active:scale-95 transition-all">
            + Nueva
          </button>
        )}
      </header>

      <div className="flex border-b" style={{ borderColor: "var(--border-subtle)" }}>
        {([["mias", "Mis planeaciones"], ["catalogo", "Catálogo"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all ${
              tab === key ? "border-pantera-green text-pantera-green" : "border-transparent"
            }`}
            style={tab !== key ? { color: "var(--text-muted)" } : undefined}>
            {label}
          </button>
        ))}
      </div>

      <div className="w-full max-w-lg mx-auto px-4 pt-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : cats.length === 0 ? (
          <p className="text-sm text-center py-16" style={{ color: "var(--text-muted)" }}>
            No tienes categorías asignadas todavía.
          </p>
        ) : tab === "mias" ? (
          <>
            {cats.length > 1 && (
              <select value={catId} onChange={(e) => setCatId(e.target.value)}
                className="input-theme text-sm" style={{ backgroundImage: "none" }}>
                <option value="" style={{ background: "var(--bg-alt)" }}>Todas mis categorías</option>
                {cats.map((c) => <option key={c.id} value={c.id} style={{ background: "var(--bg-alt)" }}>{c.nombre}</option>)}
              </select>
            )}
            {visibles.length === 0 ? (
              <div className="rounded-2xl text-center py-16 px-5 border" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Sin planeaciones aún</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Crea una nueva o toma una del Catálogo.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibles.map((p) => (
                  <button key={p.id} onClick={() => router.push(`/coach/planeaciones/${p.id}`)}
                    className="w-full text-left rounded-2xl border p-4 transition-all active:scale-[0.99] hover:border-pantera-green/30"
                    style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-pantera-green">{fmtFecha(p.fecha)}</span>
                      {cats.length > 1 && <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{p.categoria_nombre}</span>}
                    </div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {p.objetivo?.trim() || "Sin objetivo definido"}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {plantillas.length === 0 ? (
              <div className="rounded-2xl text-center py-16 px-5 border" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Sin catálogo todavía</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Tu categoría no tiene banda de edad asignada, o el coordinador aún no cargó planeaciones modelo.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {plantillas.map((p) => (
                  <div key={p.id} className="rounded-2xl border p-4" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest text-pantera-green">
                        Semana {p.semana} · {BANDA_LABEL[p.banda_edad]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{p.titulo}</p>
                    {p.objetivo && <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>{p.objetivo}</p>}
                    <button onClick={() => abrirUsar(p)}
                      className="w-full py-2.5 rounded-xl border text-sm font-bold text-pantera-green border-pantera-green/30 hover:bg-pantera-green/10 transition-colors">
                      Usar esta planeación
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {usando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.75)" }}
          onClick={() => !creando && setUsando(null)}>
          <div className="bg-[#111] border border-white/[0.08] rounded-2xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg" style={{ fontFamily: "Syne, sans-serif" }}>Usar planeación</h2>
            <p className="text-gray-400 text-sm">"{usando.titulo}" — elige para cuándo la quieres.</p>
            {cats.length > 1 && (
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Categoría</label>
                <select value={catUsar} onChange={(e) => setCatUsar(e.target.value)}
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-pantera-green/50"
                  style={{ backgroundImage: "none" }}>
                  <option value="" style={{ background: "#0a0a0a" }}>Selecciona una categoría</option>
                  {cats.map((c) => <option key={c.id} value={c.id} style={{ background: "#0a0a0a" }}>{c.nombre}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Fecha</label>
              <input type="date" value={fechaUsar} onChange={(e) => setFechaUsar(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-pantera-green/50" />
            </div>
            {errorUsar && <p className="text-red-400 text-sm">{errorUsar}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={confirmarUsar} disabled={creando}
                className="flex-1 bg-pantera-green text-white text-sm font-semibold py-3 rounded-xl disabled:opacity-50 transition-opacity">
                {creando ? "Creando..." : "Crear planeación"}
              </button>
              <button onClick={() => setUsando(null)} disabled={creando}
                className="px-4 py-3 text-sm text-gray-500 hover:text-white border border-white/10 rounded-xl transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
