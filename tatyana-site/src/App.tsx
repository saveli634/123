import { useEffect } from "react";
import { Backdrop } from "./components/Backdrop";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { BirthSky } from "./components/BirthSky";
import { Marquee } from "./components/Marquee";
import { OrbitCards } from "./components/OrbitCards";
import { NumberCalc } from "./components/NumberCalc";
import { Constellations } from "./components/Constellations";
import { Keys } from "./components/Keys";
import { Poems } from "./components/Poems";
import { Gift } from "./components/Gift";
import { Songs } from "./components/Songs";
import { Booking } from "./components/Booking";
import { Footer } from "./components/Footer";
import { MobileBar } from "./components/MobileBar";
import { useRevealObserver } from "./components/ui";
import { initScroll } from "./lib/scroll";

export default function App() {
  useRevealObserver();
  useEffect(() => initScroll(), []);
  return (
    <>
      <a className="skip" href="#main">
        К содержанию
      </a>
      <Backdrop />
      <Header />
      <main id="main">
        <Hero />
        <BirthSky />
        <Marquee />
        <OrbitCards />
        <NumberCalc />
        <Constellations />
        <Keys />
        <Gift />
        <Poems />
        <Songs />
        <Booking />
      </main>
      <Footer />
      <MobileBar />
    </>
  );
}
