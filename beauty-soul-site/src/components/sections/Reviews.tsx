import { brand, reviews, type ImageName, type Review } from "@/content/site";
import { Img } from "@/components/Img";
import { ArrowIcon } from "@/components/ui/button";
import { typo } from "@/lib/utils";

/**
 * Отзывы и доверие. Выдуманных отзывов и цифр здесь нет:
 * пока салон не передал настоящие отзывы, раздел опирается на то,
 * что можно проверить, — реальные работы, салон и команду.
 */
const proofs: { title: string; text: string; image: ImageName; alt: string }[] = [
  {
    title: "Настоящие работы",
    text: "Все фото на этом сайте — из нашего Instagram: настоящие гости и настоящий результат, без стоковых картинок.",
    image: "10_nails_detail",
    alt: "Светлый маникюр квадратной формы",
  },
  {
    title: "Настоящий салон",
    text: "То, что вы видите на снимках, — наш зал на Аксае. Приходите и убедитесь сами.",
    image: "13_interior",
    alt: "Зал салона с подсвеченными зеркалами",
  },
  {
    title: "Настоящая команда",
    text: "Работы наших мастеров — в ленте @beautysoulkz: смотрите, выбирайте, сохраняйте идеи.",
    image: "08_makeup_profile",
    alt: "Вечерний макияж и локоны",
  },
];

export function Reviews() {
  return (
    <section id="reviews" tabIndex={-1} aria-labelledby="reviews-title" className="section-y bg-sand/45">
      <div className="container-x">
        <div className="max-w-3xl">
          <p className="eyebrow reveal text-mocha">Отзывы</p>
          <h2
            id="reviews-title"
            className="font-display mt-5 text-[clamp(2.4rem,5.5vw,4.8rem)] leading-[1] text-ink"
          >
            <span className="line-mask">
              <span>Лучший отзыв —</span>
            </span>
            <span className="line-mask">
              <span style={{ ["--delay" as string]: "100ms" }}>
                <em className="text-mocha">это результат</em>
              </span>
            </span>
          </h2>
        </div>

        {reviews.length > 0 && (
          <ul className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r, i) => (
              <ReviewCard key={i} review={r} />
            ))}
          </ul>
        )}

        <ul className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8 lg:mt-20">
          {proofs.map((p, i) => (
            <li key={p.title} className="reveal" style={{ ["--delay" as string]: `${i * 100}ms` }}>
              <div className="grid grid-cols-[5.5rem_1fr] gap-5 md:block">
                <Img
                  name={p.image}
                  alt={p.alt}
                  sizes="(min-width: 768px) 12rem, 6rem"
                  className="aspect-[3/4] md:w-40"
                />
                <div className="md:mt-8">
                  <h3 className="font-display text-[1.9rem] leading-tight text-ink">{p.title}</h3>
                  <p className="mt-3 max-w-xs text-[0.95rem] text-ink/70">{typo(p.text)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <a
          href={brand.instagramUrl}
          target="_blank"
          rel="noopener"
          className="group/link reveal mt-16 inline-flex h-11 items-center gap-3 text-[0.75rem] font-semibold tracking-[0.18em] text-ink uppercase"
        >
          <span className="link-line">Смотреть работы в Instagram</span>
          <ArrowIcon className="size-3.5" />
        </a>
      </div>
    </section>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  return (
    <li className="reveal">
      <figure className="border-t border-ink/15 pt-8">
        <blockquote className="font-display text-[1.6rem] leading-snug text-ink">
          «{typo(review.text)}»
        </blockquote>
        <figcaption className="mt-6 text-sm text-mocha">
          {review.author}
          {review.service && <span className="text-taupe"> · {review.service}</span>}
        </figcaption>
      </figure>
    </li>
  );
}
