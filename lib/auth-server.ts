import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import type { Rol } from "./supabase";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type AuthOk = { user: { id: string }; rol: Rol; clubId: string; admin: typeof supabaseAdmin };
type AuthFail = { error: NextResponse };

/**
 * Verifies the request's Bearer token against Supabase Auth, then checks the
 * caller has one of `allowed` roles in `entrenadores`. Routes using the
 * service-role client MUST call this first — the service role bypasses RLS,
 * so it's the only thing standing between an anonymous request and full DB access.
 *
 * `clubId` comes from the caller's own `entrenadores` row — every multi-club-aware
 * route must scope its reads/writes to it and never trust a club id from the client.
 */
export async function requireRole(req: NextRequest, allowed: Rol[]): Promise<AuthOk | AuthFail> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: 401 }) };
  }

  const { data: entrenador } = await supabaseAdmin
    .from("entrenadores")
    .select("rol, club_id")
    .eq("id", user.id)
    .single();

  if (!entrenador || !allowed.includes(entrenador.rol)) {
    return { error: NextResponse.json({ error: "No tienes permiso para esta acción" }, { status: 403 }) };
  }

  return { user, rol: entrenador.rol, clubId: entrenador.club_id, admin: supabaseAdmin };
}
