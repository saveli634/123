/** «Почему ко мне» — шесть причин из её поста. «60 минут» и «1 месяц» — счётчики-барабаны. */

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
  return (
    <section className="reasons section" id="pochemu" aria-labelledby="reasons-title">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow" data-reveal>
            Шесть причин
          </p>
          <h2 id="reasons-title" className="h2" data-reveal>
            Почему <em>ко мне</em>
          </h2>
        </header>
        <ol className="reasons-grid">
          {REASONS.map((r, i) => (
            <li key={r.text} className={`reason ${r.counter ? "reason--count" : ""}`} data-reveal="curtain" style={{ "--d": `${(i % 3) * 90}ms` } as React.CSSProperties}>
              <span className="reason-num">{String(i + 1).padStart(2, "0")}</span>
              {r.counter && <Odometer {...r.counter} />}
              <p className="reason-text">{r.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
