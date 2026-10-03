import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/** Глобальный диалог записи; wish — предзаполненное «что хотите сделать» (например, из списка услуг). */
interface Ui {
  booking: { wish?: string } | null;
  openBooking: (wish?: string) => void;
  closeBooking: () => void;
}

const Ctx = createContext<Ui | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [booking, setBooking] = useState<Ui["booking"]>(null);
  const openBooking = useCallback((wish?: string) => setBooking({ wish }), []);
  const closeBooking = useCallback(() => setBooking(null), []);
  const value = useMemo(() => ({ booking, openBooking, closeBooking }), [booking, openBooking, closeBooking]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUi() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useUi outside UiProvider");
  return ctx;
}
