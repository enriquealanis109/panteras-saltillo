import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ["admin"]);
  if ("error" in auth) return auth.error;
  const admin = auth.admin;

  const { id } = params;

  // Limpiar tablas relacionadas al padre
  await Promise.all([
    admin.from("push_subscriptions").delete().eq("padre_id", id),
    admin.from("confirmaciones_partido").delete().eq("padre_id", id),
  ]);

  await admin.from("padres").delete().eq("id", id);

  // Si el usuario también es entrenador, no eliminar la cuenta Auth
  const { data: coach } = await admin.from("entrenadores").select("id").eq("id", id).single();
  if (!coach) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
