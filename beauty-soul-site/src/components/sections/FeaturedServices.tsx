import type { ReactNode } from "react";
import { brand } from "@/content/site";
import { Img } from "@/components/Img";
import { ArrowIcon } from "@/components/ui/button";
import { cn, typo } from "@/lib/utils";

/**
 * Пять ключевых направлений крупно. Каждое — своя композиция:
 * чередуем сторону, масштаб фото и цвет фона, чтобы ритм не повторялся.
 */
export function FeaturedServices() {
  return (
    <div aria-label="Направления салона" role="region">
      <Manicure />
      <Hair />
      <Makeup />
      <PedicureLashes />
    </div>
  );
}

/* ---------- общие части ---------- */

function ServiceSection({
  id,
  className,
  children,
  labelledBy,
}: {
  id: string;
  className?: string;
  children: ReactNode;
  labelledBy: string;
}) {
  return (
    <section
      id={id}
      tabIndex={-1}
      aria-labelledby={labelledBy}
      className={cn("section-y", className)}
    >
      {children}
    </section>
  );
}

function ServiceText({
  number,
  title,
  titleId,
  text,
  tone = "dark",
  className,
}: {
  number: string;
  title: string;
  titleId: string;
  text: string;
  tone?: "dark" | "light";
  className?: string;
}) {
  const light = tone === "light";
  return (
    <div className={className}>
      <p className={cn("reveal text-xs font-medium tracking-[0.22em] tabular-nums", light ? "text-sand/70" : "text-taupe")}>
        {number}
      </p>
      <h3
        id={titleId}
        className={cn(
          "font-display mt-4 text-[clamp(3rem,7vw,6.2rem)] leading-[0.95]",
          light ? "text-ivory" : "text-ink",
        )}
      >
        <span className="line-mask">
          <span style={{ ["--delay" as string]: "80ms" }}>{title}</span>
        </span>
      </h3>
      <p
        className={cn("reveal mt-6 max-w-sm text-[1rem] leading-relaxed", light ? "text-ivory/70" : "text-ink/70")}
        style={{ ["--delay" as string]: "180ms" }}
      >
        {typo(text)}
      </p>
      <a
        href={brand.bookingUrl}
        target="_blank"
        rel="noopener"
        className={cn(
          "group/link reveal mt-8 inline-flex h-11 items-center gap-3 text-[0.75rem] font-semibold tracking-[0.18em] uppercase",
          light ? "text-ivory" : "text-ink",
        )}
        style={{ ["--delay" as string]: "260ms" }}
      >
        <span className="link-line">Записаться на {title.toLowerCase()}</span>
        <ArrowIcon className="size-3.5" />
      </a>
    </div>
  );
}

/* ---------- 01 Маникюр: большое фото слева, текст и деталь справа ---------- */

function Manicure() {
  return (
    <ServiceSection id="service-manicure" labelledBy="manicure-title" className="bg-ivory">
      <div className="container-x grid items-end gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="img-hover img-reveal lg:col-span-7">
          <Img
            name="03_nails_white"
            alt="Молочно-перламутровый маникюр, длинная миндалевидная форма"
            sizes="(min-width: 1024px) 55vw, 100vw"
            position="50% 45%"
            className="aspect-[4/5] lg:aspect-[5/6]"
          />
        </div>
        <div className="lg:col-span-4 lg:col-start-9">
          <ServiceText
            number="01"
            title="Маникюр"
            titleId="manicure-title"
            text="Форма, покрытие, оттенок — детали, которые видны каждый день. Молочный перламутр, спокойный нюд или насыщенный красный: подберём то, что подходит именно вам."
          />
          <div
            className="img-hover img-reveal mt-14 ml-auto w-[62%] lg:w-[78%]"
            style={{ ["--delay" as string]: "200ms" }}
          >
            <Img
              name="09_nails_red"
              alt="Маникюр с глянцевым красным покрытием"
              sizes="(min-width: 1024px) 22vw, 60vw"
              className="aspect-square"
            />
          </div>
        </div>
      </div>
    </ServiceSection>
  );
}

/* ---------- 02 Волосы: текст слева, два фото лесенкой ---------- */

