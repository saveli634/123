import { createElement, Fragment, type ReactNode } from "react";

/**
 * Заголовок с построчным проявлением. На сервере слова уже в разметке (текст виден без JS);
 * в браузере fx.ts раздаёт словам номер строки (--l), и строки поднимаются по очереди.
 * Слова, склеенные неразрывным пробелом, не разрываются.
 */
export function Lines({ as = "h2", text, className = "", children, id }: { as?: string; text: string; className?: string; children?: ReactNode; id?: string }) {
  const words = text.split(/ +/);
  return createElement(
    as,
    { className: `lines ${className}`, "data-lines": "", "data-reveal": "", id },
    words.map((w, i) => (
      <Fragment key={i}>
        {i > 0 ? " " : null}
        <span className="lw">
          <span className="lw__i">{w}</span>
        </span>
      </Fragment>
    )),
    children,
  );
}
