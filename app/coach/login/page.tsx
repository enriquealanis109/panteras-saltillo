"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { hexToRgbTriplet, DEFAULT_BRANDING } from "@/lib/club-context";

// Antes de iniciar sesión no sabemos a qué club pertenece el usuario, así que
// la marca de esta pantalla viene de variables de entorno (una por despliegue
// de Vercel), no de la base de datos. Panteras sigue igual porque no las tiene
// configuradas y todas caen a su default de siempre.
const CLUB_NOMBRE = process.env.NEXT_PUBLIC_CLUB_NOMBRE || "Panteras Saltillo";
const CLUB_LOGO   = process.env.NEXT_PUBLIC_CLUB_LOGO_URL || DEFAULT_BRANDING.logoUrl;
const CLUB_COLOR  = process.env.NEXT_PUBLIC_CLUB_COLOR || DEFAULT_BRANDING.colorAcento;
const DOMAIN = process.env.NEXT_PUBLIC_CLUB_DOMAIN || "@panteras.coach";
const STORAGE_KEY = "panteras_coach_usuario";

export default function LoginPage() {
  const router = useRouter();
  const [usuario, setUsuario]   = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado) setUsuario(guardado);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const raw   = usuario.trim().toLowerCase();
    const email = raw.includes("@") ? raw : raw + DOMAIN;

    let authResult = await supabase.auth.signInWithPassword({ email, password });

    // Si falló y no es correo completo, intentar con dominio de padres
    if (authResult.error && !raw.includes("@")) {
      authResult = await supabase.auth.signInWithPassword({
        email: raw + "@padres.panteras",
        password,
      });
    }

    if (authResult.error) {
      setError("Usuario o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    localStorage.setItem(STORAGE_KEY, raw);
    sessionStorage.setItem("panteras_session", "1");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/coach"); return; }

    // Verificar rol de entrenador primero
    const { data: ent } = await supabase.from("entrenadores").select("rol").eq("id", user.id).single();
    if (ent?.rol === "admin")   { router.push("/admin"); return; }
    if (ent)                    { router.push("/coach"); return; }

    // Si no es entrenador, verificar si es padre de familia
    const { data: padre } = await supabase.from("padres").select("id, activo").eq("id", user.id).single();
    if (padre?.activo) { router.push("/papa"); return; }

    setError("Tu cuenta no tiene un rol asignado. Contacta al administrador.");
    setLoading(false);
  };

  const input = "input-theme text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center px-5"
      style={{ background: "var(--bg-page)", "--club-accent": hexToRgbTriplet(CLUB_COLOR) } as React.CSSProperties}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div style={{ animation: "loginLogoIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both" }}>
            <Image src={CLUB_LOGO} alt="" width={72} height={72}
              className="rounded-full mb-4" />
          </div>
          <h1 className="font-bold text-xl" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)", animation: "loginFadeUp 0.45s ease-out 0.15s both" }}>
            Portal
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)", animation: "loginFadeUp 0.45s ease-out 0.25s both" }}>{CLUB_NOMBRE}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4" autoComplete="on"
          style={{ animation: "loginFadeUp 0.45s ease-out 0.35s both" }}>

          <div>
            <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Usuario
            </label>
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ej: carlos"
              className={input}
              autoCapitalize="none"
              autoCorrect="off"
              required
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={input}
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button type="submit" disabled={loading}
            className="btn-primary w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
            {loading ? "Entrando..." : "Entrar →"}
          </button>
        </form>

        <p className="text-center text-xs mt-8" style={{ color: "var(--text-muted)" }}>
          Usa tu usuario asignado para acceder al portal
        </p>

        <div className="text-center mt-4">
          <a href="/" className="link-muted-theme text-xs transition-colors">
            ← Volver a la página principal
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes loginLogoIn {
          from { opacity: 0; transform: translateY(-18px) scale(0.85); }
          to   { opacity: 1; transform: translateY(0)     scale(1);    }
        }
        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
      `}</style>
    </div>
  );
}
