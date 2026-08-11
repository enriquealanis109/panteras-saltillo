"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TiendaGate from "@/components/TiendaGate";

interface PedidoConfirmacion {
  pedido: { id: string; total: number; cliente_nombre: string; estado: string };
  items: { producto_nombre: string; talla: string; color: string | null; cantidad: number; precio_unitario: number; personalizacion_nombre?: string | null; personalizacion_numero?: string | null }[];
}

export default function ConfirmacionPedidoPage() {
  return (
    <TiendaGate>
      <ConfirmacionContent />
    </TiendaGate>
  );
}

function ConfirmacionContent() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<PedidoConfirmacion | null>(null);
  const [noEncontrado, setNoEncontrado] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(`pedido_confirmacion_${id}`);
      if (raw) setData(JSON.parse(raw));
      else setNoEncontrado(true);
    } catch {
      setNoEncontrado(true);
    }
  }, [id]);

  const mensajeWhatsapp = `Hola, quiero enviar el comprobante de pago de mi pedido #${id.slice(0, 8)}${data ? ` por $${data.pedido.total.toFixed(2)}` : ""}`;

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Navbar />

      <section className="pt-32 pb-20 px-5 sm:px-6 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-pantera-green/10 border border-pantera-green/30 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pantera-green">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <h1 className="section-title text-3xl">¡Pedido recibido!</h1>
          <p className="text-gray-500 text-sm mt-2">Número de pedido: <span className="text-white font-mono">{id.slice(0, 8)}</span></p>
        </div>

        {noEncontrado || !data ? (
          <div className="card text-center py-10">
            <p className="text-gray-400">Tu pedido fue creado correctamente. Guarda tu número de pedido: <span className="text-white font-mono">{id.slice(0, 8)}</span></p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card p-5 space-y-2">
              <p className="text-white font-bold text-sm mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Resumen</p>
              {data.items.map((it, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    {it.cantidad}× {it.producto_nombre} ({it.talla}{it.color ? ` · ${it.color}` : ""})
                    {(it.personalizacion_nombre || it.personalizacion_numero) && (
                      <span className="block text-xs text-gray-600">
                        {it.personalizacion_nombre}{it.personalizacion_nombre && it.personalizacion_numero ? " · " : ""}{it.personalizacion_numero ? `#${it.personalizacion_numero}` : ""}
                      </span>
                    )}
                  </span>
                  <span className="text-white">${(it.precio_unitario * it.cantidad).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-white/10 pt-2 mt-2 flex items-center justify-between">
                <span className="text-gray-400 font-semibold">Total</span>
                <span className="text-pantera-green font-bold text-lg">${data.pedido.total.toFixed(2)} MXN</span>
              </div>
            </div>

            <div className="card p-5 space-y-2">
              <p className="text-white font-bold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>Instrucciones de pago</p>
              <p className="text-gray-500 text-xs">Realiza tu transferencia y envía el comprobante por WhatsApp.</p>
              <div className="bg-white/[0.04] rounded-lg p-3 text-sm space-y-1 text-gray-300">
                <p>Banco: <span className="text-white">___ (pendiente de configurar)</span></p>
                <p>CLABE: <span className="text-white">___ (pendiente de configurar)</span></p>
                <p>A nombre de: <span className="text-white">___ (pendiente de configurar)</span></p>
              </div>
            </div>

            <div className="card p-5">
              <p className="text-white font-bold text-sm mb-1" style={{ fontFamily: "Syne, sans-serif" }}>Recolección</p>
              <p className="text-gray-400 text-sm">Canchas del Colegio Vivir · Carretera Los González Km 1, Los Tulipanes, 25297 Saltillo, Coah.</p>
            </div>

            <a href={`https://api.whatsapp.com/send?phone=528445028582&text=${encodeURIComponent(mensajeWhatsapp)}`} target="_blank" rel="noopener noreferrer"
              className="btn-primary w-full flex items-center justify-center gap-2">
              Enviar comprobante por WhatsApp
            </a>
          </div>
        )}

        <Link href="/tienda" className="block text-center text-gray-500 hover:text-white text-sm mt-6 transition-colors">
          Volver a la tienda
        </Link>
      </section>

      <Footer />
    </main>
  );
}
