import { useRef } from "react";
import { look } from "@/content/text";
import { site, SHOW_GUESTS } from "@/lib/site";
import { Img, hasImage } from "@/components/shared/Img";
import { Bee } from "@/components/shared/Bee";
import { BookButton, WorksButton } from "@/components/shared/Buttons";
import { useTilt } from "@/lib/scrollFx";
import { cn } from "@/lib/utils";
import { guestImages } from "@/content/guests";

/**
 * «Образ»: соты из семи шестигранных окон.
 * showGuestPhotos=false (по умолчанию) — пустые окна с золотой рамкой и интерьерные кадры.
 * showGuestPhotos=true — фото гостий (guest_a_02/03 с мастером — только при showStaffFaces).
 */
type Cell = { image?: string; alt?: string; pos: { left: string; top: string }; delay: number; center?: boolean };

const POS = {
  c: { left: "34%", top: "30.7%" },
  nw: { left: "17%", top: "0%" },
  ne: { left: "50.96%", top: "0%" },
  e: { left: "67.92%", top: "30.7%" },
  se: { left: "50.96%", top: "61.4%" },
  sw: { left: "17%", top: "61.4%" },
  w: { left: "0%", top: "30.7%" },
};

const placeholderCells: Cell[] = [
  { pos: POS.c, delay: 0, center: true },
  { pos: POS.nw, image: "lounge_burgundy", alt: "Лаунж с бордовой стеной и круглыми зеркалами", delay: 90 },
  { pos: POS.ne, delay: 160 },
  { pos: POS.e, image: "reception_desk", alt: "Ресепшен и стеллаж за ним", delay: 230 },
  { pos: POS.se, delay: 300 },
  { pos: POS.sw, image: "fireplace_wood", alt: "Биокамин и глиняные вазы", delay: 370 },
  { pos: POS.w, delay: 440 },
];

const guestAlt: Record<string, string> = {
  guest_a_03: "Мастер и гостья за работой",
  guest_a_02: "Мастер наносит макияж",
};
const order = [POS.c, POS.nw, POS.ne, POS.e, POS.se, POS.sw, POS.w];
const guestCells: Cell[] = guestImages(site.showStaffFaces).map((image, i) => ({
  pos: order[i],
  image,
  alt: guestAlt[image] ?? "Гостья в пространстве Queen Bee",
  delay: i * 70,
  center: i === 0,
}));

function HexCell({ cell, guests }: { cell: Cell; guests: boolean }) {
  const filled = cell.image && hasImage(cell.image);
  return (
    <div className="look-cell absolute w-[32.05%]" style={{ ...cell.pos, aspectRatio: "0.866" }}>
      <div className={cn("hex glow absolute inset-0", filled ? "photo-wrap" : "look-empty")}>
        {filled ? (
          <div className="curtain absolute inset-0" style={{ ["--delay" as string]: `${cell.delay}ms` }}>
            <Img
              name={cell.image!}
              alt={cell.alt ?? ""}
              sizes={guests ? "(min-width: 1024px) 20vw, 40vw" : "(min-width: 1024px) 18vw, 34vw"}
              position={guests ? "50% 22%" : "50% 50%"}
            />
          </div>
        ) : (
          <div className="reveal absolute inset-0 grid place-items-center" style={{ ["--delay" as string]: `${cell.delay}ms` }}>
            {cell.center ? (
              <p className="display it max-w-[8.5em] px-3 text-center text-[clamp(1.05rem,2.1vw,1.7rem)] leading-[1.12] text-espresso">
                <Bee className="mx-auto mb-2 size-[1.5em]" />
                {look.placeholder}
              </p>
            ) : (
              <svg aria-hidden="true" className="look-empty-inner" viewBox="0 0 86.6 100" preserveAspectRatio="none">
                <polygon points="43.3,1 85.6,25.5 85.6,74.5 43.3,99 1,74.5 1,25.5" />
              </svg>
            )}
          </div>
        )}
      </div>
      <svg aria-hidden="true" className="look-outline" viewBox="0 0 86.6 100" preserveAspectRatio="none">
        <polygon points="43.3,1 85.6,25.5 85.6,74.5 43.3,99 1,74.5 1,25.5" />
      </svg>
    </div>
  );
}

export function Look() {
  const cluster = useRef<HTMLDivElement>(null);
  useTilt(cluster, 5);
  const cells = SHOW_GUESTS ? guestCells : placeholderCells;

  return (
    <section id="obraz" className="tone-sand section-y relative overflow-hidden" data-tone="sand" aria-labelledby="look-title">
      <span aria-hidden="true" className="flare" style={{ width: "40vmax", height: "40vmax", right: "-12%", top: "6%" }} />
      <div className="container-x grid-12 relative items-center gap-y-16">
        <div className="col-span-12 lg:col-span-5">
          <p className="label eyebrow eyebrow-gold reveal text-espresso">03 — {look.label}</p>
          <h2 id="look-title" className="display mt-8 text-[clamp(2.6rem,5.6vw,5.2rem)] leading-[0.98] text-espresso">
            <span className="line-mask">
              <span>{look.titleA}</span>
            </span>
            <span className="line-mask" style={{ ["--delay" as string]: "110ms" }}>
              <span className="it text-bordo">{look.titleB}</span>
            </span>
          </h2>
          <p className="display it reveal mt-6 max-w-[20ch] text-[clamp(1.6rem,2.4vw,2.15rem)] leading-[1.18] text-espresso" style={{ ["--delay" as string]: "200ms" }}>
            {look.tail}
          </p>
          <div className="reveal mt-10 flex flex-wrap items-start gap-3" style={{ ["--delay" as string]: "280ms" }}>
            <BookButton />
            <WorksButton />
          </div>
        </div>
        <div className="col-span-12 lg:col-span-7 lg:col-start-6">
          <div ref={cluster} className="look-cluster relative mx-auto w-full max-w-[640px]" style={{ aspectRatio: "1.043" }}>
            {cells.map((c, i) => (
              <HexCell key={i} cell={c} guests={SHOW_GUESTS} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
