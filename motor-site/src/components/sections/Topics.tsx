import { TOPICS, FILL } from "@/content/copy";
import { Img } from "@/components/shared/Img";
import { Lines } from "@/components/shared/Lines";
import { Play, SecLabel } from "@/components/shared/Glyphs";
import { Fill } from "@/components/shared/Fill";
import { useCardFx } from "./Services";
import { field } from "@/lib/env";
import type { Topic } from "@/content/copy";

/** Разборы: темы роликов (только заголовки). Ссылки — из source_url.txt, иначе — Instagram цеха. */
function TopicCard({ t, i }: { t: Topic; i: number }) {
  const ref = useCardFx<HTMLLIElement>(6);
  const href = t.url || field("instagram");
  const n = String(i + 1).padStart(2, "0");
  const body = (
    <>
      <span className="topic-cover" aria-hidden="true">
        <Img name={t.cover} alt="" sizes="(min-width: 1024px) 30vw, 72vw" />
        <span className="ph-fx" />
      </span>
      <span className="card-glow" aria-hidden="true" />
      <span className="topic-meta">
        <span className="topic-play" aria-hidden="true">
          <Play />
        </span>
        <span className="label">
          {TOPICS.reel} <span className="num">{n}</span>
        </span>
      </span>
      <span className="topic-title">{t.title}</span>
    </>
  );
  return (
    <li ref={ref} className="card topic rv up" style={{ ["--d" as string]: `${i * 70}ms` }}>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="topic-link" data-cursor="link">
          {body}
        </a>
      ) : (
        <div className="topic-link">{body}</div>
      )}
    </li>
  );
}

export function Topics() {
  const missing = TOPICS.items.some((t) => !t.url);
  return (
    <section id="razbory" className="sec topics" aria-labelledby="topics-title">
      <div className="wrap">
        <SecLabel n={6} total={9}>
          {TOPICS.label}
        </SecLabel>
        <div className="topics-head">
          <Lines id="topics-title" className="display h-sec" lines={[TOPICS.label]} />
          {missing && <Fill what={FILL.reels} />}
        </div>
        <ol className="topics-grid">
          {TOPICS.items.map((t, i) => (
            <TopicCard key={t.title} t={t} i={i} />
          ))}
        </ol>
      </div>
    </section>
  );
}
