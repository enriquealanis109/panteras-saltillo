"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ChatWidget from "@/components/ChatWidget";
import Hero from "@/components/Hero";
import Benefits from "@/components/Benefits";
import Categories from "@/components/Categories";
import Methodology from "@/components/Methodology";
import Sponsors from "@/components/Sponsors";
import RegistrationForm from "@/components/RegistrationForm";
import Footer from "@/components/Footer";
import AnimatedSection from "@/components/AnimatedSection";

const ES_PANTERAS = !process.env.NEXT_PUBLIC_CLUB_NOMBRE;
const CLUB_LOGO = process.env.NEXT_PUBLIC_CLUB_LOGO_URL || "/icon-192.png";

export default function Home() {
  const router = useRouter();

  // Este landing está hecho a la medida de Panteras. Los demás clubes
  // (NEXT_PUBLIC_CLUB_NOMBRE seteado) todavía no tienen sitio público propio,
  // así que la raíz manda al login del panel — pero como redirect del
  // navegador, no server-side: un 307 hace que WhatsApp/Discord/etc. no
  // confíen en la respuesta y no muestren la imagen de vista previa del link.
  useEffect(() => {
    if (!ES_PANTERAS) router.replace("/coach/login");
  }, [router]);

  if (!ES_PANTERAS) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0a" }}>
        <img src={CLUB_LOGO} alt="" width={64} height={64} className="rounded-full opacity-80" />
      </main>
    );
  }

  return (
    <main>
      <Navbar />
      <Hero />
      <AnimatedSection direction="up">
        <Benefits />
      </AnimatedSection>
      <AnimatedSection direction="left">
        <Categories />
      </AnimatedSection>
      <AnimatedSection direction="right">
        <Methodology />
      </AnimatedSection>
      <Sponsors />
      <AnimatedSection direction="up" delay={80}>
        <RegistrationForm />
      </AnimatedSection>
      <AnimatedSection direction="up" delay={60}>
        <Footer />
      </AnimatedSection>
      <ChatWidget />
    </main>
  );
}
