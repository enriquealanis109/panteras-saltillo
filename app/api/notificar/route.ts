import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { requireRole } from "@/lib/auth-server";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["entrenador", "coordinador", "ambos", "admin"]);
  if ("error" in auth) return auth.error;
  const supabaseAdmin = auth.admin;

  try {
    const { categoria_id, titulo, cuerpo, partido_id } = await req.json();

    // 1. Padres activos de la categoría
    const { data: padres, error: padresError } = await supabaseAdmin
      .from("padres")
      .select("id")
      .eq("categoria_id", categoria_id)
      .eq("activo", true);

    if (padresError) {
      console.error("Error padres:", padresError);
      return NextResponse.json({ error: "Error al consultar padres", detalle: padresError.message }, { status: 500 });
    }

    if (!padres?.length) {
      return NextResponse.json({ enviados: 0, mensaje: "No hay padres activos en esta categoria" });
    }

    const padreIds = padres.map((p) => p.id);

    // 2. Suscripciones push
    const { data: subs, error: subsError } = await supabaseAdmin
      .from("push_subscriptions")
      .select("subscription, padre_id")
      .in("padre_id", padreIds);

    if (subsError) {
      console.error("Error subs:", subsError);
      return NextResponse.json({ error: "Error al consultar suscripciones", detalle: subsError.message }, { status: 500 });
    }

    if (!subs?.length) {
      return NextResponse.json({ enviados: 0, mensaje: "No hay padres con notificaciones activas" });
    }

    // 3. Crear confirmaciones (deduplicar por padre_id para evitar conflicto en upsert)
    if (partido_id) {
      const porPadre = new Map<string, { partido_id: string; padre_id: string; estado: string }>();
      subs.forEach((s) => {
        if (!porPadre.has(s.padre_id)) {
          porPadre.set(s.padre_id, { partido_id, padre_id: s.padre_id, estado: "pendiente" });
        }
      });
      const confirmaciones = Array.from(porPadre.values());

      const { error: confError } = await supabaseAdmin
        .from("confirmaciones_partido")
        .upsert(confirmaciones, { onConflict: "partido_id,padre_id" });

      if (confError) {
        console.error("Error confirmaciones:", confError);
        // Retornar el error para que el coach vea que paso
        return NextResponse.json({
          error: "No se pudieron crear las confirmaciones",
          detalle: confError.message,
        }, { status: 500 });
      }
    }

    // 4. Enviar notificaciones
    const payload = JSON.stringify({
      title: titulo,
      body:  cuerpo,
      icon:  "/icon-192.png",
      badge: "/icon-192.png",
      data:  { partido_id, url: "/papa" },
    });

    let enviados = 0;
    await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(s.subscription as any, payload);
          enviados++;
        } catch {
          await supabaseAdmin.from("push_subscriptions").delete().eq("padre_id", s.padre_id);
        }
      })
    );

    return NextResponse.json({ enviados, total: subs.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
