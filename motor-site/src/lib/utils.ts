import { clsx, type ClassValue } from "clsx";

/**
 * cn() из shadcn/ui. Вёрстка почти не использует утилиты Tailwind, поэтому без tailwind-merge
 * (минус 27 КБ скриптов на телефоне); конфликтующие классы не передаём.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
