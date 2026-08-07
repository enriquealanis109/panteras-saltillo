const benefits = [
  {
    icon: "⚽",
    title: "Técnica profesional",
    description:
      "Metodología basada en fundamentos reales del fútbol moderno. Control, pase, regate y definición.",
  },
  {
    icon: "🧠",
    title: "Formación integral",
    description:
      "No solo entrenamos el cuerpo. Desarrollamos mentalidad, disciplina y liderazgo en cada jugador.",
  },
  {
    icon: "🤝",
    title: "Valores de equipo",
    description:
      "Compañerismo, respeto y trabajo en equipo como base de todo. El fútbol forma personas.",
  },
  {
    icon: "📈",
    title: "Progreso medible",
    description:
      "Seguimiento individual de cada jugador. Los padres ven el avance real de sus hijos.",
  },
  {
    icon: "🏟️",
    title: "Instalaciones adecuadas",
    description:
      "Canchas en buenas condiciones y equipamiento para que cada sesión sea de calidad.",
  },
  {
    icon: "👨‍🏫",
    title: "Entrenadores certificados",
    description:
      "Cuerpo técnico con experiencia y pasión por enseñar. Cada jugador recibe atención personalizada.",
  },
];

export default function Benefits() {
  return (
    <section className="py-16 sm:py-24" id="beneficios" style={{ background: "var(--bg-page)" }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="mb-16">
          <span className="section-label">Por qué elegirnos</span>
          <div className="section-line" />
          <h2 className="section-title-theme mb-4">
            Más que una academia,
            <br />
            <span className="text-pantera-green">una familia</span>
          </h2>
          <p className="section-subtitle-theme max-w-xl">
            En Panteras Saltillo creemos que el deporte transforma vidas. Cada
            entrenamiento es una oportunidad de crecer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, i) => (
            <div
              key={benefit.title}
              className="card-theme group hover:border-pantera-green/20 transition-all duration-500 hover:bg-pantera-green/[0.04]"
            >
              <div className="flex items-start gap-4 mb-4">
                <span className="font-heading text-xs font-semibold tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="w-8 h-px bg-pantera-green/40 mt-2.5 group-hover:bg-pantera-green transition-colors duration-300" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-3 tracking-tight" style={{ color: "var(--text-primary)" }}>
                {benefit.title}
              </h3>
              <p className="font-body leading-relaxed text-sm" style={{ color: "var(--text-secondary)" }}>{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
