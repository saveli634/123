import { MessageCircle } from "lucide-react";
import { brand, nav, whatsapp } from "@/content/catalog";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="on-dark bg-graphite pt-16 pb-28 text-ivory lg:pb-10">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo className="text-[1.15rem]" />
            <p className="mt-5 max-w-xs text-sm text-ivory/55">Шоурум современных диванов в Алматы</p>
          </div>

          <nav aria-label="Разделы сайта" className="lg:col-span-3 lg:col-start-6">
            <ul className="grid grid-cols-2 gap-y-3 text-sm text-ivory/75">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="link-line hover:text-ivory">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-3 text-sm text-ivory/75 lg:col-span-4 lg:col-start-9">
            <p>
              {brand.showroom}, {brand.showroomDetails}
            </p>
            {brand.phones.map((p) => (
              <p key={p.tel}>
                <a href={`tel:${p.tel}`} className="link-line tabular-nums hover:text-ivory">
                  {p.display}
                </a>
              </p>
            ))}
            <p className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
              <a href={whatsapp()} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-ivory hover:text-ember">
                <MessageCircle aria-hidden="true" className="size-4" strokeWidth={1.5} />
                WhatsApp
              </a>
              <a href={brand.instagramUrl} target="_blank" rel="noopener" className="text-ivory hover:text-ember">
                Instagram {brand.instagramHandle}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-ivory/10 pt-6 text-xs text-ivory/40 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Soft Line</p>
          <a href="#top" className="link-line self-start hover:text-ivory/70">
            Наверх
          </a>
        </div>
      </div>
    </footer>
  );
}
