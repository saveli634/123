import { useEffect, useRef, useState, type FormEvent } from "react";
import { birthNumber, maskDate, parseDate, personalYear, toIso, toRu, zodiac, type NumberResult, type Sign } from "@/lib/numerology";
import { hasBooking } from "@/data/site.config";
import { motionOk } from "@/lib/motion";
import { ZODIAC, SPARKLE } from "./glyphs";
import { Btn, SubmitBtn } from "./ui";
import { SphereEyebrow } from "./Spheres";

interface Result {
  birth: NumberResult;
  year: NumberResult;
  yearNum: number;
  sign: Sign;
}

const ERRORS = {
  empty: "Введите дату рождения: ДД.ММ.ГГГГ",
  incomplete: "Введите дату полностью: ДД.ММ.ГГГГ",
  invalid: "Такой даты нет — проверьте число и месяц",
  future: "Эта дата ещё не наступила",
  old: "Проверьте год рождения",
} as const;

/** Цифры «собираются»: каждая колонка прокручивается, как барабан, и встаёт на своё значение */
function Roll({ value, run }: { value: number; run: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const digits = String(value).split("").map(Number);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const strips = Array.from(el.querySelectorAll<HTMLElement>(".roll__strip"));
    if (!motionOk()) {
      strips.forEach((s, i) => (s.style.transform = `translate3d(0, ${-(10 + digits[i]) * 5}%, 0)`));
      return;
    }
    strips.forEach((s) => {
      s.style.transition = "none";
      s.style.transform = "translate3d(0,0,0)";
    });
    void el.offsetHeight;
    strips.forEach((s, i) => {
      s.style.transition = "";
      s.style.transitionDelay = `${120 + i * 140}ms`;
      s.style.transform = `translate3d(0, ${-(10 + digits[i]) * 5}%, 0)`;
    });
  }, [run, value]);
  return (
    <span ref={ref} className="roll" aria-hidden="true">
      {digits.map((_, i) => (
        <span key={i} className="roll__col">
          <span className="roll__strip">
            {Array.from({ length: 20 }, (_, k) => (
              <span key={k}>{k % 10}</span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

/** Как получилось число: цифры складываются, сумма сворачивается (11, 22, 33 — нет) */
function Chain({ label, r, delay = 0 }: { label: string; r: NumberResult; delay?: number }) {
  const tokens: string[] = [];
  r.digits.forEach((d, i) => tokens.push(i ? `+\u00a0${d}` : String(d)));
  tokens.push(`= ${r.chain[0]}`);
  r.chain.slice(1).forEach((n) => tokens.push(`→ ${n}`));
  return (
    <p className="chain" aria-hidden="true">
      <span className="chain__label">{label}</span>
      <span className="chain__sum">
        {tokens.map((t, i) => (
          <span key={i} className="chain__t" style={{ ["--i" as string]: i + delay }}>
            {t}
          </span>
        ))}
      </span>
    </p>
  );
}

export function NumberCalc() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<Result | null>(null);
  const [run, setRun] = useState(0);
  const [year, setYear] = useState<number | null>(null);
  const native = useRef<HTMLInputElement>(null);
  const text = useRef<HTMLInputElement>(null);
  const results = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const now = new Date();
    setYear(now.getFullYear());
    if (native.current) native.current.max = toIso({ d: now.getDate(), m: now.getMonth() + 1, y: now.getFullYear() });
  }, []);

  const calc = (raw: string, fromPicker = false) => {
    const p = parseDate(raw);
    if (!p.ok) {
      setError(ERRORS[p.reason]);
      text.current?.focus();
      return;
    }
    const y = new Date().getFullYear();
    setError(null);
    setValue(toRu(p.date));
    setRes({ birth: birthNumber(p.date), year: personalYear(p.date, y), yearNum: y, sign: zodiac(p.date) });
    setRun((r) => r + 1);
    if (!fromPicker) text.current?.blur();
    // на телефоне результат ниже формы — плавно показываем его
    window.setTimeout(() => {
      const el = results.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom > window.innerHeight || r.top < 0)
        el.scrollIntoView({ behavior: motionOk() ? "smooth" : "auto", block: "center" });
    }, 80);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    calc(value);
  };

  const announce = res
    ? `Число даты рождения: ${res.birth.value}. Персональный год ${res.yearNum}: ${res.year.value}. Знак зодиака: ${res.sign.name}.`
    : "";

  return (
    <section id="chislo" className="calc section" aria-labelledby="calc-title">
      <div className="wrap calc__grid">
        <div className="calc__intro rv">
          <SphereEyebrow id="chislo">ваше число</SphereEyebrow>
          <h2 id="calc-title" className="h2">
            Узнайте своё <em>число</em>
          </h2>
          <p className="calc__lead">
            Введите дату рождения — здесь же посчитается число даты рождения, ваш персональный год и знак зодиака.
          </p>

          <form className="calc__form" onSubmit={submit} noValidate>
            <label htmlFor="bd" className="calc__label">
              Дата рождения
            </label>
            <div className={`calc__field${error ? " is-error" : ""}`}>
              <input
                id="bd"
                ref={text}
                className="calc__input"
                type="text"
                inputMode="numeric"
                autoComplete="bday"
                placeholder="ДД.ММ.ГГГГ"
                maxLength={10}
                enterKeyHint="go"
                value={value}
                aria-invalid={!!error}
                aria-describedby="bd-hint"
                onChange={(e) => {
                  const v = e.target.value;
                  setValue(/^\d{4}-\d{2}-\d{2}$/.test(v) ? v.split("-").reverse().join(".") : maskDate(v));
                  if (error) setError(null);
                }}
              />
              <span className="calc__picker">
                <input
                  ref={native}
                  type="date"
                  min="1900-01-01"
                  aria-label="Выбрать дату в календаре"
                  onClick={(e) => {
                    const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void };
                    try {
                      el.showPicker?.();
                    } catch {
                      /* старые браузеры откроют календарь сами */
                    }
                  }}
                  onChange={(e) => e.target.value && calc(e.target.value, true)}
                />
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4.5 6.5h15v13h-15zM4.5 10.5h15M8.5 4v4M15.5 4v4" />
                  <path d={SPARKLE} transform="translate(9 12.2) scale(0.25)" className="calc__picker-star" />
                </svg>
              </span>
            </div>
            <p id="bd-hint" className={`calc__hint${error ? " is-error" : ""}`} role={error ? "alert" : undefined}>
              {error ?? "Например, 15.08.1987 — или выберите дату в календаре"}
            </p>
            <div className="calc__actions">
              <SubmitBtn>Узнать своё число</SubmitBtn>
            </div>
            <p className="calc__privacy">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 10.5V8a5 5 0 0 1 10 0v2.5M5.5 10.5h13v10h-13z" />
              </svg>
              Дата не отправляется и не сохраняется
            </p>
          </form>
        </div>

        <div className="rv">
        <div ref={results} className={`calc__out${res ? " has-result" : ""}`}>
          <div className="calc__flash" key={run} aria-hidden="true">
            {run > 0 && (
              <>
                <i className="calc__ring" />
                <svg viewBox="0 0 24 24" className="calc__burst">
                  <path d={SPARKLE} />
                </svg>
              </>
            )}
          </div>
          <div className="medals">
            <div className="medal medal--main">
              <div className="medal__disc">
                <span className="medal__orbit" aria-hidden="true" />
                {res ? <Roll value={res.birth.value} run={run} /> : <span className="medal__empty" aria-hidden="true" />}
              </div>
              <p className="medal__label">Число даты рождения</p>
            </div>
            <div className="medal">
              <div className="medal__disc">
                <span className="medal__orbit" aria-hidden="true" />
                {res ? <Roll value={res.year.value} run={run} /> : <span className="medal__empty" aria-hidden="true" />}
              </div>
              <p className="medal__label">
                Персональный год{year ? `\u00a0·\u00a0${res ? res.yearNum : year}` : ""}
              </p>

            </div>
            <div className="medal">
              <div className="medal__disc">
                <span className="medal__orbit" aria-hidden="true" />
                {res ? (
                  <svg key={`z${run}`} viewBox="0 0 24 24" className="medal__sign" aria-hidden="true">
                    <path d={ZODIAC[res.sign.id]} pathLength={1} />
                  </svg>
                ) : (
                  <span className="medal__empty" aria-hidden="true" />
                )}
              </div>
              <p className="medal__label">Знак зодиака</p>
              {res && (
                <span key={`n${run}`} className="medal__name">
                  {res.sign.name}
                </span>
              )}
            </div>
          </div>
          {res && (
            <div className="chains" key={`c${run}`}>
              <Chain label="Число даты рождения" r={res.birth} />
              <Chain label={`Персональный год\u00a0·\u00a0${res.yearNum}`} r={res.year} delay={4} />
            </div>
          )}
          <p className="calc__note">
            Это только число. Что оно значит именно для вас, я расскажу на расчёте.
          </p>
          {hasBooking && res && (
            <div className="calc__cta">
              <Btn href="#zapis">Записаться на расчёт</Btn>
            </div>
          )}
          <p className="sr-only" aria-live="polite">
            {announce}
          </p>
        </div>
        </div>
      </div>
    </section>
  );
}
