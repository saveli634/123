import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { useLang } from "@/lib/lang";
import { motionOK } from "@/lib/env";
import { ALT } from "@/content/frames";
import { Frame } from "@/components/Frame";
import { Kicker, Lines } from "@/components/Text";
import { EngineScheme, TurboScheme } from "@/components/Schemes";
import { IconArrow } from "@/components/Icons";
import { cn } from "@/lib/cn";
import { glowFollow } from "@/lib/glow";

const AUTO_MS = 6500;

/**
 * «Техническое ядро»: четыре направления — ДВИГАТЕЛЬ / АКПП / PERFORMANCE / СЕРВИС.
 * Переключатель (вкладки, стрелки с клавиатуры): меняются кадр или схема, описание, услуги, детали
 * и связанный кейс. Пока посетитель не трогал переключатель и блок на экране — направления
 * листаются сами. Без JS видны все четыре описания подряд.
 */
export function TechCore() {
  const { t, lang } = useLang();
  const cats = t.core.cats;
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const root = useRef<HTMLElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [inView, setInView] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const running = auto && inView && !hover && motionOK();
  useEffect(() => {
    if (!running) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % cats.length), AUTO_MS);
    return () => window.clearTimeout(id);
  }, [running, active, cats.length]);

  const pick = (k: number, focus = false) => {
    setAuto(false);
    setActive(k);
    if (focus) tabs.current[k]?.focus();
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const n = cats.length;
    const map: Record<string, number> = {
      ArrowRight: (active + 1) % n,
      ArrowDown: (active + 1) % n,
      ArrowLeft: (active - 1 + n) % n,
      ArrowUp: (active - 1 + n) % n,
      Home: 0,
      End: n - 1,
    };
    if (e.key in map) {
      e.preventDefault();
      pick(map[e.key], true);
    }
  };

  return (
    <section ref={root} id="services" className="section core" aria-labelledby="core-title">
      <div className="wrap">
        <div className="grid-12 items-end gap-y-8">
          <div className="col-span-12 lg:col-span-8">
            <Kicker>{t.core.label}</Kicker>
            <Lines id="core-title" lines={t.core.title} className="t-title t-title-long mt-6" />
          </div>
          <p className="fade-up t-body col-span-12 max-w-sm lg:col-span-4 lg:justify-self-end" data-reveal="">
            {t.core.lead}
          </p>
        </div>

        <div
          className="core-grid mt-[7vh]"
          data-reveal=""
          onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)}
          onPointerLeave={() => setHover(false)}
        >
          <div
            className="core-tabs fade-up"
            role="tablist"
            aria-label={t.a11y.core}
            aria-orientation="vertical"
            onKeyDown={onKey}
            data-auto={running ? "" : undefined}
            style={{ "--auto": `${AUTO_MS}ms` } as CSSProperties}
          >
            {cats.map((c, k) => (
              <button
                key={c.id}
                ref={(el) => {
                  tabs.current[k] = el;
                }}
                type="button"
                role="tab"
                id={`core-tab-${c.id}`}
                aria-selected={active === k}
                aria-controls={`core-panel-${c.id}`}
                tabIndex={active === k ? 0 : -1}
                className="core-tab"
                onClick={() => pick(k)}
              >
                <span className="t-num core-tab-num">0{k + 1}</span>
                <span className="core-tab-text">
                  <span className="core-tab-code" translate="no">
                    {c.code}
                  </span>
                  <span className="core-tab-name">{c.name}</span>
                </span>
                <span className="core-tab-bar" aria-hidden="true">
                  <i key={active === k ? `on-${active}` : "off"} />
                </span>
              </button>
            ))}
          </div>

          <div className="core-stage fade-up" style={{ "--d": 120 } as CSSProperties} onPointerMove={glowFollow}>
            {cats.map((c, k) => (
              <div key={c.id} className="core-media" data-on={active === k ? "" : undefined} aria-hidden={active !== k}>
                {"frame" in c.media ? (
                  <Frame
                    name={c.media.frame}
                    fill
                    sizes="(max-width: 1023px) 92vw, 36vw"
                    position={c.media.position}
                    className="no-border"
                  />
                ) : (
                  <div className="core-scheme">
                    {c.media.scheme === "engine" ? (
                      <EngineScheme on={active === k} label={`${t.a11y.scheme}: ${c.name}`} />
                    ) : (
                      <TurboScheme on={active === k} label={`${t.a11y.scheme}: ${c.name}`} />
                    )}
                  </div>
                )}
                <div className="core-media-cap">
                  <span className="t-num text-gold" translate="no">
                    {c.code}
                  </span>
                  <span className="t-label text-cream/75">
                    {"frame" in c.media ? ALT[c.media.frame][lang] : t.core.scheme}
                  </span>
                </div>
              </div>
            ))}
            <span className="corners" aria-hidden="true">
              <span className="hud-corner" />
              <span className="hud-corner" />
              <span className="hud-corner" />
              <span className="hud-corner" />
            </span>
            <span className="core-glow" aria-hidden="true" />
          </div>

          <div className="core-panels fade-up" style={{ "--d": 220 } as CSSProperties}>
            {cats.map((c, k) => (
              <div
                key={c.id}
                id={`core-panel-${c.id}`}
                role="tabpanel"
                aria-labelledby={`core-tab-${c.id}`}
                className="core-item"
                data-on={active === k ? "" : undefined}
              >
                <p className="t-num text-xs text-gold">
                  0{k + 1} — <span translate="no">{c.code}</span>
                </p>
                <h3 className="core-title t-display">{c.name}</h3>
                <p className="t-body core-desc">{c.desc}</p>
                <p className="t-label mt-7 text-muted">{t.core.services}</p>
                <ul className="core-list">
                  {c.services.map((s, i) => (
                    <li key={s} style={{ "--i": i } as CSSProperties}>
                      {s}
                    </li>
                  ))}
                </ul>
                <ul className="core-chips" aria-label={t.core.details}>
                  {c.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                <a href={c.related.href} className={cn("core-related")}>
                  <span className="t-label text-muted">{t.core.related}</span>
                  <span className="core-related-title">{c.related.label}</span>
                  <IconArrow className="core-related-arrow" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
