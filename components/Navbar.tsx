"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const links = [
  { label: "Beneficios",  href: "/#beneficios"  },
  { label: "Categorías",  href: "/#categorias"  },
  { label: "Metodología", href: "/#metodologia" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen]         = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled ? "backdrop-blur-xl border-b bg-[var(--nav-overlay)]" : "bg-transparent"
    }`} style={scrolled ? { borderColor: "var(--border-subtle)" } : undefined}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <Image
            src="/c0810c3f-4795-4374-909f-79abe32eb3bd.jpeg"
            alt="Panteras Saltillo"
            width={38}
            height={38}
            className="rounded-full border group-hover:border-pantera-green/40 transition-colors duration-300 -translate-y-[6px]"
            style={{ borderColor: "var(--border-strong)" }}
          />
          <span className="font-heading font-bold text-sm tracking-widest uppercase" style={{ color: "var(--text-primary)" }}>
            Panteras <span className="text-pantera-green">Saltillo</span>
          </span>
        </Link>

        {/* Links — desktop */}
        <div className="hidden md:flex items-center gap-7 flex-1 justify-center">
          {links.map((l) => (
            <a key={l.href} href={l.href}
              className="font-body text-sm transition-colors duration-200 tracking-wide relative group"
              style={{ color: "var(--text-secondary)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}>
              {l.label}
              <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-pantera-green group-hover:w-full transition-all duration-300" />
            </a>
          ))}
          <Link href="/tienda"
            className="font-body text-sm transition-colors duration-200 tracking-wide relative group"
            style={{ color: "var(--text-secondary)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}>
            Tienda
            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-pantera-green group-hover:w-full transition-all duration-300" />
          </Link>
        </div>

        {/* CTAs — desktop */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          <ThemeToggle />
          <a href="/#inscripcion"
            className="text-sm font-bold text-white bg-pantera-green hover:bg-pantera-green-dark px-5 py-2 rounded-lg transition-all duration-200 hover:scale-[1.03] inline-block">
            Inscribir ahora
          </a>
        </div>

        {/* Hamburger — mobile */}
        <div className="md:hidden flex items-center gap-1 flex-shrink-0">
          <ThemeToggle />
          <button className="flex flex-col gap-1.5 p-2"
            onClick={() => setOpen(!open)} aria-label="Menú">
            <span className={`block w-5 h-px transition-all duration-300 ${open ? "rotate-45 translate-y-2" : ""}`} style={{ background: "var(--text-primary)" }} />
            <span className={`block w-5 h-px transition-all duration-300 ${open ? "opacity-0" : ""}`} style={{ background: "var(--text-primary)" }} />
            <span className={`block w-5 h-px transition-all duration-300 ${open ? "-rotate-45 -translate-y-2.5" : ""}`} style={{ background: "var(--text-primary)" }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden backdrop-blur-xl border-t px-6 py-6 flex flex-col gap-4 bg-[var(--nav-overlay-mobile)]" style={{ borderColor: "var(--border-subtle)" }}>
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}
              className="font-body text-base transition-colors duration-200"
              style={{ color: "var(--text-secondary)" }}>
              {l.label}
            </a>
          ))}
          <Link href="/tienda" onClick={() => setOpen(false)}
            className="font-body text-base transition-colors duration-200"
            style={{ color: "var(--text-secondary)" }}>
            Tienda
          </Link>
          <div className="border-t pt-4" style={{ borderColor: "var(--border-strong)" }}>
            <a href="/#inscripcion" onClick={() => setOpen(false)}
              className="btn-primary text-center block">
              Inscribir ahora
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
