"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const DOCS_BASE = ["acta", "curp"]; // obligatorios individualmente
// constancia O pasaporte — con uno basta

interface CatDoc { id: string; nombre: string; total: number; completos: number; pendientes: number; porTipo: Record<string, number> }

export default function AdminDocumentosPage() {
  const router  = useRouter();
  const [cats, setCats]     = useState<CatDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const cargar = async () => {
    const [catRes, jugRes, docRes] = await Promise.all([
      supabase.from("categorias").select("id, nombre").order("nombre"),
      supabase.from("jugadores").select("id, categoria_id").eq("activo", true),
      supabase.from("documentos").select("jugador_id, tipo"),
    ]);

    if (docRes.error) { setError(docRes.error.message); setLoading(false); return; }

    const docsMap: Record<string, Set<string>> = {};
    (docRes.data ?? []).forEach((d) => {
      if (!docsMap[d.jugador_id]) docsMap[d.jugador_id] = new Set();
      docsMap[d.jugador_id].add(d.tipo);
    });

    const result: CatDoc[] = (catRes.data ?? []).map((cat) => {
      const jugscat = (jugRes.data ?? []).filter((j) => j.categoria_id === cat.id);
      const completos = jugscat.filter((j) => {
        const tipos = docsMap[j.id] ?? new Set();
        return DOCS_BASE.every((req) => tipos.has(req)) &&
          (tipos.has("constancia") || tipos.has("pasaporte"));
      }).length;
      const porTipo: Record<string, number> = {};
      ["acta", "curp", "constancia", "pasaporte"].forEach((tipo) => {
        porTipo[tipo] = jugscat.filter((j) => (docsMap[j.id] ?? new Set()).has(tipo)).length;
      });
      porTipo["foto"] = jugscat.filter((j) => (docsMap[j.id] ?? new Set()).has("foto")).length;
      return { id: cat.id, nombre: cat.nombre, total: jugscat.length, completos, pendientes: jugscat.length - completos, porTipo };
    });

    setCats(result);
    setLoading(false);
  };

  useEffect(() => {
    cargar();

    // Tiempo real: re-carga cuando cualquier coordinador sube o elimina un documento
    const channel = supabase
      .channel("admin-documentos-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "documentos" }, () => {
        cargar();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []); // eslint-disable-line

  const totalPend = cats.reduce((s, c) => s + c.pendientes, 0);
  const totalDocs = cats.reduce((s, c) => s + Object.values(c.porTipo).reduce((a, b) => a + b, 0), 0);

  const TIPO_LABEL: Record<string, string> = {
    acta: "Acta", curp: "CURP", constancia: "Const.", pasaporte: "Pasap.", foto: "Foto",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Syne, sans-serif" }}>Documentos</h1>
        <p className="text-gray-500 text-sm mt-1">
          {totalPend} jugadores con documentación incompleta · {totalDocs} archivos subidos en total
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4 text-red-400 text-sm">
          Error al cargar: {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div id="tour-docs-lista" className="space-y-3">
          {cats.map((cat) => {
            const pct = cat.total > 0 ? Math.round((cat.completos / cat.total) * 100) : 0;
            return (
              <div key={cat.id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:border-white/15 cursor-pointer transition-all"
                onClick={() => router.push(`/coach/documentos/${cat.id}`)}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold text-sm" style={{ fontFamily: "Syne, sans-serif" }}>{cat.nombre}</h3>
                    <p className="text-gray-600 text-xs mt-0.5">{cat.total} jugadores · {cat.completos} completos · {cat.pendientes} pendientes</p>
                  </div>
                  <span className={`text-lg font-black ${pct === 100 ? "text-green-400" : pct >= 75 ? "text-gray-400" : pct > 0 ? "text-orange-400" : "text-red-400"}`}
                    style={{ fontFamily: "Syne, sans-serif" }}>
                    {pct}%
                  </span>
                </div>

                <div className="w-full bg-white/[0.05] rounded-full h-1.5 mb-3">
                  <div className={`h-1.5 rounded-full transition-all ${pct === 100 ? "bg-green-500" : pct >= 75 ? "bg-gray-400" : pct > 0 ? "bg-orange-500" : "bg-red-500"}`}
                    style={{ width: `${pct}%` }} />
                </div>

                {/* Desglose por tipo de documento */}
                <div className="grid grid-cols-5 gap-2">
                  {["acta", "curp", "constancia", "pasaporte", "foto"].map((tipo) => {
                    const count = cat.porTipo[tipo] ?? 0;
                    const tipoPct = cat.total > 0 ? Math.round((count / cat.total) * 100) : 0;
                    return (
                      <div key={tipo} className="text-center">
                        <p className="text-[10px] text-gray-600 uppercase tracking-wider">{TIPO_LABEL[tipo]}</p>
                        <p className={`text-sm font-bold mt-0.5 ${tipoPct === 100 ? "text-green-400" : tipoPct > 0 ? "text-gray-400" : "text-gray-700"}`}>
                          {count}/{cat.total}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
