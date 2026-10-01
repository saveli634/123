import { Phone } from "lucide-react";
import { site, whatsapp } from "@/data/site.config";
import { WhatsAppIcon } from "@/components/shared/icons";

/** Постоянная нижняя панель на телефоне: «Позвонить» и «WhatsApp», 56 px, с учётом safe-area. */
export function StickyActionBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-px border-t border-line bg-line pb-[env(safe-area-inset-bottom)] lg:hidden">
      <a href={`tel:${site.phone.tel}`} className="display flex h-14 items-center justify-center gap-2 bg-accent text-[1.05rem] text-accent-ink active:scale-[0.98]">
        <Phone aria-hidden="true" className="size-5" />
        Позвонить
      </a>
      <a href={whatsapp()} target="_blank" rel="noopener" className="display flex h-14 items-center justify-center gap-2 bg-surface text-[1.05rem] active:scale-[0.98]">
        <WhatsAppIcon className="size-5" />
        WhatsApp
      </a>
    </div>
  );
}
