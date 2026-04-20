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
    <section className="py-24 bg-pantera-black">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-pantera-green font-semibold text-sm uppercase tracking-widest">
              Metodología
            </span>
            <h2 className="section-title mt-3 mb-6">
              Un sistema que
              <br />
              <span className="text-pantera-green">realmente funciona</span>
            </h2>
            <p className="section-subtitle mb-8">
              No improvisamos. Cada entrenamiento tiene un propósito claro y
              sigue una progresión pensada para el desarrollo real del jugador.
            </p>
            <a href="#inscripcion" className="btn-primary inline-block">
              Comenzar ahora →
            </a>
          </div>

          <div className="space-y-6">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex gap-5 group"
              >
                <div className="flex-shrink-0">
                  <span className="text-4xl font-black text-pantera-green/20 group-hover:text-pantera-green/40 transition-colors duration-300">
                    {step.number}
                  </span>
                </div>
                <div className="pt-2">
                  <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
