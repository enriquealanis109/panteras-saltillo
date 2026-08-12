import { redirect } from "next/navigation";
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

export default function Home() {
  // Este landing está hecho a la medida de Panteras. Los demás clubes
  // (NEXT_PUBLIC_CLUB_NOMBRE seteado) todavía no tienen sitio público propio,
  // así que la raíz manda directo al login del panel en vez de mostrarlo.
  if (process.env.NEXT_PUBLIC_CLUB_NOMBRE) redirect("/coach/login");

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
