"use client";
import { useState } from "react";
import toast from "react-hot-toast";

interface FormData {
  parentName: string;
  childName: string;
  age: string;
  phone: string;
  category: string;
}

export default function RegistrationForm() {
  const [formData, setFormData] = useState<FormData>({
    parentName: "",
    childName: "",
    age: "",
    phone: "",
    category: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
    } catch {}

    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <section className="py-24 bg-pantera-gray" id="inscripcion">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h3 className="text-3xl font-black text-white mb-4">
            ¡Datos recibidos!
          </h3>
          <p className="text-gray-400 text-lg mb-8">
            El siguiente paso es hablar con nuestro asistente en Telegram — te ayudará a agendar tu sesión de prueba <span className="text-white font-semibold">gratuita</span> en segundos.
          </p>
          <a
            href="https://t.me/panteras_bot_10bot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#229ED9] hover:bg-[#1a8fc4] text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg text-lg"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Continuar en Telegram →
          </a>
          <p className="text-gray-600 text-sm mt-4">
            Nuestro asistente te atiende de inmediato ⚡
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-pantera-gray" id="inscripcion">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left side */}
          <div>
            <span className="text-pantera-green font-semibold text-sm uppercase tracking-widest">
              Inscripción
            </span>
            <h2 className="section-title mt-3 mb-6">
              El primer paso
              <br />
              <span className="text-pantera-green">empieza aquí</span>
            </h2>
            <p className="section-subtitle mb-8">
              Llena el formulario y un entrenador de Panteras FC te contactará
              para coordinar la primera sesión de prueba —{" "}
              <span className="text-white font-semibold">completamente gratis</span>.
            </p>

            <div className="space-y-4">
              {[
                "✅ Primera sesión de prueba sin costo",
                "✅ Evaluación personalizada de tu hijo",
                "✅ Sin compromiso de inscripción",
                "✅ Respuesta en menos de 24 horas",
              ].map((item) => (
                <div key={item} className="text-gray-300 font-medium">
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="card border border-pantera-green/20">
            <h3 className="text-white font-bold text-xl mb-6">
              Datos de inscripción
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-gray-400 text-sm font-medium block mb-2">
                  Tu nombre (papá / mamá)
                </label>
                <input
                  type="text"
                  name="parentName"
                  required
                  placeholder="Juan García"
                  className="input-field"
                  value={formData.parentName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="text-gray-400 text-sm font-medium block mb-2">
                  Nombre de tu hijo
                </label>
                <input
                  type="text"
                  name="childName"
                  required
                  placeholder="Carlos García"
                  className="input-field"
                  value={formData.childName}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-400 text-sm font-medium block mb-2">
                    Edad del jugador
                  </label>
                  <input
                    type="number"
                    name="age"
                    required
                    placeholder="10"
                    min="5"
                    max="17"
                    className="input-field"
                    value={formData.age}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm font-medium block mb-2">
                    Categoría aprox.
                  </label>
                  <select
                    name="category"
                    className="input-field [&>option]:bg-[#0a0a0a] [&>option]:text-white"
                    style={{ backgroundColor: '#111111', color: 'white' }}
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="" style={{background:'#0a0a0a',color:'white'}}>Seleccionar categoría</option>
                    <option value="Cat 2021" style={{background:'#0a0a0a',color:'white'}}>Cat. 2021 — 5 años</option>
                    <option value="Cat 2020" style={{background:'#0a0a0a',color:'white'}}>Cat. 2020 — 6 años</option>
                    <option value="Cat 2019" style={{background:'#0a0a0a',color:'white'}}>Cat. 2019 — 7 años</option>
                    <option value="Cat 2018" style={{background:'#0a0a0a',color:'white'}}>Cat. 2018 — 8 años</option>
                    <option value="Cat 2017" style={{background:'#0a0a0a',color:'white'}}>Cat. 2017 — 9 años</option>
                    <option value="Cat 2016" style={{background:'#0a0a0a',color:'white'}}>Cat. 2016 — 10 años</option>
                    <option value="Cat 2015" style={{background:'#0a0a0a',color:'white'}}>Cat. 2015 — 11 años</option>
                    <option value="Cat 2014" style={{background:'#0a0a0a',color:'white'}}>Cat. 2014 — 12 años</option>
                    <option value="Cat 2013" style={{background:'#0a0a0a',color:'white'}}>Cat. 2013 — 13 años</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm font-medium block mb-2">
                  WhatsApp / Teléfono
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  placeholder="844 123 4567"
                  className="input-field"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-center mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? "Enviando..." : "Quiero la sesión gratuita →"}
              </button>

              <p className="text-gray-600 text-xs text-center">
                Tus datos son privados y no se comparten con nadie.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
