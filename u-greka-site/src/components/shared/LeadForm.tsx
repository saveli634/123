import { useId, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { serviceOptions } from "@/data/services";
import { whatsapp } from "@/data/site.config";
import { formatPhone, leadText, sendLead, validate, webhookUrl, type Lead } from "@/lib/lead";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "./icons";

type Status = "idle" | "sending" | "sent" | "whatsapp" | "error";

/**
 * Форма заявки. Если настроен VITE_LEAD_WEBHOOK_URL — заявка уходит на сервер.
 * Если нет (или сервер недоступен) — собираем текст и открываем WhatsApp: форма никогда не тупик.
 */
export function LeadForm({ defaultService, tone = "dark" }: { defaultService?: string; tone?: "dark" | "paper" }) {
  const id = useId();
  const [lead, setLead] = useState<Lead>({ name: "", phone: "", service: defaultService ?? "", car: "", comment: "", consent: false });
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({});
  const [status, setStatus] = useState<Status>("idle");
  const set = <K extends keyof Lead>(k: K, v: Lead[K]) => setLead((l) => ({ ...l, [k]: v }));
  const paper = tone === "paper";
  const field = cn(
    "h-12 w-full rounded-[3px] border px-3.5 text-[1rem] outline-none transition-colors",
    paper
      ? "border-paper-ink/20 bg-white text-paper-ink placeholder:text-paper-muted/70 focus:border-paper-ink"
      : "border-line bg-surface-2 text-text placeholder:text-muted/70 focus:border-accent",
  );
  const label = cn("mb-1.5 block text-sm", paper ? "text-paper-muted" : "text-muted");
  const err = "mt-1.5 text-sm text-[#ff8a7a]";
  const errPaper = "mt-1.5 text-sm text-[#a3271a]";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(lead);
    setErrors(found);
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(`${id}-${first}`)?.focus();
      return;
    }
    if (webhookUrl) {
      setStatus("sending");
      try {
        if (await sendLead(lead)) return setStatus("sent");
      } catch {
        /* упадём в WhatsApp ниже */
      }
      return setStatus("error");
    }
    window.open(whatsapp(leadText(lead)), "_blank", "noopener");
    setStatus("whatsapp");
  };

  if (status === "sent" || status === "whatsapp") {
    return (
      <div role="status" className={cn("rounded-[3px] border p-6", paper ? "border-paper-ink/20" : "border-line bg-surface")}>
        <Check aria-hidden="true" className="size-7 text-accent" />
        <p className="display mt-4 text-2xl">{status === "sent" ? "Заявка отправлена. Мы перезвоним вам." : "Заявка готова"}</p>
        {status === "whatsapp" && (
          <p className={cn("mt-3", paper ? "text-paper-muted" : "text-muted")}>
            Мы открыли WhatsApp с текстом заявки — нажмите «Отправить». Если окно не открылось,{" "}
            <a className="text-accent underline underline-offset-4" href={whatsapp(leadText(lead))} target="_blank" rel="noopener">
              откройте WhatsApp по ссылке
            </a>
            .
          </p>
        )}
      </div>
    );
  }

  const E = ({ k }: { k: keyof Lead }) =>
    errors[k] ? (
      <p id={`${id}-${k}-err`} className={paper ? errPaper : err}>
        {errors[k]}
      </p>
    ) : null;
  const describedBy = (k: keyof Lead) => (errors[k] ? `${id}-${k}-err` : undefined);

  return (
    <form noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor={`${id}-name`} className={label}>Имя</label>
        <input id={`${id}-name`} name="name" autoComplete="given-name" className={field} value={lead.name}
          onChange={(e) => set("name", e.target.value)} aria-invalid={!!errors.name} aria-describedby={describedBy("name")} />
        <E k="name" />
      </div>
      <div>
        <label htmlFor={`${id}-phone`} className={label}>Телефон</label>
        <input id={`${id}-phone`} name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+7 (7__) ___-__-__"
          className={cn(field, "mono")} value={lead.phone} onChange={(e) => set("phone", formatPhone(e.target.value))}
          aria-invalid={!!errors.phone} aria-describedby={describedBy("phone")} />
        <E k="phone" />
      </div>
      <div>
        <label htmlFor={`${id}-service`} className={label}>Услуга</label>
        <select id={`${id}-service`} name="service" className={cn(field, "appearance-none bg-[length:12px] bg-[right_14px_center] bg-no-repeat")}
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%23f6b400' stroke-width='2'/%3E%3C/svg%3E")` }}
          value={lead.service} onChange={(e) => set("service", e.target.value)} aria-invalid={!!errors.service} aria-describedby={describedBy("service")}>
          <option value="">Выберите услугу</option>
          {serviceOptions.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <E k="service" />
      </div>
      <div>
        <label htmlFor={`${id}-car`} className={label}>Марка и модель <span className="opacity-70">(необязательно)</span></label>
        <input id={`${id}-car`} name="car" className={field} placeholder="Например, Prado 95" value={lead.car} onChange={(e) => set("car", e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={`${id}-comment`} className={label}>Комментарий <span className="opacity-70">(необязательно)</span></label>
        <textarea id={`${id}-comment`} name="comment" rows={3} className={cn(field, "h-auto py-3")} value={lead.comment} onChange={(e) => set("comment", e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm">
          <input id={`${id}-consent`} type="checkbox" checked={lead.consent} onChange={(e) => set("consent", e.target.checked)}
            className="mt-0.5 size-5 shrink-0 accent-[#f6b400]" aria-invalid={!!errors.consent} aria-describedby={describedBy("consent")} />
          <span className={paper ? "text-paper-muted" : "text-muted"}>Согласен на обработку персональных данных для обратной связи по заявке</span>
        </label>
        <E k="consent" />
      </div>
      <div aria-live="polite" className="sm:col-span-2">
        {status === "error" && (
          <p className={paper ? errPaper : err}>
            Не удалось отправить заявку.{" "}
            <a className="underline underline-offset-4" href={whatsapp(leadText(lead))} target="_blank" rel="noopener">
              Отправьте её в WhatsApp
            </a>{" "}
            — текст уже заполнен.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center">
        <Button type="submit" size="lg" disabled={status === "sending"} variant={paper ? "dark" : "primary"} className="h-auto min-h-14 w-full px-4 py-3 text-center whitespace-normal sm:w-auto sm:px-7 sm:whitespace-nowrap">
          {webhookUrl ? (status === "sending" ? "Отправляем…" : "Записаться") : (<><WhatsAppIcon className="size-5" />Записаться через WhatsApp</>)}
        </Button>
        {!webhookUrl && (
          <p className={cn("text-sm", paper ? "text-paper-muted" : "text-muted")}>Откроется WhatsApp с заполненным текстом заявки.</p>
        )}
      </div>
    </form>
  );
}
