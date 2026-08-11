"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

const LETTERS = ["P","A","N","T","E","R","A","S"];

export default function PageLoader() {
  const pathname = usePathname();
  const [visible,  setVisible]  = useState(true);
  const [fadeOut,  setFadeOut]  = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true),  2000);
    const t2 = setTimeout(() => setVisible(false), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Splash de bienvenida solo para el sitio público — un coordinador/coach
  // no necesita verlo cada vez que entra a trabajar, y está hecho a la
  // medida del nombre "Panteras" (no sirve tal cual para otro club).
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/coach")) return null;

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}>

      {/* Flash verde radial al inicio */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, rgba(22,163,74,0.38) 0%, transparent 65%)",
          animation: "flashFade 1.1s ease-out forwards",
        }}
      />

      {/* Logo con drop + bounce */}
      <div
        className="relative z-10 mb-5"
        style={{ animation: "logoDrop 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.1s both" }}
      >
        <Image
          src="/c0810c3f-4795-4374-909f-79abe32eb3bd.jpeg"
          alt="Panteras Saltillo"
          width={92}
          height={92}
          className="rounded-full"
          priority
        />
      </div>

      {/* PANTERAS — cada letra entra con stagger */}
      <div className="flex items-center gap-[2px] z-10 mb-1">
        {LETTERS.map((l, i) => (
          <span
            key={i}
            className="text-[30px] font-black text-white leading-none"
            style={{
              fontFamily: "Syne, sans-serif",
              animation: `letterUp 0.35s ease-out ${0.28 + i * 0.045}s both`,
            }}
          >
            {l}
          </span>
        ))}
      </div>

      {/* SALTILLO desliza desde la derecha */}
      <p
        className="text-pantera-green font-bold text-[11px] tracking-[0.5em] z-10 mb-8"
        style={{ animation: "slideIn 0.4s ease-out 0.7s both" }}
      >
        SALTILLO
      </p>

      {/* Barra de progreso */}
      <div
        className="w-28 h-[2px] bg-white/[0.06] rounded-full overflow-hidden z-10"
        style={{ animation: "fadeIn 0.3s ease-out 0.45s both" }}
      >
        <div
          className="h-full bg-pantera-green rounded-full"
          style={{ animation: "progress 1.7s cubic-bezier(0.4,0,0.2,1) 0.45s both" }}
        />
      </div>

      <style jsx>{`
        @keyframes flashFade {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes logoDrop {
          from { opacity: 0; transform: translateY(-32px) scale(0.82); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
        @keyframes letterUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(14px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes progress {
          from { width: 0%;    }
          to   { width: 100%;  }
        }
      `}</style>
    </div>
  );
}
