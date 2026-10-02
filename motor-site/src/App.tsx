import { Header } from "@/components/layout/Header";
import { Cursor, Footer, MobileBar, Progress } from "@/components/layout/Chrome";
import { EngineLayer } from "@/components/sections/EngineLayer";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { Stages } from "@/components/sections/Stages";
import { Workshop } from "@/components/sections/Workshop";
import { Services } from "@/components/sections/Services";
import { Care } from "@/components/sections/Care";
import { Works } from "@/components/sections/Works";
import { Topics } from "@/components/sections/Topics";
import { Materials } from "@/components/sections/Materials";
import { Predator } from "@/components/sections/Predator";
import { Contacts } from "@/components/sections/Contacts";
import { BookingDialog } from "@/components/shared/BookingDialog";
import { SITE } from "@/content/copy";
import { useReveal } from "@/lib/reveal";
import { useSmoothScroll } from "@/lib/scroll";

export default function App() {
  useReveal();
  useSmoothScroll();
  return (
    <>
      <a href="#main" className="skip">
        {SITE.skip}
      </a>
      <Progress />
      <Header />
      <EngineLayer />
      <main id="main">
        <Hero />
        <Marquee />
        <Stages />
        <Workshop />
        <Services />
        <Care />
        <Works />
        <Topics />
        <Materials />
        <Predator />
        <Contacts />
      </main>
      <Footer />
      <MobileBar />
      <BookingDialog />
      <Cursor />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
