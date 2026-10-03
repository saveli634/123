import { Fragment, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** *слово* → акцент (курсив Playfair, золото). */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("*") && p.endsWith("*") ? <em key={i}>{p.slice(1, -1)}</em> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  );
}

/**
 * Заголовок, который проявляется построчно из-под маски.
 * Строки задаются в текстах явно (массив) — так разметка одинакова на сервере и в браузере.
 * Прячется только при классе .js на <html> (без JS всё видно сразу).
 */
export function Lines({
  lines,
  as: Tag = "h2",
  className,
  reveal = true,
  start = 0,
  id,
}: {
  lines: string[];
  as?: ElementType;
  className?: string;
  reveal?: boolean;
  start?: number;
  id?: string;
}) {
  return (
    <Tag className={className} data-reveal={reveal ? "" : undefined} id={id}>
      {lines.map((l, i) => (
        <span className="ln" key={i}>
          <span style={{ "--i": i + start } as CSSProperties}>
            <Rich text={l} />
          </span>
        </span>
      ))}
    </Tag>
  );
}

/** Метка раздела: «— УСЛУГИ». */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("kicker t-label", className)}>{children}</p>;
}

/** Кавычки по языку: «ёлочки» для русского, “лапки” для английского. */
export const q = (text: string, lang: "ru" | "en") => (lang === "en" ? `“${text}”` : `«${text}»`);
