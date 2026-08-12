import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ["admin"]);
  if ("error" in auth) return auth.error;
  const admin = auth.admin;

  const { nombre } = await req.json();
  if (!nombre?.trim()) {
    return NextResponse.json({ error: "Falta el nombre de la categoría." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("categorias")
    .update({ nombre: nombre.trim() })
    .eq("id", params.id)
    .eq("club_id", auth.clubId)
    .select("id, nombre")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!data) {
    return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireRole(req, ["admin"]);
  if ("error" in auth) return auth.error;
  const admin = auth.admin;

  const { data: categoria } = await admin
    .from("categorias")
    .select("id")
    .eq("id", params.id)
    .eq("club_id", auth.clubId)
    .single();

  if (!categoria) {
    return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });
  }

  const { error } = await admin
    .from("categorias")
    .delete()
    .eq("id", params.id)
    .eq("club_id", auth.clubId);

  if (error) {
    // 23503 = foreign key violation — todavía hay jugadores (u otro registro) apuntando a esta categoría.
    if (error.code === "23503") {
      return NextResponse.json({
        error: "Esta categoría todavía tiene jugadores u otros datos registrados. Muévelos o elimínalos antes de borrar la categoría.",
      }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
