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
    <section className="py-24 bg-pantera-black" id="beneficios">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-pantera-green font-semibold text-sm uppercase tracking-widest">
            Por qué elegirnos
          </span>
          <h2 className="section-title mt-3 mb-4">
            Más que una academia,
            <br />
            <span className="text-pantera-green">una familia</span>
          </h2>
          <p className="section-subtitle max-w-xl mx-auto">
            En Panteras FC creemos que el deporte transforma vidas. Cada
            entrenamiento es una oportunidad de crecer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="card group hover:border-pantera-green/30 transition-all duration-300 hover:bg-pantera-green/5"
            >
              <div className="text-4xl mb-4">{benefit.icon}</div>
              <h3 className="text-white font-bold text-xl mb-3">
                {benefit.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
