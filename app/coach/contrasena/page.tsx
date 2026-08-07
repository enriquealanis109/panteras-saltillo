"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CambiarContrasena() {
  const router = useRouter();
  const [nueva, setNueva]       = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [ok, setOk]             = useState(false);

  const input = "input-theme text-sm";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (nueva.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (nueva !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: nueva });

    if (error) {
      setError("No se pudo cambiar la contraseña. Intenta de nuevo.");
    } else {
      setOk(true);
      setNueva("");
      setConfirmar("");
      setTimeout(() => router.push("/coach"), 2000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-page)" }}>

      {/* Header */}
      <header className="border-b px-5 py-4 flex items-center gap-3" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <button onClick={() => router.back()}
          className="link-muted-theme transition-colors text-lg">
          ←
        </button>
        <h1 className="font-bold" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
          Cambiar contraseña
        </h1>
      </header>

      <div className="max-w-sm mx-auto px-5 pt-10">

        {ok ? (
          <div className="card-theme text-center py-10">
            <p className="text-4xl mb-4">✓</p>
            <p className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>Contraseña actualizada</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Redirigiendo al panel...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Elige una contraseña nueva. Mínimo 6 caracteres.
            </p>

            <div>
              <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Nueva contraseña
              </label>
              <input
                type="password"
                value={nueva}
                onChange={(e) => setNueva(e.target.value)}
                placeholder="••••••••"
                className={input}
                required
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest block mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Confirmar contraseña
              </label>
              <input
                type="password"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="••••••••"
                className={input}
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
              {loading ? "Guardando..." : "Guardar contraseña →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
