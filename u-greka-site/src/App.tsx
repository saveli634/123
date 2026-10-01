import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StickyActionBar } from "@/components/layout/StickyActionBar";
import { Hero } from "@/components/sections/Hero";
import { ServiceStrip } from "@/components/sections/ServiceStrip";
import { ServicesList } from "@/components/sections/ServicesList";
import { AcSection } from "@/components/sections/AcSection";
import { HeaterResults } from "@/components/sections/HeaterResults";
import { Fabrication } from "@/components/sections/Fabrication";
import { Works } from "@/components/sections/Works";
import { AutoShop } from "@/components/sections/AutoShop";
import { Equipment } from "@/components/sections/Equipment";
import { Process } from "@/components/sections/Process";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Lightbox } from "@/components/shared/Lightbox";
import { LeadDrawer } from "@/components/shared/LeadDrawer";
import { UiProvider } from "@/components/shared/UiContext";
import { useRevealObserver } from "@/lib/useReveal";

export default function App() {
  useRevealObserver();
  return (
    <UiProvider>
      <a href="#main" className="fixed top-2 left-2 z-[60] -translate-y-24 rounded-[3px] bg-accent px-4 py-3 text-accent-ink transition-transform focus:translate-y-0">
        Перейти к содержимому
      </a>
      <Header />
      <main id="main">
        <Hero />
        <ServiceStrip />
        <ServicesList />
        <AcSection />
        <HeaterResults />
        <Fabrication />
        <Works />
        <AutoShop />
        <Equipment />
        <Process />
        <About />
        <Contact />
      </main>
      <Footer />
      <StickyActionBar />
      <Lightbox />
      <LeadDrawer />
    </UiProvider>
  );
}
