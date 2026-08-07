"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase, authHeaders, type Jugador, type Documento, type TipoDoc } from "@/lib/supabase";
import { PanelTour } from "@/components/admin/PanelTour";
import { DOCUMENTOS_STEPS } from "@/lib/coach-tours";

const TIPOS: { value: TipoDoc; label: string; short: string }[] = [
  { value: "acta",        label: "Acta de nacimiento",     short: "Acta"   },
  { value: "curp",        label: "CURP",                   short: "CURP"   },
  { value: "constancia",  label: "Constancia de estudios", short: "Const." },
  { value: "pasaporte",   label: "Pasaporte",              short: "Pasap." },
];

interface JugadorDocs {
  jugador: Jugador;
  docs: Partial<Record<TipoDoc, Documento>>;
}

/** "documentos" es privado desde el fix de seguridad — filas viejas guardan la URL
 *  pública que ya no funciona, filas nuevas guardan solo el path. Soporta ambas. */
function pathFromStored(value: string): string {
  const marker = "/object/public/documentos/";
  const idx = value.indexOf(marker);
  return idx === -1 ? value : decodeURIComponent(value.slice(idx + marker.length));
}

function IconPrint() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9"/>
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/>
      <rect x="6" y="14" width="12" height="8"/>
    </svg>
  );
}

