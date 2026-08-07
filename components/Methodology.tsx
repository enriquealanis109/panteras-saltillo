const steps = [
  {
    number: "01",
    title: "Evaluación inicial",
    description:
      "Cada jugador pasa por una evaluación donde identificamos sus fortalezas y áreas de mejora para ubicarlo en la categoría correcta.",
  },
  {
    number: "02",
    title: "Plan personalizado",
    description:
      "Diseñamos un plan de desarrollo adaptado a la edad, nivel y objetivos de cada jugador. No todos aprenden igual.",
  },
  {
    number: "03",
    title: "Entrenamiento constante",
    description:
      "Sesiones estructuradas con enfoque técnico, táctico y físico. La repetición correcta construye grandes jugadores.",
  },
  {
    number: "04",
    title: "Competencia real",
    description:
      "Participación en torneos y ligas locales para que los jugadores pongan en práctica lo aprendido bajo presión.",
  },
];

export default function Methodology() {
  return (
    <section className="py-16 sm:py-24" id="metodologia" style={{ background: "var(--bg-page)" }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="section-label">Metodología</span>
            <div className="section-line" />
            <h2 className="section-title-theme mb-6">
              Un sistema que
              <br />
              <span className="text-pantera-green">realmente funciona</span>
            </h2>
            <p className="section-subtitle-theme mb-8">
              No improvisamos. Cada entrenamiento tiene un propósito claro y
              sigue una progresión pensada para el desarrollo real del jugador.
            </p>
            <a href="#inscripcion" className="btn-primary inline-block">
              Comenzar ahora →
            </a>
          </div>

          <div className="space-y-6">
            {steps.map((step) => (
              <div key={step.number} className="flex gap-5 group border-b pb-6 last:border-0 last:pb-0" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="flex-shrink-0 pt-1">
                  <span className="font-heading text-sm font-semibold text-pantera-green/30 group-hover:text-pantera-green/60 transition-colors duration-300 tracking-widest">
                    {step.number}
                  </span>
                </div>
                <div>
                  <h3 className="font-heading font-semibold text-base mb-1.5 tracking-tight group-hover:text-pantera-green transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                    {step.title}
                  </h3>
                  <p className="font-body leading-relaxed text-sm" style={{ color: "var(--text-secondary)" }}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
