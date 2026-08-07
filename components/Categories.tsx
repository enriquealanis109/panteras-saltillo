"use client";
import { useEffect, useRef } from "react";

const panteritas = [
  { cat: "2021", ages: "5 años", description: "Primer contacto con el balón. Juego libre y desarrollo motor básico.", color: "from-green-400/20 to-green-500/5" },
  { cat: "2020", ages: "6 años", description: "Coordinación y habilidades motrices a través del juego y la diversión.", color: "from-green-500/20 to-green-600/5" },
  { cat: "2019", ages: "7 años", description: "Iniciación a los fundamentos técnicos: control, pase y dribling.", color: "from-green-700/20 to-green-800/5" },
];

const panteras = [
  { cat: "2018", ages: "8 años",  description: "Técnica individual y primeros conceptos de juego en equipo.",          color: "from-pantera-green/20 to-pantera-green/5" },
  { cat: "2017", ages: "9 años",  description: "Fundamentos tácticos básicos y desarrollo de la inteligencia de juego.", color: "from-emerald-500/20 to-emerald-600/5" },
  { cat: "2016", ages: "10 años", description: "Posicionamiento, presión y juego colectivo más estructurado.",           color: "from-blue-500/20 to-blue-600/5" },
  { cat: "2015", ages: "11 años", description: "Preparación física, táctica y desarrollo de mentalidad competitiva.",    color: "from-purple-500/20 to-purple-600/5" },
  { cat: "2014", ages: "12 años", description: "Fútbol competitivo. Táctica avanzada y alto rendimiento.",               color: "from-orange-500/20 to-orange-600/5" },
  { cat: "2013", ages: "13 años", description: "Máximo nivel. Preparación para ligas y torneos de alto nivel.",          color: "from-red-500/20 to-red-600/5" },
];

export default function Categories() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cards = sectionRef.current?.querySelectorAll(".cat-card");
    if (!cards) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = Number(el.dataset.delay ?? 0);
            setTimeout(() => el.classList.add("visible"), delay);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="py-16 sm:py-24" id="categorias" ref={sectionRef} style={{ background: "var(--bg-alt)" }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="mb-16">
          <span className="section-label">Categorías</span>
          <div className="section-line" />
          <h2 className="section-title-theme mb-4">
            Tenemos un lugar
            <br />
            <span className="text-pantera-green">para tu hijo</span>
          </h2>
          <p className="section-subtitle-theme max-w-xl">
            9 categorías desde los 5 hasta los 13 años. Metodología específica para cada edad.
          </p>
        </div>

        {/* Panteritas */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-2">
            <span className="font-heading text-xs font-semibold tracking-[0.2em] text-pantera-green uppercase border border-pantera-green/30 px-3 py-1 rounded-full">
              Sub-8
            </span>
            <h3 className="font-heading font-bold text-xl tracking-tight" style={{ color: "var(--text-primary)" }}>Panteritas</h3>
            <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>2019 · 2020 · 2021</span>
          </div>

          {/* Hint clickeable */}
          <p className="font-body text-xs tracking-widest uppercase mb-5 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <span className="inline-block w-3 h-px" style={{ background: "var(--border-strong)" }} />
            Selecciona una categoría para explorar su historial
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {panteritas.map((cat, i) => (
              <a
                key={cat.cat}
                href={`/categorias/${cat.cat}`}
                data-delay={i * 100}
                className={`cat-card group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${cat.color} p-5 hover:border-green-400/25 transition-colors duration-300 hover:scale-[1.02] block`}
                style={{ transitionProperty: "border-color, transform, opacity, translate", borderColor: "var(--border-subtle)" }}
              >
                <span className="font-heading text-[10px] font-semibold text-[var(--status-good)] tracking-[0.2em] uppercase border border-green-400/20 px-2.5 py-1 rounded-full">
                  CAT. {cat.cat}
                </span>
                <h4 className="font-heading font-bold text-lg mt-3 mb-1 tracking-tight" style={{ color: "var(--text-primary)" }}>{cat.ages}</h4>
                <p className="font-body text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>{cat.description}</p>
                <div className="flex items-center gap-2 text-[var(--status-good)]/60 group-hover:text-[var(--status-good)] transition-colors duration-300">
                  <span className="font-heading text-[10px] tracking-[0.2em] uppercase font-semibold">Ver historial</span>
                  <span className="text-xs group-hover:translate-x-1 transition-transform duration-300">→</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Panteras */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-2">
            <span className="font-heading text-xs font-semibold tracking-[0.2em] text-pantera-green uppercase border border-pantera-green/30 px-3 py-1 rounded-full">
              Sub-14
            </span>
            <h3 className="font-heading font-bold text-xl tracking-tight" style={{ color: "var(--text-primary)" }}>Panteras</h3>
            <span className="text-xs tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>2013 · 2014 · 2015 · 2016 · 2017 · 2018</span>
          </div>

          <p className="font-body text-xs tracking-widest uppercase mb-5 flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <span className="inline-block w-3 h-px" style={{ background: "var(--border-strong)" }} />
            Selecciona una categoría para explorar su historial
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {panteras.map((cat, i) => (
              <a
                key={cat.cat}
                href={`/categorias/${cat.cat}`}
                data-delay={(panteritas.length + i) * 100}
                className={`cat-card group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${cat.color} p-5 hover:border-pantera-green/25 transition-colors duration-300 hover:scale-[1.02] block`}
                style={{ transitionProperty: "border-color, transform, opacity, translate", borderColor: "var(--border-subtle)" }}
              >
                <span className="font-heading text-[10px] font-semibold text-pantera-green/80 tracking-[0.2em] uppercase border border-pantera-green/20 px-2.5 py-1 rounded-full">
                  CAT. {cat.cat}
                </span>
                <h4 className="font-heading font-bold text-lg mt-3 mb-1 tracking-tight" style={{ color: "var(--text-primary)" }}>{cat.ages}</h4>
                <p className="font-body text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>{cat.description}</p>
                <div className="flex items-center gap-2 text-pantera-green/40 group-hover:text-pantera-green/80 transition-colors duration-300">
                  <span className="font-heading text-[10px] tracking-[0.2em] uppercase font-semibold">Ver historial</span>
                  <span className="text-xs group-hover:translate-x-1 transition-transform duration-300">→</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div className="text-center">
          <a href="#inscripcion" className="btn-primary inline-block">
            Quiero inscribir a mi hijo →
          </a>
        </div>
      </div>
    </section>
  );
}
