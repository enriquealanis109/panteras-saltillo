import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: padre } = await supabaseAdmin
    .from("padres")
    .select("categoria_id, jugador_ids")
    .eq("id", user.id)
    .single();

  if (!padre) return NextResponse.json({ data: [] });

  const { data: misConfs } = await supabaseAdmin
    .from("confirmaciones_partido")
    .select("partido_id, estado")
    .eq("padre_id", user.id);

  if (!misConfs || misConfs.length === 0) return NextResponse.json({ data: [] });

  const partIds = misConfs.map((c: any) => c.partido_id);
  const jugadorIds: string[] = padre.jugador_ids ?? [];

  const [partRes, confsRes, padresRes, asistRes] = await Promise.all([
    supabaseAdmin
      .from("partidos")
      .select("id, fecha, hora_juego, rival, lugar, uniforme, goles_favor, goles_contra, ligas(nombre)")
      .in("id", partIds),
    supabaseAdmin
      .from("confirmaciones_partido")
      .select("partido_id, estado")
      .in("partido_id", partIds)
      .eq("estado", "asiste"),
    supabaseAdmin
      .from("padres")
      .select("id")
      .eq("categoria_id", padre.categoria_id)
      .eq("activo", true),
    jugadorIds.length > 0
      ? supabaseAdmin
          .from("asistencia_partidos")
          .select("partido_id, jugador_id, asistio")
          .in("partido_id", partIds)
          .in("jugador_id", jugadorIds)
      : Promise.resolve({ data: [] as any[], error: null }),
  ]);

  const confMap: Record<string, string> = {};
  misConfs.forEach((c: any) => { confMap[c.partido_id] = c.estado; });

  const confirmadasMap: Record<string, number> = {};
  (confsRes.data ?? []).forEach((c: any) => {
    confirmadasMap[c.partido_id] = (confirmadasMap[c.partido_id] ?? 0) + 1;
  });

  const asistioMap: Record<string, boolean> = {};
  const asistRecordedMap: Record<string, boolean> = {};
  (asistRes.data ?? []).forEach((a: any) => {
    asistRecordedMap[a.partido_id] = true;
    if (a.asistio === true) asistioMap[a.partido_id] = true;
  });

  const totalPadres = padresRes.data?.length ?? 0;

  const data = (partRes.data ?? []).map((p: any) => ({
    partido: p,
    estado: confMap[p.id] ?? "pendiente",
    confirmadas: confirmadasMap[p.id] ?? 0,
    total_padres: totalPadres,
    hijo_asistio: asistRecordedMap[p.id]
      ? (asistioMap[p.id] ?? false)
      : null,
  }));

  const hoy = new Date().toISOString().split("T")[0];
  const proximos = data
    .filter((d: any) => !d.partido.fecha || d.partido.fecha >= hoy)
    .sort((a: any, b: any) => {
      if (!a.partido.fecha) return 1;
      if (!b.partido.fecha) return -1;
      return a.partido.fecha.localeCompare(b.partido.fecha);
    });
  const pasados = data
    .filter((d: any) => d.partido.fecha && d.partido.fecha < hoy)
    .sort((a: any, b: any) => b.partido.fecha.localeCompare(a.partido.fecha));

  return NextResponse.json({ data: [...proximos, ...pasados] });
}
