import { LION_CUT_D, LION_D, LION_H, LION_PAD, LION_W } from "@/generated/lion";

/** Векторный лев (из logo/lion.png, scripts/lion.mjs) — определяется в документе один раз. */
export function LionDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <defs>
        <symbol id="lion" viewBox={`0 0 ${LION_W} ${LION_H}`}>
          <path d={LION_D} fillRule="evenodd" />
        </symbol>
        <symbol id="lion-cut" viewBox={`${-LION_PAD} ${-LION_PAD} ${LION_W + LION_PAD * 2} ${LION_H + LION_PAD * 2}`}>
          <path d={LION_CUT_D} />
        </symbol>
      </defs>
    </svg>
  );
}

/** Лев цветом текста (currentColor). Декоративный: подпись даёт соседний текст. */
export function Lion({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LION_W} ${LION_H}`}
      className={className}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      focusable="false"
    >
      <use href="#lion" xlinkHref="#lion" />
    </svg>
  );
}
