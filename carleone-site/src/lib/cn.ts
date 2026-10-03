/** Склейка классов без лишних пробелов (без зависимостей). */
export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
