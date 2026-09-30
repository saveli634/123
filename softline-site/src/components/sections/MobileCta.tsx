import { useEffect, useState } from "react";
import { Phone } from "lucide-react";
import { brand, whatsapp } from "@/content/catalog";
import { Button } from "@/components/ui/button";
import { useScrolledPast } from "@/lib/useScrollY";
import { cn } from "@/lib/utils";

/** Липкая панель на телефоне: подобрать диван + звонок. Прячется у блока контактов и в подвале. */
export function MobileCta() {
  const pastHero = useScrolledPast(typeof window === "undefined" ? 700 : window.innerHeight * 0.85);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const targets = ["#contacts", "footer"].map((s) => document.querySelector(s)).filter(Boolean) as Element[];
    const visible = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      setHidden(visible.size > 0);
    });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  const show = pastHero && !hidden;

  return (
    <div
      aria-hidden={!show}
      inert={!show}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 flex gap-2 bg-ivory/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-1px_0_rgb(18_17_16/0.08)] backdrop-blur lg:hidden",
        "transition-[transform,opacity] duration-500 ease-(--ease-out-soft)",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
      )}
    >
      <Button asChild variant="accent" size="lg" className="flex-1">
        <a href={whatsapp("Здравствуйте! Помогите, пожалуйста, подобрать диван.")} target="_blank" rel="noopener">
          Подобрать диван
        </a>
      </Button>
      <Button asChild variant="outline" size="lg" className="px-0 text-graphite">
        <a href={`tel:${brand.phones[0].tel}`} aria-label={`Позвонить: ${brand.phones[0].display}`} className="w-14">
          <Phone aria-hidden="true" className="size-5" strokeWidth={1.5} />
        </a>
      </Button>
    </div>
  );
}
