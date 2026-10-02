import { useRef } from "react";
import { HERO, SITE, STAGES, STAGES_HEAD, UI } from "@/content/copy";
import type { ImageName } from "@/content/images";
import { Frame } from "@/components/shared/Frame";
import { Img } from "@/components/shared/Img";
import { Cta } from "@/components/shared/Cta";
import { Cross } from "@/components/shared/Glyphs";
import { useScrollFx, scrollToY } from "@/lib/scroll";

/**
 * Главная сцена «Капиталка за один прокрут»: 500svh, внутри закреплённый экран.
 * Прокрутка ведёт мотор через шесть этапов (сам мотор — в EngineLayer), здесь — подписи,
 * врезки-кадры, HUD (рамка, шкала 01–06, узел, условные координаты, подсказка «Прокрути»).
 * Без JS / при «уменьшить движение» этапы идут обычным списком с готовыми рендерами.
 */
const pad = (n: number) => String(n).padStart(2, "0");

export function Stages() {
  const ref = useRef<HTMLElement>(null);
  const active = useRef(-1);

  useScrollFx(
    ref,
    (p, el) => {
      const i = Math.min(5, Math.floor(p * 6));
      el.style.setProperty("--sp", p.toFixed(4));
      // прогресс внутри этапа — для параллакса врезок
      el.style.setProperty("--lp", (p * 6 - i).toFixed(4));
      if (i === active.current) return;
      active.current = i;
      el.dataset.active = String(i);
      document.documentElement.dataset.stage = String(i);
      el.querySelectorAll<HTMLElement>(".stage").forEach((s, k) => s.classList.toggle("is-on", k === i));
      el.querySelectorAll<HTMLElement>(".hud-tick").forEach((s, k) => s.classList.toggle("is-on", k === i));
      const n = el.querySelector<HTMLElement>("[data-hud='n']");
      if (n) n.textContent = pad(i + 1);
      const node = el.querySelector<HTMLElement>("[data-hud='node']");
      if (node) node.textContent = STAGES[i].node;
    },
    "sticky",
  );

  const goTo = (i: number) => {
    const el = ref.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const range = el.offsetHeight - window.innerHeight;
    scrollToY(top + range * ((i + 0.5) / 6));
  };

  return (
    <section id="etapy" ref={ref} className="stages" aria-labelledby="stages-title" data-active="0">
      <h2 id="stages-title" className="sr-only">
        {STAGES_HEAD.label}
      </h2>
      <div className="stages-pin">
        <div className="stages-bg" aria-hidden="true">
          <Img name="red_garage_atmosphere-bg" alt="" sizes="100vw" className="stages-bg-img" />
        </div>

        <div className="hud" aria-hidden="true">
          <span className="hud-c hud-tl" />
          <span className="hud-c hud-tr" />
          <span className="hud-c hud-bl" />
          <span className="hud-c hud-br" />
          <div className="hud-top">
            <span className="hud-title">{STAGES_HEAD.label}</span>
            <span className="hud-note">{SITE.schemeNote}</span>
          </div>
          <div className="hud-right">
            <span className="hud-k">{STAGES_HEAD.hudNode}</span>
            <span className="hud-node" data-hud="node">
              {STAGES[0].node}
            </span>
            <span className="hud-xyz num">
              X <b data-hud="x">11.60</b> · Y <b data-hud="y">6.40</b> · Z <b data-hud="z">7.80</b>
            </span>
          </div>
          <div className="hud-hint">
            <span>{HERO.scroll}</span>
            <span className="hud-hint-line" />
          </div>
        </div>

        <nav className="hud-scale" aria-label={STAGES_HEAD.hudStage}>
          <span className="hud-k" aria-hidden="true">
            {STAGES_HEAD.hudStage} <b className="num" data-hud="n">01</b>
            <span className="num">/06</span>
          </span>
          <ol>
            {STAGES.map((s, i) => (
              <li key={s.n}>
                <button type="button" className={`hud-tick${i === 0 ? " is-on" : ""}`} onClick={() => goTo(i)} aria-label={`${STAGES_HEAD.hudStage} ${s.n}: ${s.title}`} data-cursor="link">
                  <span className="num">{s.n}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <ol className="stage-list">
          {STAGES.map((s, i) => (
            <li key={s.n} className={`stage stage-${i + 1}${i === 0 ? " is-on" : ""}`}>
              <div className="stage-render">
                <Img name={`render-${i + 1}` as ImageName} alt={`${UI.scheme}: ${s.title}`} sizes="(min-width: 1024px) 60vw, 100vw" contain />
              </div>
              <div className="stage-copy">
                <p className="stage-n">
                  <Cross className="sec-cross" />
                  <span className="num">{s.n}</span>
                  <span className="stage-of num">/ 06</span>
                </p>
                <h3 className="display stage-title lines">
                  <span className="ln">
                    <span>{s.title}</span>
                  </span>
                </h3>
                {s.note && <p className="stage-note">{s.note}</p>}
              </div>
              {i === 5 && (
                <div className="stage-cta">
                  <Cta kind="call" />
                  <Cta kind="whatsapp" variant="outline" />
                </div>
              )}
              {s.insets.length > 0 && (
                <div className={`stage-insets n${s.insets.length}`}>
                  {s.insets.map((f, k) => (
                    <Frame
                      key={f.img}
                      img={f.img}
                      alt={f.caption}
                      caption={f.caption}
                      index={`${s.n}.${k + 1}`}
                      sizes="(min-width: 1024px) 15vw, 30vw"
                      wipe={false}
                      className={`inset inset-${k + 1}`}
                    />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
