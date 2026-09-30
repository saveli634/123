import { useEffect, useRef } from "react";
import type { PortfolioItem } from "@/content/site";
import { Img } from "@/components/Img";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/** Просмотр фото на весь экран: стрелки, ← → с клавиатуры, Esc, счётчик. */
export function Lightbox({
  items,
  index,
  onIndexChange,
  labelFor,
}: {
  items: PortfolioItem[];
  index: number | null;
  onIndexChange: (i: number | null) => void;
  labelFor: (item: PortfolioItem) => string;
}) {
  const open = index !== null && index < items.length;
  const item = open ? items[index] : null;

  // Диалог управляется снаружи (без Trigger), поэтому возврат фокуса делаем сами.
  const returnFocus = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  if (open && !wasOpen.current && typeof document !== "undefined") {
    returnFocus.current = document.activeElement as HTMLElement | null;
  }
  wasOpen.current = open;

  const step = (d: number) => {
    if (index === null) return;
    onIndexChange((index + d + items.length) % items.length);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onIndexChange(null)}>
      <DialogContent
        className="on-dark inset-0 flex flex-col text-ivory"
        onCloseAutoFocus={(e) => {
          if (returnFocus.current?.isConnected) {
            e.preventDefault();
            returnFocus.current.focus();
          }
        }}
      >
        {item && (
          <>
            <div className="container-x flex h-(--header-h) shrink-0 items-center justify-between">
              <p className="text-sm text-ivory/60 tabular-nums">
                {index! + 1} / {items.length}
              </p>
              <DialogClose asChild>
                <button
                  type="button"
                  className="-mr-2 inline-flex size-11 items-center justify-center rounded-full"
                  aria-label="Закрыть просмотр"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" stroke="currentColor" strokeWidth="1.2">
                    <path d="M5 5l14 14M19 5L5 19" />
                  </svg>
                </button>
              </DialogClose>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20">
              <div key={item.image} className="h-full w-full animate-[fade-in_400ms_var(--ease-out-soft)]">
                <Img
                  name={item.image}
                  alt={item.alt}
                  sizes="90vw"
                  className="h-full"
                  placeholder={false}
                  imgClassName="object-contain"
                />
              </div>

              {items.length > 1 && (
                <>
                  <NavButton dir="prev" onClick={() => step(-1)} />
                  <NavButton dir="next" onClick={() => step(1)} />
                </>
              )}
            </div>

            <div className="container-x shrink-0 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <DialogTitle className="eyebrow text-sand/80">{labelFor(item)}</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-ivory/70">{item.alt}</DialogDescription>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function NavButton({ dir, onClick }: { dir: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === "prev" ? "Предыдущее фото" : "Следующее фото"}
      className={`absolute top-1/2 inline-flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-ink/40 text-ivory backdrop-blur transition-[background-color,transform] duration-200 hover:bg-ink/70 active:scale-95 ${
        dir === "prev" ? "left-2 sm:left-6" : "right-2 sm:right-6"
      }`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className={`size-5 ${dir === "prev" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M4 12h15M13 6l6 6-6 6" />
      </svg>
    </button>
  );
}
