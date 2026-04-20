"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 1800);
    const hide = setTimeout(() => setVisible(false), 2300);
    return () => { clearTimeout(timer); clearTimeout(hide); };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo animado */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Anillo giratorio */}
        <div className="absolute w-36 h-36 rounded-full border-2 border-pantera-green/20 border-t-pantera-green animate-spin" />
        <div className="absolute w-28 h-28 rounded-full border border-pantera-green/10 border-b-pantera-green/40 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
        <Image
          src="/c0810c3f-4795-4374-909f-79abe32eb3bd.jpeg"
          alt="Panteras FC"
          width={88}
          height={88}
          className="rounded-full z-10"
        />
      </div>

      {/* Nombre */}
      <div className="text-center">
        <p className="text-2xl font-black text-white tracking-widest">
          PANTERAS <span className="text-pantera-green">SALTILLO</span>
        </p>
        <p className="text-gray-600 text-xs mt-1 tracking-widest uppercase">
          Formación y Fútbol Saltillo
        </p>
      </div>

      {/* Barra de progreso */}
      <div className="mt-8 w-40 h-0.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-pantera-green rounded-full animate-[progress_1.8s_ease-in-out_forwards]" />
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0% }
          to { width: 100% }
        }
      `}</style>
    </div>
  );
}
