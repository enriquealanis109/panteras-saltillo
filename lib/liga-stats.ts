export interface LigaStats {
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
}

const VACIO: LigaStats = { pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0, pts: 0 };

/**
 * Calcula el registro (puntos, W-D-L, goles) de un conjunto de partidos.
 * Amistosos no cuentan para las estadísticas — no son competitivos.
 * Solo cuentan partidos con marcador capturado (goles_favor y goles_contra no nulos).
 */
export function computeLigaStats(
  partidos: { goles_favor: number | null; goles_contra: number | null; fase?: string | null }[]
): LigaStats {
  return partidos.reduce((s, p) => {
    if (p.fase === "amistoso") return s;
    if (p.goles_favor === null || p.goles_favor === undefined) return s;
    if (p.goles_contra === null || p.goles_contra === undefined) return s;

    const gf = p.goles_favor;
    const gc = p.goles_contra;
    const ganado   = gf > gc;
    const empatado = gf === gc;

    return {
      pj: s.pj + 1,
      pg: s.pg + (ganado ? 1 : 0),
      pe: s.pe + (empatado ? 1 : 0),
      pp: s.pp + (!ganado && !empatado ? 1 : 0),
      gf: s.gf + gf,
      gc: s.gc + gc,
      dg: s.dg + (gf - gc),
      pts: s.pts + (ganado ? 3 : empatado ? 1 : 0),
    };
  }, VACIO);
}
