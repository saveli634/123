import { useEffect, useId, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { form as t } from "@/content/text";
import { site, waHref, waNumber } from "@/lib/site";
import { Bee } from "./Bee";
import { FillPlate } from "./Fill";
import { useUi } from "./UiContext";

/**
 * Форма записи: имя, телефон, «что хотите сделать» → собирает текст и открывает wa.me. Без сервера.
 */
export function BookingDialog() {
  const { booking, closeBooking } = useUi();
  const id = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wish, setWish] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [sentUrl, setSentUrl] = useState("");

  useEffect(() => {
    if (booking) {
      setWish(booking.wish ?? "");
      setErrors({});
      setSentUrl("");
    }
  }, [booking]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = t.required;
    if (phone.replace(/\D/g, "").length < 10) next.phone = phone.trim() ? t.phoneInvalid : t.required;
    setErrors(next);
    if (next.name || next.phone) {
      document.getElementById(`${id}-${next.name ? "name" : "phone"}`)?.focus();
      return;
    }
    const text = [t.greeting, `${t.name}: ${name.trim()}`, `${t.phone}: ${phone.trim()}`, wish.trim() ? `${t.wish}: ${wish.trim()}` : ""]
      .filter(Boolean)
      .join("\n")
      .replace(/\u00A0|\u2011/g, (c) => (c === "\u2011" ? "-" : " ")); // в сообщении — обычные пробелы и дефисы
    const url = waHref(text);
    if (!url) return;
    setSentUrl(url);
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) window.location.href = url;
  };

  return (
    <Dialog.Root open={!!booking} onOpenChange={(o) => !o && closeBooking()}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-panel" aria-describedby={`${id}-lead`}>
          <div className="relative px-6 pt-8 pb-7 sm:px-10 sm:pt-10 sm:pb-9">
            <Dialog.Close className="label absolute top-5 right-5 min-h-11 min-w-11 cursor-pointer rounded-full text-ink-soft hover:text-espresso" aria-label={t.close}>
              ✕
            </Dialog.Close>
            <Bee className="size-9" />
            <Dialog.Title className="display mt-4 text-[2.6rem] leading-none text-espresso">{t.title}</Dialog.Title>
            <p id={`${id}-lead`} className="mt-3 max-w-[38ch] text-[0.98rem] text-ink-soft">
              {t.lead}
            </p>
            <form className="mt-8 grid gap-6" onSubmit={submit} noValidate>
              <label className="field" htmlFor={`${id}-name`}>
                <span className="label text-ink-soft">{t.name}</span>
                <input
                  id={`${id}-name`}
                  name="name"
                  spellCheck={false}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? `${id}-name-err` : undefined}
                />
                {errors.name && (
                  <span id={`${id}-name-err`} className="text-[0.85rem] text-bordo" aria-live="polite">
                    {errors.name}
                  </span>
                )}
              </label>
              <label className="field" htmlFor={`${id}-phone`}>
                <span className="label text-ink-soft">{t.phone}</span>
                <input
                  id={`${id}-phone`}
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? `${id}-phone-err` : undefined}
                />
                {errors.phone && (
                  <span id={`${id}-phone-err`} className="text-[0.85rem] text-bordo" aria-live="polite">
                    {errors.phone}
                  </span>
                )}
              </label>
              <label className="field" htmlFor={`${id}-wish`}>
                <span className="label text-ink-soft">{t.wish}</span>
                {site.services.length > 0 && (
                  <span className="flex flex-wrap gap-2 pt-1">
                    {site.services.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => setWish(s.name)}
                        className="rounded-full border border-gold/70 px-3 py-1.5 text-[0.85rem] text-espresso hover:bg-gold/10"
                        aria-pressed={wish === s.name}
                      >
                        {s.name}
                      </button>
                    ))}
                  </span>
                )}
                <textarea id={`${id}-wish`} name="wish" rows={3} value={wish} placeholder={t.wishHint} onChange={(e) => setWish(e.target.value)} />
              </label>
              {waNumber ? (
                <button type="submit" className="btn btn-primary mt-2 w-full">
                  <span className="btn-label">{t.submit}</span>
                </button>
              ) : (
                <div className="grid gap-3">
                  <button type="submit" className="btn btn-primary mt-2 w-full" disabled aria-disabled="true" style={{ opacity: 0.55 }}>
                    <span className="btn-label">{t.submit}</span>
                  </button>
                  <FillPlate field="WhatsApp — номер, на который придёт заявка" />
                </div>
              )}
              {sentUrl && (
                <p className="text-[0.92rem] text-ink-soft" role="status">
                  Если WhatsApp не открылся,{" "}
                  <a href={sentUrl} target="_blank" rel="noopener noreferrer" className="link-thread text-bordo">
                    откройте сообщение по ссылке
                  </a>
                  .
                </p>
              )}
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
