import { useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomBar } from "@/components/layout/BottomBar";
import { Thread } from "@/components/layout/Thread";
import { Cursor } from "@/components/layout/Cursor";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { Manifest } from "@/components/sections/Manifest";
import { Residence } from "@/components/sections/Residence";
import { Look } from "@/components/sections/Look";
import { Space } from "@/components/sections/Space";
import { Address } from "@/components/sections/Address";
import { Services } from "@/components/sections/Services";
import { Team } from "@/components/sections/Team";
import { Contact } from "@/components/sections/Contact";
import { BookingDialog } from "@/components/shared/BookingDialog";
import { UiProvider } from "@/components/shared/UiContext";
import { useRevealObserver } from "@/lib/useReveal";
import { useSmoothScroll } from "@/lib/smoothScroll";
import { motionAllowed } from "@/lib/scrollFx";
import { useBgTones, useInteractions } from "@/lib/fx";
import grain from "@/content/grain.png";

export default function App() {
  useRevealObserver();
  useSmoothScroll();
  useInteractions();
  useBgTones();
  // .motion включает закреплённую сцену и эффекты прокрутки; без него — статичная вёрстка
  useEffect(() => {
    if (motionAllowed()) document.documentElement.classList.add("motion");
  }, []);
  return (
    <UiProvider>
      <a href="#main" className="label fixed top-2 left-2 z-[110] -translate-y-24 rounded-full bg-bordo px-5 py-3 text-milk transition-transform focus:translate-y-0">
        Перейти к содержимому
      </a>
      <div aria-hidden="true" className="page-bg" />
      <div aria-hidden="true" className="grain" style={{ ["--grain" as string]: `url(${grain})` }} />
      <Thread />
      <Header />
      <main id="main">
        <Hero />
        <Marquee />
        <Manifest />
        <Residence />
        <Look />
        <Space />
        <Address />
        <Services />
        <Team />
        <Contact />
      </main>
      <Footer />
      <BottomBar />
      <Cursor />
      <BookingDialog />
    </UiProvider>
  );
}
