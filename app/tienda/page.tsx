"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, Producto } from "@/lib/supabase";
import { useCart } from "@/lib/cart-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TiendaGate from "@/components/TiendaGate";

export default function TiendaPage() {
  return (
    <TiendaGate>
      <TiendaContent />
    </TiendaGate>
  );
}

function TiendaContent() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading]     = useState(true);
  const { totalItems } = useCart();

  useEffect(() => {
    const cargar = async () => {
      const { data } = await supabase.from("productos").select("*").eq("activo", true).order("orden");
      setProductos(data ?? []);
      setLoading(false);
    };
    cargar();
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <section className="pt-32 pb-20 px-5 sm:px-6 max-w-6xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <h1 className="section-title">Tienda Oficial Panteras Saltillo</h1>
            <p className="section-subtitle mt-2 max-w-xl">
              Gorras, playeras y accesorios oficiales.
            </p>
          </div>
          <Link href="/tienda/carrito"
            className="relative flex-shrink-0 w-12 h-12 rounded-full border border-white/10 bg-white/[0.04] hover:border-pantera-green/50 transition-all flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
            </svg>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-pantera-green text-white text-[10px] font-bold flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
          </div>
        ) : productos.length === 0 ? (
          <p className="text-gray-500 text-center py-20">Próximamente nuevos productos.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {productos.map((p) => (
              <Link key={p.id} href={`/tienda/${p.id}`} className="card p-0 overflow-hidden group hover:border-pantera-green/40 transition-all">
                <div className="aspect-square bg-white/[0.03] overflow-hidden">
                  {p.imagen_url ? (
                    <img src={p.imagen_url} alt={p.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700">Sin imagen</div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-white font-semibold text-sm truncate">{p.nombre}</p>
                  <p className="text-pantera-green font-bold mt-1">${p.precio.toFixed(2)} MXN</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
