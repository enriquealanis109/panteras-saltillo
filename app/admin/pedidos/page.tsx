"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, Pedido, PedidoItem, EstadoPedido } from "@/lib/supabase";

const ESTADOS: { value: EstadoPedido | "todos"; label: string }[] = [
  { value: "todos",          label: "Todos" },
  { value: "pendiente_pago", label: "Pend. pago" },
  { value: "pagado",         label: "Pagado" },
  { value: "listo",          label: "Listo" },
  { value: "entregado",      label: "Entregado" },
  { value: "cancelado",      label: "Cancelado" },
];

const SIGUIENTE: Partial<Record<EstadoPedido, EstadoPedido>> = {
  pendiente_pago: "pagado",
  pagado: "listo",
  listo: "entregado",
};

const ESTADO_LABEL: Record<EstadoPedido, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  listo: "Listo",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const ESTADO_COLOR: Record<EstadoPedido, string> = {
  pendiente_pago: "bg-gray-500/10 border-gray-500/30 text-gray-400",
  pagado:         "bg-blue-500/10 border-blue-500/30 text-blue-400",
  listo:          "bg-purple-500/10 border-purple-500/30 text-purple-400",
  entregado:      "bg-green-500/10 border-green-500/30 text-green-400",
  cancelado:      "bg-red-500/10 border-red-500/30 text-red-400",
};

export default function AdminPedidosPage() {
  const router = useRouter();
  const [pedidos, setPedidos]     = useState<Pedido[]>([]);
  const [items, setItems]         = useState<Record<string, PedidoItem[]>>({});
  const [expandido, setExpandido] = useState<string | null>(null);
  const [filtro, setFiltro]       = useState<EstadoPedido | "todos">("todos");
  const [toast, setToast]         = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500); };

  const cargar = async () => {
    const { data: peds } = await supabase.from("pedidos").select("*").order("created_at", { ascending: false });
    setPedidos(peds ?? []);
    const { data: its } = await supabase.from("pedido_items").select("*");
    const agrupados: Record<string, PedidoItem[]> = {};
    (its ?? []).forEach((it) => {
      if (!agrupados[it.pedido_id]) agrupados[it.pedido_id] = [];
      agrupados[it.pedido_id].push(it);
    });
    setItems(agrupados);
  };

  useEffect(() => { cargar(); }, []);

  const cambiarEstado = async (p: Pedido, nuevoEstado: EstadoPedido) => {
    await supabase.from("pedidos").update({ estado: nuevoEstado }).eq("id", p.id);
    await cargar(); showToast(`Pedido marcado como ${ESTADO_LABEL[nuevoEstado]}`);
  };

  const cancelarPedido = async (p: Pedido) => {
    const pedidoItems = items[p.id] ?? [];
    for (const it of pedidoItems) {
      if (!it.variante_id) continue;
      const { data: v } = await supabase.from("producto_variantes").select("stock").eq("id", it.variante_id).single();
      if (v) await supabase.from("producto_variantes").update({ stock: v.stock + it.cantidad }).eq("id", it.variante_id);
    }
    await supabase.from("pedidos").update({ estado: "cancelado" }).eq("id", p.id);
    await cargar(); showToast("Pedido cancelado y stock restaurado");
  };

  const visibles = filtro === "todos" ? pedidos : pedidos.filter((p) => p.estado === filtro);

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
          <h1 className="text-white font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Pedidos</h1>
          <p className="text-gray-600 text-xs">{visibles.length} pedidos</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        <div id="tour-pedidos-filtro" className="flex flex-wrap gap-2">
          {ESTADOS.map((e) => (
            <button key={e.value} onClick={() => setFiltro(e.value)}
              className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-all ${
                filtro === e.value ? "bg-pantera-green/10 border-pantera-green/40 text-pantera-green" : "border-white/10 text-gray-500"
              }`}>
              {e.label}
            </button>
          ))}
        </div>

        {visibles.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">Sin pedidos en este filtro.</p>
        ) : (
          <div id="tour-pedidos-lista" className="space-y-2">
            {visibles.map((p) => {
              const pedidoItems = items[p.id] ?? [];
              const siguiente = SIGUIENTE[p.estado];
              return (
                <div key={p.id} className="card p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">{p.cliente_nombre}</p>
                      <p className="text-gray-600 text-xs">{p.cliente_telefono} · ${p.total.toFixed(2)} MXN</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border font-bold flex-shrink-0 ${ESTADO_COLOR[p.estado]}`}>
                      {ESTADO_LABEL[p.estado]}
                    </span>
                  </div>

                  <button onClick={() => setExpandido(expandido === p.id ? null : p.id)}
                    className="text-xs text-gray-400 hover:text-white">
                    {expandido === p.id ? "Ocultar" : "Ver"} items ({pedidoItems.length})
                  </button>

                  {expandido === p.id && (
                    <div className="border-t border-white/[0.07] pt-2 space-y-1">
                      {pedidoItems.map((it) => (
                        <div key={it.id} className="flex items-center justify-between text-xs text-gray-400">
                          <span>
                            {it.cantidad}× {it.producto_nombre} ({it.talla}{it.color ? ` · ${it.color}` : ""})
                            {(it.personalizacion_nombre || it.personalizacion_numero) && (
                              <span className="block text-blue-400">
                                {it.personalizacion_nombre && `Nombre: ${it.personalizacion_nombre}`}
                                {it.personalizacion_nombre && it.personalizacion_numero ? " · " : ""}
                                {it.personalizacion_numero && `Número: ${it.personalizacion_numero}`}
                              </span>
                            )}
                          </span>
                          <span className="text-white">${(it.precio_unitario * it.cantidad).toFixed(2)}</span>
                        </div>
                      ))}
                      {p.notas && <p className="text-gray-500 text-xs mt-1">Notas: {p.notas}</p>}
                    </div>
                  )}

                  {p.estado !== "entregado" && p.estado !== "cancelado" && (
                    <div id="tour-pedidos-cancelar" className="flex gap-2">
                      {siguiente && (
                        <button onClick={() => cambiarEstado(p, siguiente)}
                          className="flex-1 text-xs font-bold py-2 rounded-lg bg-pantera-green/10 border border-pantera-green/30 text-pantera-green">
                          Marcar {ESTADO_LABEL[siguiente]}
                        </button>
                      )}
                      <button onClick={() => cancelarPedido(p)}
                        className="text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 px-3 py-2 rounded-lg transition-all">
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
