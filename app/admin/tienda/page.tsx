"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase, Producto, ProductoVariante } from "@/lib/supabase";

const inputCls = "w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-pantera-green/50";
const TALLA_PLACEHOLDER = "Talla (ej. 8 años, M, L)";

export default function AdminTiendaPage() {
  const router = useRouter();
  const [productos, setProductos]   = useState<Producto[]>([]);
  const [variantes, setVariantes]   = useState<Record<string, ProductoVariante[]>>({});
  const [expandido, setExpandido]   = useState<string | null>(null);

  const [nombre, setNombre]         = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio]         = useState("");
  const [personalizable, setPersonalizable] = useState(false);
  const [imagen, setImagen]         = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving]         = useState(false);
  const fileRef                     = useRef<HTMLInputElement>(null);

  // Tallas/stock que se arman antes de guardar el producto (se crean junto con él en un solo paso)
  const [pendientes, setPendientes] = useState<{ talla: string; color: string; stock: string }[]>([]);
  const [pvTalla, setPvTalla] = useState("");
  const [pvColor, setPvColor] = useState("");
  const [pvStock, setPvStock] = useState("");

  const [talla, setTalla] = useState("");
  const [color, setColor] = useState("");
  const [stock, setStock] = useState("");

  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500); };

  const cargar = async () => {
    const { data: prods } = await supabase.from("productos").select("*").order("orden");
    setProductos(prods ?? []);
    const { data: vars } = await supabase.from("producto_variantes").select("*");
    const agrupadas: Record<string, ProductoVariante[]> = {};
    (vars ?? []).forEach((v) => {
      if (!agrupadas[v.producto_id]) agrupadas[v.producto_id] = [];
      agrupadas[v.producto_id].push(v);
    });
    setVariantes(agrupadas);
  };

  useEffect(() => { cargar(); }, []);

  useEffect(() => {
    if (!imagen) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(imagen);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imagen]);

  const agregarVariantePendiente = () => {
    if (!pvTalla.trim() || pvStock === "") return;
    setPendientes((prev) => [...prev, { talla: pvTalla.trim(), color: pvColor.trim(), stock: pvStock }]);
    setPvTalla(""); setPvColor(""); setPvStock("");
  };

  const quitarVariantePendiente = (index: number) => {
    setPendientes((prev) => prev.filter((_, i) => i !== index));
  };

  const agregarProducto = async () => {
    if (!nombre.trim() || !precio) return;
    setSaving(true);
    let imagen_url: string | null = null;
    if (imagen) {
      const ext  = imagen.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { data: uploaded, error: uploadError } = await supabase.storage.from("tienda").upload(path, imagen, { upsert: true });
      if (uploadError || !uploaded) {
        showToast(`Error: ${uploadError?.message ?? "No se pudo subir la imagen"}`, false);
        setSaving(false); return;
      }
      imagen_url = supabase.storage.from("tienda").getPublicUrl(uploaded.path).data.publicUrl;
    }
    const orden = productos.length;
    const { data: nuevo, error } = await supabase.from("productos").insert({
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || null,
      precio: parseFloat(precio),
      imagen_url,
      personalizable,
      orden,
    }).select().single();
    if (error || !nuevo) { showToast(`Error: ${error?.message ?? "No se pudo crear el producto"}`, false); setSaving(false); return; }

    if (pendientes.length > 0) {
      const { error: variantesError } = await supabase.from("producto_variantes").insert(
        pendientes.map((v) => ({ producto_id: nuevo.id, talla: v.talla, color: v.color || null, stock: parseInt(v.stock, 10) }))
      );
      if (variantesError) showToast(`Producto creado, pero hubo un error con las tallas: ${variantesError.message}`, false);
    }

    setNombre(""); setDescripcion(""); setPrecio(""); setImagen(null); setPersonalizable(false); setPendientes([]);
    if (fileRef.current) fileRef.current.value = "";
    setSaving(false); await cargar(); showToast("Producto agregado");
  };

  const eliminarProducto = async (p: Producto) => {
    if (p.imagen_url) {
      const oldPath = p.imagen_url.split("/object/public/tienda/")[1];
      if (oldPath) await supabase.storage.from("tienda").remove([decodeURIComponent(oldPath)]);
    }
    await supabase.from("productos").delete().eq("id", p.id);
    await cargar(); showToast("Producto eliminado");
  };

  const toggleActivo = async (p: Producto) => {
    await supabase.from("productos").update({ activo: !p.activo }).eq("id", p.id);
    await cargar();
  };

  const togglePersonalizable = async (p: Producto) => {
    await supabase.from("productos").update({ personalizable: !p.personalizable }).eq("id", p.id);
    await cargar();
  };

  const agregarVariante = async (productoId: string) => {
    if (!talla.trim() || stock === "") return;
    const { error } = await supabase.from("producto_variantes").insert({
      producto_id: productoId,
      talla: talla.trim(),
      color: color.trim() || null,
      stock: parseInt(stock, 10),
    });
    if (error) { showToast(`Error: ${error.message}`, false); return; }
    setTalla(""); setColor(""); setStock("");
    await cargar(); showToast("Variante agregada");
  };

  const actualizarStock = async (v: ProductoVariante, nuevoStock: number) => {
    if (nuevoStock < 0) return;
    await supabase.from("producto_variantes").update({ stock: nuevoStock }).eq("id", v.id);
    await cargar();
  };

  const eliminarVariante = async (v: ProductoVariante) => {
    await supabase.from("producto_variantes").delete().eq("id", v.id);
    await cargar(); showToast("Variante eliminada");
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
          <h1 className="text-white font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Tienda</h1>
          <p className="text-gray-600 text-xs">{productos.length} productos</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* Formulario nuevo producto */}
        <div id="tour-tienda-form" className="card p-4 space-y-3">
          <p className="text-white font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Agregar producto</p>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre del producto" className={inputCls} />
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción (opcional)" rows={2} className={inputCls} />
          <input value={precio} onChange={(e) => setPrecio(e.target.value)} type="number" min="0" step="0.01" placeholder="Precio (MXN)" className={inputCls} />
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={personalizable} onChange={(e) => setPersonalizable(e.target.checked)}
              className="w-4 h-4 accent-pantera-green" />
            Personalizable (el cliente escribe nombre y número)
          </label>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-widest block mb-1.5">Imagen (PNG o JPG)</label>
            <div className="flex items-center gap-3">
              {previewUrl && (
                <img src={previewUrl} alt="Vista previa" className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-white/10" />
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setImagen(e.target.files?.[0] ?? null)}
                className="flex-1 min-w-0 text-gray-400 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-white/[0.06] file:text-white file:text-xs" />
            </div>
          </div>

          {/* Tallas y stock — se crean junto con el producto */}
          <div className="border-t border-white/[0.07] pt-3 space-y-2">
            <label className="text-xs text-gray-500 uppercase tracking-widest block">Tallas y stock</label>
            <p className="text-gray-600 text-xs">Para niños usa talla y edad (ej. "8 años"); para adultos usa la talla (S, M, L, XL).</p>
            {pendientes.length > 0 && (
              <div className="space-y-1.5">
                {pendientes.map((v, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-2">
                    <span className="text-white text-xs flex-1">{v.talla}{v.color ? ` · ${v.color}` : ""} — {v.stock} pza.</span>
                    <button onClick={() => quitarVariantePendiente(i)} className="text-red-400 text-xs">×</button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input value={pvTalla} onChange={(e) => setPvTalla(e.target.value)} placeholder={TALLA_PLACEHOLDER} className={`${inputCls} !py-1.5 !px-2.5 text-xs`} />
              <input value={pvColor} onChange={(e) => setPvColor(e.target.value)} placeholder="Color (opcional)" className={`${inputCls} !py-1.5 !px-2.5 text-xs`} />
              <input value={pvStock} onChange={(e) => setPvStock(e.target.value)} type="number" min="0" placeholder="Stock" className={`${inputCls} !py-1.5 !px-2.5 text-xs w-20`} />
            </div>
            <button onClick={agregarVariantePendiente} disabled={!pvTalla.trim() || pvStock === ""}
              className="btn-outline w-full text-xs py-2 disabled:opacity-40">
              + Agregar talla
            </button>
            {pendientes.length === 0 && (
              <p className="text-gray-600 text-xs">Puedes guardar el producto sin tallas y agregarlas después, pero no será comprable hasta tener al menos una.</p>
            )}
          </div>

          <button onClick={agregarProducto} disabled={saving || !nombre.trim() || !precio}
            className="btn-primary w-full text-sm py-3 disabled:opacity-50 active:scale-[0.98] transition-transform">
            {saving ? "Guardando..." : "Agregar producto"}
          </button>
        </div>

        {/* Lista de productos */}
        {productos.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">Sin productos registrados.</p>
        ) : (
          <div id="tour-tienda-lista" className="space-y-2">
            {productos.map((p) => (
              <div key={p.id} className={`card p-4 space-y-3 ${!p.activo ? "opacity-40" : ""}`}>
                <div className="flex items-center gap-3">
                  {p.imagen_url && <img src={p.imagen_url} alt={p.nombre} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold text-sm truncate">{p.nombre}</p>
                    <p className="text-pantera-green text-xs font-bold mt-0.5">${p.precio.toFixed(2)} MXN</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActivo(p)}
                      className={`text-xs px-2.5 py-1 rounded-full border font-bold transition-all active:scale-95 ${
                        p.activo ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-white/[0.04] border-white/10 text-gray-600"
                      }`}>
                      {p.activo ? "Activo" : "Oculto"}
                    </button>
                    <button onClick={() => eliminarProducto(p)} className="text-red-400 hover:text-red-300 text-xs border border-red-500/20 hover:border-red-500/40 px-2.5 py-1 rounded-full transition-all active:scale-95">Borrar</button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <button onClick={() => setExpandido(expandido === p.id ? null : p.id)}
                    id="tour-tienda-variantes"
                    className="text-xs text-gray-400 hover:text-white flex items-center gap-1.5">
                    {expandido === p.id ? "Ocultar" : "Gestionar"} tallas y stock ({(variantes[p.id] ?? []).length})
                  </button>
                  <button onClick={() => togglePersonalizable(p)}
                    className={`text-[10px] px-2.5 py-1 rounded-full border font-bold transition-all active:scale-95 ${
                      p.personalizable ? "bg-blue-500/10 border-blue-500/30 text-blue-400" : "bg-white/[0.04] border-white/10 text-gray-600"
                    }`}>
                    {p.personalizable ? "Personalizable" : "Sin personalizar"}
                  </button>
                </div>

                {expandido === p.id && (
                  <div className="border-t border-white/[0.07] pt-3 space-y-2">
                    {(variantes[p.id] ?? []).map((v) => (
                      <div key={v.id} className="flex items-center gap-2 bg-white/[0.04] rounded-lg px-3 py-2">
                        <span className="text-white text-xs flex-1">{v.talla}{v.color ? ` · ${v.color}` : ""}</span>
                        <button onClick={() => actualizarStock(v, v.stock - 1)} className="w-6 h-6 rounded border border-white/15 text-white text-xs">−</button>
                        <span className="text-white text-xs w-6 text-center">{v.stock}</span>
                        <button onClick={() => actualizarStock(v, v.stock + 1)} className="w-6 h-6 rounded border border-white/15 text-white text-xs">+</button>
                        <button onClick={() => eliminarVariante(v)} className="text-red-400 text-xs ml-1">×</button>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <input value={talla} onChange={(e) => setTalla(e.target.value)} placeholder={TALLA_PLACEHOLDER} className={`${inputCls} !py-1.5 !px-2.5 text-xs`} />
                      <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Color (opcional)" className={`${inputCls} !py-1.5 !px-2.5 text-xs`} />
                      <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" min="0" placeholder="Stock" className={`${inputCls} !py-1.5 !px-2.5 text-xs w-20`} />
                    </div>
                    <button onClick={() => agregarVariante(p.id)} disabled={!talla.trim() || stock === ""}
                      className="btn-outline w-full text-xs py-2 disabled:opacity-40">
                      Agregar variante
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
