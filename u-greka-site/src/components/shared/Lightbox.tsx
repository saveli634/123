import { useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Img } from "./Img";
import { useUi } from "./UiContext";

/** Просмотр фото: свайп на телефоне, ← → на клавиатуре, Esc, фокус-ловушка и возврат фокуса. */
export function Lightbox() {
  const { lightbox, setLightboxIndex } = useUi();
  const open = !!lightbox;
  const photos = lightbox?.photos ?? [];
  const index = lightbox?.index ?? 0;
  const photo = photos[index];
  const count = photos.length;
  const step = (d: number) => setLightboxIndex((index + d + count) % count);

  const returnFocus = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  if (open && !wasOpen.current && typeof document !== "undefined") returnFocus.current = document.activeElement as HTMLElement;
  wasOpen.current = open;

  useEffect(() => {
    if (!open || count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Свайп
  const touch = useRef<number | null>(null);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && setLightboxIndex(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/95 data-[state=closed]:animate-[fade-out_180ms] data-[state=open]:animate-[fade-in_240ms_var(--ease-out)]" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex flex-col outline-none data-[state=open]:animate-[fade-in_240ms_var(--ease-out)]"
          onCloseAutoFocus={(e) => {
            if (returnFocus.current?.isConnected) {
              e.preventDefault();
              returnFocus.current.focus();
            }
          }}
          onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touch.current === null || count < 2) return;
            const dx = e.changedTouches[0].clientX - touch.current;
            if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
            touch.current = null;
          }}
        >
          {photo && (
            <>
              <div className="container-x flex h-(--header-h) shrink-0 items-center justify-between">
                <p className="mono text-sm text-muted">
                  {index + 1} / {count}
                </p>
                <Dialog.Close asChild>
                  <button type="button" aria-label="Закрыть просмотр" className="-mr-2 inline-flex size-12 items-center justify-center rounded-[3px] hover:bg-surface-2">
                    <X aria-hidden="true" className="size-6" />
                  </button>
                </Dialog.Close>
              </div>
              <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 sm:px-20">
                <div key={photo.name} className="h-full w-full animate-[fade-in_260ms_var(--ease-out)] [&_.photo]:object-contain [&_.photo]:bg-transparent! [&_.photo]:bg-contain">
                  <Img name={photo.name} alt={photo.alt} sizes="92vw" position="50% 50%" />
                </div>
                {count > 1 && (
                  <>
                    <button type="button" onClick={() => step(-1)} aria-label="Предыдущее фото" className="absolute top-1/2 left-2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-[3px] border border-line bg-surface/90 hover:border-accent sm:inline-flex">
                      <ChevronLeft aria-hidden="true" className="size-5" />
                    </button>
                    <button type="button" onClick={() => step(1)} aria-label="Следующее фото" className="absolute top-1/2 right-2 hidden size-12 -translate-y-1/2 items-center justify-center rounded-[3px] border border-line bg-surface/90 hover:border-accent sm:inline-flex">
                      <ChevronRight aria-hidden="true" className="size-5" />
                    </button>
                  </>
                )}
              </div>
              <div className="container-x shrink-0 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                <Dialog.Title className="mono text-sm text-accent">{photo.tag ?? "Фото работы"}</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted">{photo.alt}</Dialog.Description>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
