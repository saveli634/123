import { brand, nav } from "@/content/site";
import { ArrowIcon, Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="on-dark bg-espresso pt-20 pb-28 text-ivory lg:pb-12">
      <div className="container-x">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <p className="font-display text-[clamp(3rem,7vw,5.6rem)] leading-[0.9]">
              Beauty <em>Soul</em>
            </p>
            <p className="mt-4 text-sm text-ivory/55">{brand.fullName} — салон красоты в Алматы</p>
          </div>

          <nav aria-label="Разделы сайта" className="lg:col-span-3 lg:col-start-7">
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

          <div className="space-y-3 text-sm text-ivory/75 lg:col-span-3 lg:col-start-10">
            <p>
              {brand.city}, {brand.address}
            </p>
            <p>
              <a href={brand.instagramUrl} target="_blank" rel="noopener" className="link-line hover:text-ivory">
                {brand.instagramHandle}
              </a>
            </p>
            <Button asChild variant="light" size="sm" className="mt-3">
              <a href={brand.bookingUrl} target="_blank" rel="noopener">
                Записаться
                <ArrowIcon className="size-3.5" />
              </a>
            </Button>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-ivory/10 pt-6 text-xs text-ivory/40 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} {brand.fullName}</p>
          <a href="#top" className="link-line self-start hover:text-ivory/70">
            Наверх
          </a>
        </div>
      </div>
    </footer>
  );
}
