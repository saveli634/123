import { useState, type CSSProperties } from "react";
import { useLang } from "@/lib/lang";
import type { Case } from "@/content/i18n";
import { Frame } from "@/components/Frame";
import { Kicker, Lines } from "@/components/Text";
import { IconArrow } from "@/components/Icons";
import { glowFollow } from "@/lib/glow";
import { cn } from "@/lib/cn";
import { RouteMap } from "@/sections/Travellers";

/** Сетка: ширина карточки в колонках из 12 (компьютер). Последняя — горизонтальная во всю ширину. */
const SPAN = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7", "lg:col-span-12 case-wide"];

/**
 * «Реальные работы»: каждый кейс — проблема (или задача, если проблема в ролике не названа) → что
 * сделано. Только подтверждённое: подписи к роликам, кадры, слова заказчика. Арка и днище — кадр
 * «было» сменяется «стало» при наведении или по кнопке.
 */
export function Cases() {
  const { t } = useLang();
  return (
    <section id="cases" className="section cases" aria-labelledby="cases-title">
      <div className="wrap">
        <div className="grid-12 items-end gap-y-8">
          <div className="col-span-12 lg:col-span-7">
            <Kicker>{t.cases.label}</Kicker>
            <Lines id="cases-title" lines={t.cases.title} className="t-title mt-6" />
          </div>
          <p className="fade-up t-body col-span-12 max-w-md lg:col-span-5 lg:justify-self-end" data-reveal="">
            {t.cases.lead}
          </p>
        </div>
        <div className="grid-12 mt-[7vh] gap-5 lg:gap-6">
          {t.cases.items.map((c, i) => (
            <CaseCard key={c.id} c={c} n={i + 1} className={cn("col-span-12", SPAN[i] ?? "lg:col-span-6")} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CaseCard({ c, n, className }: { c: Case; n: number; className?: string }) {
  const { t } = useLang();
  const [after, setAfter] = useState(false);
  return (
    <article
      id={c.id}
      className={cn("case card", className)}
      onPointerMove={glowFollow}
      onPointerEnter={(e) => c.frameAfter && e.pointerType === "mouse" && setAfter(true)}
      onPointerLeave={(e) => c.frameAfter && e.pointerType === "mouse" && setAfter(false)}
      data-reveal=""
      data-after={after ? "" : undefined}
    >
      <div className="case-media fade-up">
        {c.frame ? (
          <>
            <Frame
              name={c.frame}
              fill
              sizes="(max-width: 1023px) 92vw, 46vw"
              position="50% 50%"
              className="no-border"
            />
            {c.frameAfter && (
              <div className="case-after">
                <Frame name={c.frameAfter} fill sizes="(max-width: 1023px) 92vw, 40vw" className="no-border" />
              </div>
            )}
          </>
        ) : (
          c.route && (
            <div className="case-route">
              <RouteMap only="BE" />
            </div>
          )
        )}
        <span className="case-tag t-label">{c.tag}</span>
        <span className="case-num t-num">{String(n).padStart(2, "0")}</span>
        {c.frameAfter && (
          <button
            type="button"
            className="case-flip t-label"
            aria-pressed={after}
            onClick={() => setAfter((v) => !v)}
          >
            <span data-on={!after ? "" : undefined}>{t.beforeAfter.before}</span>
            <i aria-hidden="true" />
            <span data-on={after ? "" : undefined}>{t.beforeAfter.after}</span>
          </button>
        )}
      </div>
      <div className="case-body">
        <h3 className="case-title fade-up" style={{ "--d": 80 } as CSSProperties}>
          {c.title}
        </h3>
        <dl className="case-steps fade-up" style={{ "--d": 160 } as CSSProperties}>
          <div>
            <dt className="t-label">{c.kind === "problem" ? t.cases.problem : t.cases.task}</dt>
            <dd>{c.problem}</dd>
          </div>
          <span className="case-arrow" aria-hidden="true">
            <IconArrow />
          </span>
          <div>
            <dt className="t-label text-gold">{t.cases.done}</dt>
            <dd>{c.done}</dd>
          </div>
        </dl>
        {c.link && (
          <a href={c.link.href} className="case-link t-label fade-up" style={{ "--d": 220 } as CSSProperties}>
            {c.link.label}
            <IconArrow className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </article>
  );
}
