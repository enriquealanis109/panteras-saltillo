"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

function ParallaxPhoto({ src, label, delay = 0 }: { src: string; label: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rawY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const y    = useSpring(rawY, { stiffness: 60, damping: 20 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      className="relative overflow-hidden rounded-2xl group cursor-default h-full">
      <motion.img
        src={src}
        alt={label}
        style={{ y }}
        className="w-full h-full object-cover scale-110 will-change-transform"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
        <span className="text-xs text-pantera-green font-semibold tracking-widest uppercase">{label}</span>
      </div>
    </motion.div>
  );
}

function FullWidthParallax() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rawY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const y    = useSpring(rawY, { stiffness: 50, damping: 18 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="absolute inset-0 overflow-hidden rounded-2xl">
      <motion.img
        src="/equipo.png"
        alt="Panteras Saltillo — Equipo"
        style={{ y }}
        className="w-full h-full object-cover object-center scale-125 will-change-transform"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 flex items-center px-8 sm:px-12">
        <div>
          <p className="section-label mb-2">Temporada 2025–2026</p>
          <p className="font-heading font-bold text-white text-2xl sm:text-3xl">Panteras Saltillo</p>
          <p className="text-gray-400 text-sm mt-1">Más de 200 jugadores · 9 categorías</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function PhotoGallery() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
  const y       = useTransform(scrollYProgress, [0, 0.4], [60, 0]);

  return (
    <section ref={ref} className="py-24 px-5 sm:px-8 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">

        <motion.div style={{ opacity, y }} className="mb-12">
          <p className="section-label mb-3">En acción</p>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-white leading-tight">
            Donde se forman<br />
            <span className="text-pantera-green">los grandes</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4 h-[420px] sm:h-[520px] lg:h-[580px]">
          <div className="col-span-1 row-span-2">
            <ParallaxPhoto src="/accion2.jpeg" label="Competencia" delay={0} />
          </div>
          <div className="col-span-1 row-span-1">
            <ParallaxPhoto src="/accion3.jpeg" label="Portería" delay={0.1} />
          </div>
          <div className="col-span-1 row-span-1">
            <ParallaxPhoto src="/accion1.png" label="Duelo" delay={0.2} />
          </div>
        </div>

        <div className="mt-4 relative overflow-hidden rounded-2xl h-56 sm:h-72">
          <FullWidthParallax />
        </div>
      </div>
    </section>
  );
}
