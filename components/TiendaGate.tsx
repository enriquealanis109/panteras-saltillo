"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type Estado = "cargando" | "admin" | "publico";

// Mientras se termina de armar el catálogo, solo el admin puede ver la tienda real.
// Cualquier otro visitante ve un aviso de "Próximamente" en su lugar.
export default function TiendaGate({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<Estado>("cargando");

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setEstado("publico"); return; }
      const { data } = await supabase.from("entrenadores").select("rol").eq("id", user.id).single();
      setEstado(data?.rol === "admin" ? "admin" : "publico");
    };
    check();
  }, []);

  if (estado === "cargando") {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (estado === "publico") {
    return (
      <main className="min-h-screen bg-[#0a0a0a]">
        <Navbar />
        <section className="pt-40 pb-32 px-5 sm:px-6 max-w-xl mx-auto text-center">
          <div className="w-20 h-20 rounded-2xl bg-pantera-green/10 border border-pantera-green/30 flex items-center justify-center mx-auto mb-6">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-pantera-green">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <p className="section-label">Tienda Oficial Panteras Saltillo</p>
          <h1 className="section-title mt-2">Muy pronto</h1>
          <p className="section-subtitle mt-4">
            Estamos preparando la tienda oficial con uniformes, accesorios y más. Vuelve pronto.
          </p>
        </section>
        <Footer />
      </main>
    );
  }

  return <>{children}</>;
}
