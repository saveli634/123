import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { Intro } from "@/components/sections/Intro";
import { Services } from "@/components/sections/Services";
import { FeaturedServices } from "@/components/sections/FeaturedServices";
import { Portfolio } from "@/components/sections/Portfolio";
import { Masters } from "@/components/sections/Masters";
import { Atmosphere } from "@/components/sections/Atmosphere";
import { Reviews } from "@/components/sections/Reviews";
import { Instagram } from "@/components/sections/Instagram";
import { Booking } from "@/components/sections/Booking";
import { Location } from "@/components/sections/Location";
import { Footer } from "@/components/sections/Footer";
import { MobileBookingBar } from "@/components/sections/MobileBookingBar";
import { useRevealObserver } from "@/lib/useReveal";

export default function App() {
  useRevealObserver();

  return (
    <>
      <a
        href="#main"
        className="fixed top-3 left-3 z-[60] -translate-y-20 rounded-full bg-espresso px-5 py-3 text-sm text-ivory transition-transform focus:translate-y-0"
      >
        Перейти к содержанию
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Intro />
        <Services />
        <FeaturedServices />
        <Portfolio />
        <Masters />
        <Atmosphere />
        <Reviews />
        <Instagram />
        <Booking />
        <Location />
      </main>
      <Footer />
      <MobileBookingBar />
    </>
  );
}
