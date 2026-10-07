import type { PageId } from "@/data/pages";
import { hasBooking } from "@/data/site.config";
import { Hero } from "./Hero";
import { BirthSky } from "./BirthSky";
import { Marquee } from "./Marquee";
import { OrbitCards } from "./OrbitCards";
import { NumberCalc } from "./NumberCalc";
import { Constellations } from "./Constellations";
import { Keys } from "./Keys";
import { Poems } from "./Poems";
import { Songs } from "./Songs";
import { Gift } from "./Gift";
import { PageHero } from "./PageHero";
import { About, GiftTeaser, NextPage, SphereCards } from "./HomeBlocks";
import { Books, ForWhom, VideoNote } from "./GiftBlocks";
import { Btn } from "./ui";

/** Содержимое каждой страницы. Тексты — её слова (источники — в README). */
export function PageContent({ id }: { id: PageId }) {
  const book = hasBooking ? <Btn href="#zapis">Записаться на расчёт</Btn> : null;
  switch (id) {
    case "home":
      return (
        <>
          <Hero />
          <Marquee words={["карта", "число", "слово", "песня"]} />
          <About />
          <SphereCards />
          <GiftTeaser />
        </>
      );
    case "karta":
      return (
        <>
          <PageHero
            page="karta"
            sphereId="karta"
            eyebrow="натальная карта"
            title={
              <>
                Натальная <em>карта</em>
              </>
            }
            lead="Это как инструкция к прибору, которая должна прилагаться в роддоме каждому новорождённому."
          >
            {book}
          </PageHero>
          <BirthSky />
          <Marquee />
          <OrbitCards />
          <Keys />
          <NextPage from="karta" />
        </>
      );
    case "chislo":
      return (
        <>
          <PageHero
            page="chislo"
            sphereId="chislo"
            eyebrow="нумерология"
            title={
              <>
                Нумерологический <em>расчёт</em>
              </>
            }
            lead="По дате рождения: персональный год, финансовый код, предназначение — и ещё двадцать вопросов. Своё число можно узнать прямо здесь."
          >
            {book}
          </PageHero>
          <NumberCalc />
          <Constellations />
          <NextPage from="chislo" />
        </>
      );
    case "stihi":
      return (
        <>
          <PageHero
            page="stihi"
            sphereId="slovo"
            eyebrow="стихи"
            title={<em>Стихи</em>}
            lead="А ещё я пишу стихи — к праздникам и для близких. Некоторые из них звучат в моих роликах в Instagram."
          />
          <Poems />
          <NextPage from="stihi" />
        </>
      );
    case "pesni":
      return (
        <>
          <PageHero
            page="pesni"
            sphereId="pesnya"
            eyebrow="авторские песни"
            title={
              <>
                Авторские <em>песни</em>
              </>
            }
            lead="Песни, написанные под личные истории: папе, маме, бабушке, мужу, коллегам. Стихи и расчёты читаются, а песня должна звучать — здесь её можно послушать."
          />
          <Songs />
          <VideoNote />
          <NextPage from="pesni" />
        </>
      );
    case "podarki":
      return (
        <>
          <PageHero
            page="podarki"
            eyebrow="подарки"
            title={
              <>
                Подарок <em>на день рождения</em>
              </>
            }
            lead="Человек может просто в подарок — либо для себя, либо для мужа, для детей — заказать книгу о себе. И сопроводить её музыкальным поздравлением."
          />
          <ForWhom />
          <Books />
          <Gift />
          <VideoNote />
          <NextPage from="podarki" />
        </>
      );
  }
}
