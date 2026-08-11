import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["admin"]);
  if ("error" in auth) return auth.error;
  const admin = auth.admin;

  const { nombre } = await req.json();
  if (!nombre?.trim()) {
    return NextResponse.json({ error: "Falta el nombre de la categoría." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("categorias")
    .insert({ nombre: nombre.trim(), club_id: auth.clubId })
    .select("id, nombre")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
