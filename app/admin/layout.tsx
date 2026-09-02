"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { PanelTour } from "@/components/admin/PanelTour";
import { ADMIN_TOURS } from "@/lib/admin-tours";
import { ClubContext, DEFAULT_BRANDING, hexToRgbTriplet, type ClubBranding, type ModuloOpcional } from "@/lib/club-context";
import ChatWidget from "@/components/chat/ChatWidget";

const NAV: { href: string; label: string; icon: React.ReactNode; modulo?: ModuloOpcional }[] = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    href: "/admin/categorias",
    label: "Categorías",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
      </svg>
    ),
  },
  {
    href: "/admin/jugadores",
    label: "Jugadores",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    href: "/admin/entrenadores",
    label: "Cuerpo Técnico",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
  {
    href: "/admin/documentos",
    label: "Documentos",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  {
    href: "/admin/metricas",
    label: "Métricas",
    modulo: "metricas",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    href: "/admin/partidos",
    label: "Partidos",
    modulo: "partidos",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 000 20"/><path d="M2 12h20"/>
        <path d="M12 2c-4 6-4 14 0 20"/><path d="M4.93 4.93l14.14 14.14"/>
      </svg>
    ),
  },
  {
    href: "/admin/planeaciones",
    label: "Planeaciones",
    modulo: "planeaciones",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    href: "/admin/patrocinadores",
    label: "Patrocinadores",
    modulo: "patrocinadores",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
      </svg>
    ),
  },
  {
    href: "/admin/tienda",
    label: "Tienda",
    modulo: "tienda",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 01-8 0"/>
      </svg>
    ),
  },
  {
    href: "/admin/pedidos",
    label: "Pedidos",
    modulo: "tienda",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    href: "/admin/padres",
    label: "Padres",
    modulo: "padres",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
    ),
  },
];

