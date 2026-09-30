import { brand } from "@/content/site";
import { ArrowIcon } from "@/components/ui/button";

const links = [
  { href: brand.maps.twoGis, label: "Открыть в 2ГИС" },
  { href: brand.maps.yandex, label: "Открыть в Яндекс Картах" },
  { href: brand.instagramUrl, label: `Instagram ${brand.instagramHandle}` },
];

export function Location() {
  return (
    <section id="contacts" tabIndex={-1} aria-labelledby="contacts-title" className="section-y bg-cream">
      <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <p className="eyebrow reveal text-mocha">Контакты</p>
          <h2 id="contacts-title" className="font-display mt-5 text-[clamp(2.4rem,5vw,4.4rem)] leading-[1] text-ink">
            <span className="line-mask">
              <span>Мы находимся здесь</span>
            </span>
          </h2>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <address className="reveal not-italic">
            <span className="block text-sm tracking-[0.04em] text-mocha">{brand.city}</span>
            <span className="font-display mt-2 block text-[clamp(3rem,8vw,6.6rem)] leading-none text-ink">
              {brand.address}
            </span>
          </address>

          <ul className="mt-12 border-t border-ink/12">
            {links.map((l, i) => (
              <li
                key={l.href}
                className="reveal border-b border-ink/12"
                style={{ ["--delay" as string]: `${100 + i * 70}ms` }}
              >
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener"
                  className="group/link flex min-h-14 items-center justify-between gap-4 py-3 text-[0.95rem] text-ink"
                >
                  {l.label}
                  <ArrowIcon className="-rotate-45 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                </a>
              </li>
            ))}
          </ul>

          <p className="reveal mt-8 max-w-sm text-sm text-ink/60">
            Свободное время мастеров смотрите при{" "}
            <a href={brand.bookingUrl} target="_blank" rel="noopener" className="text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
              онлайн-записи
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
