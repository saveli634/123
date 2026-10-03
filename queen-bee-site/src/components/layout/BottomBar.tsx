import { BookButton, CallButton } from "@/components/shared/Buttons";

/** Нижняя панель телефона «Позвонить / Записаться». Под неё у body есть отступ — контент не перекрывается. */
export function BottomBar() {
  return (
    <div className="bottom-bar" role="region" aria-label="Быстрая запись">
      <CallButton size="sm" className="w-full" />
      <BookButton size="sm" className="w-full" />
    </div>
  );
}
