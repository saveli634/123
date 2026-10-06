import { useRef, type ReactNode } from "react";
import { useTilt } from "@/lib/pointer";
import { Arrow, MagLink } from "./Buttons";

function Card({
  num,
  title,
  meta,
  children,
  link,
  art,
}: {
  num: string;
  title: string;
  meta: string[];
  children: ReactNode;
  link: { href: string; label: string };
  art: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  useTilt(ref);
  return (
    <div className="svc-wrap" data-reveal>
      <article className="svc" ref={ref}>
        <span className="svc-holo" aria-hidden="true" />
        <span className="svc-sheen" aria-hidden="true" />
        <div className="svc-art" aria-hidden="true">
          {art}
        </div>
        <p className="svc-num">{num}</p>
        <h3 className="svc-title">{title}</h3>
        <ul className="svc-meta">
          {meta.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        <p className="svc-text">{children}</p>
        <MagLink href={link.href} variant="ghost" className="btn--sm" icon={<Arrow />}>
          {link.label}
        </MagLink>
      </article>
    </div>
  );
}

/** Веер ресниц для карточки (декор). lifted — подняты и подкручены (ламинирование), иначе длинные и густые. */
function FanArt({ lifted }: { lifted: boolean }) {
  const n = lifted ? 13 : 17;
  const paths = Array.from({ length: n }, (_, i) => {
    const u = i / (n - 1);
    const c = u - 0.5;
    const x = 20 + u * 160;
    const y = 92 - Math.sin(Math.PI * u) * 16;
    const len = lifted ? 34 + Math.sin(Math.PI * Math.pow(u, 1.4)) * 30 : 40 + Math.sin(Math.PI * Math.pow(u, 1.3)) * 42;
    const a = -Math.PI / 2 + c * (lifted ? 1.7 : 1.3);
    const curl = lifted ? c * 1.4 + 0.1 : c * 0.6;
    const mx = x + Math.cos(a) * len * 0.55;
    const my = y + Math.sin(a) * len * 0.55;
    const ex = x + Math.cos(a + curl) * len;
    const ey = y + Math.sin(a + curl) * len;
    return `M${x.toFixed(1)} ${y.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
  });
  return (
    <svg viewBox="0 0 200 110">
      <path d="M14 96 C 60 70, 140 70, 186 92" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d={paths.join("")} fill="none" stroke="currentColor" strokeWidth={lifted ? 1.5 : 1.2} strokeLinecap="round" />
    </svg>
  );
}

export function Services() {
  return (
    <section className="services section" id="uslugi" aria-labelledby="svc-title">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow" data-reveal>
            Услуги
          </p>
          <h2 id="svc-title" className="h2" data-reveal>
            Что я <em>делаю</em>
          </h2>
        </header>
        <div className="svc-grid">
          <Card
            num="01"
            title="Ламинирование ресниц"
            meta={["около 1 часа", "Минск"]}
            link={{ href: "#process", label: "Как проходит процедура" }}
            art={<FanArt lifted />}
          >
            Подбираю валик и выкладываю на него реснички, работаю двумя составами, окрашиваю для насыщенности и завершаю ботоксом — маской
            для питания и увлажнения.
          </Card>
          <Card
            num="02"
            title="Наращивание ресниц"
            meta={["Минск"]}
            link={{ href: "#raboty", label: "Смотреть работы" }}
            art={<FanArt lifted={false} />}
          >
            Наращиваю ресницы — посмотри мои работы в галерее ниже.
          </Card>
        </div>
      </div>
    </section>
  );
}
