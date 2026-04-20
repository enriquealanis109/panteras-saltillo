const panteritas = [
  { cat: "2021", ages: "5 años", description: "Primer contacto con el balón. Juego libre y desarrollo motor básico.", color: "from-yellow-400/20 to-yellow-500/5" },
  { cat: "2020", ages: "6 años", description: "Coordinación y habilidades motrices a través del juego y la diversión.", color: "from-yellow-500/20 to-yellow-600/5" },
  { cat: "2019", ages: "7 años", description: "Iniciación a los fundamentos técnicos: control, pase y dribling.", color: "from-yellow-600/20 to-yellow-700/5" },
];

const panteras = [
  { cat: "2018", ages: "8 años", description: "Técnica individual y primeros conceptos de juego en equipo.", color: "from-pantera-green/20 to-pantera-green/5" },
  { cat: "2017", ages: "9 años", description: "Fundamentos tácticos básicos y desarrollo de la inteligencia de juego.", color: "from-emerald-500/20 to-emerald-600/5" },
  { cat: "2016", ages: "10 años", description: "Posicionamiento, presión y juego colectivo más estructurado.", color: "from-blue-500/20 to-blue-600/5" },
  { cat: "2015", ages: "11 años", description: "Preparación física, táctica y desarrollo de mentalidad competitiva.", color: "from-purple-500/20 to-purple-600/5" },
  { cat: "2014", ages: "12 años", description: "Fútbol competitivo. Táctica avanzada y alto rendimiento.", color: "from-orange-500/20 to-orange-600/5" },
  { cat: "2013", ages: "13 años", description: "Máximo nivel. Preparación para ligas y torneos de alto nivel.", color: "from-red-500/20 to-red-600/5" },
];

export default function Categories() {
  return (
    <section className="py-24 bg-pantera-gray" id="categorias">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-pantera-green font-semibold text-sm uppercase tracking-widest">
            Categorías
          </span>
          <h2 className="section-title mt-3 mb-4">
            Tenemos un lugar
            <br />
            <span className="text-pantera-green">para tu hijo</span>
          </h2>
          <p className="section-subtitle max-w-xl mx-auto">
            9 categorías desde los 5 hasta los 13 años. Metodología específica para cada edad.
          </p>
        </div>

        {/* Panteritas */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">🐾</span>
            <h3 className="text-white font-black text-2xl">Panteritas</h3>
            <span className="text-gray-500 text-sm font-medium">Cat. 2019 · 2020 · 2021</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {panteritas.map((cat) => (
              <div
                key={cat.cat}
                className={`relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${cat.color} p-5 hover:border-white/10 transition-all duration-300 hover:scale-[1.02]`}
              >
                <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1 rounded-full">
                  CAT. {cat.cat}
                </span>
                <h4 className="text-white font-black text-xl mt-3 mb-1">{cat.ages}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{cat.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Panteras */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">🐆</span>
            <h3 className="text-white font-black text-2xl">Panteras</h3>
            <span className="text-gray-500 text-sm font-medium">Cat. 2013 · 2014 · 2015 · 2016 · 2017 · 2018</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {panteras.map((cat) => (
              <div
                key={cat.cat}
                className={`relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${cat.color} p-5 hover:border-white/10 transition-all duration-300 hover:scale-[1.02]`}
              >
                <span className="text-xs font-bold text-pantera-green bg-pantera-green/10 border border-pantera-green/20 px-3 py-1 rounded-full">
                  CAT. {cat.cat}
                </span>
                <h4 className="text-white font-black text-xl mt-3 mb-1">{cat.ages}</h4>
                <p className="text-gray-500 text-sm leading-relaxed">{cat.description}</p>
              </div>
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
