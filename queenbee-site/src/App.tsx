import { useEffect, useRef } from "react";
import { Preloader } from "./components/Preloader";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { MirrorStage } from "./components/MirrorStage";
import { Manifest } from "./components/Manifest";
import { Marquee } from "./components/Marquee";
import { WorksWall } from "./components/WorksWall";
import { Services } from "./components/Services";
import { Space } from "./components/Space";
import { Quote } from "./components/Quote";
import { Team } from "./components/Team";
import { Contacts } from "./components/Contacts";
import { Footer } from "./components/Footer";
import { MobileBar } from "./components/MobileBar";
import { DemoBadge } from "./components/DemoBadge";
import { DevPanel } from "./components/DevPanel";
import { initScroll } from "./lib/scroll";
import { initFx } from "./lib/fx";
import { igniteRing } from "./lib/stageController";

export default function App() {
  const slot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // эффекты подключаем отдельными задачами после гидрации — без длинных блокировок потока
    let offScroll = () => {};
    let offFx = () => {};
    const t0 = window.setTimeout(() => {
      offScroll = initScroll();
      window.setTimeout(() => (offFx = initFx()), 0);
    }, 0);
    const root = document.documentElement;
    // кольцо зажигается вместе с кольцом прелоадера, при повторном заходе — сразу
    const t = window.setTimeout(igniteRing, root.classList.contains("pl") ? 820 : 120);
    const t2 = window.setTimeout(() => root.classList.add("pl-done"), 1250);
    return () => {
      clearTimeout(t0);
      offScroll();
      offFx();
      clearTimeout(t);
      clearTimeout(t2);
    };
  }, []);

  return (
    <>
      <Preloader />
      <div className="thread" aria-hidden="true">
        <span className="thread__line" />
      </div>
      <Header />
      <main>
        <Hero ref={slot} />
        <MirrorStage slot={slot} />
        <Manifest />
        <Marquee />
        <WorksWall />
        <Services />
        <Space />
        <Quote />
        <Team />
        <Contacts />
      </main>
      <Footer />
      <MobileBar />
      <DemoBadge />
      <DevPanel />
    </>
  );
}
