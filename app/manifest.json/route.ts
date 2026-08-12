import { NextResponse } from "next/server";

// Mismo patrón que app/layout.tsx: sin NEXT_PUBLIC_CLUB_* cae en Panteras,
// así el manifest (nombre/ícono al "Agregar a inicio") sale correcto por club.
export async function GET() {
  const nombre = process.env.NEXT_PUBLIC_CLUB_NOMBRE || "Panteras Saltillo";
  const shortName = nombre.split(" ")[0] || "Panteras";
  const color = process.env.NEXT_PUBLIC_CLUB_COLOR || "#16a34a";
  const clubLogo = process.env.NEXT_PUBLIC_CLUB_LOGO_URL;
  const icon192 = clubLogo || "/icon-192.png";
  const icon512 = clubLogo || "/icon-512.png";
  const iconType = (src: string) =>
    /\.(jpe?g)$/i.test(src) ? "image/jpeg" : /\.svg$/i.test(src) ? "image/svg+xml" : "image/png";

  return NextResponse.json({
    name: nombre,
    short_name: shortName,
    description: `Portal de ${nombre} — entrenadores y padres de familia.`,
    start_url: "/papa",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: color,
    orientation: "portrait",
    icons: [
      { src: icon192, sizes: "192x192", type: iconType(icon192), purpose: "any" },
      { src: icon512, sizes: "512x512", type: iconType(icon512), purpose: "any" },
      { src: icon512, sizes: "512x512", type: iconType(icon512), purpose: "maskable" },
    ],
  });
}
