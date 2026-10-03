import { forwardRef } from "react";
import { MirrorCss } from "./MirrorCss";
import { T, HERO_PHOTO } from "@/content/copy";
import { waHref, worksHref, extProps, GREETING } from "@/lib/links";

/** Первый экран: «Салон красоты», «Queen Bee», «Макияж · Причёски», портрет в зеркале, «Записаться». */
export const Hero = forwardRef<HTMLDivElement>(function Hero(_props, slotRef) {
  const wa = waHref(GREETING);
  return (
    <section id="top" className="hero" aria-labelledby="hero-title">
      <div className="hero__bg" aria-hidden="true" />
      <div className="hero__grid wrap">
        <div className="hero__text">
          <h1 id="hero-title" className="hero__h1">
            <span className="eyebrow hero__label">
              <span className="hero__rule" aria-hidden="true" />
              {T.label}
            </span>
            <span className="hero__title">
              <span className="ln">
                <span>{T.title[0]}</span>
              </span>{" "}
              <span className="ln">
                <em>{T.title[1]}</em>
              </span>
            </span>
          </h1>
          <p className="hero__sub">{T.sub}</p>
          <p className="hero__services">
            {T.services.map((s, i) => (
              <span key={s} className={i === 2 ? "hero__svc hero__svc--soft" : "hero__svc"}>
                {i > 0 && <span className="dot" aria-hidden="true">·</span>}
                {s}
              </span>
            ))}
          </p>
          <div className="hero__cta">
            <a href="#booking" className="btn btn--wine" data-magnetic>
              Записаться
            </a>
            <a href={worksHref} className="btn btn--line" data-magnetic {...extProps(worksHref)}>
              Смотреть работы
            </a>
          </div>
          <a href={wa} className="hero__wa ulink" {...extProps(wa)}>
            Написать в WhatsApp
          </a>
        </div>
        <div className="hero__mirror">
          <MirrorCss ref={slotRef} name={HERO_PHOTO} alt="Готовый образ гостьи салона Queen Bee у зеркала с подсветкой" eager className="hero__cmirror" />
        </div>
      </div>
      <a href="#mirror" className="hero__scroll" aria-label="Прокрути к образам">
        <span>Прокрути</span>
        <i aria-hidden="true" />
      </a>
    </section>
  );
});
