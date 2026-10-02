import { lazy, Suspense, useEffect, useState } from "react";

// Форма записи (диалог, поля, переключатель модели на Radix) — отдельный файл,
// грузится по первому нажатию «Записаться».
const BookingDialog = lazy(() => import("./BookingDialog"));

export function BookingHost() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (loaded) return;
    const onOpen = () => setLoaded(true);
    window.addEventListener("booking:open", onOpen);
    return () => window.removeEventListener("booking:open", onOpen);
  }, [loaded]);
  if (!loaded) return null;
  return (
    <Suspense fallback={null}>
      <BookingDialog initialOpen />
    </Suspense>
  );
}
