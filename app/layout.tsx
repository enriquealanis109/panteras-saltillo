import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import PageLoader from "@/components/PageLoader";
import { Analytics } from "@vercel/analytics/next";
import SessionGuard from "@/components/SessionGuard";
import { CartProvider } from "@/lib/cart-context";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "Panteras Saltillo | Academia de Fútbol en Saltillo",
  description:
    "Formamos jugadores con disciplina, técnica y carácter. Categorías desde los 5 hasta los 17 años. Inscribe a tu hijo hoy.",
  keywords: "academia de futbol saltillo, futbol infantil coahuila, panteras fc, futbol juvenil saltillo",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Panteras Saltillo",
  },
  openGraph: {
    title: "Panteras Saltillo | Academia de Fútbol en Saltillo",
    description: "Formamos jugadores con disciplina, técnica y carácter.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
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
