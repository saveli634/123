import { useEffect, useRef } from "react";
import { ArrowDown, Phone } from "lucide-react";
import { site, whatsapp } from "@/data/site.config";
import { Img } from "@/components/shared/Img";
import { Button } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/shared/icons";
import { motionAllowed, useScrollVar } from "@/lib/scrollFx";

const facts = [
  { label: "Заправка кондиционеров", value: "фреон Frio+ (Бельгия)" },
  { label: "Промывка печки", value: "оплата по результату" },
  { label: "Автомагазин", value: "при сервисе" },
];

/**
 * Первый экран. Десктоп: фото на всю ширину, графитовая вуаль только за текстом.
 * Телефон: фото сверху (~55vh), текст ниже — чтобы не терять контраст.
 * Движение (--p — уход экрана вверх, --mx/--my — курсор): фото уходит вниз и приближается,
 * строки заголовка разъезжаются, текст и фото смещаются за курсором с разной «глубиной».
 */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  useScrollVar(section, "exit");

  useEffect(() => {
    const el = section.current;
    if (!el || !motionAllowed() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let f = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.setProperty("--mx", cx.toFixed(4));
      el.style.setProperty("--my", cy.toFixed(4));
      f = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.0005 ? requestAnimationFrame(loop) : 0;
    };
    const move = (e: PointerEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!f) f = requestAnimationFrame(loop);
    };
    el.addEventListener("pointermove", move);
    return () => {
      el.removeEventListener("pointermove", move);
      if (f) cancelAnimationFrame(f);
    };
  }, []);

  return (
    <section ref={section} id="top" tabIndex={-1} aria-labelledby="hero-title" className="hero relative pt-(--header-h) lg:pt-0">
      <div className="relative lg:min-h-[max(40rem,92svh)]">
        <div className="hero-img corner-marks relative h-[55svh] min-h-[20rem] overflow-hidden lg:absolute lg:inset-0 lg:h-auto">
          <div className="hero-media h-full w-full">
            <Img
              name="hero-main"
              alt="Белый Toyota Land Cruiser 70 с силовым бампером, лебёдкой и светодиодной балкой"
              sizes="100vw"
              priority
            />
          </div>
          <div aria-hidden="true" className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(15_15_16/0.9)_0%,rgb(15_15_16/0.78)_32%,rgb(15_15_16/0.2)_68%,rgb(15_15_16/0.1)_100%)] lg:block" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_top,var(--color-bg),transparent)] lg:hidden" />
          <div aria-hidden="true" className="hero-veil pointer-events-none absolute inset-0 bg-bg" />
          <p className="mono absolute right-4 bottom-4 z-[3] hidden rounded-[2px] bg-bg/85 px-3 py-2 text-[0.75rem] lg:right-8 lg:bottom-8 lg:block">
            <span aria-hidden="true" className="mr-2 text-accent">■</span>
            Силовой бампер с лебёдкой — наша работа
          </p>
        </div>

        <div className="container-x relative z-10 pt-6 pb-10 lg:flex lg:min-h-[max(40rem,92svh)] lg:flex-col lg:justify-center lg:pt-[calc(var(--header-h)+2rem)] lg:pb-16">
          <div className="hero-copy">
            <p className="eyebrow reveal text-accent">Алматы · Рыскулова, 174А</p>
            <h1 id="hero-title" className="display mt-4 max-w-[13ch] text-[clamp(2.75rem,8vw,7rem)] lg:mt-6">
              <span className="line-mask hero-line" style={{ ["--dir" as string]: "-1" }}>
                <span style={{ ["--delay" as string]: "80ms" }}>Автосервис</span>
              </span>
              <span className="line-mask hero-line" style={{ ["--dir" as string]: "1" }}>
                <span style={{ ["--delay" as string]: "180ms" }}>
                  «У&nbsp;Грека»
                </span>
              </span>
            </h1>
            <p className="reveal mt-5 max-w-xl text-[1.08rem] text-text/85 lg:text-[1.2rem]" style={{ ["--delay" as string]: "260ms" }}>
              Кондиционеры, автопечки, двигатель, ходовая и силовой обвес. Автомагазин — здесь же.
            </p>
            <div className="reveal mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center" style={{ ["--delay" as string]: "340ms" }}>
              <Button asChild size="lg">
                <a href={`tel:${site.phone.tel}`}>
                  <Phone aria-hidden="true" className="size-5" />
                  Позвонить <span className="mono font-medium normal-case">{site.phone.display}</span>
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={whatsapp()} target="_blank" rel="noopener">
                  <WhatsAppIcon className="size-5" />
                  Написать в WhatsApp
                </a>
              </Button>
              <a href="#raboty" className="inline-flex h-12 items-center gap-2 px-1 text-muted underline-offset-4 hover:text-text hover:underline">
                Смотреть работы
                <ArrowDown aria-hidden="true" className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-y border-line bg-surface">
        <dl className="container-x grid sm:grid-cols-3">
          {facts.map((f, i) => (
            <div key={f.label} className="flex flex-col gap-1 border-line py-4 sm:border-l sm:px-6 sm:first:border-l-0 sm:first:pl-0">
              <dt className="mono text-[0.72rem] tracking-[0.06em] text-muted uppercase">
                <span className="text-accent">0{i + 1}</span> · {f.label}
              </dt>
              <dd className="text-[1rem]">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
