import { useEffect } from "react";
import { Backdrop } from "./components/Backdrop";
import { Header } from "./components/Header";
import { Booking } from "./components/Booking";
import { Footer } from "./components/Footer";
import { MobileBar } from "./components/MobileBar";
import { PageContent } from "./components/Pages";
import { useRevealObserver } from "./components/ui";
import { initScroll } from "./lib/scroll";
import { RouteProvider } from "./lib/route";
import { PAGE_ORDER, type PageId } from "./data/pages";

/**
 * page — страница этого HTML-файла (хостинг) или "spa": все страницы в одном файле (sait.html),
 * видна та, что в адресе #/karta (CSS по data-route на <html>).
 */
export default function App({ page }: { page: PageId | "spa" }) {
  useRevealObserver();
  useEffect(() => initScroll(), []);
  const spa = page === "spa";
  return (
    <RouteProvider initial={spa ? "home" : page}>
      <a className="skip" href="#main">
        К содержанию
      </a>
      <Backdrop />
      <Header />
      <main id="main">
        {spa ? (
          PAGE_ORDER.map((id) => (
            <div key={id} id={`/${id}`} className={`page page--${id}`}>
              <PageContent id={id} />
            </div>
          ))
        ) : (
          <div className={`page page--${page}`}>
            <PageContent id={page} />
          </div>
        )}
        <Booking />
      </main>
      <Footer />
      <MobileBar />
    </RouteProvider>
  );
}
