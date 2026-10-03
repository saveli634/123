import { lazy, Suspense, useEffect, useState } from "react";
import type { Lang } from "@/content/i18n";
import { LangProvider, useLang } from "@/lib/lang";
import { initSmoothScroll } from "@/lib/scroll";
import { LionDefs } from "@/components/Lion";
import { InkFilter } from "@/components/Stamp";
import { Cursor, Header, MobileBar, Preloader, ProgressThread } from "@/components/Chrome";
import { GlobeStory } from "@/sections/GlobeStory";
import { Services } from "@/sections/Services";
import { Radiator } from "@/sections/Radiator";
import { BeforeAfter } from "@/sections/BeforeAfter";
import { Sticker } from "@/sections/Sticker";
import { Quotes, Travellers } from "@/sections/Travellers";
import { Works } from "@/sections/Works";
import { Contacts, Footer } from "@/sections/Contacts";

const loadBooking = () => import("@/sections/Booking");
const BookingDialog = lazy(() => loadBooking().then((m) => ({ default: m.BookingDialog })));

declare global {
  interface Window {
    __clReady?: boolean;
  }
}

/**
 * Построчные появления: [data-reveal] получает data-in, когда попадает в экран.
 * Пока играет прелоадер, первый экран ждёт его окончания.
 */
function useReveal(dep: unknown) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not([data-in])"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.setAttribute("data-in", ""));
      return;
    }
    const html = document.documentElement;
    const intro = html.classList.contains("js") && !html.classList.contains("no-intro");
    const timers: number[] = [];
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          const show = () => e.target.setAttribute("data-in", "");
          if (intro && e.target.closest(".hero")) timers.push(window.setTimeout(show, 900));
          else show();
        }),
      { rootMargin: "0px 0px -10% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [dep]);
}

function Page() {
  const { t, lang } = useLang();
  const [book, setBook] = useState(false);
  const [bookMounted, setBookMounted] = useState(false);
  const openBook = () => {
    setBookMounted(true);
    setBook(true);
  };

  useEffect(() => {
    const off = initSmoothScroll();
    window.__clReady = true;
    // форму записи подгружаем заранее — после первого действия пользователя
    const warm = () => {
      loadBooking();
      ["pointerdown", "keydown", "scroll", "touchstart"].forEach((e) => window.removeEventListener(e, warm));
    };
    ["pointerdown", "keydown", "scroll", "touchstart"].forEach((e) =>
      window.addEventListener(e, warm, { passive: true }),
    );
    return () => {
      off();
      ["pointerdown", "keydown", "scroll", "touchstart"].forEach((e) => window.removeEventListener(e, warm));
    };
  }, []);
  useReveal(lang);

  return (
    <>
      <a className="skip-link" href="#main">
        {t.a11y.skip}
      </a>
      <LionDefs />
      <InkFilter />
      <Preloader />
      <ProgressThread />
      <Header onBook={openBook} />
      <main id="main">
        <GlobeStory />
        <Services />
        <Radiator />
        <BeforeAfter />
        <Sticker />
        <Travellers />
        <Quotes />
        <Works />
        <Contacts onBook={openBook} />
      </main>
      <Footer />
      <MobileBar />
      {bookMounted && (
        <Suspense fallback={null}>
          <BookingDialog open={book} onOpenChange={setBook} />
        </Suspense>
      )}
      <Cursor />
      <div className="grain" aria-hidden="true" />
    </>
  );
}

export default function App({ lang }: { lang: Lang }) {
  return (
    <LangProvider initial={lang}>
      <Page />
    </LangProvider>
  );
}
