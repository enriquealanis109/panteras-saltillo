import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panteras Saltillo",
  description: "Portal para padres de familia",
  manifest: "/manifest-papa.json",
};

export default function PapaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
