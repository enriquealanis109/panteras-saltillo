import { supabase } from "./supabase";

export async function trackEvento(tipo: string, metadata?: Record<string, unknown>) {
  try {
    await supabase.from("eventos").insert({ tipo, metadata: metadata ?? null });
  } catch { /* silencioso — nunca interrumpir la UX por analytics */ }
}
