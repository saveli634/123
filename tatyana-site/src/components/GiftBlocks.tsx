import { pageHref } from "@/data/pages";
import { channels, hasBooking } from "@/data/site.config";
import { photos } from "@/data/photos";
import { BookCover } from "./HomeBlocks";
import { SphereIcon } from "./Spheres";
import { Btn, Eyebrow } from "./ui";

/** Для кого подарок — её слова из голосовых (сообщения 4 и 5) и пункты из списка расчётов */
const WHO = [
  {
    t: "Для себя",
    d: "Чтобы лучше знать себя: свои способности, таланты, профессию, которая подходит, где лучше зарабатывать деньги.",
    icon: "M12 3.5l2.2 5.1 5.3.4-4 3.5 1.2 5.3L12 15l-4.7 2.8 1.2-5.3-4-3.5 5.3-.4z",
  },
  {
    t: "Для мужа",
    d: "Для чего вы встретились со своим партнёром, совместимость партнёров — и к этому в подарок песня или стихи.",
    icon: "M9 14.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9zM15 18.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z",
  },
  {
    t: "Для детей",
    d: "Какие виды спорта или творчества подходят ребёнку; что нужно передать своим детям, а чему они пришли нас научить.",
    icon: "M12 4.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM7 20l2-7.5h6L17 20M9.5 12.5 6 10M14.5 12.5 18 10",
  },
];

export function ForWhom() {
  return (
    <section className="who section" aria-labelledby="who-title">
      <div className="wrap">
        <header className="who__head rv">
          <Eyebrow>Кому</Eyebrow>
          <h2 id="who-title" className="h2">
            Для себя, для мужа, <em>для детей</em>
          </h2>
        </header>
        <ul className="who__list">
          {WHO.map((w, i) => (
            <li key={w.t} className="who__card rv" style={{ ["--i" as string]: i }}>
              <span className="who__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d={w.icon} />
                </svg>
              </span>
              <h3 className="who__t">{w.t}</h3>
              <p className="who__d">{w.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Книги о человеке: «Кто я», «Для чего я здесь» — её примеры названий */
export function Books() {
  return (
    <section className="books section" aria-labelledby="books-title">
      <div className="wrap books__grid">
        <div className="books__shelf rv" aria-hidden="true">
          <BookCover title="Кто я" tone="violet" />
          <BookCover title="Для чего я здесь" tone="gold" />
        </div>
        <div className="books__copy rv">
          <Eyebrow>Книга</Eyebrow>
          <h2 id="books-title" className="h2">
            «Кто я», <em>«Для чего я здесь»</em>
          </h2>
          <p className="books__text">
            Натальную карту или нумерологические расчёты я могу оформить в такой книжке, в альбоме — например, с названием «Кто я» или «Для чего я здесь».
          </p>
          <p className="books__text">И в то же время к ней можно добавить музыкальное поздравление.</p>
          <p className="books__note">Обложки — пример оформления.</p>
        </div>
      </div>
    </section>
  );
}

/** Видеоролики с фотографиями под песню — сами ролики не публикуются (на них люди), только описание */
export function VideoNote() {
  return (
    <section className="vnote section" aria-labelledby="vnote-title">
      <div className="wrap">
        <div className="vnote__card rv">
          {photos.sad && (
            <figure className="vnote__photo">
              <img src={photos.sad} alt="Анна в жёлтом платье у цветущего куста" width="960" height="960" loading="lazy" decoding="async" />
            </figure>
          )}
          <div className="vnote__copy">
            <Eyebrow>Видеоролик</Eyebrow>
            <h2 id="vnote-title" className="h2">
              Ролик с фотографиями <em>под песню</em>
            </h2>
            <p className="vnote__text">
              К расчёту или карте в подарок я могу сделать видеоролик с фотографиями под песню, либо просто написать песню, либо стихи.
            </p>
            <p className="vnote__quote">Все ролики — под авторские песни, написанные под личные истории.</p>
            <ul className="vnote__chips">
              <li>
                <SphereIcon id="pesnya" size={18} />
                <a href={pageHref("pesni")}>Песни</a>
              </li>
              <li>
                <SphereIcon id="slovo" size={18} />
                <a href={pageHref("stihi")}>Стихи</a>
              </li>
            </ul>
            {hasBooking && (
              <Btn href={channels[0].href} external={channels[0].id !== "phone"}>
                Заказать подарок
              </Btn>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
