export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-pantera-black to-pantera-green-dark/20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(22,163,74,0.15)_0%,_transparent_60%)]" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 text-center pt-24 pb-16">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/c0810c3f-4795-4374-909f-79abe32eb3bd.jpeg"
            alt="Panteras FC"
            className="w-28 h-28 rounded-full border-4 border-pantera-green/40 shadow-2xl shadow-pantera-green/20"
          />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-pantera-green/10 border border-pantera-green/30 rounded-full px-4 py-2 mb-8">
          <span className="w-2 h-2 bg-pantera-green rounded-full animate-pulse" />
          <span className="text-pantera-green text-sm font-semibold">
            Panteras Saltillo · Academia de Fútbol
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-white leading-none mb-6 tracking-tight">
          FORMAMOS
          <span className="block text-pantera-green">CAMPEONES</span>
          <span className="block text-white/90">DENTRO Y FUERA</span>
          <span className="block text-white/90">DE LA CANCHA</span>
        </h1>

        <p className="text-gray-400 text-xl md:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Disciplina, técnica y carácter para jugadores de{" "}
          <span className="text-white font-semibold">5 a 17 años</span>.
          Tu hijo merece la mejor formación futbolística.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <a href="#inscripcion" className="btn-primary text-lg w-full sm:w-auto text-center">
            Inscribir a mi hijo →
          </a>
          <a href="#categorias" className="btn-outline text-lg w-full sm:w-auto text-center">
            Ver categorías
          </a>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
          {[
            { number: "200+", label: "Jugadores activos" },
            { number: "Lun–Jue", label: "5:15 – 7:15 PM" },
            { number: "9", label: "Categorías" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-pantera-green">
                {stat.number}
              </div>
              <div className="text-gray-500 text-xs md:text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-pantera-black to-transparent" />
    </section>
  );
}
