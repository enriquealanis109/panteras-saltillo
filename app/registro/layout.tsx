import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registro — Panteras Saltillo",
  manifest: "/manifest-papa.json",
};

export default function RegistroLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
