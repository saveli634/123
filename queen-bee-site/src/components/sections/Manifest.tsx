import { useRef } from "react";
import { manifest } from "@/content/text";
import { HexMark } from "@/components/shared/Bee";
import { useScrollFx } from "@/lib/scrollFx";
import { smooth } from "@/lib/utils";

/** Манифест (подпись 001): слова проявляются по мере прокрутки, акцент — курсив бордо. */
export function Manifest() {
  const para = useRef<HTMLParagraphElement>(null);
  const words = manifest.text.split(" ");
  const accent = new Set(manifest.accent);
  const N = words.length;

  useScrollFx(para, (p, el) => {
    const t = smooth(0.1, 0.5, p) * (N + 2);
    el.querySelectorAll<HTMLElement>(".manifest-word").forEach((w, i) => {
      w.style.setProperty("--w", Math.min(1, Math.max(0, (t - i) / 2.2)).toFixed(3));
    });
  });

  return (
    <section className="tone-sand section-y relative overflow-hidden" data-tone="sand" aria-labelledby="manifest-label">
      <div aria-hidden="true" className="honeycomb" style={{ opacity: 0.035 }} />
      <div className="container-x grid-12 relative gap-y-10">
        <div className="col-span-12 md:col-span-3">
          <p id="manifest-label" className="label eyebrow eyebrow-gold reveal text-espresso">
            01 — {manifest.label}
          </p>
        </div>
        <p
          ref={para}
          className="manifest-words display prose-qb col-span-12 text-[clamp(2.05rem,4.7vw,4.6rem)] leading-[1.08] text-espresso md:col-span-9"
        >
          {words.map((w, i) => (
            <span key={i}>
              <span className={w.split("\u00A0").some((x) => accent.has(x)) ? "manifest-word it text-bordo" : "manifest-word"}>{w}</span>
              {i < N - 1 ? " " : ""}
            </span>
          ))}
        </p>
        <div className="col-span-12 flex items-center justify-end gap-4 md:col-start-4 md:col-span-9">
          <span aria-hidden="true" className="reveal h-px flex-1 bg-gold/70" />
          <HexMark className="reveal size-10" />
        </div>
      </div>
    </section>
  );
}
