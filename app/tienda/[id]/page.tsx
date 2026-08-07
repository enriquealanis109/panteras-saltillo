"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase, Producto, ProductoVariante } from "@/lib/supabase";
import { useCart } from "@/lib/cart-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TiendaGate from "@/components/TiendaGate";

export default function ProductoPage() {
  return (
    <TiendaGate>
      <ProductoContent />
    </TiendaGate>
  );
}

function ProductoContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { addItem } = useCart();

  const [producto, setProducto]   = useState<Producto | null>(null);
  const [variantes, setVariantes] = useState<ProductoVariante[]>([]);
  const [varianteId, setVarianteId] = useState<string | null>(null);
  const [cantidad, setCantidad]   = useState(1);
  const [loading, setLoading]     = useState(true);
  const [nombrePersonal, setNombrePersonal] = useState("");
  const [numeroPersonal, setNumeroPersonal] = useState("");

  useEffect(() => {
    const cargar = async () => {
      const [{ data: p }, { data: v }] = await Promise.all([
        supabase.from("productos").select("*").eq("id", id).single(),
        supabase.from("producto_variantes").select("*").eq("producto_id", id),
      ]);
      setProducto(p);
      setVariantes(v ?? []);
      const primeraDisponible = (v ?? []).find((x) => x.stock > 0);
      setVarianteId(primeraDisponible?.id ?? null);
      setLoading(false);
    };
    cargar();
  }, [id]);

  const variante = variantes.find((v) => v.id === varianteId);

  const agregarAlCarrito = () => {
    if (!producto || !variante) return;
    addItem({
      varianteId: variante.id,
      productoId: producto.id,
      productoNombre: producto.nombre,
      imagenUrl: producto.imagen_url ?? null,
      talla: variante.talla,
      color: variante.color ?? null,
      precioUnitario: producto.precio,
      personalizable: producto.personalizable,
      personalizacionNombre: producto.personalizable ? nombrePersonal.trim() || undefined : undefined,
      personalizacionNumero: producto.personalizable ? numeroPersonal.trim() || undefined : undefined,
    }, cantidad);
    toast.success(producto.personalizable ? "Agregado — puedes agregar otro con datos distintos" : "Agregado al carrito");
    setCantidad(1);
    setNombrePersonal("");
    setNumeroPersonal("");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!producto) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Producto no encontrado.</p>
        <button onClick={() => router.push("/tienda")} className="btn-outline">Volver a la tienda</button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <section className="pt-32 pb-20 px-5 sm:px-6 max-w-4xl mx-auto">
        <button onClick={() => router.push("/tienda")}
          className="text-gray-500 hover:text-white text-sm flex items-center gap-1.5 mb-6 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Volver a la tienda
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-white/[0.03] rounded-2xl overflow-hidden border border-white/[0.07]">
            {producto.imagen_url ? (
              <img src={producto.imagen_url} alt={producto.nombre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-700">Sin imagen</div>
            )}
          </div>

          <div>
            <h1 className="section-title text-3xl">{producto.nombre}</h1>
            <p className="text-pantera-green font-bold text-2xl mt-2">${producto.precio.toFixed(2)} MXN</p>
            {producto.descripcion && <p className="text-gray-400 mt-4 leading-relaxed">{producto.descripcion}</p>}

            {variantes.length === 0 ? (
              <p className="text-gray-500 mt-6">Sin variantes disponibles.</p>
            ) : (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Talla / Color</label>
                  <div className="flex flex-wrap gap-2">
                    {variantes.map((v) => {
                      const agotado = v.stock <= 0;
                      const seleccionado = v.id === varianteId;
                      return (
                        <button key={v.id} disabled={agotado}
                          onClick={() => { setVarianteId(v.id); setCantidad(1); }}
                          className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
                            agotado
                              ? "border-white/5 text-gray-700 line-through cursor-not-allowed"
                              : seleccionado
                                ? "border-pantera-green bg-pantera-green/10 text-pantera-green"
                                : "border-white/15 text-gray-300 hover:border-white/30"
                          }`}>
                          {v.talla}{v.color ? ` · ${v.color}` : ""}{agotado ? " (Agotado)" : ""}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {variante && producto.personalizable && (
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Personalizar</label>
                    <input value={nombrePersonal} onChange={(e) => setNombrePersonal(e.target.value)}
                      placeholder="Nombre para personalizar"
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-pantera-green/50" />
                    <input value={numeroPersonal} onChange={(e) => setNumeroPersonal(e.target.value)}
                      placeholder="Número (opcional)"
                      className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-pantera-green/50" />
                    <p className="text-gray-600 text-xs">Cada unidad personalizada se agrega por separado — agrega de nuevo para otro nombre.</p>
                  </div>
                )}

                {variante && !producto.personalizable && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-widest block mb-2">Cantidad</label>
                    <div className="flex items-center gap-3">
                      <button onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                        className="w-9 h-9 rounded-lg border border-white/15 text-white hover:border-white/30 transition-all">−</button>
                      <span className="text-white font-semibold w-8 text-center">{cantidad}</span>
                      <button onClick={() => setCantidad((c) => Math.min(variante.stock, c + 1))}
                        className="w-9 h-9 rounded-lg border border-white/15 text-white hover:border-white/30 transition-all">+</button>
                      <span className="text-gray-600 text-xs">{variante.stock} disponibles</span>
                    </div>
                  </div>
                )}

                <button onClick={agregarAlCarrito} disabled={!variante}
                  className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed">
                  {producto.personalizable ? "Agregar personalizado al carrito" : "Agregar al carrito"}
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
