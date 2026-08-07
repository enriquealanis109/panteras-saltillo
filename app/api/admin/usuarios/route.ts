import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["admin"]);
  if ("error" in auth) return auth.error;
  const admin = auth.admin;

  const { nombre, usuario, password, rol, categorias } = await req.json();

  if (!nombre || !usuario || !password || !rol) {
    return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
  }

  const email = `${usuario.trim().toLowerCase()}@panteras.coach`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? "Error al crear usuario." }, { status: 400 });
  }

  const id = data.user.id;

  const { error: dbErr } = await admin.from("entrenadores").insert({ id, nombre: nombre.trim(), rol });
  if (dbErr) {
    await admin.auth.admin.deleteUser(id);
    return NextResponse.json({ error: dbErr.message }, { status: 400 });
  }

  if (categorias?.length > 0) {
    await admin.from("entrenador_categorias").insert(
      categorias.map((cat_id: string) => ({ entrenador_id: id, categoria_id: cat_id }))
    );
  }

  return NextResponse.json({ id });
}
