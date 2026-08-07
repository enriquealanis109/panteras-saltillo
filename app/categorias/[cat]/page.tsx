"use client";
import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const META: Record<string, { nombre: string; edad: string; grupo: string; color: string; accentColor: string; descripcion: string; temporada: string }> = {
  "2021": { nombre: "Cat. 2021", edad: "5 años",  grupo: "Panteritas", color: "from-green-400/15 to-transparent", accentColor: "#4ade80", descripcion: "Primer contacto con el balón. Juego libre y desarrollo motor básico.", temporada: "2025–2026" },
  "2020": { nombre: "Cat. 2020", edad: "6 años",  grupo: "Panteritas", color: "from-green-500/15 to-transparent", accentColor: "#16a34a", descripcion: "Coordinación y habilidades motrices a través del juego y la diversión.", temporada: "2025–2026" },
  "2019": { nombre: "Cat. 2019", edad: "7 años",  grupo: "Panteritas", color: "from-green-700/15 to-transparent", accentColor: "#15803d", descripcion: "Iniciación a los fundamentos técnicos: control, pase y dribling.", temporada: "2025–2026" },
  "2018": { nombre: "Cat. 2018", edad: "8 años",  grupo: "Panteras",   color: "from-emerald-500/15 to-transparent", accentColor: "#16a34a", descripcion: "Técnica individual y primeros conceptos de juego en equipo.", temporada: "2025–2026" },
  "2017": { nombre: "Cat. 2017", edad: "9 años",  grupo: "Panteras",   color: "from-emerald-600/15 to-transparent", accentColor: "#16a34a", descripcion: "Fundamentos tácticos básicos y desarrollo de la inteligencia de juego.", temporada: "2025–2026" },
  "2016": { nombre: "Cat. 2016", edad: "10 años", grupo: "Panteras",   color: "from-blue-500/15 to-transparent",    accentColor: "#3b82f6", descripcion: "Posicionamiento, presión y juego colectivo más estructurado.", temporada: "2025–2026" },
  "2015": { nombre: "Cat. 2015", edad: "11 años", grupo: "Panteras",   color: "from-purple-500/15 to-transparent",  accentColor: "#a855f7", descripcion: "Preparación física, táctica y desarrollo de mentalidad competitiva.", temporada: "2025–2026" },
  "2014": { nombre: "Cat. 2014", edad: "12 años", grupo: "Panteras",   color: "from-orange-500/15 to-transparent",  accentColor: "#f97316", descripcion: "Fútbol competitivo. Táctica avanzada y alto rendimiento.", temporada: "2025–2026" },
  "2013": { nombre: "Cat. 2013", edad: "13 años", grupo: "Panteras",   color: "from-red-500/15 to-transparent",     accentColor: "#ef4444", descripcion: "Máximo nivel. Preparación para ligas y torneos de alto nivel.", temporada: "2025–2026" },
};

const secciones = [
  { id: "palmares", label: "Palmarés" },
  { id: "ligas",    label: "Ligas" },
  { id: "galeria",  label: "Galería" },
  { id: "staff",    label: "Staff" },
];

interface Palmares { id: string; tipo: string; nombre: string; anio: number }
interface Liga     { id: string; nombre: string; activo: boolean }
interface Galeria  { id: string; tipo: string; url: string; titulo: string | null }
interface Staff    { id: string; nombre: string; rol: string; foto_url: string | null }

function TrophyIcon({ tipo }: { tipo: string }) {
  if (tipo === "campeonato") return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-pantera-green mx-auto">
      <path d="M6 9H4a2 2 0 01-2-2V5h4"/><path d="M18 9h2a2 2 0 002-2V5h-4"/>
      <path d="M12 17c-3.3 0-6-2.7-6-6V3h12v8c0 3.3-2.7 6-6 6z"/><path d="M8 21h8"/><path d="M12 17v4"/>
    </svg>
  );
  if (tipo === "subcampeonato") return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mx-auto">
      <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
    </svg>
  );
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 mx-auto">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  );
}

