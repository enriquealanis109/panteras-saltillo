"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { trackEvento } from "@/lib/analytics";

const fadeUp = {
  hidden: { opacity: 0, y: 50, filter: "blur(8px)" },
  show:   { opacity: 1, y: 0,  filter: "blur(0px)", transition: { duration: 0.8, ease: "easeOut" as const } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const imgY    = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const textY   = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const imgYSpring  = useSpring(imgY,  { stiffness: 80, damping: 25 });
  const textYSpring = useSpring(textY, { stiffness: 80, damping: 25 });

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Fondo con degradado (sin fotos de jugadores) */}
      <motion.div style={{ y: imgYSpring }} className="absolute inset-0 scale-110 will-change-transform">
        <div
          className="w-full h-full"
          style={{
            background:
              "radial-gradient(circle at 25% 20%, rgba(22,163,74,0.22), transparent 55%), linear-gradient(135deg, var(--bg-page) 0%, var(--hero-tint) 45%, var(--bg-page) 100%)",
          }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, var(--bg-page), transparent, var(--hero-fade-edge))" }} />
      </motion.div>

      {/* Orb verde */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.12, 1], opacity: [0.1, 0.18, 0.1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
          style={{ background: "radial-gradient(circle, #16a34a 0%, transparent 65%)" }}
        />
      </div>

      {/* Contenido */}
      <motion.div
        style={{ y: textYSpring, opacity }}
        className="relative z-10 max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-20 w-full">

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* ── Columna izquierda ── */}
          <div>
            <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-pantera-green" />
              <span className="section-label">Academia de Fútbol · Saltillo</span>
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-heading font-bold leading-[0.92] tracking-tight mb-5">
              <span className="block w-fit text-5xl sm:text-6xl lg:text-6xl xl:text-7xl" style={{ color: "var(--text-primary)" }}>
                FORMAMOS
              </span>
              <span
                className="block w-fit text-5xl sm:text-6xl lg:text-6xl xl:text-7xl"
                style={{
                  background: "linear-gradient(135deg, #86efac 0%, #22c55e 40%, #16a34a 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                CAMPEONES
              </span>
              <span className="block text-sm sm:text-base font-medium tracking-[0.2em] uppercase mt-3" style={{ color: "var(--text-muted)" }}>
                dentro y fuera de la cancha
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} className="text-base sm:text-lg leading-relaxed mb-8 max-w-lg" style={{ color: "var(--text-secondary)" }}>
              Disciplina, técnica y carácter para jugadores de{" "}
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>5 a 13 años</span>.
              Metodología profesional con resultados reales en Saltillo.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 mb-12">
              <motion.a
                href="#inscripcion"
                onClick={() => trackEvento("clic_inscribir")}
                whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(22,163,74,0.5)" }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary text-center text-sm sm:text-base">
                Inscribir a mi hijo
              </motion.a>
              <motion.a
                href="#categorias"
                onClick={() => trackEvento("clic_ver_categorias")}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-outline-theme text-center text-sm sm:text-base">
                Ver categorías
              </motion.a>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-6 border-t pt-6 max-w-sm" style={{ borderColor: "var(--border-strong)" }}>
              {[
                { number: "200+",    label: "Jugadores" },
                { number: "Lun–Jue", label: "5–7 PM" },
                { number: "9",       label: "Categorías" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-heading text-2xl sm:text-3xl font-bold text-pantera-green">{s.number}</div>
                  <div className="text-[10px] mt-1 tracking-widest uppercase" style={{ color: "var(--text-secondary)" }}>{s.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Logo desktop ── */}
          <motion.div variants={fadeUp} className="hidden lg:flex items-center justify-center">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full opacity-25 animate-orb-slow"
                style={{ background: "conic-gradient(from 0deg, transparent 60%, #16a34a 80%, transparent 100%)", scale: "1.2" }}
              />
              <div className="animate-glow-pulse rounded-full">
                <img
                  src="/c0810c3f-4795-4374-909f-79abe32eb3bd.jpeg"
                  alt="Panteras Saltillo"
                  className="w-64 h-64 xl:w-80 xl:h-80 rounded-full border-2 border-pantera-green/30 object-cover relative z-10"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-pantera-green text-white font-heading font-bold text-xs px-4 py-2 rounded-full tracking-widest uppercase shadow-lg shadow-pantera-green/30 z-20">
                Saltillo
              </div>
            </div>
          </motion.div>

        </motion.div>
      </motion.div>

      {/* Degradado inferior */}
      <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none z-10" style={{ background: "linear-gradient(to top, var(--bg-page), transparent)" }} />

      {/* Scroll indicator */}
      <motion.div
        style={{ opacity }}
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
        <span className="text-[10px] tracking-widest uppercase" style={{ color: "var(--text-muted)" }}>Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-pantera-green/60 to-transparent" />
      </motion.div>
    </section>
  );
}