// Bottom nav: 4 pinned + "Más" drawer
const BOTTOM_NAV_PINNED = ["/admin", "/admin/entrenadores", "/admin/documentos", "/admin/metricas"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router      = useRouter();
  const pathname    = usePathname();
  const [ok, setOk]             = useState(false);
  const [nombre, setNombre]     = useState("");
  const [branding, setBranding] = useState<ClubBranding>(DEFAULT_BRANDING);
  const [masOpen, setMasOpen]   = useState(false);
  const [aviso, setAviso]       = useState("");

  const avisarBloqueado = (label: string) => {
    setAviso(`${label} no está incluido en tu plan. Contacta al administrador del sistema para activarlo.`);
    setTimeout(() => setAviso(""), 3500);
  };

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/coach/login"); return; }
      const { data } = await supabase.from("entrenadores").select("nombre, rol, club_id").eq("id", user.id).single();
      if (data?.rol !== "admin") { router.push("/coach"); return; }
      setNombre(data.nombre ?? "Admin");
      if (data.club_id) {
        const { data: club } = await supabase.from("clubes").select("nombre, logo_url, color_acento, modulos_activos").eq("id", data.club_id).single();
        if (club) {
          setBranding({
            nombre: club.nombre ?? DEFAULT_BRANDING.nombre,
            logoUrl: club.logo_url ?? DEFAULT_BRANDING.logoUrl,
            colorAcento: club.color_acento ?? DEFAULT_BRANDING.colorAcento,
            modulosActivos: club.modulos_activos ?? [],
          });
        }
      }
      setOk(true);
    };
    check();
  }, [router]);

  // Close "más" drawer on route change
  useEffect(() => { setMasOpen(false); }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/coach/login");
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  // Exact path key for tour (strip dynamic segments)
  const tourKey = pathname.replace(/\/[0-9a-f-]{36}$/, "").replace(/\/\[.*?\]$/, "");
  const currentTour = ADMIN_TOURS[tourKey];

  if (!ok) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const initials = nombre.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const tieneModulo = (item: { modulo?: ModuloOpcional }) =>
    !item.modulo || branding.modulosActivos.includes(item.modulo);
  const pinnedItems = NAV.filter((n) => BOTTOM_NAV_PINNED.includes(n.href));
  const moreItems   = NAV.filter((n) => !BOTTOM_NAV_PINNED.includes(n.href));

  // Módulo (si aplica) de la página actual — si el club no lo tiene activado,
  // se muestra un aviso en vez del contenido real de esa página.
  const itemActual = NAV.find((n) => isActive(n.href));
  const moduloBloqueado = itemActual?.modulo && !branding.modulosActivos.includes(itemActual.modulo)
    ? itemActual : null;

  const IconLock = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  );

  return (
    <ClubContext.Provider value={branding}>
    <div className="min-h-screen bg-[#0a0a0a] flex overflow-x-hidden"
      style={{ "--club-accent": hexToRgbTriplet(branding.colorAcento) } as React.CSSProperties}>

      {aviso && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl max-w-[90vw] text-center bg-[#111] border border-white/10 text-white">
          {aviso}
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ─────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 bg-[#0d0d0d] border-r border-white/[0.06] fixed h-full z-20">
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <Image src={branding.logoUrl} alt={branding.nombre} width={32} height={32} className="rounded-full" />
            <div>
              <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>{branding.nombre}</p>
              <p className="text-pantera-green text-[10px] font-bold uppercase tracking-widest">Panel admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map((item) => {
            const disponible = tieneModulo(item);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  !disponible
                    ? "text-gray-700 hover:text-gray-500 hover:bg-white/[0.02]"
                    : isActive(item.href)
                    ? "bg-pantera-green/10 text-pantera-green border border-pantera-green/20"
                    : "text-gray-500 hover:text-white hover:bg-white/[0.04]"
                }`}>
                <span className={!disponible ? "text-gray-700" : isActive(item.href) ? "text-pantera-green" : "text-gray-600"}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {!disponible && <IconLock />}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/[0.06] space-y-0.5">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-pantera-green/20 border border-pantera-green/30 flex items-center justify-center flex-shrink-0">
              <span className="text-pantera-green text-[10px] font-bold">{initials}</span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{nombre}</p>
              <p className="text-gray-600 text-[10px]">Administrador</p>
            </div>
          </div>
          {branding.modulosActivos.includes("sitio_publico") ? (
            <a href="/" target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-white hover:bg-white/[0.04] transition-all">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              Ver sitio
            </a>
          ) : (
            <button onClick={() => avisarBloqueado("Ver sitio")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:text-gray-500 hover:bg-white/[0.02] transition-all">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              <span className="flex-1 text-left">Ver sitio</span>
              <IconLock />
            </button>
          )}
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/5 transition-all">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP HEADER ───────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-[#0d0d0d] border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Image src={branding.logoUrl} alt={branding.nombre} width={26} height={26} className="rounded-full" />
          <div>
            <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: "Syne, sans-serif" }}>
              {currentTour ? currentTour.label : "Panel Admin"}
            </p>
            <p className="text-pantera-green text-[9px] uppercase tracking-widest font-bold">Administrador</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentTour && (
            <PanelTour
              key={tourKey}
              steps={currentTour.steps}
              storageKey={`tour_admin_${tourKey.replace(/\//g, "_")}`}
            />
          )}
          <div className="w-8 h-8 rounded-full bg-pantera-green/15 border border-pantera-green/25 flex items-center justify-center">
            <span className="text-pantera-green text-[10px] font-bold">{initials}</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────── */}
      <main className="flex-1 lg:ml-56 pt-[52px] pb-20 lg:pt-0 lg:pb-0 min-h-screen overflow-x-hidden">
        {moduloBloqueado ? (
          <div className="flex flex-col items-center justify-center text-center px-6 py-24">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-5 text-gray-500">
              <IconLock />
            </div>
            <h2 className="text-white font-bold text-lg mb-2" style={{ fontFamily: "Syne, sans-serif" }}>
              {moduloBloqueado.label} no está incluido en tu plan
            </h2>
            <p className="text-gray-500 text-sm max-w-sm">
              Contacta al administrador del sistema si quieres agregar este módulo a {branding.nombre}.
            </p>
          </div>
        ) : children}
      </main>

      {/* ── MOBILE BOTTOM NAV ───────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0d0d0d] border-t border-white/[0.06] flex items-stretch h-16">
        {pinnedItems.map((item) => {
          const active = isActive(item.href);
          const disponible = tieneModulo(item);
          return (
            <Link key={item.href} href={item.href}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                !disponible ? "text-gray-700" : active ? "text-pantera-green" : "text-gray-600"
              }`}>
              <span className="relative">
                {item.icon}
                {!disponible && <span className="absolute -top-1 -right-1.5 text-gray-600"><IconLock /></span>}
              </span>
              <span className={`text-[9px] font-semibold leading-none ${!disponible ? "text-gray-700" : active ? "text-pantera-green" : "text-gray-600"}`}>
                {item.label === "Cuerpo Técnico" ? "Staff" : item.label}
              </span>
              {active && <span className="absolute bottom-0 w-8 h-0.5 bg-pantera-green rounded-t-full" />}
            </Link>
          );
        })}

        {/* Más button */}
        <button
          onClick={() => setMasOpen((v) => !v)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
            masOpen ? "text-white" : "text-gray-600"
          }`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {masOpen
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>}
          </svg>
          <span className="text-[9px] font-semibold leading-none">Más</span>
        </button>
      </nav>

      {/* ── MOBILE MÁS DRAWER ───────────────────── */}
      {masOpen && (
        <div
          className="lg:hidden fixed inset-0 z-20 bg-black/40"
          onClick={() => setMasOpen(false)}>
          <div
            className="absolute bottom-16 left-0 right-0 bg-[#0d0d0d] border-t border-white/[0.06] p-3 space-y-0.5"
            onClick={(e) => e.stopPropagation()}>

            <p className="text-[9px] text-gray-600 uppercase tracking-widest px-3 py-1">Secciones</p>

            {moreItems.map((item) => {
              const disponible = tieneModulo(item);
              return (
                <Link key={item.href} href={item.href} onClick={() => setMasOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                    !disponible
                      ? "text-gray-600"
                      : isActive(item.href)
                      ? "bg-pantera-green/10 text-pantera-green border border-pantera-green/20"
                      : "text-gray-400 hover:text-white hover:bg-white/[0.04]"
                  }`}>
                  <span className={!disponible ? "text-gray-700" : isActive(item.href) ? "text-pantera-green" : "text-gray-600"}>{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {!disponible && <IconLock />}
                </Link>
              );
            })}

            <div className="border-t border-white/[0.06] pt-2 mt-2 space-y-0.5">
              {branding.modulosActivos.includes("sitio_publico") ? (
                <a href="/" target="_blank"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-500 hover:text-white hover:bg-white/[0.04] transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  Ver sitio
                </a>
              ) : (
                <button onClick={() => { avisarBloqueado("Ver sitio"); setMasOpen(false); }}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-gray-700 hover:text-gray-500 hover:bg-white/[0.02] transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  <span className="flex-1 text-left">Ver sitio</span>
                  <IconLock />
                </button>
              )}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-400 hover:bg-red-500/5 transition-all">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP FLOATING TOUR BUTTON ────────── */}
      {currentTour && (
        <div className="hidden lg:block fixed bottom-6 right-6 z-40">
          <PanelTour
            key={tourKey}
            steps={currentTour.steps}
            storageKey={`tour_admin_${tourKey.replace(/\//g, "_")}`}
          />
        </div>
      )}

      <ChatWidget />
    </div>
    </ClubContext.Provider>
  );
}
