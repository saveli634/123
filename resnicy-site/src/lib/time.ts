import { useEffect, useState } from "react";

/** Текущее время в Минске «21:04» — только в браузере (в готовой разметке его нет). */
export function useMinskTime() {
  const [time, setTime] = useState("");
  useEffect(() => {
    let fmt: Intl.DateTimeFormat;
    try {
      fmt = new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Minsk", hour: "2-digit", minute: "2-digit" });
    } catch {
      return;
    }
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 20000);
    return () => window.clearInterval(id);
  }, []);
  return time;
}
