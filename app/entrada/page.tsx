"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EntradaPage() {
  const router = useRouter();

  useEffect(() => {
    const detectar = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) { router.replace("/coach/login"); return; }

      const { data: padre } = await supabase
        .from("padres")
        .select("id, activo")
        .eq("id", user.id)
        .single();

      if (padre?.activo) { router.replace("/papa"); return; }

      const { data: coach } = await supabase
        .from("entrenadores")
        .select("id")
        .eq("id", user.id)
        .single();

      if (coach) { router.replace("/coach"); return; }

      router.replace("/coach/login");
    };

    detectar();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
