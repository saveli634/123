import { useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { site } from "@/data/site.config";
import { LeadForm } from "./LeadForm";
import { useUi } from "./UiContext";

/** Выдвижная панель заявки: справа на десктопе, снизу на телефоне. */
export function LeadDrawer() {
  const { lead, closeLead } = useUi();
  const open = !!lead;
  const returnFocus = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  if (open && !wasOpen.current && typeof document !== "undefined") returnFocus.current = document.activeElement as HTMLElement;
  wasOpen.current = open;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && closeLead()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-bg/80 data-[state=closed]:animate-[fade-out_200ms] data-[state=open]:animate-[fade-in_240ms_var(--ease-out)]" />
        <Dialog.Content
          onCloseAutoFocus={(e) => {
            if (returnFocus.current?.isConnected) {
              e.preventDefault();
              returnFocus.current.focus();
            }
          }}
          className="fixed inset-x-0 bottom-0 z-50 max-h-[92svh] overflow-y-auto overscroll-contain rounded-t-[6px] border-t-2 border-accent bg-surface outline-none data-[state=closed]:animate-[sheet-out_240ms_var(--ease-out)] data-[state=open]:animate-[sheet-in_320ms_var(--ease-out)] lg:inset-y-0 lg:right-0 lg:left-auto lg:max-h-none lg:w-[min(36rem,94vw)] lg:rounded-none lg:border-t-0 lg:border-l-2 lg:data-[state=closed]:animate-[drawer-out_240ms_var(--ease-out)] lg:data-[state=open]:animate-[drawer-in_320ms_var(--ease-out)]"
        >
          <div className="flex items-start justify-between gap-4 p-5 lg:p-8">
            <div>
              <p className="eyebrow text-accent">Заявка</p>
              <Dialog.Title className="display mt-2 text-[2rem]">Узнать цену и записаться</Dialog.Title>
              <Dialog.Description className="mt-2 text-muted">
                Или позвоните:{" "}
                <a className="mono text-text underline decoration-accent underline-offset-4" href={`tel:${site.phone.tel}`}>
                  {site.phone.display}
                </a>
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label="Закрыть" className="-mt-1 -mr-2 inline-flex size-12 shrink-0 items-center justify-center rounded-[3px] hover:bg-surface-2">
                <X aria-hidden="true" className="size-6" />
              </button>
            </Dialog.Close>
          </div>
          <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:px-8 lg:pb-10">
            {lead && <LeadForm key={lead.service ?? "none"} defaultService={lead.service} />}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
