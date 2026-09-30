import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { Catalog } from "@/components/sections/Catalog";
import { Editorial } from "@/components/sections/Editorial";
import { Details } from "@/components/sections/Details";
import { Showroom } from "@/components/sections/Showroom";
import { ClientInterior } from "@/components/sections/ClientInterior";
import { Delivery } from "@/components/sections/Delivery";
import { ContactCta } from "@/components/sections/ContactCta";
import { Footer } from "@/components/sections/Footer";
import { MobileCta } from "@/components/sections/MobileCta";
import { useRevealObserver } from "@/lib/useReveal";

export default function App() {
  useRevealObserver();
  return (
    <>
      <a
        href="#main"
        className="fixed top-3 left-3 z-[60] -translate-y-24 bg-terracotta px-5 py-3 text-sm text-ivory transition-transform focus:translate-y-0"
      >
        Перейти к содержанию
      </a>
      <Header />
      <main id="main">
        <Hero />
        <TrustStrip />
        <Catalog />
        <Editorial />
        <Details />
        <Showroom />
        <ClientInterior />
        <Delivery />
        <ContactCta />
      </main>
      <Footer />
      <MobileCta />
    </>
  );
}
