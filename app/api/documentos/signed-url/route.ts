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

  const { data, error } = await auth.admin.storage
    .from("documentos")
    .createSignedUrls(objectPaths, SIGNED_URL_TTL_SECONDS);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const urls: Record<string, string> = {};
  data.forEach((d, i) => {
    if (d.signedUrl) urls[paths[i]] = d.signedUrl;
  });

  return NextResponse.json({ urls });
}
