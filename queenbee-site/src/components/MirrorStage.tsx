import { Fragment, useEffect, useRef, type RefObject } from "react";
import { STAGES, T } from "@/content/copy";
import { Photo } from "./Photo";
import { mountStage } from "@/lib/stageController";
import { callHref, waHref, extProps, GREETING } from "@/lib/links";

/**
 * Главная сцена «Зеркало образа»: закреплённый блок 500svh, этапы 01–04.
 * Живое 3D рисуется на фиксированной канве (mirror-layer), здесь — подписи, HUD,
 * готовые рендеры (без WebGL 2) и статичная версия (без JS и при reduced motion).
 */
export function MirrorStage({ slot }: { slot: RefObject<HTMLDivElement | null> }) {
  const pin = useRef<HTMLElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renders = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slot.current || !pin.current || !layer.current || !canvas.current || !renders.current) return;
    return mountStage({ slot: slot.current, pin: pin.current, layer: layer.current, canvas: canvas.current, renders: renders.current });
  }, [slot]);

  const wa = waHref(GREETING);
  return (
    <>
      <div className="mirror-layer" ref={layer} aria-hidden="true">
        <canvas ref={canvas} className="mirror-canvas" />
      </div>
      <section id="mirror" className="pin" ref={pin} data-stage="0" aria-label="Зеркало образа: макияж, причёски, полный образ">
        <div className="pin__sticky">
          <div className="pin__renders" ref={renders} aria-hidden="true">
            {[0, 1, 2, 3, 4].map((k) => (
              <Photo key={k} name={`render_${k}` as never} alt="" className={`pin__render pin__render--${k}`} sizes="80vw" />
            ))}
          </div>
          <div className="hud" aria-hidden="true">
            <span className="hud__frame" />
            <ol className="hud__scale">
              {STAGES.map((s) => (
                <li key={s.n} data-n={s.n}>
                  <span className="hud__num">0{s.n}</span>
                  <span className="hud__tick" />
                </li>
              ))}
            </ol>
            <span className="hud__progress">
              <i />
            </span>
            <span className="hud__names">
              {STAGES.map((s) => (
                <span key={s.n} data-n={s.n}>
                  {s.name}
                </span>
              ))}
            </span>
            <span className="hud__hint">Прокрути</span>
          </div>
          {STAGES.slice(0, 3).map((s) => (
            <article key={s.id} className="cap" data-n={s.n}>
              <p className="cap__num">
                <span>0{s.n}</span> / 04
              </p>
              <h2 className="cap__title">
                {s.name.split(" ").map((w, i) => (
                  <Fragment key={i}>
                    {i > 0 && " "}
                    <span className="cw" style={{ transitionDelay: `${120 + i * 80}ms` }}>
                      <span>{w}</span>
                    </span>
                  </Fragment>
                ))}
              </h2>
              <p className="cap__line">{s.line}</p>
              <div className="cap__static">
                <Photo name={`render_${s.n}` as never} alt="" className="cap__render" sizes="(max-width: 767px) 90vw, 40vw" />
                <div className="cap__photos">
                  {s.photos.map((p) => (
                    <Photo key={p} name={p} alt={`${s.name} — работа салона Queen Bee`} className="cap__photo" sizes="(max-width: 767px) 45vw, 22vw" />
                  ))}
                </div>
              </div>
            </article>
          ))}
          <article className="cap cap--book" data-n="4">
            <p className="cap__num">
              <span>04</span> / 04
            </p>
            <h2 className="cap__title">
              <span className="cw">
                <span>Запись</span>
              </span>
            </h2>
            <p className="cap__line">{T.special}</p>
            <div className="cap__actions">
              <a href="#booking" className="btn btn--wine" data-magnetic>
                Записаться
              </a>
              <a href={wa} className="btn btn--line" data-magnetic {...extProps(wa)}>
                Написать в WhatsApp
              </a>
              <a href={callHref} className="btn btn--ghost" data-magnetic>
                Позвонить
              </a>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
