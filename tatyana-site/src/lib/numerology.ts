/**
 * Подсчёт чисел по дате рождения. Всё считается в браузере, ничего никуда не отправляется.
 * Схема (уточнить у Татьяны, см. README):
 * — число даты рождения: сумма всех цифр даты, сворачиваем до однозначного; 11, 22 и 33 не сворачиваем;
 * — персональный год: цифры дня + месяца + текущего года, сворачиваем так же;
 * — знак зодиака по стандартным (западным) границам.
 */

export interface BirthDate {
  d: number;
  m: number;
  y: number;
}

export const MASTER = [11, 22, 33];

const digits = (s: string) => s.replace(/\D/g, "").split("").map(Number);
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const pad = (n: number) => String(n).padStart(2, "0");

/** Цепочка свёртки: [36, 9] или [38, 11]. Первый элемент — исходная сумма. */
export function reduceChain(n: number): number[] {
  const chain = [n];
  while (n > 9 && !MASTER.includes(n)) {
    n = sum(digits(String(n)));
    chain.push(n);
  }
  return chain;
}

export interface NumberResult {
  /** Цифры, которые складываются */
  digits: number[];
  /** Сумма и шаги свёртки */
  chain: number[];
  value: number;
}

export function birthNumber(b: BirthDate): NumberResult {
  const ds = digits(pad(b.d) + pad(b.m) + String(b.y));
  const chain = reduceChain(sum(ds));
  return { digits: ds, chain, value: chain[chain.length - 1] };
}

export function personalYear(b: BirthDate, year: number): NumberResult {
  const ds = digits(pad(b.d) + pad(b.m) + String(year));
  const chain = reduceChain(sum(ds));
  return { digits: ds, chain, value: chain[chain.length - 1] };
}

export type SignId =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

export interface Sign {
  id: SignId;
  name: string;
  /** Первый день знака: [месяц, день] */
  from: [number, number];
}

/** Порядок — по кругу, начиная с Овна. Границы стандартные (западная традиция). */
export const SIGNS: Sign[] = [
  { id: "aries", name: "Овен", from: [3, 21] },
  { id: "taurus", name: "Телец", from: [4, 20] },
  { id: "gemini", name: "Близнецы", from: [5, 21] },
  { id: "cancer", name: "Рак", from: [6, 21] },
  { id: "leo", name: "Лев", from: [7, 23] },
  { id: "virgo", name: "Дева", from: [8, 23] },
  { id: "libra", name: "Весы", from: [9, 23] },
  { id: "scorpio", name: "Скорпион", from: [10, 23] },
  { id: "sagittarius", name: "Стрелец", from: [11, 22] },
  { id: "capricorn", name: "Козерог", from: [12, 22] },
  { id: "aquarius", name: "Водолей", from: [1, 20] },
  { id: "pisces", name: "Рыбы", from: [2, 19] },
];

export function zodiac(b: BirthDate): Sign {
  const key = b.m * 100 + b.d;
  // Знак — последний, чья дата начала не позже даты рождения (с переходом через Новый год).
  let best = SIGNS.find((s) => s.id === "capricorn")!;
  let bestKey = -1;
  for (const s of SIGNS) {
    const k = s.from[0] * 100 + s.from[1];
    if (k <= key && k > bestKey) {
      best = s;
      bestKey = k;
    }
  }
  return best;
}

export function daysInMonth(m: number, y: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export type ParseResult = { ok: true; date: BirthDate } | { ok: false; reason: "empty" | "incomplete" | "invalid" | "future" | "old" };

/** Принимает ДД.ММ.ГГГГ (точки, слэши, дефисы, пробелы) и ГГГГ-ММ-ДД (из input type="date"). */
export function parseDate(raw: string, today = new Date()): ParseResult {
  const s = raw.trim();
  if (!s) return { ok: false, reason: "empty" };
  let d: number, m: number, y: number;
  let iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    y = +iso[1];
    m = +iso[2];
    d = +iso[3];
  } else {
    const parts = s.split(/[.\-/\s]+/).filter(Boolean);
    if (parts.length === 1 && /^\d{8}$/.test(parts[0])) {
      d = +parts[0].slice(0, 2);
      m = +parts[0].slice(2, 4);
      y = +parts[0].slice(4);
    } else if (parts.length === 3 && parts[2].length === 4) {
      d = +parts[0];
      m = +parts[1];
      y = +parts[2];
    } else return { ok: false, reason: "incomplete" };
  }
  if (!(m >= 1 && m <= 12 && d >= 1 && y >= 1 && d <= daysInMonth(m, y))) return { ok: false, reason: "invalid" };
  if (y < 1900) return { ok: false, reason: "old" };
  const t = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  if (y * 10000 + m * 100 + d > t) return { ok: false, reason: "future" };
  return { ok: true, date: { d, m, y } };
}

/** Маска ввода: оставляет цифры и расставляет точки — 15081987 → 15.08.1987 */
export function maskDate(raw: string) {
  const ds = raw.replace(/\D/g, "").slice(0, 8);
  if (ds.length <= 2) return ds;
  if (ds.length <= 4) return `${ds.slice(0, 2)}.${ds.slice(2)}`;
  return `${ds.slice(0, 2)}.${ds.slice(2, 4)}.${ds.slice(4)}`;
}

export const toIso = (b: BirthDate) => `${b.y}-${pad(b.m)}-${pad(b.d)}`;
export const toRu = (b: BirthDate) => `${pad(b.d)}.${pad(b.m)}.${b.y}`;
