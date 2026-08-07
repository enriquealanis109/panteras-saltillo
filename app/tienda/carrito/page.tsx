"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/lib/cart-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TiendaGate from "@/components/TiendaGate";

const inputCls = "w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-pantera-green/50";

export default function CarritoPage() {
  return (
    <TiendaGate>
      <CarritoContent />
    </TiendaGate>
  );
}

function CarritoContent() {
  const router = useRouter();
  const { items, updateQty, removeItem, totalPrecio, clear } = useCart();

  const [nombre, setNombre]     = useState("");
  const [telefono, setTelefono] = useState("");
  const [notas, setNotas]       = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [stockActual, setStockActual] = useState<Record<string, number>>({});

  useEffect(() => {
    if (items.length === 0) return;
    const revalidar = async () => {
      const { data } = await supabase
        .from("producto_variantes")
        .select("id, stock")
        .in("id", items.map((i) => i.varianteId));
      const map: Record<string, number> = {};
      (data ?? []).forEach((v) => { map[v.id] = v.stock; });
      setStockActual(map);
    };
    revalidar();
  }, [items.length]);

  const confirmarPedido = async () => {
    setError(null);
    if (!nombre.trim() || !telefono.trim()) {
      setError("Nombre y teléfono son obligatorios");
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_nombre: nombre,
          cliente_telefono: telefono,
          notas,
          items: items.map((i) => ({
            varianteId: i.varianteId,
            cantidad: i.cantidad,
            personalizacionNombre: i.personalizacionNombre,
            personalizacionNumero: i.personalizacionNumero,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear el pedido");
        setEnviando(false);
        return;
      }
      sessionStorage.setItem(`pedido_confirmacion_${data.pedido.id}`, JSON.stringify(data));
      clear();
      router.push(`/tienda/pedido/${data.pedido.id}`);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      setEnviando(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <section className="pt-32 pb-20 px-5 sm:px-6 max-w-3xl mx-auto">
        <h1 className="section-title text-3xl mb-8">Tu carrito</h1>

        {items.length === 0 ? (
          <div className="card text-center py-16">
            <p className="text-gray-500 mb-4">Tu carrito está vacío.</p>
            <button onClick={() => router.push("/tienda")} className="btn-outline">Ir a la tienda</button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-3">
              {items.map((i) => {
                const disponible = stockActual[i.varianteId];
                // Varias líneas (personalizadas) pueden compartir la misma variante — comparar
                // contra la suma total pedida de esa variante, no solo la cantidad de esta línea.
                const totalPedidoVariante = items
                  .filter((x) => x.varianteId === i.varianteId)
                  .reduce((sum, x) => sum + x.cantidad, 0);
                const sinStock = disponible !== undefined && disponible < totalPedidoVariante;
                return (
                  <div key={i.lineId} className={`card p-4 flex items-center gap-3 ${sinStock ? "border-red-500/40" : ""}`}>
                    <div className="w-16 h-16 rounded-lg bg-white/[0.03] overflow-hidden flex-shrink-0">
                      {i.imagenUrl && <img src={i.imagenUrl} alt={i.productoNombre} className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-semibold text-sm truncate">{i.productoNombre}</p>
                      <p className="text-gray-500 text-xs">{i.talla}{i.color ? ` · ${i.color}` : ""}</p>
                      {(i.personalizacionNombre || i.personalizacionNumero) && (
                        <p className="text-gray-400 text-xs">
                          {i.personalizacionNombre}{i.personalizacionNombre && i.personalizacionNumero ? " · " : ""}{i.personalizacionNumero ? `#${i.personalizacionNumero}` : ""}
                        </p>
                      )}
                      <p className="text-pantera-green text-sm font-bold">${i.precioUnitario.toFixed(2)}</p>
                      {sinStock && <p className="text-red-400 text-xs mt-1">Solo quedan {disponible} disponibles</p>}
                    </div>
                    {i.personalizable ? (
                      <span className="text-gray-500 text-xs flex-shrink-0">Cant. 1</span>
                    ) : (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => updateQty(i.lineId, i.cantidad - 1)}
                          className="w-7 h-7 rounded-lg border border-white/15 text-white text-sm">−</button>
                        <span className="text-white text-sm w-5 text-center">{i.cantidad}</span>
                        <button onClick={() => updateQty(i.lineId, i.cantidad + 1)}
                          className="w-7 h-7 rounded-lg border border-white/15 text-white text-sm">+</button>
                      </div>
                    )}
                    <button onClick={() => removeItem(i.lineId)} className="text-red-400 hover:text-red-300 text-xs flex-shrink-0">Quitar</button>
                  </div>
                );
              })}
            </div>

            <div className="card p-4 flex items-center justify-between">
              <span className="text-gray-400 font-semibold">Total</span>
              <span className="text-pantera-green font-bold text-xl">${totalPrecio.toFixed(2)} MXN</span>
            </div>

            <div className="card p-4 space-y-3">
              <p className="text-white font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Datos para tu pedido</p>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo" className={inputCls} />
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Teléfono / WhatsApp" className={inputCls} />
              <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas (opcional)" rows={2} className={inputCls} />
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button onClick={confirmarPedido} disabled={enviando}
                className="btn-primary w-full disabled:opacity-50">
                {enviando ? "Enviando..." : "Confirmar pedido"}
              </button>
              <p className="text-gray-600 text-xs text-center">Recolección en Canchas del Colegio Vivir. El pago se confirma por transferencia.</p>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
