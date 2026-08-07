"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Patrocinador { id: string; nombre: string; logo_url: string; website_url: string | null }

export default function Sponsors() {
  const [sponsors, setSponsors] = useState<Patrocinador[]>([]);

  useEffect(() => {
    supabase.from("patrocinadores").select("id, nombre, logo_url, website_url")
      .eq("activo", true).order("orden")
      .then(({ data }) => setSponsors(data ?? []));
  }, []);

  const fallback: Patrocinador[] = [
    { id: "1", nombre: "RDN",                 logo_url: "/logos/logo1.png",  website_url: null },
    { id: "2", nombre: "Icónica",             logo_url: "/logos/logo2.png",  website_url: null },
    { id: "3", nombre: "Pepe Pizza",          logo_url: "/logos/logo3.jpeg", website_url: null },
    { id: "4", nombre: "Díaz Construcciones", logo_url: "/logos/logo4.jpeg", website_url: null },
  ];
  const lista = sponsors.length > 0 ? sponsors : fallback;
  const items = [...lista, ...lista];

  return (
    <section className="py-16 sm:py-20 border-y overflow-hidden" style={{ background: "var(--bg-page)", borderColor: "var(--border-subtle)" }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6 mb-12 text-center">
        <span className="section-label">Alianzas</span>
        <div className="section-line mx-auto" />
        <h2 className="font-heading font-bold text-2xl sm:text-3xl tracking-tight" style={{ color: "var(--text-primary)" }}>
          Empresas que hacen posible a Panteras
        </h2>
        <p className="font-body text-sm mt-3 max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
          Gracias al respaldo de nuestros patrocinadores podemos seguir formando campeones.
        </p>
      </div>

      {/* Carrusel */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(90deg, var(--bg-page), transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(270deg, var(--bg-page), transparent)" }} />

        <div className="overflow-hidden py-6">
          <div className="marquee-track" style={{ display: "flex", alignItems: "center" }}>
            {items.map((sponsor, i) => {
              const card = (
                <div className="w-48 h-24 rounded-2xl shadow-xl shadow-black/50 hover:border-pantera-green/25 hover:shadow-pantera-green/10 transition-all duration-500 overflow-hidden border"
                  style={{ background: "var(--bg-surface-2)", borderColor: "var(--border-strong)" }}>
                  <img src={sponsor.logo_url} alt={sponsor.nombre}
                    className="w-full h-full object-contain p-4 opacity-75 hover:opacity-100 transition-opacity duration-400" />
                </div>
              );
              return (
                <div key={`${sponsor.id}-${i}`} className="flex-shrink-0 mx-4 group"
                  style={{
                    animation: `float-sponsor ${3.8 + (i % sponsors.length) * 0.5}s ease-in-out infinite`,
                    animationDelay: `${(i % sponsors.length) * 0.4}s`,
                  }}>
                  {sponsor.website_url ? (
                    <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer">{card}</a>
                  ) : card}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-center mt-10">
        <a href="https://wa.me/528445028582" target="_blank" rel="noopener noreferrer"
          className="font-body text-xs transition-colors duration-200 tracking-widest uppercase border-b hover:border-pantera-green/40 hover:text-pantera-green pb-0.5"
          style={{ color: "var(--text-muted)", borderColor: "var(--border-strong)" }}>
          ¿Quieres patrocinar a Panteras? Contáctanos →
        </a>
      </div>
    </section>
  );
}