function Hair() {
  return (
    <ServiceSection id="service-hair" labelledBy="hair-title" className="bg-cream">
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-8">
        <ServiceText
          className="lg:col-span-4 lg:pt-10"
          number="02"
          title="Волосы"
          titleId="hair-title"
          text="Мягкие волны, объёмные локоны, гладкая длина. Укладка, в которой вы остаётесь собой — только праздничнее."
        />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:col-span-7 lg:col-start-6 lg:gap-8">
          <div className="img-hover img-reveal mt-16 lg:mt-32">
            <Img
              name="04_hair_waves"
              alt="Объёмная укладка: мягкие волны на волосах средней длины"
              sizes="(min-width: 1024px) 28vw, 48vw"
              className="aspect-[3/4]"
            />
          </div>
          <div className="img-hover img-reveal" style={{ ["--delay" as string]: "180ms" }}>
            <Img
              name="06_hair_back"
              alt="Длинные волосы, уложенные крупными волнами, вид со спины"
              sizes="(min-width: 1024px) 28vw, 48vw"
              position="50% 40%"
              className="aspect-[3/4]"
            />
          </div>
        </div>
      </div>
    </ServiceSection>
  );
}

/* ---------- 03 Макияж: тёмный разворот ---------- */

function Makeup() {
  return (
    <ServiceSection
      id="service-makeup"
      labelledBy="makeup-title"
      className="on-dark bg-espresso text-ivory"
    >
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="order-2 flex flex-col justify-between gap-12 lg:order-1 lg:col-span-4">
          <ServiceText
            number="03"
            title="Макияж"
            titleId="makeup-title"
            tone="light"
            text="Выразительный и при этом бережный к вашим чертам. Макияж и причёска для события, съёмки или вечера, которого вы ждали."
          />
          <figure className="img-hover img-reveal w-[70%] max-w-[18rem]" style={{ ["--delay" as string]: "240ms" }}>
            <Img
              name="02_master_makeup"
              alt="Праздничный макияж и собранные волосы, портрет в салоне"
              sizes="18rem"
              position="50% 30%"
              className="aspect-[4/5]"
            />
          </figure>
        </div>
        <div className="img-hover img-reveal order-1 lg:order-2 lg:col-span-7 lg:col-start-6">
          <Img
            name="07_makeup_updo"
            alt="Нежный макияж и собранная причёска с выпущенными прядями"
            sizes="(min-width: 1024px) 55vw, 100vw"
            position="50% 35%"
            className="aspect-[4/5] lg:aspect-[6/7]"
          />
        </div>
      </div>
    </ServiceSection>
  );
}

/* ---------- 04 Педикюр + 05 Ресницы: пара со смещением ---------- */

function PedicureLashes() {
  return (
    <div className="section-y bg-ivory">
      <div className="container-x grid gap-20 md:grid-cols-2 md:gap-10 lg:gap-24">
        <section id="service-pedicure" tabIndex={-1} aria-labelledby="pedicure-title">
          <div className="img-hover img-reveal max-w-md">
            <Img
              name="11_pedicure"
              alt="Педикюр с нежно-розовым покрытием"
              sizes="(min-width: 768px) 28rem, 90vw"
              position="50% 60%"
              className="aspect-[4/5]"
            />
          </div>
          <ServiceText
            className="mt-10"
            number="04"
            title="Педикюр"
            titleId="pedicure-title"
            text="Ухоженные стопы и деликатное покрытие. Спокойный уход, после которого легко идти дальше."
          />
        </section>
        <section
          id="service-lashes"
          tabIndex={-1}
          aria-labelledby="lashes-title"
          className="md:mt-48"
        >
          <div className="img-hover img-reveal max-w-md" style={{ ["--delay" as string]: "150ms" }}>
            <Img
              name="12_lashes"
              alt="Крупный план глаз: ресницы с естественным изгибом"
              sizes="(min-width: 768px) 28rem, 90vw"
              position="50% 50%"
              className="aspect-[4/5]"
            />
          </div>
          <ServiceText
            className="mt-10"
            number="05"
            title="Ресницы"
            titleId="lashes-title"
            text="Естественный изгиб и открытый взгляд — без тяжести и лишнего объёма."
          />
        </section>
      </div>
    </div>
  );
}
