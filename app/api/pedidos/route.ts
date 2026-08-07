import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface ItemInput {
  varianteId: string;
  cantidad: number;
  personalizacionNombre?: string;
  personalizacionNumero?: string;
}

export async function POST(req: NextRequest) {
  const { cliente_nombre, cliente_telefono, notas, items } = await req.json() as {
    cliente_nombre?: string;
    cliente_telefono?: string;
    notas?: string;
    items?: ItemInput[];
  };

  if (!cliente_nombre?.trim() || !cliente_telefono?.trim()) {
    return NextResponse.json({ error: "Nombre y teléfono son obligatorios" }, { status: 400 });
  }
  if (!items?.length || items.some((i) => !i.varianteId || !i.cantidad || i.cantidad <= 0)) {
    return NextResponse.json({ error: "El carrito está vacío o tiene cantidades inválidas" }, { status: 400 });
  }

  const admin = getAdmin();

  // 1. Releer variantes + producto desde la BD (nunca confiar en precio del cliente)
  const varianteIds = items.map((i) => i.varianteId);
  const { data: variantes, error: variantesError } = await admin
    .from("producto_variantes")
    .select("id, stock, talla, color, producto_id, productos(nombre, precio, activo)")
    .in("id", varianteIds);

  if (variantesError) {
    return NextResponse.json({ error: "Error al consultar productos", detalle: variantesError.message }, { status: 500 });
  }

  const varianteById = new Map((variantes ?? []).map((v: any) => [v.id, v]));
  // Stock restante por variante *dentro de este request*: distinto items pueden compartir
  // varianteId (ej. dos jerseys personalizados de la misma talla), así que no se puede
  // calcular cada decremento desde el snapshot inicial de `varianteById` — hay que ir
  // restando conforme se confirma cada línea.
  const stockRestante = new Map((variantes ?? []).map((v: any) => [v.id, v.stock]));

  for (const item of items) {
    const v = varianteById.get(item.varianteId);
    if (!v || !v.productos || v.productos.activo === false) {
      return NextResponse.json({ error: `Uno de los productos ya no está disponible` }, { status: 400 });
    }
  }

  // 2. Decremento atómico de stock por fila, con reversión si algo falla a mitad de camino
  const decrementados: { varianteId: string; cantidad: number }[] = [];

  for (const item of items) {
    const v = varianteById.get(item.varianteId)!;
    const stockBase = stockRestante.get(item.varianteId)!;
    const { data: updated, error: updateError } = await admin
      .from("producto_variantes")
      .update({ stock: stockBase - item.cantidad })
      .eq("id", item.varianteId)
      .gte("stock", item.cantidad)
      .select();

    if (updateError || !updated?.length) {
      // Revertir lo ya decrementado en este mismo request
      for (const d of decrementados) {
        const dv = varianteById.get(d.varianteId)!;
        await admin.from("producto_variantes").update({ stock: dv.stock }).eq("id", d.varianteId);
      }
      const nombreProducto = v.productos?.nombre ?? "producto";
      return NextResponse.json({
        error: `No hay suficiente stock de "${nombreProducto}" (talla ${v.talla}${v.color ? `, ${v.color}` : ""})`,
      }, { status: 400 });
    }
    stockRestante.set(item.varianteId, stockBase - item.cantidad);
    decrementados.push({ varianteId: item.varianteId, cantidad: item.cantidad });
  }

  // 3. Crear pedido + items
  const total = items.reduce((sum, item) => {
    const v = varianteById.get(item.varianteId)!;
    return sum + v.productos!.precio * item.cantidad;
  }, 0);

  const { data: pedido, error: pedidoError } = await admin
    .from("pedidos")
    .insert({ cliente_nombre: cliente_nombre.trim(), cliente_telefono: cliente_telefono.trim(), notas: notas?.trim() || null, total })
    .select()
    .single();

  if (pedidoError || !pedido) {
    // Revertir stock, el pedido no se pudo crear
    for (const d of decrementados) {
      const dv = varianteById.get(d.varianteId)!;
      await admin.from("producto_variantes").update({ stock: dv.stock }).eq("id", d.varianteId);
    }
    return NextResponse.json({ error: "No se pudo crear el pedido", detalle: pedidoError?.message }, { status: 500 });
  }

  const pedidoItems = items.map((item) => {
    const v = varianteById.get(item.varianteId)!;
    return {
      pedido_id: pedido.id,
      variante_id: item.varianteId,
      producto_nombre: v.productos!.nombre,
      talla: v.talla,
      color: v.color,
      cantidad: item.cantidad,
      precio_unitario: v.productos!.precio,
      personalizacion_nombre: item.personalizacionNombre?.trim() || null,
      personalizacion_numero: item.personalizacionNumero?.trim() || null,
    };
  });

  const { data: insertedItems, error: itemsError } = await admin
    .from("pedido_items")
    .insert(pedidoItems)
    .select();

  if (itemsError) {
    // Revertir stock y borrar el pedido huérfano
    for (const d of decrementados) {
      const dv = varianteById.get(d.varianteId)!;
      await admin.from("producto_variantes").update({ stock: dv.stock }).eq("id", d.varianteId);
    }
    await admin.from("pedidos").delete().eq("id", pedido.id);
    return NextResponse.json({ error: "No se pudo registrar el pedido", detalle: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ pedido, items: insertedItems });
}
