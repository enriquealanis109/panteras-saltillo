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
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
        toast.success("¡Registro enviado! Te contactamos pronto.");
      } else {
        throw new Error("Error en el registro");
      }
    } catch {
      toast.error("Algo salió mal. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <section className="py-24 bg-pantera-gray" id="inscripcion">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h3 className="text-3xl font-black text-white mb-4">
            ¡Solicitud enviada!
          </h3>
          <p className="text-gray-400 text-lg">
            Recibimos tus datos. Un coach de Panteras FC se pondrá en contacto
            contigo en menos de 24 horas.
          </p>
          <div className="mt-8 p-4 bg-pantera-green/10 border border-pantera-green/20 rounded-xl">
            <p className="text-pantera-green font-semibold">
              Mientras tanto, síguenos en Instagram para ver lo que hacemos cada
              día 🐆
            </p>
          </div>
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
