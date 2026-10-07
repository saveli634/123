import { BrandDefs } from "@/components/Brand";
import { Intro } from "@/components/Intro";
import { Header } from "@/components/Header";
import { ScrollLash } from "@/components/ScrollLash";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { LiftScene } from "@/components/LiftScene";
import { BeforeAfter } from "@/components/BeforeAfter";
import { Services } from "@/components/Services";
import { Process } from "@/components/Process";
import { Reasons } from "@/components/Reasons";
import { Works } from "@/components/Works";
import { Booking } from "@/components/Booking";
import { Footer } from "@/components/Footer";
import { MobileBar } from "@/components/MobileBar";
import { Cursor } from "@/components/Cursor";
import { useReveal } from "@/lib/reveal";

export default function App() {
  useReveal();
  return (
    <>
      <BrandDefs />
      <a href="#main" className="skip-link">
        Перейти к содержимому
      </a>
      <Intro />
      <ScrollLash />
      <Header />
      <main id="main">
        <Hero />
        <LiftScene />
        <Marquee />
        <BeforeAfter />
        <Services />
        <Process />
        <Reasons />
        <Works />
        <Booking />
      </main>
      <Footer />
      <MobileBar />
      <Cursor />
    </>
  );
}