export default function DocumentosPage({ params }: { params: { id: string } }) {
  const categoriaId = params.id;
  const router = useRouter();

  const [categoria, setCategoria]       = useState("");
  const [lista, setLista]               = useState<JugadorDocs[]>([]);
  const [loading, setLoading]           = useState(true);
  const [uploading, setUploading]       = useState<string | null>(null);
  const [deleting, setDeleting]         = useState<string | null>(null);
  const [toast, setToast]               = useState<{ msg: string; ok: boolean } | null>(null);
  const [vistaJugador, setVistaJugador] = useState<JugadorDocs | null>(null);
  const [signedUrls, setSignedUrls]     = useState<Record<string, string>>({});
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const uploadTarget  = useRef<{ jugadorId: string; tipo: TipoDoc } | null>(null);

  // "documentos" es un bucket privado (CURP/actas de menores) — cada acceso
  // pasa por el servidor, que verifica sesión+rol antes de firmar una URL temporal.
  const resolveSignedUrls = async (rawUrls: string[]): Promise<Record<string, string>> => {
    const unique = Array.from(new Set(rawUrls));
    if (unique.length === 0) return {};
    const res = await fetch("/api/documentos/signed-url", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify({ paths: unique }),
    });
    if (!res.ok) return {};
    const { urls } = await res.json();
    return urls ?? {};
  };

  const descargar = async (url: string, nombre: string) => {
    const res  = await fetch(url);
    const blob = await res.blob();
    const a    = document.createElement("a");
    a.href     = URL.createObjectURL(blob);
    a.download = nombre;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const mostrarToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const cargar = async () => {
    const { data: cat } = await supabase.from("categorias").select("nombre").eq("id", categoriaId).single();
    setCategoria(cat?.nombre ?? "");

    const { data: jug } = await supabase
      .from("jugadores").select("*")
      .eq("categoria_id", categoriaId).eq("activo", true).order("nombre");

    const jugadores: Jugador[] = jug ?? [];
    if (jugadores.length === 0) { setLista([]); setLoading(false); return; }

    const { data: docs } = await supabase
      .from("documentos").select("*")
      .in("jugador_id", jugadores.map((j) => j.id));

    const docsArr: Documento[] = docs ?? [];

    const resultado: JugadorDocs[] = jugadores.map((j) => {
      const map: Partial<Record<TipoDoc, Documento>> = {};
      docsArr.filter((d) => d.jugador_id === j.id).forEach((d) => { map[d.tipo as TipoDoc] = d; });
      return { jugador: j, docs: map };
    });

    setLista(resultado);
    setLoading(false);

    if (docsArr.length > 0) {
      resolveSignedUrls(docsArr.map((d) => d.url)).then(setSignedUrls);
    }
  };

  useEffect(() => {
    cargar();

    // Tiempo real: se actualiza cuando cualquier coordinador modifica documentos de esta categoría
    const channel = supabase
      .channel(`documentos-cat-${categoriaId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "documentos" }, () => {
        cargar();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [categoriaId]); // eslint-disable-line

  useEffect(() => {
    if (vistaJugador) {
      const updated = lista.find((l) => l.jugador.id === vistaJugador.jugador.id);
      if (updated) setVistaJugador(updated);
    }
  }, [lista]); // eslint-disable-line

  const iniciarSubida = (jugadorId: string, tipo: TipoDoc) => {
    uploadTarget.current = { jugadorId, tipo };
    if (fileInputRef.current) {
      // Accept lo más amplio posible para máxima compatibilidad en Mac, iOS, Android y Windows
      fileInputRef.current.accept = tipo === "foto"
        ? "image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,image/gif,image/bmp,image/tiff,image/*"
        : "application/pdf";
    }
    fileInputRef.current?.click();
  };

  const MAX_FILE_MB = 15;

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget.current) return;

    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      mostrarToast(`El archivo pesa más de ${MAX_FILE_MB}MB.`, false);
      e.target.value = "";
      return;
    }

    const { jugadorId, tipo } = uploadTarget.current;
    const key      = `${jugadorId}-${tipo}`;
    const existing = lista.find((l) => l.jugador.id === jugadorId)?.docs[tipo];
    setUploading(key);

    if (existing) {
      await supabase.storage.from("documentos").remove([pathFromStored(existing.url)]);
      await supabase.from("documentos").delete().eq("id", existing.id);
    }

    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase();
    const path = `${jugadorId}/${tipo}_${Date.now()}.${ext}`;

    // Detectar content type por extensión cuando el browser no lo reporta (común en Mac/iOS)
    const mimeByExt: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      webp: "image/webp", heic: "image/heic", heif: "image/heif",
      gif: "image/gif", bmp: "image/bmp", tiff: "image/tiff",
      pdf: "application/pdf",
    };
    const contentType = file.type || mimeByExt[ext] || "application/octet-stream";

    const { data: uploaded, error } = await supabase.storage
      .from("documentos").upload(path, file, { upsert: true, contentType });

    if (error || !uploaded) {
      mostrarToast(`Error al subir: ${error?.message ?? "desconocido"}`, false);
    } else {
      // Se guarda solo el path del bucket (privado) — la URL se firma al momento de verla, no antes.
      const { error: insertError } = await supabase.from("documentos").insert({
        jugador_id: jugadorId, tipo, url: uploaded.path, nombre_archivo: file.name,
      });
      if (insertError) {
        mostrarToast(`Error al guardar: ${insertError.message}`, false);
      } else {
        mostrarToast("Documento guardado");
        setVistaJugador((prev) => {
          if (!prev || prev.jugador.id !== jugadorId) return prev;
          const nuevoDoc = { id: "temp", jugador_id: jugadorId, tipo, url: uploaded.path, nombre_archivo: file.name, created_at: new Date().toISOString() };
          return { ...prev, docs: { ...prev.docs, [tipo]: nuevoDoc } };
        });
      }
    }

    e.target.value = "";
    await cargar();
    setUploading(null);
  };

  const eliminarDoc = async (jugadorId: string, doc: Documento) => {
    const key = `${jugadorId}-${doc.tipo}`;
    setDeleting(key);
    await supabase.storage.from("documentos").remove([pathFromStored(doc.url)]);
    const { error } = await supabase.from("documentos").delete().eq("id", doc.id);
    if (error) mostrarToast("Error al eliminar", false);
    else mostrarToast("Documento eliminado");
    await cargar();
    setDeleting(null);
  };

  const generarPDFUnificado = async (
    docs: { jugador: string; tipo: string; url: string; nombre?: string }[]
  ) => {
    if (docs.length === 0) { mostrarToast("No hay documentos subidos aún", false); return; }

    mostrarToast("Generando PDF...");

    // URLs firmadas frescas (las de la lista pueden llevar rato en pantalla y ya expiraron).
    const fresh = await resolveSignedUrls(docs.map((d) => d.url));

    const { PDFDocument } = await import("pdf-lib");
    const merged = await PDFDocument.create();

    for (const d of docs) {
      try {
        const resp  = await fetch(fresh[d.url] ?? d.url);
        const bytes = await resp.arrayBuffer();
        const ext   = (d.nombre ?? d.url).split(".").pop()?.toLowerCase();

        if (ext === "pdf") {
          const src   = await PDFDocument.load(bytes, { ignoreEncryption: true });
          const pages = await merged.copyPages(src, src.getPageIndices());
          pages.forEach((p) => merged.addPage(p));
        } else {
          const page = merged.addPage();
          const { width, height } = page.getSize();
          const img  = ext === "png"
            ? await merged.embedPng(bytes)
            : await merged.embedJpg(bytes);
          const dims = img.scaleToFit(width - 40, height - 40);
          page.drawImage(img, {
            x: (width  - dims.width)  / 2,
            y: (height - dims.height) / 2,
            width:  dims.width,
            height: dims.height,
          });
        }
      } catch { /* omitir archivo con error */ }
    }

    const pdfBytes = await merged.save();
    const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: "application/pdf" });
    const url  = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const imprimirJugador = (item: JugadorDocs) => {
    const docs = TIPOS
      .filter((t) => item.docs[t.value])
      .map((t) => ({
        jugador: item.jugador.nombre,
        tipo: t.label,
        url: item.docs[t.value]!.url,
        nombre: item.docs[t.value]!.nombre_archivo,
      }));
    generarPDFUnificado(docs);
  };

  const imprimirTodos = () => {
    const docs: { jugador: string; tipo: string; url: string; nombre?: string }[] = [];
    lista.forEach((item) =>
      TIPOS.forEach((t) => {
        const doc = item.docs[t.value];
        if (doc) docs.push({ jugador: item.jugador.nombre, tipo: t.label, url: doc.url, nombre: doc.nombre_archivo });
      })
    );
    generarPDFUnificado(docs);
  };

  const completados = (docs: Partial<Record<TipoDoc, Documento>>) => {
    const tieneBase = ["acta", "curp"].every((t) => docs[t as TipoDoc]);
    const tieneDoc  = !!(docs["constancia"] || docs["pasaporte"]);
    return tieneBase && tieneDoc ? 3 : ["acta", "curp"].filter((t) => docs[t as TipoDoc]).length + (tieneDoc ? 1 : 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10 overflow-x-hidden w-full" style={{ background: "var(--bg-page)" }}>

      <input ref={fileInputRef} type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,image/gif,image/bmp,image/*,application/pdf"
        className="hidden" onChange={onFileChange} />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm font-semibold shadow-xl ${
          toast.ok ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10" style={{ background: "var(--bg-alt)", borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.back()} className="link-muted-theme w-9 h-9 flex items-center justify-center rounded-lg transition-all active:scale-90 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div className="min-w-0">
            <h1 className="font-bold leading-tight truncate" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
              Documentos — {categoria}
            </h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{lista.length} jugadores</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <PanelTour steps={DOCUMENTOS_STEPS} storageKey="tour_coach_documentos" />
          <button onClick={imprimirTodos}
            className="link-muted-theme flex items-center gap-1.5 border text-xs font-bold px-3 py-2 rounded-lg transition-all" style={{ background: "var(--bg-surface-2)", borderColor: "var(--border-strong)" }}>
            <IconPrint />
            Imprimir todos
          </button>
        </div>
      </header>

      {/* Encabezado columnas */}
      <div className="grid grid-cols-7 px-4 py-2 border-b text-[10px] uppercase tracking-wider" style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}>
        <div className="col-span-2">Jugador</div>
        {TIPOS.map((t) => (
          <div key={t.value} className="text-center">{t.short}</div>
        ))}
        <div className="text-center">Foto</div>
      </div>

      {lista.length === 0 ? (
        <div className="text-center py-20 px-5">
          <p style={{ color: "var(--text-secondary)" }}>No hay jugadores en esta categoría.</p>
        </div>
      ) : (
        <div id="tour-docs-lista" className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
          {lista.map((item) => {
            const total = completados(item.docs);
            const tieneFoto = !!item.docs["foto"];
            return (
              <button key={item.jugador.id} onClick={() => setVistaJugador(item)}
                className="grid grid-cols-7 w-full px-4 py-3 items-center text-left transition-colors">
                <div className="col-span-2 min-w-0 pr-2">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{item.jugador.nombre}</p>
                  <p className={`text-[10px] mt-0.5 ${total === 3 ? "text-green-500" : ""}`} style={total !== 3 ? { color: "var(--text-muted)" } : undefined}>
                    {total}/3 docs
                  </p>
                </div>
                {TIPOS.map((t) => (
                  <div key={t.value} className="flex justify-center">
                    {item.docs[t.value] ? (
                      <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--bg-surface-2)" }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--border-strong)" }} />
                      </span>
                    )}
                  </div>
                ))}
                {/* Columna Foto */}
                <div className="flex justify-center">
                  {tieneFoto ? (
                    <span className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--bg-surface-2)" }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--border-strong)" }} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal centrado */}
      {vistaJugador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setVistaJugador(null)}>
          <div className="border rounded-2xl w-full max-w-md p-6 space-y-4" style={{ background: "var(--bg-alt)", borderColor: "var(--border-strong)" }}
            onClick={(e) => e.stopPropagation()}>

            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-bold text-lg" style={{ fontFamily: "Syne, sans-serif", color: "var(--text-primary)" }}>
                  {vistaJugador.jugador.nombre}
                </h2>
                {vistaJugador.jugador.alias && (
                  <p className="text-pantera-green text-sm">"{vistaJugador.jugador.alias}"</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => imprimirJugador(vistaJugador)}
                  className="link-muted-theme flex items-center gap-1.5 text-xs border hover:border-white/20 px-3 py-1.5 rounded-lg transition-all" style={{ borderColor: "var(--border-strong)" }}>
                  <IconPrint />
                  Imprimir
                </button>
                <button onClick={() => setVistaJugador(null)} className="link-muted-theme w-8 h-8 flex items-center justify-center rounded-lg transition-all active:scale-90 ml-1">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            <div className="space-y-2">

              {/* Foto del jugador — documento confidencial */}
              {(() => {
                const fotoDoc  = vistaJugador.docs["foto"];
                const fotoUrl  = fotoDoc ? signedUrls[fotoDoc.url] : undefined;
                const fotoKey  = `${vistaJugador.jugador.id}-foto`;
                const cargando = uploading === fotoKey;
                const borrando = deleting  === fotoKey;
                return (
                  <div className="rounded-xl px-4 py-3 border" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: "var(--bg-surface-2)" }}>
                        {fotoUrl ? (
                          <img src={fotoUrl} alt="" className="w-full h-full object-cover object-top" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--border-strong)" }} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Fotografía</p>
                        {fotoDoc ? (
                          <p className="text-green-500 text-[10px] mt-0.5">Subida</p>
                        ) : (
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Sin foto</p>
                        )}
                      </div>
                      <button onClick={() => iniciarSubida(vistaJugador.jugador.id, "foto")} disabled={cargando || borrando}
                        className="link-muted-theme text-xs border hover:border-white/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 flex-shrink-0" style={{ background: "var(--bg-surface-2)", borderColor: "var(--border-strong)" }}>
                        {cargando ? "Subiendo..." : fotoDoc ? "Cambiar" : "Subir foto"}
                      </button>
                    </div>
                    {fotoDoc && fotoUrl && (
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                        <a href={fotoUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-pantera-green hover:underline">Ver</a>
                        <button onClick={() => descargar(fotoUrl, fotoDoc.nombre_archivo ?? "foto")}
                          className="link-muted-theme text-xs transition-colors">Descargar</button>
                        <button onClick={() => eliminarDoc(vistaJugador.jugador.id, fotoDoc)} disabled={borrando}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50">
                          {borrando ? "..." : "Borrar"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {TIPOS.map((t) => {
                const doc      = vistaJugador.docs[t.value];
                const key      = `${vistaJugador.jugador.id}-${t.value}`;
                const cargando = uploading === key;
                const borrando = deleting === key;

                return (
                  <div key={t.value}
                    className="flex items-center justify-between rounded-xl px-4 py-3 border" style={{ background: "var(--bg-surface-1)", borderColor: "var(--border-subtle)" }}>
                    <div className="flex items-center gap-3 min-w-0">
                      {doc ? (
                        <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0" style={{ background: "var(--bg-surface-2)", borderColor: "var(--border-subtle)" }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: "var(--border-strong)" }} />
                        </span>
                      )}
                      <span className="text-sm" style={{ color: "var(--text-primary)" }}>{t.label}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {doc && (
                        <>
                          {signedUrls[doc.url] && (
                            <a href={signedUrls[doc.url]} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-pantera-green hover:underline px-2 py-1">
                              Ver
                            </a>
                          )}
                          <button onClick={() => eliminarDoc(vistaJugador.jugador.id, doc)}
                            disabled={borrando}
                            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 disabled:opacity-50">
                            {borrando ? "..." : "Borrar"}
                          </button>
                        </>
                      )}
                      <button disabled={cargando || borrando}
                        onClick={() => iniciarSubida(vistaJugador.jugador.id, t.value)}
                        className="link-muted-theme text-xs border hover:border-white/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50" style={{ background: "var(--bg-surface-2)", borderColor: "var(--border-strong)" }}>
                        {cargando ? "Subiendo..." : doc ? "Reemplazar" : "Subir"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
