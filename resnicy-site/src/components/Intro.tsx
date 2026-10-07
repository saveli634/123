import { useEffect } from "react";
import { BrandMark } from "./Brand";

/**
 * Интро ≤ 1,5 с: чёрный экран, название «пишется» штрихом, затем «веки» раскрываются в первый экран.
 * Вся анимация — в CSS и играет по умолчанию (даже в предпросмотре файла без скриптов);
 * скрипт в index.html ставит .intro-skip, если интро уже видели в этой вкладке.
 * Пропускается при «уменьшить движение» и при повторном заходе в сессии.
 */
export function Intro() {
  useEffect(() => {
    const d = document.documentElement;
    if (d.classList.contains("intro-skip")) return;
    const t = window.setTimeout(() => d.classList.add("intro-done"), 1550);
    return () => window.clearTimeout(t);
  }, []);
  return (
    <div className="intro" aria-hidden="true">
      <div className="intro-lid intro-lid--top" />
      <div className="intro-lid intro-lid--bottom" />
      <div className="intro-mark">
        <BrandMark decorative className="intro-brand" />
      </div>
    </div>
  );
}
