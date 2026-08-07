"use client";
import { trackEvento } from "@/lib/analytics";

const WHATSAPP = "https://wa.me/528445028582";

const perks = [
  "Primera sesión de prueba sin costo",
  "Agenda en minutos por WhatsApp",
  "Sin compromiso de inscripción",
  "Confirmación inmediata",
];

export default function RegistrationForm() {
  return (
    <section id="inscripcion" className="py-16 sm:py-24" style={{ background: "var(--bg-alt)" }}>
      <div className="max-w-6xl mx-auto px-5 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Izquierda — texto */}
          <div>
            <span className="section-label">Inscripción</span>
            <div className="section-line" />
            <h2 className="section-title-theme mt-0 mb-6">
              El primer paso<br />
              <span className="text-pantera-green">empieza aquí</span>
            </h2>
            <p className="section-subtitle-theme mb-8">
              Agenda tu sesión de prueba{" "}
              <span className="font-semibold" style={{ color: "var(--text-primary)" }}>completamente gratis</span>{" "}
              directamente por WhatsApp, sin formularios ni esperas.
            </p>

            <ul className="space-y-4 mb-8">
              {perks.map((p) => (
                <li key={p} className="flex items-center gap-3 font-medium" style={{ color: "var(--text-secondary)" }}>
                  <span className="w-5 h-5 rounded-full bg-pantera-green/20 border border-pantera-green/40 flex items-center justify-center text-pantera-green text-xs flex-shrink-0">
                    ✓
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Derecha — CTA */}
          <div className="card-theme border border-pantera-green/20 flex flex-col items-center text-center gap-6 py-12">

            {/* Ícono WhatsApp */}
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(22,163,74,0.12)", border: "1px solid rgba(22,163,74,0.2)" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="#22c55e">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>

            <div>
              <h3 className="font-bold text-2xl mb-2"
                style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
                Agenda tu clase de prueba
              </h3>
              <p className="text-sm leading-relaxed max-w-xs mx-auto" style={{ color: "var(--text-secondary)" }}>
                Escríbenos por WhatsApp y agenda tu clase de prueba en minutos, sin compromiso.
              </p>
            </div>

            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvento("whatsapp_clic")}
              className="btn-primary w-full max-w-xs text-center text-base">
              Agendar por WhatsApp →
            </a>

            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              844 502 8582
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
