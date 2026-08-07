"use client";
import { useEffect, useState, useCallback } from "react";
import type { TourStep } from "@/lib/admin-tours";

interface PanelTourProps {
  steps: TourStep[];
  storageKey: string;
}

const GREEN = "#16a34a";
const HIGHLIGHT_SHADOW = `0 0 0 2px ${GREEN}, 0 0 0 6px rgba(22,163,74,0.25)`;

function applyHighlight(targetId: string | undefined) {
  if (!targetId) return;
  const el = document.getElementById(targetId);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.style.boxShadow    = HIGHLIGHT_SHADOW;
  el.style.transition   = "box-shadow 0.3s ease";
  el.style.borderRadius = "1rem";
}

function removeHighlight(targetId: string | undefined) {
  if (!targetId) return;
  const el = document.getElementById(targetId);
  if (!el) return;
  el.style.boxShadow  = "";
  el.style.transition = "";
  el.style.borderRadius = "";
}

export function PanelTour({ steps, storageKey }: PanelTourProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) setOpen(true);
    } catch { /* SSR or blocked */ }
  }, [storageKey]);

  useEffect(() => {
    if (!open) return;
    const tid = steps[step]?.targetId;
    const timer = setTimeout(() => applyHighlight(tid), 300);
    return () => {
      clearTimeout(timer);
      removeHighlight(tid);
    };
  }, [open, step, steps]);

  const close = useCallback(() => {
    removeHighlight(steps[step]?.targetId);
    try { localStorage.setItem(storageKey, "1"); } catch { /* */ }
    setOpen(false);
    setStep(0);
  }, [steps, step, storageKey]);

  const next = () => {
    if (step < steps.length - 1) setStep((s) => s + 1);
    else close();
  };

  const prev = () => step > 0 && setStep((s) => s - 1);

  const openTour = () => { setStep(0); setOpen(true); };

  const current = steps[step];

  return (
    <>
      {/* Trigger button — rendered by parent in layout */}
      <button
        onClick={openTour}
        aria-label="Tour del panel"
        className="w-10 h-10 rounded-full bg-[#111] border border-white/[0.08] flex items-center justify-center text-gray-500 hover:text-pantera-green hover:border-pantera-green/40 transition-all active:scale-90 shadow-lg">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </button>

      {open && (
        <div className="fixed inset-x-0 bottom-0 z-[200] px-3 pb-20 lg:pb-4 pointer-events-none">
          <div className="bg-[#141414] border border-pantera-green/25 rounded-2xl p-5 max-w-lg mx-auto shadow-2xl shadow-black/60 pointer-events-auto">

            {/* Progress bar */}
            <div className="flex items-center gap-1.5 mb-4">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    i < step
                      ? "flex-1 bg-pantera-green/50"
                      : i === step
                      ? "flex-[2] bg-pantera-green"
                      : "flex-1 bg-white/[0.08]"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-start justify-between gap-2 mb-1.5">
              <span className="text-[10px] text-pantera-green uppercase tracking-widest font-bold">
                Paso {step + 1} de {steps.length}
              </span>
              <button
                onClick={close}
                className="text-gray-600 hover:text-white p-0.5 transition-colors flex-shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <h3 className="text-white font-bold text-[15px] leading-snug mb-1.5" style={{ fontFamily: "Syne, sans-serif" }}>
              {current.title}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">{current.body}</p>

            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="px-4 py-2.5 text-sm text-gray-400 border border-white/10 rounded-xl hover:text-white transition-all active:scale-95">
                  Anterior
                </button>
              )}
              <button
                onClick={next}
                className="flex-1 py-2.5 text-sm font-bold bg-pantera-green text-white rounded-xl hover:bg-pantera-green/90 transition-all active:scale-[0.98]">
                {step === steps.length - 1 ? "Entendido" : "Siguiente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
