import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { requireRole } from "@/lib/auth-server";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["entrenador", "ambos", "admin"]);
  if ("error" in auth) return auth.error;
  const admin = auth.admin;

  try {
    const { conversacion_id, texto } = await req.json();
    if (!conversacion_id || !texto) {
      return NextResponse.json({ error: "Falta conversacion_id o texto." }, { status: 400 });
    }

    const { data: conv } = await admin
      .from("conversaciones")
      .select("entrenador_id, club_id")
      .eq("id", conversacion_id)
      .eq("club_id", auth.clubId)
      .single();
    if (!conv) {
      return NextResponse.json({ error: "Conversación no encontrada." }, { status: 404 });
    }

    let entrenadorIds: string[];
    let titulo: string;
    if (auth.rol === "admin") {
      // Admin escribió: se notifica al coach dueño del hilo.
      entrenadorIds = [conv.entrenador_id];
      titulo = "Nuevo mensaje del administrador";
    } else {
      // El coach escribió: se notifica a todos los admins del club.
      const { data: admins } = await admin
        .from("entrenadores")
        .select("id")
        .eq("club_id", auth.clubId)
        .eq("rol", "admin");
      entrenadorIds = (admins ?? []).map((a) => a.id);
      const { data: yo } = await admin.from("entrenadores").select("nombre").eq("id", auth.user.id).single();
      titulo = `Nuevo mensaje de ${yo?.nombre ?? "un entrenador"}`;
    }

    if (entrenadorIds.length === 0) {
      return NextResponse.json({ enviados: 0 });
    }

    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("subscription, entrenador_id")
      .in("entrenador_id", entrenadorIds);

    if (!subs?.length) {
      return NextResponse.json({ enviados: 0, mensaje: "Sin notificaciones activas" });
    }

    const payload = JSON.stringify({
      title: titulo,
      body: texto.length > 120 ? texto.slice(0, 117) + "..." : texto,
      icon: process.env.NEXT_PUBLIC_CLUB_LOGO_URL || "/icon-192.png",
      badge: process.env.NEXT_PUBLIC_CLUB_LOGO_URL || "/icon-192.png",
      data: { url: "/coach" },
    });

    let enviados = 0;
    await Promise.allSettled(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(s.subscription as any, payload);
          enviados++;
        } catch {
          await admin.from("push_subscriptions").delete().eq("entrenador_id", s.entrenador_id);
        }
      })
    );

    return NextResponse.json({ enviados, total: subs.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
