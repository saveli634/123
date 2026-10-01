/** Заявка: проверка, маска телефона, текст для WhatsApp, отправка на вебхук (если настроен). */
export interface Lead {
  name: string;
  phone: string;
  service: string;
  car?: string;
  comment?: string;
  consent: boolean;
}

/**
 * Номер → «7» + 10 цифр. Учитываем, как номер реально вводят:
 * «+7 …» (уже с кодом из маски), «8 7…», «7 7…» (11 цифр) и просто «701…» (10 цифр без кода).
 */
export function phoneDigits(raw: string) {
  const trimmed = raw.trim();
  let d = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("+7")) d = d.slice(1);
  else if (d[0] === "8") d = d.slice(1); // «8» — междугородний префикс, местные номера с неё не начинаются
  else if (d.length === 11 && d[0] === "7") d = d.slice(1);
  if (d[0] === "8") d = d.slice(1); // «+7» уже в поле, а пользователь по привычке начал с «8»
  return "7" + d.slice(0, 10);
}

/** +7 (7XX) XXX-XX-XX */
export function formatPhone(v: string) {
  const d = phoneDigits(v).slice(1);
  let out = "+7";
  if (d.length) out += " (" + d.slice(0, 3);
  if (d.length >= 3) out += ")";
  if (d.length > 3) out += " " + d.slice(3, 6);
  if (d.length > 6) out += "-" + d.slice(6, 8);
  if (d.length > 8) out += "-" + d.slice(8, 10);
  return out;
}

export function validate(l: Lead) {
  const e: Partial<Record<keyof Lead, string>> = {};
  if (l.name.trim().length < 2) e.name = "Введите имя";
  if (phoneDigits(l.phone).length !== 11) e.phone = "Введите корректный номер телефона";
  if (!l.service) e.service = "Выберите услугу";
  if (!l.consent) e.consent = "Нужно согласие на обработку данных";
  return e;
}

export function leadText(l: Lead) {
  return [
    "Здравствуйте! Хочу записаться.",
    `Имя: ${l.name.trim()}`,
    `Телефон: ${formatPhone(l.phone)}`,
    `Услуга: ${l.service}`,
    l.car?.trim() ? `Автомобиль: ${l.car.trim()}` : "",
    l.comment?.trim() ? `Комментарий: ${l.comment.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Адрес приёма заявок задаётся при сборке: VITE_LEAD_WEBHOOK_URL. Без него — только WhatsApp. */
export const webhookUrl: string | undefined = import.meta.env.VITE_LEAD_WEBHOOK_URL || undefined;

export async function sendLead(l: Lead) {
  if (!webhookUrl) return false;
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...l, phone: formatPhone(l.phone), source: "u-greka-site" }),
  });
  return res.ok;
}
