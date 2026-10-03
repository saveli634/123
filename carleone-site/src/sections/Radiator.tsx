import { useRef } from "react";
import { useT } from "@/lib/lang";
import { motionOK, smooth } from "@/lib/env";
import { useScrollProgress } from "@/lib/scroll";
import type { FrameName } from "@/content/frames";
import { Frame } from "@/components/Frame";
import { Kicker, Lines } from "@/components/Text";

const SEQ: FrameName[] = ["rav4_on_lift", "lion_plaque_bumper", "radiator_close", "radiator_installed"];

/**
 * «Установка дополнительного радиатора охлаждения АКПП на Rav4» — закреплённая сцена 250svh:
 * кадры сменяют друг друга по прокрутке (шторка снизу вверх), шаги загораются по очереди.
 * Рядом — детали: radiator_hand и valve_body_hand с разным параллаксом.
 */
export function Radiator() {
  const t = useT();
  const root = useRef<HTMLElement>(null);
  const frames = useRef<(HTMLDivElement | null)[]>([]);
  const steps = useRef<(HTMLLIElement | null)[]>([]);
  const details = useRef<(HTMLDivElement | null)[]>([]);
  const counter = useRef<HTMLSpanElement>(null);
  const caption = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);

  useScrollProgress(root, "sticky", (p) => {
    const q = p * 3.3 - 0.15; // 0…3 + запас на удержание первого и последнего кадра
    const move = motionOK();
    let current = 0;
    SEQ.forEach((_, k) => {
      const a = k === 0 ? 1 : smooth(k - 0.75, k - 0.2, q);
      if (a > 0.5) current = k;
      const el = frames.current[k];
      if (el && k > 0) {
        const v = `inset(${((1 - a) * 100).toFixed(2)}% 0 0 0)`;
        el.style.clipPath = v;
        el.style.setProperty("-webkit-clip-path", v);
      }
      const img = el?.querySelector<HTMLElement>(".frame-bg, .frame-img");
      if (img && move) img.style.transform = `scale(${(1.12 - 0.12 * a).toFixed(4)})`;
      const li = steps.current[k];
      if (li) li.style.setProperty("--f", a.toFixed(3));
    });
    steps.current.forEach((li, k) => {
      if (!li) return;
      if (k <= current) li.setAttribute("data-on", "");
      else li.removeAttribute("data-on");
    });
    if (counter.current) counter.current.textContent = `0${current + 1}`;
    if (caption.current && shown.current !== current) {
      shown.current = current;
      caption.current.textContent = t.radiator.steps[current];
    }
    if (move)
      details.current.forEach((d, k) => {
        if (d) d.style.transform = `translate3d(0, ${((0.5 - p) * (k ? 140 : 70)).toFixed(1)}px, 0)`;
      });
  });

  return (
    <>
      <section ref={root} id="rav4" className="pin-250" aria-labelledby="radiator-title">
        <div className="pin-inner">
          <div className="wrap grid-12 h-full content-center items-center gap-y-6 pt-[calc(var(--header-h)+1rem)] pb-6 md:pt-[var(--header-h)]">
            <div className="radiator-window relative col-span-12 md:col-span-6 lg:col-span-5">
              {SEQ.map((name, k) => (
                <div
                  key={name}
                  className="swap-frame"
                  ref={(el) => {
                    frames.current[k] = el;
                  }}
                >
                  <Frame
                    name={name}
                    fill
                    sizes="(max-width: 767px) 92vw, 42vw"
                    position={k === 1 ? "35% 55%" : "50% 45%"}
                  />
                </div>
              ))}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-between p-4 md:p-6">
                <span className="t-num text-sm text-gold">
                  <span ref={counter}>01</span> <span className="text-muted">/ 04</span>
                </span>
                <span ref={caption} className="t-label max-w-[15rem] text-right text-cream/85" aria-hidden="true">
                  {t.radiator.steps[0]}
                </span>
              </div>
            </div>

            <div className="col-span-12 md:col-span-6 md:col-start-7 lg:col-span-6 lg:col-start-7">
              <Kicker className="hidden md:inline-flex">{t.radiator.kicker}</Kicker>
              <Lines id="radiator-title" lines={t.radiator.title} className="radiator-title t-display mt-2 md:mt-6" />
              <ol className="steps mt-5 md:mt-9">
                {t.radiator.steps.map((s, k) => (
                  <li
                    key={k}
                    ref={(el) => {
                      steps.current[k] = el;
                    }}
                    data-on={k === 0 ? "" : undefined}
                  >
                    <span className="t-num text-xs text-gold">0{k + 1}</span>
                    <span className="step-text text-[0.95rem] md:text-base">{s}</span>
                  </li>
                ))}
              </ol>
              <div className="radiator-details mt-8 hidden grid-cols-2 gap-4 lg:grid">
                {(
                  [
                    ["radiator_hand", t.radiator.detailHand],
                    ["valve_body_hand", t.radiator.detailValve],
                  ] as [FrameName, string][]
                ).map(([name, label], k) => (
                  <div
                    key={name}
                    ref={(el) => {
                      details.current[k] = el;
                    }}
                    className={k ? "mt-10" : ""}
                  >
                    <Frame name={name} ratio={4 / 3} sizes="20vw" position="50% 55%" />
                    <p className="t-label mt-3 text-muted">
                      <span className="text-gold">{t.radiator.details}</span> · {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* детали на телефоне и планшете — после закреплённой сцены, обычным потоком */}
      <div className="wrap grid grid-cols-2 gap-3 pb-[var(--section)] lg:hidden" data-reveal="">
        {(
          [
            ["radiator_hand", t.radiator.detailHand],
            ["valve_body_hand", t.radiator.detailValve],
          ] as [FrameName, string][]
        ).map(([name, label]) => (
          <div key={name} className="fade-up">
            <Frame name={name} ratio={3 / 4} sizes="46vw" position="50% 55%" />
            <p className="t-label mt-2 text-[0.6875rem] text-muted">
              <span className="text-gold">{t.radiator.details}</span> · {label}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
