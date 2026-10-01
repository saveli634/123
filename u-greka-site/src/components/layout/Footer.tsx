import { services } from "@/data/services";
import { site } from "@/data/site.config";
import { Wordmark } from "@/components/shared/Wordmark";

export function Footer() {
  return (
    <footer className="border-t border-line bg-bg pt-14 pb-24 lg:pb-10">
      <div className="container-x grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Wordmark />
          <p className="mt-5 text-muted">{site.tagline}</p>
          <p className="mt-4">
            {site.city}, {site.street}
          </p>
          <a href={`tel:${site.phone.tel}`} className="mono mt-2 inline-block text-lg hover:text-accent">
            {site.phone.display}
          </a>
        </div>
        <nav aria-label="Услуги" className="lg:col-span-5 lg:col-start-6">
          <p className="eyebrow text-accent">Услуги</p>
          <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {services.map((s) => (
              <li key={s.slug}>
                <a href={`#usluga-${s.slug}`} className="text-muted hover:text-text">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="text-sm text-muted lg:col-span-3">
          <p>Цены ориентировочные, точную стоимость назовём после диагностики.</p>
          <p className="mt-3">Отправляя заявку, вы соглашаетесь на обработку персональных данных для обратной связи.</p>
        </div>
      </div>
      <div className="container-x mt-12 flex flex-col gap-2 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} {site.name}</p>
        <a href="#top" className="hover:text-text">Наверх</a>
      </div>
    </footer>
  );
}
