"use client";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-black/90 backdrop-blur-md border-b border-white/5" : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/c0810c3f-4795-4374-909f-79abe32eb3bd.jpeg"
            alt="Panteras FC Logo"
            width={52}
            height={52}
            className="rounded-full"
          />
          <span className="text-xl font-black text-white">
            PANTERAS <span className="text-pantera-green">SALTILLO</span>
          </span>
        </div>
        <a
          href="#inscripcion"
          className="bg-pantera-green hover:bg-pantera-green-dark text-white font-bold py-2 px-6 rounded-lg transition-all duration-200 text-sm"
        >
          Inscribir ahora
        </a>
      </div>
    </nav>
  );
}
