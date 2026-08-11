"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface ClubBranding { nombre: string; logoUrl: string; colorAcento: string; modulosActivos: string[] }

/** Módulos "extra" (fuera del núcleo coordinador+coach) que un club puede prender.
 *  Sin ninguno activo, el panel solo trae lo operativo: categorías, jugadores,
 *  entrenadores, documentos, asistencias, evaluaciones. */
export const MODULOS_OPCIONALES = ["metricas", "partidos", "patrocinadores", "tienda", "padres", "avisos", "sitio_publico"] as const;
export type ModuloOpcional = typeof MODULOS_OPCIONALES[number];

export const DEFAULT_BRANDING: ClubBranding = {
  nombre: "Panteras",
  logoUrl: "/icon-192.png",
  colorAcento: "#16a34a",
  modulosActivos: [...MODULOS_OPCIONALES],
};

const ClubContext = createContext<ClubBranding>(DEFAULT_BRANDING);
export const useClub = () => useContext(ClubContext);

/** "#16a34a" -> "22 163 74" (formato que espera la variable --club-accent). */
export function hexToRgbTriplet(hex: string): string {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return hexToRgbTriplet(DEFAULT_BRANDING.colorAcento);
  return `${r} ${g} ${b}`;
}

/**
 * Carga el nombre/logo/color del club del usuario logueado (a partir de su
 * club_id en `entrenadores`) y los expone vía useClub() + la variable CSS
 * --club-accent, de la que depende el color "pantera-green" en toda la app.
 */
export function ClubProvider({ clubId, children }: { clubId: string | null; children: React.ReactNode }) {
  const [branding, setBranding] = useState<ClubBranding>(DEFAULT_BRANDING);

  useEffect(() => {
    if (!clubId) { setBranding(DEFAULT_BRANDING); return; }
    supabase.from("clubes").select("nombre, logo_url, color_acento, modulos_activos").eq("id", clubId).single()
      .then(({ data }) => {
        if (!data) return;
        setBranding({
          nombre: data.nombre ?? DEFAULT_BRANDING.nombre,
          logoUrl: data.logo_url ?? DEFAULT_BRANDING.logoUrl,
          colorAcento: data.color_acento ?? DEFAULT_BRANDING.colorAcento,
          modulosActivos: data.modulos_activos ?? [],
        });
      });
  }, [clubId]);

  return (
    <ClubContext.Provider value={branding}>
      <div style={{ "--club-accent": hexToRgbTriplet(branding.colorAcento) } as React.CSSProperties}>
        {children}
      </div>
    </ClubContext.Provider>
  );
}
