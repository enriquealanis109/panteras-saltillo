import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import PageLoader from "@/components/PageLoader";
import { Analytics } from "@vercel/analytics/next";
import SessionGuard from "@/components/SessionGuard";
import { CartProvider } from "@/lib/cart-context";
import ThemeProvider from "@/components/ThemeProvider";

// Cada deploy de Vercel (panteras-saltillo, inter-saltillo, ...) trae su propio
// club_nombre/color vía env vars, así el <title>, OG tags y manifest no quedan
// pegados a "Panteras Saltillo" en los demás clubes. Sin la env var, cae en Panteras.
const CLUB_NOMBRE = process.env.NEXT_PUBLIC_CLUB_NOMBRE || "Panteras Saltillo";
const CLUB_DESCRIPCION = process.env.NEXT_PUBLIC_CLUB_DESCRIPCION
  || "Formamos jugadores con disciplina, técnica y carácter. Categorías desde los 5 hasta los 17 años. Inscribe a tu hijo hoy.";
const CLUB_COLOR = process.env.NEXT_PUBLIC_CLUB_COLOR || "#16a34a";
const CLUB_LOGO = process.env.NEXT_PUBLIC_CLUB_LOGO_URL || "/icon-192.png";

export const metadata: Metadata = {
  title: `${CLUB_NOMBRE} | Academia de Fútbol en Saltillo`,
  description: CLUB_DESCRIPCION,
  keywords: "academia de futbol saltillo, futbol infantil coahuila, panteras fc, futbol juvenil saltillo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: CLUB_NOMBRE,
  },
  openGraph: {
    title: `${CLUB_NOMBRE} | Academia de Fútbol en Saltillo`,
    description: CLUB_DESCRIPCION,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: CLUB_COLOR,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href={CLUB_LOGO} />
        <link rel="apple-touch-icon" href={CLUB_LOGO} />
      </head>
      <body>
        <ThemeProvider>
          <PageLoader />
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#1a1a1a",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
              },
            }}
          />
          <CartProvider>
            {children}
          </CartProvider>
          <SessionGuard />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
