import { useEffect, useRef } from "react";
import { Split } from "./Split";
import { ScrollTrigger, motionStarted } from "@/lib/motion";

/**
 * «Почему ко мне» — шесть причин из её поста. Карточки при прокрутке складываются в стопку
 * (каждая следующая наезжает на предыдущую, та чуть уменьшается). «60 минут» и «1 месяц» — счётчики-барабаны.
 */
function Odometer({ value, label }: { value: string; label: string }) {
  // каждая цифра — колонка 0…9 0…9 и нужная цифра; при появлении колонка «прокручивается» до неё
  return (
    <span className="odo" aria-label={`${value} ${label}`} role="img">
      <span className="odo-digits" aria-hidden="true">
        {value.split("").map((d, i) => {
          const target = 20 + Number(d);
          return (
            <span className="odo-col" key={i} style={{ "--to": target, "--i": i } as React.CSSProperties}>
              {Array.from({ length: target + 1 }, (_, k) => (
                <span key={k}>{k % 10}</span>
              ))}
            </span>
          );
        })}
      </span>
      <span className="odo-label" aria-hidden="true">
        {label}
      </span>
    </span>
  );
}

const REASONS: { text: string; counter?: { value: string; label: string } }[] = [
  { text: "Ты будешь тратить меньше времени на сборы" },
  { text: "Процедура занимает всего 1 час", counter: { value: "60", label: "минут" } },
  { text: "Можно тереть глаза и пользоваться мицеллярной водой" },
  { text: "Эффект сохраняется в течение месяца", counter: { value: "1", label: "месяц" } },
  { text: "Можно пользоваться тушью — эффект будет ещё больше" },
  { text: "Со мной можно посплетничать и поболтать" },
];

export function Reasons() {
  const list = useRef<HTMLOListElement>(null);

  // карточка, на которую наехала следующая, чуть уменьшается и темнеет
  useEffect(() => {
    if (!motionStarted() || !list.current) return;
    const cards = Array.from(list.current.querySelectorAll<HTMLElement>(".reason-card"));
    const sts = cards.slice(0, -1).map((card, i) =>
      ScrollTrigger.create({
        trigger: cards[i + 1].parentElement!,
        start: "top bottom",
        end: "top top+=120",
        scrub: true,
        onUpdate: (self) => {
          const k = self.progress;
          card.style.transform = `scale(${(1 - k * 0.06).toFixed(4)})`;
          card.style.setProperty("--dim", (k * 0.55).toFixed(3));
        },
      }),
    );
    return () => sts.forEach((s) => s.kill());
  }, []);

  return (
    <section className="reasons section" id="pochemu" aria-labelledby="reasons-title">
      <div className="container reasons-layout">
        <header className="section-head reasons-head">
          <p className="eyebrow" data-reveal>
            <span className="eyebrow-num">05</span>Шесть причин
          </p>
          <Split id="reasons-title" className="h2" text="Почему *ко мне*" />
          <p className="reasons-lead" data-reveal>
            Из моего поста «Почему тебе нужно записаться ко мне на реснички».
          </p>
        </header>
        <ol className="reasons-stack" ref={list}>
          {REASONS.map((r, i) => (
            <li key={r.text} className="reason" style={{ "--n": i } as React.CSSProperties}>
              <div className={`reason-card ${r.counter ? "reason-card--count" : ""}`} data-reveal="curtain">
                <span className="reason-num">
                  {String(i + 1).padStart(2, "0")}
                  <span aria-hidden="true"> / 06</span>
                </span>
                {r.counter && <Odometer {...r.counter} />}
                <p className="reason-text">{r.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
