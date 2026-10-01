import { faq } from "@/data/faq";
import { site } from "@/data/site.config";
import { PhotoFrame } from "@/components/shared/PhotoFrame";

/** О нас — коротко и только по фактам; плюс вопросы, ответы на которые есть в публикациях. */
export function About() {
  return (
    <section id="o-nas" tabIndex={-1} aria-labelledby="about-title" className="section-y">
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="eyebrow reveal text-accent">О нас</p>
          <h2 id="about-title" className="display mt-4 text-[clamp(2.1rem,4.6vw,3.8rem)]">
            <span className="line-mask"><span>{site.tagline}</span></span>
          </h2>
          <p className="reveal mt-6 text-[1.08rem] text-text/85">
            Автосервис и автомагазин в одном месте: ремонт и обслуживание, кондиционеры и автопечки, силовой обвес под заказ. Работаем только с оригинальными маслами.
          </p>
          <PhotoFrame photo={{ name: "equip-lift-bay", alt: "Бокс с синим четырёхстоечным подъёмником", tag: "Бокс на Рыскулова, 174А" }} ratio="16/9" sizes="(min-width: 1024px) 46vw, 100vw" className="reveal mt-8" />
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <h3 className="display text-[1.6rem]">Частые вопросы</h3>
          <div className="mt-5 border-t border-line">
            {faq.map((f) => (
              <details key={f.q} className="group border-b border-line">
                <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[1.05rem] [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span aria-hidden="true" className="mono text-xl text-accent transition-transform duration-200 group-open:rotate-45">+</span>
                </summary>
                <p className="pb-5 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
