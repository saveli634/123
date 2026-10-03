import { useRef } from "react";
import { space } from "@/content/text";
import { Img } from "@/components/shared/Img";
import { useScrollFx } from "@/lib/scrollFx";
import { cn } from "@/lib/utils";
import { Wave } from "@/components/shared/Wave";

/**
 * «Пространство» на бордо: три окна-арки (как ниша в зале) с разной скоростью параллакса.
 * Кадры 720 px — окна не шире 360 px, чтобы на ретине не было «мыла».
 */
const layout = [
  { col: "lg:col-span-4 lg:col-start-1 lg:mt-[14vh]", mob: "w-[66vw] self-start", speed: -60, inner: 40 },
  { col: "lg:col-span-4 lg:col-start-5 lg:mt-0", mob: "w-[62vw] self-end -mt-[18vw]", speed: 40, inner: -30 },
  { col: "lg:col-span-4 lg:col-start-9 lg:mt-[26vh]", mob: "w-[66vw] self-start -mt-[10vw]", speed: -110, inner: 50 },
];

function Window({ i }: { i: number }) {
  const ref = useRef<HTMLElement>(null);
  const photo = useRef<HTMLDivElement>(null);
  const f = space.frames[i];
  const l = layout[i];
  useScrollFx(ref, (p) => {
    const c = p - 0.5;
    const mobile = window.innerWidth < 1024;
    const k = mobile ? 0.45 : 1;
    if (ref.current) ref.current.style.transform = `translate3d(0, ${(c * l.speed * k).toFixed(1)}px, 0)`;
    if (photo.current) photo.current.style.transform = `translate3d(0, ${(c * l.inner * k).toFixed(1)}px, 0) scale(1.12)`;
  });
  return (
    <figure ref={ref} className={cn("parallax col-span-12 m-0 lg:flex lg:flex-col lg:items-center", l.col, l.mob, "lg:w-auto lg:self-auto")}>
      <div className="arch-frame w-full lg:max-w-[360px]">
        <div className="arch curtain photo-wrap" style={{ ["--delay" as string]: `${i * 120}ms` }}>
          <div ref={photo} className="parallax absolute inset-[-7%]">
            <Img name={f.image} alt={f.alt} sizes="(min-width: 1024px) 360px, 66vw" position={f.image === "ceiling_leaves" ? "50% 78%" : undefined} />
          </div>
        </div>
      </div>
      <figcaption className="label reveal mt-5 flex w-full items-center gap-3 text-gold-soft lg:max-w-[360px]">
        <span>0{i + 1}</span>
        <span aria-hidden="true" className="h-px w-8 bg-gold" />
        <span className="text-milk">{f.caption}</span>
      </figcaption>
    </figure>
  );
}

export function Space() {
  return (
    <section id="prostranstvo" className="tone-bordo section-y relative overflow-hidden" data-tone="sand" aria-labelledby="space-title">
      <Wave edge="top" color="var(--color-sand)" />
      <Wave edge="bottom" color="var(--color-sand)" />
      <div aria-hidden="true" className="honeycomb" />
      <div className="container-x relative">
        <div className="grid-12 gap-y-8">
          <p className="label eyebrow eyebrow-gold reveal col-span-12 text-gold-soft lg:col-span-3">04 — {space.label}</p>
          <h2 id="space-title" className="display col-span-12 text-[clamp(2.4rem,5.2vw,5rem)] leading-[1.02] text-milk lg:col-span-9">
            <span className="line-mask">
              <span>{space.titleA}</span>
            </span>
            <span className="line-mask" style={{ ["--delay" as string]: "110ms" }}>
              <span className="it text-gold-soft">{space.titleB}</span>
            </span>
          </h2>
        </div>
        <div className="mt-[10vh] flex flex-col gap-y-14 lg:grid lg:grid-cols-12 lg:gap-x-6">
          {space.frames.map((_, i) => (
            <Window key={i} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
