import { brand, masters, type Master } from "@/content/site";
import { Img } from "@/components/Img";
import { ArrowIcon } from "@/components/ui/button";
import { cn, typo } from "@/lib/utils";

/** Мастера — не справочник сотрудников, а разворот: имя крупно, рядом работа мастера. */
export function Masters() {
  return (
    <section id="masters" tabIndex={-1} aria-labelledby="masters-title" className="section-y bg-ivory">
      <div className="container-x">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-8">
          <h2
            id="masters-title"
            className="font-display text-[clamp(2.8rem,7vw,6rem)] leading-[0.95] text-ink lg:col-span-7"
          >
            <span className="line-mask">
              <span>Наши мастера</span>
            </span>
          </h2>
          <p className="reveal max-w-sm text-ink/70 lg:col-span-4 lg:col-start-9 lg:self-end">
            {typo("Люди, которым вы доверяете свой образ. Выбрать мастера и удобное время можно при онлайн-записи.")}
          </p>
        </div>

        <ul className="mt-16 grid gap-20 md:grid-cols-2 md:gap-10 lg:mt-24 lg:gap-24">
          {masters.map((m, i) => (
            <MasterCard key={m.name} master={m} index={i} />
          ))}
        </ul>

        <a
          href={brand.bookingUrl}
          target="_blank"
          rel="noopener"
          className="group/link reveal mt-20 inline-flex h-11 items-center gap-3 text-[0.75rem] font-semibold tracking-[0.18em] text-ink uppercase"
        >
          <span className="link-line">Записаться к мастеру</span>
          <ArrowIcon className="size-3.5" />
        </a>
      </div>
    </section>
  );
}

function MasterCard({ master, index }: { master: Master; index: number }) {
  return (
    <li className={cn(index % 2 === 1 && "md:mt-40")}>
      <figure>
        <div className="img-hover img-reveal" style={{ ["--delay" as string]: `${index * 120}ms` }}>
          <Img
            name={master.image}
            alt={master.imageAlt}
            sizes="(min-width: 768px) 42vw, 92vw"
            position="50% 35%"
            className="aspect-[4/5]"
          />
        </div>
        <figcaption className="mt-8 grid grid-cols-[1fr_auto] items-end gap-4 border-b border-ink/12 pb-6">
          <span>
            <span className="font-display block text-[clamp(2.4rem,4.5vw,3.8rem)] leading-none text-ink">
              {master.name}
            </span>
            <span className="mt-3 block text-sm text-mocha">{master.specialty}</span>
          </span>
          <span className="eyebrow text-taupe">{master.caption}</span>
        </figcaption>
      </figure>
    </li>
  );
}
