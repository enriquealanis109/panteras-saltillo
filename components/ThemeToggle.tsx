"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className={`w-9 h-9 ${className}`} aria-hidden="true" />;
  }

  const isLight = theme === "light";

  return (
    <button
      onClick={() => setTheme(isLight ? "dark" : "light")}
      aria-label={isLight ? "Activar modo oscuro" : "Activar modo claro"}
      className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors duration-200 ${className}`}
      style={{ borderColor: "var(--border-strong)", color: "var(--text-primary)" }}
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
