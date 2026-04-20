import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import PageLoader from "@/components/PageLoader";

export const metadata: Metadata = {
  title: "Panteras FC | Academia de Fútbol en Saltillo",
  description:
    "Formamos jugadores con disciplina, técnica y carácter. Categorías desde los 5 hasta los 17 años. Inscribe a tu hijo hoy.",
  keywords: "academia de futbol saltillo, futbol infantil coahuila, panteras fc, futbol juvenil saltillo",
  openGraph: {
    title: "Panteras FC | Academia de Fútbol en Saltillo",
    description: "Formamos jugadores con disciplina, técnica y carácter.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
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
        {children}
      </body>
    </html>
  );
}
