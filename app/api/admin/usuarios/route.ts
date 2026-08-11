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

  const { data: club } = await admin.from("clubes").select("slug").eq("id", auth.clubId).single();
  if (!club) {
    return NextResponse.json({ error: "Club no encontrado." }, { status: 400 });
  }

  const email = `${usuario.trim().toLowerCase()}@${club.slug}.coach`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message ?? "Error al crear usuario." }, { status: 400 });
  }

  const id = data.user.id;

  const { error: dbErr } = await admin
    .from("entrenadores")
    .insert({ id, nombre: nombre.trim(), rol, club_id: auth.clubId });
  if (dbErr) {
    await admin.auth.admin.deleteUser(id);
    return NextResponse.json({ error: dbErr.message }, { status: 400 });
  }

  if (categorias?.length > 0) {
    // Nunca confiar en los ids que manda el cliente: solo se enlazan categorías
    // que de verdad son del mismo club que el admin que está creando el usuario.
    const { data: categoriasDelClub } = await admin
      .from("categorias")
      .select("id")
      .eq("club_id", auth.clubId)
      .in("id", categorias);

    const idsValidos = (categoriasDelClub ?? []).map((c) => c.id);
    if (idsValidos.length > 0) {
      await admin.from("entrenador_categorias").insert(
        idsValidos.map((cat_id: string) => ({ entrenador_id: id, categoria_id: cat_id }))
      );
    }
  }

  return NextResponse.json({ id });
}