export default function CategoriaPage() {
  const params = useParams();
  const cat = params.cat as string;
  const meta = META[cat];

  const [palmares, setPalmares]       = useState<Palmares[]>([]);
  const [ligas, setLigas]             = useState<Liga[]>([]);
  const [galeria, setGaleria]         = useState<Galeria[]>([]);
  const [staff, setStaff]             = useState<Staff[]>([]);
  const [fotoPortada, setFotoPortada] = useState<string | null>(null);
  const [portadaPosX, setPortadaPosX] = useState(50);
  const [portadaPosY, setPortadaPosY] = useState(50);
  const [portadaEscala, setPortadaEscala] = useState(1);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    if (!meta) return;
    const fetch = async () => {
      const { data: catData } = await supabase
        .from("categorias").select("id").eq("nombre", `CAT ${cat}`).single();
      if (!catData) { setLoading(false); return; }
      const id = catData.id;

      const { data: portadaData } = await supabase.from("portadas").select("url, pos_x, pos_y, escala").eq("categoria_id", id).single();
      setFotoPortada(portadaData?.url ?? null);
      setPortadaPosX(portadaData?.pos_x ?? 50);
      setPortadaPosY(portadaData?.pos_y ?? 50);
      setPortadaEscala(portadaData?.escala ?? 1);

      const [p, l, g, s] = await Promise.all([
        supabase.from("palmares").select("*").eq("categoria_id", id).order("anio", { ascending: false }),
        supabase.from("ligas").select("*").eq("categoria_id", id).order("nombre"),
        supabase.from("galeria").select("*").eq("categoria_id", id).order("created_at", { ascending: false }),
        supabase.from("cuerpo_tecnico").select("*").eq("categoria_id", id).order("nombre"),
      ]);
      setPalmares(p.data ?? []);
      setLigas(l.data ?? []);
      setGaleria(g.data ?? []);
      setStaff(s.data ?? []);
      setLoading(false);
    };
    fetch();
  }, [cat]); // eslint-disable-line

  if (!meta) return notFound();

  const campeonatos    = palmares.filter((p) => p.tipo === "campeonato");
  const subcampeonatos = palmares.filter((p) => p.tipo === "subcampeonato");
  const torneos        = palmares.filter((p) => p.tipo === "torneo");

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-white/40 group-hover:text-white transition-colors text-sm">←</span>
            <span className="font-heading font-bold text-white text-sm tracking-widest uppercase">
              Panteras <span className="text-pantera-green">Saltillo</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {secciones.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="font-body text-xs text-gray-500 hover:text-white transition-colors uppercase tracking-wide">
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className={`relative min-h-[88vh] flex items-center overflow-hidden pt-14 ${!fotoPortada ? `bg-gradient-to-br ${meta.color}` : "bg-[#0a0a0a]"}`}>

        {/* Foto de portada */}
        {fotoPortada && (
          <img src={fotoPortada} alt={meta.nombre}
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              objectPosition: `${portadaPosX}% ${portadaPosY}%`,
              transform: `scale(${portadaEscala})`,
              transformOrigin: `${portadaPosX}% ${portadaPosY}%`,
            }} />
        )}

        {/* Capa base oscura uniforme */}
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.35)" }} />

        {/* Gradiente de arriba hacia el centro — cubre todo el top sin línea visible */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.20) 50%, transparent 75%)" }} />

        {/* Gradiente desde la izquierda para legibilidad del texto */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.20) 50%, transparent 100%)" }} />

        {/* Color de la categoría desde abajo */}
        <div className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: `linear-gradient(to top, ${meta.accentColor}30 0%, transparent 100%)` }} />

        {/* Fade al fondo de página */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0a0a0a] to-transparent" />

        {/* Grid pattern si no hay foto */}
        {!fotoPortada && (
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
        )}

        {/* Línea de color lateral */}
        <div className="absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full" style={{ background: meta.accentColor }} />

        <div className="relative z-10 max-w-6xl mx-auto px-8 md:px-12 w-full">
          <div className="flex items-center gap-3 mb-5">
            <span className="font-heading text-xs tracking-[0.3em] uppercase font-bold" style={{ color: meta.accentColor }}>
              {meta.grupo}
            </span>
            <span className="text-white/20 text-xs">·</span>
            <span className="font-heading text-xs tracking-[0.2em] uppercase text-white/40">
              Temporada {meta.temporada}
            </span>
          </div>
          <h1 className="font-heading font-bold leading-none tracking-tight">
            <span className="block text-5xl sm:text-7xl md:text-9xl text-white drop-shadow-2xl whitespace-nowrap">{meta.nombre}</span>
            <span className="block text-xl sm:text-2xl md:text-3xl font-medium mt-3" style={{ color: meta.accentColor }}>{meta.edad}</span>
          </h1>
          <p className="font-body text-white/60 text-sm md:text-lg max-w-lg mt-5 leading-relaxed">{meta.descripcion}</p>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-6 py-20 space-y-24">

          {/* Palmarés */}
          <section id="palmares">
            <span className="section-label" style={{ color: meta.accentColor }}>Historial</span>
            <div className="w-12 h-px mt-4 mb-6" style={{ background: meta.accentColor + "99" }} />
            <h2 className="section-title mb-10">Palmarés</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { tipo: "campeonato",    lista: campeonatos,    titulo: "Campeonatos" },
                { tipo: "subcampeonato", lista: subcampeonatos, titulo: "Subcampeonatos" },
                { tipo: "torneo",        lista: torneos,        titulo: "Torneos jugados" },
              ].map((item) => (
                <div key={item.tipo} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 text-center">
                  <div className="mb-3"><TrophyIcon tipo={item.tipo} /></div>
                  <div className="font-heading font-bold text-4xl text-white mb-1">
                    {item.lista.length > 0 ? item.lista.length : "—"}
                  </div>
                  <div className="font-heading text-sm text-white/70 font-semibold mb-3">{item.titulo}</div>
                  {item.lista.length > 0 ? (
                    <div className="space-y-1">
                      {item.lista.map((p) => (
                        <p key={p.id} className="font-body text-xs text-gray-500">{p.nombre} · {p.anio}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="font-body text-xs text-gray-700">Por confirmar</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Ligas activas */}
          <section id="ligas">
            <span className="section-label" style={{ color: meta.accentColor }}>Competencia</span>
            <div className="w-12 h-px mt-4 mb-6" style={{ background: meta.accentColor + "99" }} />
            <h2 className="section-title mb-10">Ligas activas</h2>

            {ligas.length === 0 ? (
              <p className="font-body text-gray-600 text-sm">Sin ligas registradas por el momento.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ligas.map((liga) => (
                  <div key={liga.id} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 flex items-center gap-5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: liga.activo ? "#16a34a" : "#6b7280" }} />
                    <div>
                      <div className="font-heading text-white font-semibold text-base">{liga.nombre}</div>
                      <div className="font-body text-gray-500 text-sm mt-0.5">
                        Temporada {meta.temporada} · <span style={{ color: liga.activo ? "#16a34a" : "#6b7280" }}>{liga.activo ? "Activa" : "Por confirmar"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Galería */}
          <section id="galeria">
            <span className="section-label" style={{ color: meta.accentColor }}>Fotos</span>
            <div className="w-12 h-px mt-4 mb-6" style={{ background: meta.accentColor + "99" }} />
            <h2 className="section-title mb-4">Galería</h2>

            {galeria.length === 0 ? (
              <>
                <p className="section-subtitle mb-10">Las fotos de entrenamientos y partidos se irán publicando a lo largo de la temporada.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="aspect-video bg-white/[0.03] border border-white/[0.05] rounded-xl flex items-center justify-center">
                      <span className="font-heading text-white/10 text-xs tracking-widest uppercase">Próximamente</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
                {galeria.map((g) => (
                  <div key={g.id} className="rounded-2xl overflow-hidden aspect-video bg-white/[0.03]">
                    {g.tipo === "foto" ? (
                      <img src={g.url} alt={g.titulo ?? ""} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <video src={g.url} className="w-full h-full object-cover" controls />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Cuerpo técnico */}
          <section id="staff">
            <span className="section-label" style={{ color: meta.accentColor }}>Staff</span>
            <div className="w-12 h-px mt-4 mb-6" style={{ background: meta.accentColor + "99" }} />
            <h2 className="section-title mb-10">Cuerpo técnico</h2>

            {staff.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {["Entrenador principal", "Asistente técnico", "Preparador físico"].map((rol) => (
                  <div key={rol} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-4 flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div className="font-heading text-white/30 font-semibold text-base mb-1">Por confirmar</div>
                    <div className="font-body text-gray-600 text-sm">{rol}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {staff.map((s) => (
                  <div key={s.id} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
                    {s.foto_url ? (
                      <img src={s.foto_url} alt={s.nombre} className="w-16 h-16 rounded-full object-cover mb-4" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 mb-4 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                    )}
                    <div className="font-heading text-white font-semibold text-base mb-1">{s.nombre}</div>
                    <div className="font-body text-gray-500 text-sm">{s.rol}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* CTA */}
          <section className="border-t border-white/[0.06] pt-16 text-center">
            <h3 className="font-heading font-bold text-3xl text-white mb-4">¿Tu hijo quiere jugar en esta categoría?</h3>
            <p className="font-body text-gray-400 mb-8">La primera semana de prueba es completamente gratuita y sin compromiso.</p>
            <Link href="/#inscripcion" className="btn-primary inline-block">
              Solicitar prueba gratuita →
            </Link>
          </section>
        </div>
      )}
    </main>
  );
}
