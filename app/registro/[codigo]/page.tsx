"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import toast from "react-hot-toast";

const CLUB_LOGO = process.env.NEXT_PUBLIC_CLUB_LOGO_URL || "/icon-192.png";
const CLUB_NOMBRE = process.env.NEXT_PUBLIC_CLUB_NOMBRE || "Panteras Saltillo";

type Step = "validando" | "form" | "hijos" | "notif" | "ios-guia" | "listo" | "error";

interface JugadorCat { id: string; nombre: string; }

export default function RegistroPage() {
  const { codigo } = useParams<{ codigo: string }>();
  const router     = useRouter();

  const [step,         setStep]         = useState<Step>("validando");
  const [codigoData,   setCodigoData]   = useState<{ id: string; categoria_id: string; categorias: { nombre: string } } | null>(null);
  const [form,         setForm]         = useState({ nombre: "", usuario: "", password: "" });
  const [loading,      setLoading]      = useState(false);
  const [existingUser, setExistingUser] = useState<{ id: string; email?: string } | null>(null);
  const [jugadoresCat, setJugadoresCat] = useState<JugadorCat[]>([]);
  const [selectedHijos, setSelectedHijos] = useState<string[]>([]);
  const [userId, setUserId]            = useState<string | null>(null);

  useEffect(() => {
    const validar = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setExistingUser({ id: user.id, email: user.email });

      const { data, error } = await supabase
        .from("codigos_invitacion")
        .select("id, categoria_id, usado, expira_en, categorias(nombre)")
        .eq("codigo", codigo.toUpperCase())
        .single();
      if (error || !data)                        { setStep("error"); return; }
      if (data.usado)                            { setStep("error"); return; }
      if (new Date(data.expira_en) < new Date()) { setStep("error"); return; }
      setCodigoData(data as any);
      setStep("form");
    };
    validar();
  }, [codigo]);

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let uid: string;

    if (existingUser) {
      uid = existingUser.id;
    } else {
      const rawUsuario = form.usuario.trim().toLowerCase().replace(/\s+/g, ".");
      const email = `${rawUsuario}@padres.panteras`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: form.password,
      });
      if (authError || !authData.user) {
        toast.error(authError?.message ?? "Error al crear cuenta");
        setLoading(false);
        return;
      }
      uid = authData.user.id;
    }

    const { error: padreError } = await supabase.from("padres").insert({
      id:           uid,
      nombre:       form.nombre.trim(),
      categoria_id: codigoData!.categoria_id,
      jugador_ids:  [],
    });
    if (padreError) {
      toast.error(padreError.message);
      setLoading(false);
      return;
    }

    await supabase.from("codigos_invitacion").update({
      usado: true, usado_por: uid,
    }).eq("id", codigoData!.id);

    // Cargar jugadores de la categoria para seleccionar hijos
    const { data: jugs } = await supabase
      .from("jugadores")
      .select("id, nombre")
      .eq("categoria_id", codigoData!.categoria_id)
      .eq("activo", true)
      .order("nombre");
    setJugadoresCat(jugs ?? []);
    setUserId(uid);
    setLoading(false);
    setStep("hijos");
  };

  const handleHijos = async () => {
    setLoading(true);
    const uid = userId ?? existingUser?.id;
    if (uid && selectedHijos.length > 0) {
      await supabase.from("padres").update({ jugador_ids: selectedHijos }).eq("id", uid);
    }
    setLoading(false);

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isPWA = (navigator as any).standalone === true ||
                  window.matchMedia("(display-mode: standalone)").matches;
    if (isIOS && !isPWA) {
      setStep("ios-guia");
    } else {
      setStep("notif");
    }
  };

  const habilitarNotificaciones = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setStep("listo");
      return;
    }
    const permiso = await Notification.requestPermission();
    if (permiso !== "granted") { setStep("listo"); return; }
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("push_subscriptions").insert({
        padre_id: user!.id, subscription: sub.toJSON(),
      });
      toast.success("Notificaciones activadas");
    } catch {
      toast("No se pudieron activar las notificaciones");
    }
    setStep("listo");
  };

  const toggleHijo = (id: string) => {
    setSelectedHijos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ── ESTADOS ──

  if (step === "validando") return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (step === "error") return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h2 className="text-white font-bold text-lg mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Codigo invalido</h2>
        <p className="text-gray-500 text-sm">Este codigo ya fue usado, expiro o no existe. Solicita uno nuevo a tu entrenador.</p>
      </div>
    </div>
  );

  if (step === "listo") return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-pantera-green/10 border border-pantera-green/20 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Registro completo</h2>
        <p className="text-gray-400 text-sm mb-6">
          Ya eres parte de Panteras {codigoData?.categorias?.nombre}. Recibiras notificaciones cuando el entrenador publique partidos o avisos.
        </p>
        <button onClick={() => router.push("/papa")}
          className="bg-pantera-green hover:bg-pantera-green-dark text-white font-bold py-3 px-8 rounded-xl transition-colors w-full">
          Ir a mi panel
        </button>
      </div>
    </div>
  );

  if (step === "hijos") return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-pantera-green/10 border border-pantera-green/20 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <h2 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
            Selecciona a tu hijo
          </h2>
          <p className="text-gray-400 text-sm">
            Toca el nombre de tu hijo registrado en {codigoData?.categorias?.nombre}. Si tienes mas de uno, selecciona todos.
          </p>
        </div>

        <div className="space-y-2 mb-6 max-h-80 overflow-y-auto">
          {jugadoresCat.length === 0 ? (
            <div className="text-center py-8 text-gray-600 text-sm">
              No hay jugadores registrados en esta categoria todavia.
            </div>
          ) : jugadoresCat.map((j) => {
            const sel = selectedHijos.includes(j.id);
            return (
              <button key={j.id} onClick={() => toggleHijo(j.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left ${
                  sel
                    ? "bg-pantera-green/10 border-pantera-green/40"
                    : "bg-white/[0.03] border-white/[0.07] hover:border-white/15"
                }`}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  sel ? "bg-pantera-green border-pantera-green" : "border-white/25"
                }`}>
                  {sel && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <span className={`text-sm font-medium ${sel ? "text-white" : "text-gray-300"}`}>
                  {j.nombre}
                </span>
              </button>
            );
          })}
        </div>

        <button onClick={handleHijos} disabled={loading}
          className="bg-pantera-green hover:bg-pantera-green-dark disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors w-full mb-3">
          {loading
            ? "Guardando..."
            : selectedHijos.length > 0
              ? `Continuar · ${selectedHijos.length} seleccionado${selectedHijos.length > 1 ? "s" : ""}`
              : "Continuar sin seleccionar"}
        </button>
        <p className="text-gray-700 text-xs text-center">
          Puedes actualizar esta seleccion despues desde tu panel
        </p>
      </div>
    </div>
  );

  if (step === "ios-guia") return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <Image src={CLUB_LOGO} alt={CLUB_NOMBRE} width={56} height={56} className="rounded-full mx-auto mb-4 border border-pantera-green/20" />
          <h2 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
            Agrega la app a tu iPhone
          </h2>
          <p className="text-gray-400 text-sm">
            Para recibir notificaciones en iPhone necesitas guardar la app en tu pantalla de inicio. Solo toma 30 segundos.
          </p>
        </div>

        <div className="space-y-3 mb-8">
          {[
            {
              texto: "Toca el boton de compartir en Safari",
              icono: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>,
            },
            {
              texto: "Selecciona Agregar a pantalla de inicio",
              icono: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
            },
            {
              texto: "Abre la app desde tu pantalla de inicio y ya recibiras notificaciones",
              icono: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
            },
          ].map((paso, i) => (
            <div key={i} className="flex items-start gap-4 bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
              <div className="w-8 h-8 rounded-lg bg-pantera-green/10 border border-pantera-green/20 flex items-center justify-center flex-shrink-0">
                {paso.icono}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{paso.texto}</p>
            </div>
          ))}
        </div>

        <button onClick={() => setStep("listo")}
          className="bg-pantera-green hover:bg-pantera-green-dark text-white font-bold py-3 rounded-xl transition-colors w-full mb-3">
          Listo, ya lo agregue
        </button>
        <button onClick={() => setStep("listo")}
          className="text-gray-600 hover:text-white text-sm py-2 w-full transition-colors">
          Omitir por ahora
        </button>
      </div>
    </div>
  );

  if (step === "notif") return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-pantera-green/10 border border-pantera-green/20 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
          </div>
          <h2 className="text-white font-bold text-xl mb-2" style={{ fontFamily: "Syne, sans-serif" }}>Activa notificaciones</h2>
          <p className="text-gray-400 text-sm">
            Recibe alertas directamente en tu celular cuando haya un partido o aviso importante.
          </p>
        </div>
        <button onClick={habilitarNotificaciones}
          className="bg-pantera-green hover:bg-pantera-green-dark text-white font-bold py-3 rounded-xl transition-colors w-full mb-3">
          Activar notificaciones
        </button>
        <button onClick={() => setStep("listo")}
          className="text-gray-600 hover:text-white text-sm py-2 w-full transition-colors">
          Ahora no
        </button>
      </div>
    </div>
  );

  // Step: form
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src={CLUB_LOGO} alt={CLUB_NOMBRE} width={56} height={56} className="rounded-full mx-auto mb-4 border border-pantera-green/20" />
          <div className="inline-flex items-center gap-2 bg-pantera-green/10 border border-pantera-green/20 rounded-full px-3 py-1 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-pantera-green" />
            <span className="text-pantera-green text-xs font-semibold">Categoria {codigoData?.categorias?.nombre}</span>
          </div>
          <h1 className="text-white font-bold text-2xl" style={{ fontFamily: "Syne, sans-serif" }}>Unete a Panteras</h1>
          <p className="text-gray-500 text-sm mt-1">Crea tu acceso para recibir notificaciones y confirmar asistencia</p>
        </div>

        <form onSubmit={handleRegistro} className="space-y-3">
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Nombre completo</label>
            <input
              type="text"
              placeholder="Ej: Maria Gonzalez"
              value={form.nombre}
              onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))}
              required
              className="input-field"
            />
          </div>
          {!existingUser && (
            <>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Usuario</label>
                <input
                  type="text"
                  placeholder="Ej: papajuan"
                  value={form.usuario}
                  onChange={(e) => setForm((p) => ({ ...p, usuario: e.target.value }))}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  className="input-field"
                />
                <p className="text-gray-700 text-[10px] mt-1">Con este usuario entrarás al sistema</p>
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block mb-1.5">Contrasena</label>
                <input
                  type="password"
                  placeholder="Minimo 6 caracteres"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                  className="input-field"
                />
              </div>
            </>
          )}
          {existingUser && (
            <p className="text-gray-500 text-xs bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-3">
              Cuenta detectada: {existingUser.email} — se vinculara esta categoria a tu perfil existente.
            </p>
          )}
          <button type="submit" disabled={loading}
            className="bg-pantera-green hover:bg-pantera-green-dark disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors w-full mt-2">
            {loading
              ? (existingUser ? "Vinculando..." : "Creando acceso...")
              : (existingUser ? "Vincular mi hijo" : "Crear mi acceso")}
          </button>
        </form>

        <p className="text-gray-600 text-xs text-center mt-4">
          Codigo valido por 30 dias · Un codigo por familia
        </p>
      </div>
    </div>
  );
}
