import { pageHref, PAGES, nextPage, type PageId } from "@/data/pages";
import { sphere, sphereOfPage, type SphereId } from "@/data/spheres";
import { photos } from "@/data/photos";
import { fullName } from "@/data/site.config";
import { Planet } from "./Spheres";
import { SPARKLE } from "./glyphs";
import { Btn, Eyebrow } from "./ui";

/** Четыре сферы — карточки-входы на страницы (тексты — её слова, источники в README) */
const CARDS: { id: SphereId; title: string; text: string; more: string }[] = [
  {
    id: "karta",
    title: "Натальная карта",
    text: "Показывает, зачем мы родились на этой планете Земля, какие в нас заложены качества, таланты, способности, характер.",
    more: "Как это работает",
  },
  {
    id: "chislo",
    title: "Нумерология",
    text: "23 расчёта по дате рождения — от персонального года до финансового кода. Своё число можно узнать прямо здесь.",
    more: "Узнать своё число",
  },
  {
    id: "slovo",
    title: "Стихи",
    text: "Стихи к праздникам и для близких — некоторые из них звучат в моих роликах.",
    more: "Читать стихи",
  },
  {
    id: "pesnya",
    title: "Авторские песни",
    text: "Песни, написанные под личные истории: папе, маме, бабушке, мужу, коллегам. Их можно послушать здесь.",
    more: "Слушать",
  },
];

export function SphereCards() {
  return (
    <section className="spc section" aria-labelledby="spc-title">
      <div className="wrap">
        <header className="spc__head rv">
          <Eyebrow>Одно небо</Eyebrow>
          <h2 id="spc-title" className="h2">
            Карта, число, <em>слово и песня</em>
          </h2>
          <p className="spc__lead">Астрология, нумерология и творчество — стихи и песни — в одном месте.</p>
        </header>
        <div className="spc__orbit" aria-hidden="true">
          <i />
        </div>
        <ul className="spc__list">
          {CARDS.map((c, i) => {
            const s = sphere(c.id);
            return (
              <li key={c.id} className="spc__item rv" style={{ ["--i" as string]: i, ["--pc" as string]: s.color }}>
                <a href={s.href} className="spcard">
                  <Planet id={c.id} className="spcard__planet" />
                  <span className="spcard__sphere">{s.label}</span>
                  <span className="spcard__title">{c.title}</span>
                  <span className="spcard__text">{c.text}</span>
                  <span className="spcard__more">
                    {c.more}
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 12h13M13 6.5 18.5 12 13 17.5" />
                    </svg>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** «Обо мне»: фото и коротко — кто она и чем занимается */
export function About() {
  return (
    <section className="about section" aria-labelledby="about-title">
      <div className="wrap about__grid">
        <figure className="about__photo rv">
          <span className="about__arch">
            {photos.kuvshin && <img src={photos.kuvshin} alt={`${fullName} в жёлтом платье рядом с большим медным кувшином`} width="960" height="960" loading="lazy" decoding="async" />}
          </span>
          <span className="about__ring" aria-hidden="true" />
          <svg className="about__spark" viewBox="0 0 24 24" aria-hidden="true">
            <path d={SPARKLE} />
          </svg>
        </figure>
        <div className="about__copy rv">
          <Eyebrow>Обо мне</Eyebrow>
          <h2 id="about-title" className="h2">
            Меня зовут <em>{fullName}</em>
          </h2>
          <p className="about__text">
            Я делаю нумерологические расчёты по дате рождения и составляю натальные карты. А ещё пишу стихи и авторские песни, написанные под личные истории.
          </p>
          <p className="about__text">
            Мне хочется, чтобы всё это было в одном месте: и астрология, и нумерология, и творчество — стихи и песни.
          </p>
          <div className="about__actions">
            <Btn href={pageHref("podarki")} variant="gold">
              Подарок на день рождения
            </Btn>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Краткий рассказ о подарке на главной — со ссылкой на страницу «Подарки» */
export function GiftTeaser() {
  const steps = [
    { n: "01", t: "Расчёт или натальная карта" },
    { n: "02", t: "Оформление в книжке, в альбоме" },
    { n: "03", t: "Песня, стихи или видеоролик под песню" },
  ];
  return (
    <section className="gteaser section" aria-labelledby="gteaser-title">
      <div className="wrap gteaser__grid">
        <div className="gteaser__copy rv">
          <Eyebrow>Подарок</Eyebrow>
          <h2 id="gteaser-title" className="h2">
            Подарок <em>на день рождения</em>
          </h2>
          <p className="gteaser__lead">Для себя, для мужа, для детей — книга о человеке и музыкальное поздравление к ней.</p>
          <ol className="gteaser__steps">
            {steps.map((s) => (
              <li key={s.n}>
                <span className="gteaser__n">{s.n}</span>
                {s.t}
              </li>
            ))}
          </ol>
          <Btn href={pageHref("podarki")}>Как устроен подарок</Btn>
        </div>
        <div className="gteaser__books rv" aria-hidden="true">
          <BookCover title="Кто я" tone="violet" />
          <BookCover title="Для чего я здесь" tone="gold" />
        </div>
      </div>
    </section>
  );
}

/** Обложка книги — нарисована CSS: корешок, золотое тиснение, колесо карты */
export function BookCover({ title, tone }: { title: string; tone: "violet" | "gold" }) {
  return (
    <div className={`bookc bookc--${tone}`}>
      <div className="bookc__cover">
        <svg className="bookc__wheel" viewBox="-50 -50 100 100">
          <circle r="44" />
          <circle r="33" />
          <circle r="12" />
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i * Math.PI) / 6;
            return <line key={i} x1={Math.cos(a) * 12} y1={Math.sin(a) * 12} x2={Math.cos(a) * 44} y2={Math.sin(a) * 44} />;
          })}
        </svg>
        <span className="bookc__title">{title}</span>
        <span className="bookc__name">{fullName}</span>
      </div>
      <span className="bookc__pages" />
    </div>
  );
}

/** Переход на следующую страницу — внизу каждой внутренней страницы */
export function NextPage({ from }: { from: PageId }) {
  const to = nextPage(from);
  const s = sphereOfPage(to);
  return (
    <section className="nextp" aria-label="Следующая страница">
      <div className="wrap">
        <a href={pageHref(to)} className="nextp__link rv" style={{ ["--pc" as string]: s?.color ?? "#E6CF9A" }}>
          <span className="nextp__label">Дальше</span>
          <span className="nextp__title">
            {s ? <Planet id={s.id} className="planet--sm" /> : <SparkPlanet />}
            {PAGES[to].nav}
          </span>
          <svg className="nextp__arrow" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12h13M13 6.5 18.5 12 13 17.5" />
          </svg>
        </a>
      </div>
    </section>
  );
}

function SparkPlanet() {
  return (
    <span className="planet planet--sm" style={{ ["--pc" as string]: "#E6CF9A" }} aria-hidden="true">
      <svg className="sicon" viewBox="0 0 24 24">
        <path d={SPARKLE} fill="currentColor" />
      </svg>
    </span>
  );
}
