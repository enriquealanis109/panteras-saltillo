"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { ClubProvider } from "@/lib/club-context";
import ChatWidget from "@/components/chat/ChatWidget";

const PUBLIC_PATHS = ["/coach/login"];

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(PUBLIC_PATHS.includes(pathname));
  const [clubId, setClubId] = useState<string | null>(null);

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) { setOk(true); return; }
    setOk(false);
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/coach/login"); return; }
      const { data } = await supabase.from("entrenadores").select("id, club_id").eq("id", user.id).single();
      if (!data) { router.push("/coach/login"); return; }
      setClubId(data.club_id ?? null);
      setOk(true);
    };
    check();
  }, [pathname, router]);

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-page)" }}>
        <div className="w-8 h-8 border-2 border-pantera-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ClubProvider clubId={clubId}>
      {children}
      {!PUBLIC_PATHS.includes(pathname) && <ChatWidget />}
    </ClubProvider>
  );
}
