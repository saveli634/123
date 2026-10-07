import { useEffect, useRef } from "react";
import { poems } from "@/data/poems.generated";
import { motionOk } from "@/lib/motion";
import { Btn } from "./ui";
import { SPARKLE } from "./glyphs";

/** Заголовки карточек (stihi_istochnik.md, строки 3 и 51; stihi_dop.md — заголовки стихов) */
const TITLES: Record<string, { title: string; note?: string }> = {
  "stih-1": { title: "Детский сад «Айналайн»", note: "выпускной" },
  "stih-2": { title: "С юбилеем, сынок" },
  "stih-3": { title: "С 5 летием со дня нашего венчания", note: "мужу" },
  "stih-4": { title: "С окончанием первого года учёбы", note: "учительнице" },
};

/** Валик «свитка» сверху и снизу карточки */
function Roller({ bottom }: { bottom?: boolean }) {
  return <div className={`scroll__roller${bottom ? " scroll__roller--b" : ""}`} aria-hidden="true" />;
}

/**
 * Стихи из роликов: строки проявляются по одной (размытие → резкость) при прокрутке.
 * Текст — дословно; убраны только эмодзи и хештег (оформление Instagram).
 */
export function Poems() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const lines = Array.from(el.querySelectorAll<HTMLElement>(".pl"));
    if (!motionOk()) {
      lines.forEach((l) => l.classList.add("is-in"));
      return;
    }
    el.classList.add("is-live");
    const io = new IntersectionObserver(
      (entries) => {
        // строки, появившиеся одновременно, — с небольшой задержкой друг за другом
        let k = 0;
        entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
          .forEach((e) => {
            const t = e.target as HTMLElement;
            t.style.transitionDelay = `${Math.min(k++, 10) * 70}ms`;
            t.classList.add("is-in");
            io.unobserve(t);
          });
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    lines.forEach((l) => io.observe(l));
    return () => {
      io.disconnect();
      el.classList.remove("is-live");
    };
  }, []);

  return (
    <section id="stihi" ref={root} className="poems section" aria-labelledby="poems-title">
      <div className="wrap">
        <h2 id="poems-title" className="sr-only">
          Стихи
        </h2>

        <div className="poems__grid">
          {poems.map((p, idx) => {
            const t = TITLES[p.id];
            return (
              <article key={p.id} className={`scroll rv${idx % 2 ? " scroll--alt" : ""}`} aria-labelledby={`${p.id}-t`}>
                <Roller />
                <div className="scroll__paper">
                  <p className="scroll__src">{p.reel ? "Из моих роликов" : "Из моего Instagram"}</p>
                  <h3 id={`${p.id}-t`} className="scroll__title">
                    {t.title}
                    {t.note && <span className="scroll__note">{t.note}</span>}
                  </h3>
                  <svg className="scroll__divider" viewBox="0 0 120 12" aria-hidden="true">
                    <path d="M0 6h50M70 6h50" />
                    <path d={SPARKLE} transform="translate(54 0) scale(0.5)" />
                  </svg>
                  <div className="scroll__poem">
                    {p.stanzas.map((s, si) => (
                      <p key={si} className="stanza">
                        {s.map((l) => (
                          <span key={l.line} className="pl">
                            {l.text}{" "}
                          </span>
                        ))}
                      </p>
                    ))}
                  </div>
                  {p.reel && (
                  <div className="scroll__foot">
                    <Btn
                      href={p.reel}
                      external
                      variant="gold"
                      ariaLabel={`Смотреть ролик «${t.title}» в Instagram (откроется в новой вкладке)`}
                      icon={
                        <svg viewBox="0 0 24 24" className="btn__icon" aria-hidden="true">
                          <path d="M8 5.5v13l10.5-6.5z" />
                        </svg>
                      }
                    >
                      Смотреть ролик
                    </Btn>
                  </div>
                  )}
                </div>
                <Roller bottom />
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
