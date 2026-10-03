import { useEffect, useRef } from "react";
import { Bee } from "@/components/shared/Bee";

/** Золотая нить-прогресс страницы: справа на компьютере (с пчелой на конце), сверху на телефоне. */
export function Thread() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      ref.current?.style.setProperty("--progress", (max > 0 ? window.scrollY / max : 0).toFixed(4));
    };
    const on = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
  return (
    <div ref={ref} className="thread" aria-hidden="true">
      <span className="thread-fill" />
      <span className="thread-bee">
        <Bee className="h-full w-full" />
      </span>
    </div>
  );
}
