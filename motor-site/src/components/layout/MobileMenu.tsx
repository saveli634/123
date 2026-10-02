import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Cta } from "@/components/shared/Cta";
import { NAV, UI } from "@/content/copy";

/** Меню на телефоне и планшете — во весь экран. */
export default function MobileMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dlg-menu" closeLabel={UI.close}>
        <DialogTitle className="sr-only">{UI.menu}</DialogTitle>
        <DialogDescription className="sr-only">{UI.nav}</DialogDescription>
        <nav className="menu-nav" aria-label={UI.nav}>
          {NAV.map((n, i) => (
            <a key={n.id} href={`#${n.id}`} className="display" onClick={() => onOpenChange(false)} style={{ ["--i" as string]: i }}>
              <span className="num">{String(i + 1).padStart(2, "0")}</span>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="menu-cta">
          <Cta kind="call" magnetic={false} />
          <Cta kind="whatsapp" variant="outline" magnetic={false} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
