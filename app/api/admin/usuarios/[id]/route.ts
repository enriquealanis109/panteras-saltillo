import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ["admin"]);
  if ("error" in auth) return auth.error;
  const admin = auth.admin;

  const { id } = params;

  // El service-role se salta RLS: hay que confirmar aquí mismo que el usuario
  // a borrar es del mismo club del admin que pide el borrado.
  const { data: objetivo } = await admin.from("entrenadores").select("club_id").eq("id", id).single();
  if (!objetivo || objetivo.club_id !== auth.clubId) {
    return NextResponse.json({ error: "No tienes permiso para esta acción" }, { status: 403 });
  }

  // Con CASCADE configurado en la DB, borrar el usuario de Auth
  // elimina automáticamente entrenadores, entrenador_categorias y evaluaciones
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
