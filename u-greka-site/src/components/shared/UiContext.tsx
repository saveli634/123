import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Photo } from "@/data/types";

/** Глобальные диалоги: просмотр фото и форма заявки (с предвыбранной услугой). */
interface Ui {
  lightbox: { photos: Photo[]; index: number } | null;
  openLightbox: (photos: Photo[], index: number) => void;
  setLightboxIndex: (i: number | null) => void;
  lead: { service?: string } | null;
  openLead: (service?: string) => void;
  closeLead: () => void;
}

const Ctx = createContext<Ui | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [lightbox, setLightbox] = useState<Ui["lightbox"]>(null);
  const [lead, setLead] = useState<Ui["lead"]>(null);
  const openLightbox = useCallback((photos: Photo[], index: number) => setLightbox({ photos, index }), []);
  const setLightboxIndex = useCallback(
    (i: number | null) => setLightbox((lb) => (i === null || !lb ? null : { ...lb, index: i })),
    [],
  );
  const openLead = useCallback((service?: string) => setLead({ service }), []);
  const closeLead = useCallback(() => setLead(null), []);
  const value = useMemo(
    () => ({ lightbox, openLightbox, setLightboxIndex, lead, openLead, closeLead }),
    [lightbox, openLightbox, setLightboxIndex, lead, openLead, closeLead],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUi() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUi outside UiProvider");
  return ctx;
}
