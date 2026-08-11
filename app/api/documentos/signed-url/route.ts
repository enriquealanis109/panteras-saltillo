import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth-server";

const SIGNED_URL_TTL_SECONDS = 5 * 60;

/** Extracts the storage object path from either an old public-style URL or a bare path. */
function pathFromUrlOrPath(value: string): string {
  const marker = "/object/public/documentos/";
  const idx = value.indexOf(marker);
  return idx === -1 ? value : decodeURIComponent(value.slice(idx + marker.length));
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["entrenador", "coordinador", "ambos", "admin"]);
  if ("error" in auth) return auth.error;

  const { paths } = await req.json();
  if (!Array.isArray(paths) || paths.length === 0) {
    return NextResponse.json({ error: "Falta 'paths'." }, { status: 400 });
  }

  const objectPaths = paths.map((p: string) => pathFromUrlOrPath(p));

  // auth.admin es el cliente service-role: se salta RLS por completo, así que
  // aquí mismo hay que verificar que cada documento pedido sea de un jugador
  // del club de quien lo pide — si no, no se genera signed URL para ese path.
  const jugadorIds = Array.from(new Set(objectPaths.map((p) => p.split("/")[0])));
  const { data: jugadoresDelClub } = await auth.admin
    .from("jugadores")
    .select("id")
    .eq("club_id", auth.clubId)
    .in("id", jugadorIds);

  const idsPermitidos = new Set((jugadoresDelClub ?? []).map((j) => j.id));
  const permitidos = objectPaths
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => idsPermitidos.has(p.split("/")[0]));

  if (permitidos.length === 0) {
    return NextResponse.json({ urls: {} });
  }

  const { data, error } = await auth.admin.storage
    .from("documentos")
    .createSignedUrls(permitidos.map(({ p }) => p), SIGNED_URL_TTL_SECONDS);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const urls: Record<string, string> = {};
  data.forEach((d, idx) => {
    if (d.signedUrl) urls[paths[permitidos[idx].i]] = d.signedUrl;
  });

  return NextResponse.json({ urls });
}
