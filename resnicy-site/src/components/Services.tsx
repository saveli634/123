import { useEffect, useRef, type ReactNode } from "react";
import { Split } from "./Split";
import { Photo, type PhotoName } from "./Photo";
import { useTilt } from "@/lib/pointer";
import { ScrollTrigger, motionStarted } from "@/lib/motion";
import { Arrow, MagLink } from "./Buttons";

interface CardProps {
  num: string;
  title: string;
  meta: string[];
  children: ReactNode;
  link: { href: string; label: string };
  photo: { name: PhotoName; alt: string; position?: string };
}

/** Карточка услуги: фото с параллаксом внутри кадра, 3D-наклон за курсором и голографическая кромка. */
function Card({ num, title, meta, children, link, photo }: CardProps) {
  const ref = useRef<HTMLElement>(null);
  const img = useRef<HTMLDivElement>(null);
  useTilt(ref, 7);

  useEffect(() => {
    if (!motionStarted() || !img.current || !ref.current) return;
    const st = ScrollTrigger.create({
      trigger: ref.current,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        if (img.current) img.current.style.transform = `translate3d(0,${((self.progress - 0.5) * -12).toFixed(2)}%,0) scale(1.18)`;
      },
    });
    return () => st.kill();
  }, []);

  return (
    <div className="svc-wrap" data-reveal>
      {/* покачивание на телефоне — на обёртке, наклон под пальцем/курсором — на самой карточке */}
      <div className="svc-sway">
      <article className="svc" ref={ref}>
        <span className="svc-holo" aria-hidden="true" />
        <span className="svc-sheen" aria-hidden="true" />
        <div className="svc-media">
          <div className="svc-media-in" ref={img}>
            <Photo name={photo.name} alt={photo.alt} sizes="(min-width: 860px) 46vw, 92vw" position={photo.position} />
          </div>
          <span className="svc-num">{num}</span>
        </div>
        <div className="svc-body">
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
        </div>
      </article>
      </div>
    </div>
  );
}

export function Services() {
  return (
    <section className="services section" id="uslugi" aria-labelledby="svc-title">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow" data-reveal>
            <span className="eyebrow-num">03</span>Услуги
          </p>
          <Split id="svc-title" className="h2" text="Что я *делаю*" />
        </header>
        <div className="svc-grid">
          <Card
            num="01"
            title="Ламинирование ресниц"
            meta={["около 1 часа", "Минск"]}
            link={{ href: "#process", label: "Как проходит процедура" }}
            photo={{ name: "after", alt: "Ресницы после ламинирования: подняты и разделены", position: "50% 55%" }}
          >
            Подбираю валик и выкладываю на него реснички, работаю двумя составами, окрашиваю для насыщенности и завершаю
            ботоксом — маской для питания и увлажнения.
          </Card>
          <Card
            num="02"
            title="Наращивание ресниц"
            meta={["Минск"]}
            link={{ href: "#raboty", label: "Смотреть работы" }}
            photo={{ name: "violet", alt: "Наращенные ресницы в фиолетовом свете", position: "30% 45%" }}
          >
            Наращиваю ресницы — посмотри мои работы в галерее ниже.
          </Card>
        </div>
      </div>
    </section>
  );
}
