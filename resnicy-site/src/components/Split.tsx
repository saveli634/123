import type { CSSProperties, ElementType } from "react";

/**
 * Заголовок, который проявляется по словам (каждое слово выезжает из-под «маски»).
 * Слова в *звёздочках* — курсив-акцент. Без скриптов текст виден сразу.
 */
export function Split({ text, as: Tag = "h2", className = "", id }: { text: string; as?: ElementType; className?: string; id?: string }) {
  const words: { w: string; em: boolean }[] = [];
  let em = false;
  for (const raw of text.split(" ")) {
    let w = raw;
    const open = w.startsWith("*");
    if (open) w = w.slice(1);
    const close = w.endsWith("*");
    if (close) w = w.slice(0, -1);
    if (open) em = true;
    words.push({ w, em });
    if (close) em = false;
  }
  return (
    <Tag className={`split ${className}`} id={id} data-reveal="split">
      {words.map((x, i) => (
        <span key={i}>
          <span className="w">
            <span className="wi" style={{ "--wi": i } as CSSProperties}>
              {x.em ? <em>{x.w}</em> : x.w}
            </span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
