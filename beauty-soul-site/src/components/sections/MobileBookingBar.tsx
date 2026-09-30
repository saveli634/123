import { useEffect, useState } from "react";
import { brand } from "@/content/site";
import { ArrowIcon, Button } from "@/components/ui/button";
import { useScrolledPast } from "@/lib/useScrollY";
import { cn } from "@/lib/utils";

/**
 * Липкая кнопка записи на телефоне. Появляется после первого экрана
 * и прячется, когда на экране уже есть блок записи или подвал — чтобы не дублировать CTA.
 */
export function MobileBookingBar() {
  const pastHero = useScrolledPast(typeof window === "undefined" ? 600 : window.innerHeight * 0.9);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    const targets = ["#booking", "footer"]
      .map((s) => document.querySelector(s))
      .filter(Boolean) as Element[];
    const visible = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      setCtaVisible(visible.size > 0);
    });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  const show = pastHero && !ctaVisible;

  return (
    <div
      aria-hidden={!show}
      inert={!show}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden",
        "bg-gradient-to-t from-ivory via-ivory/90 to-transparent",
        "transition-[transform,opacity] duration-500 ease-(--ease-out-soft)",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
      )}
    >
      <Button asChild size="lg" className="w-full shadow-[0_12px_30px_-12px_rgb(23_19_15/0.5)]">
        <a href={brand.bookingUrl} target="_blank" rel="noopener">
          Записаться онлайн
          <ArrowIcon />
        </a>
      </Button>
    </div>
  );
}
