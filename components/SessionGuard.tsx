"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

const SESSION_KEY = "panteras_session";
const TIMEOUT_MS  = 45 * 60 * 1000; // 45 min sin actividad → cierre
const WARNING_MS  = 42 * 60 * 1000; // aviso 3 min antes

// Rutas que requieren sesión activa
const RUTAS_PROTEGIDAS = ["/coach", "/admin", "/papa"];
// Páginas de login: no aplica el guard
const PAGINAS_LOGIN    = ["/coach/login"];

export default function SessionGuard() {
  const router   = useRouter();
  const pathname = usePathname();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [aviso, setAviso] = useState(false);

  const esProtegida = RUTAS_PROTEGIDAS.some((p) => pathname.startsWith(p)) &&
                      !PAGINAS_LOGIN.includes(pathname);

  const cerrarSesion = useCallback(async () => {
    sessionStorage.removeItem(SESSION_KEY);
    await supabase.auth.signOut();
    router.push("/coach/login");
  }, [router]);

  const resetTimer = useCallback(() => {
    setAviso(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warnRef.current)  clearTimeout(warnRef.current);
    warnRef.current  = setTimeout(() => setAviso(true),  WARNING_MS);
    timerRef.current = setTimeout(() => cerrarSesion(),  TIMEOUT_MS);
  }, [cerrarSesion]);

  // Verificación inicial: detectar si el navegador fue cerrado y reabierto
  useEffect(() => {
    if (!esProtegida) return;

    const verificar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // sin sesión activa, la propia página redirige

      if (!sessionStorage.getItem(SESSION_KEY)) {
        // Supabase conserva el token en localStorage pero sessionStorage está vacío
        // → el navegador/tab fue cerrado → forzar re-login
        await cerrarSesion();
        return;
      }

      resetTimer();
    };

    verificar();
  }, [esProtegida, pathname, cerrarSesion, resetTimer]); // eslint-disable-line

  // Resetear timer con cualquier actividad del usuario
  useEffect(() => {
    if (!esProtegida) return;

    const onActivity = () => resetTimer();
    const events = ["click", "keydown", "touchstart", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (warnRef.current)  clearTimeout(warnRef.current);
    };
  }, [esProtegida, resetTimer]); // eslint-disable-line

  if (!aviso || !esProtegida) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[200] max-w-md mx-auto">
      <div className="bg-[#1a1a1a] border border-gray-500/30 rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3 shadow-2xl">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse flex-shrink-0" />
          <p className="text-gray-300 text-sm leading-tight">
            Sesión por cerrar — <span className="font-semibold">3 min por inactividad</span>
          </p>
        </div>
        <button
          onClick={resetTimer}
          className="flex-shrink-0 text-xs font-bold bg-gray-500/20 border border-gray-500/40 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-500/30 active:scale-95 transition-all"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
