import { useEffect, useRef, useState, type FormEvent } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useLang } from "@/lib/lang";
import { digits, telHref, waHref } from "@/lib/links";
import { cn } from "@/lib/cn";
import { Btn, Fill } from "@/components/Cta";
import { Lion } from "@/components/Lion";
import { IconChat, IconClose, IconPhone } from "@/components/Icons";

/*
 * Форма записи грузится отдельным кусочком скрипта — только когда она нужна (Radix Dialog не
 * утяжеляет первую загрузку страницы).
 */
/** Форма «Записаться»: собирает текст и открывает https://wa.me/…?text=… — без сервера. */
export function BookingDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t, lang } = useLang();
  const f = t.form;
  const [err, setErr] = useState<{ name?: string; phone?: string }>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const wa = waHref();
  const tel = telHref();

  useEffect(() => {
    if (!open) setErr({});
  }, [open]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const car = String(data.get("car") || "").trim();
    const problem = String(data.get("problem") || "").trim();
    const next: typeof err = {};
    if (!name) next.name = f.errName;
    if (digits(phone).length < 10) next.phone = f.errPhone;
    setErr(next);
    if (next.name || next.phone) {
      (e.currentTarget.elements.namedItem(next.name ? "name" : "phone") as HTMLInputElement | null)?.focus();
      return;
    }
    const text = [
      f.msgHello,
      `${f.msgName}: ${name}`,
      `${f.msgPhone}: ${phone}`,
      car && `${f.msgCar}: ${car}`,
      problem && `${f.msgProblem}: ${problem}`,
    ]
      .filter(Boolean)
      .join("\n")
      .replace(/\u00a0/g, " "); // неразрывные пробелы из типографа в сообщении не нужны
    const href = waHref(text);
    if (!href) return;
    window.open(href, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog"
          data-lenis-prevent=""
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            nameRef.current?.focus();
          }}
          lang={lang}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Lion className="h-9 w-9 text-gold" />
              <Dialog.Title className="font-display text-3xl font-semibold md:text-4xl">{f.title}</Dialog.Title>
            </div>
            <Dialog.Close
              className="grid size-10 place-items-center rounded-full border border-[var(--line)] text-cream/80 transition-colors hover:border-gold hover:text-gold"
              aria-label={t.a11y.close}
            >
              <IconClose className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="t-body mt-4 text-[0.95rem]">{f.lead}</Dialog.Description>
          <form className="mt-7 flex flex-col gap-5" noValidate onSubmit={submit}>
            <div className="field" data-invalid={err.name ? "" : undefined}>
              <label htmlFor="bk-name">{f.name}</label>
              <input
                ref={nameRef}
                id="bk-name"
                name="name"
                autoComplete="name"
                placeholder={f.namePh}
                aria-invalid={!!err.name}
                aria-describedby={err.name ? "bk-name-err" : undefined}
              />
              {err.name && (
                <p id="bk-name-err" className="field-err">
                  {err.name}
                </p>
              )}
            </div>
            <div className="field" data-invalid={err.phone ? "" : undefined}>
              <label htmlFor="bk-phone">{f.phone}</label>
              <input
                id="bk-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder={f.phonePh}
                aria-invalid={!!err.phone}
                aria-describedby={err.phone ? "bk-phone-err" : undefined}
              />
              {err.phone && (
                <p id="bk-phone-err" className="field-err">
                  {err.phone}
                </p>
              )}
            </div>
            <div className="field">
              <label htmlFor="bk-car">{f.car}</label>
              <input id="bk-car" name="car" autoComplete="off" placeholder={f.carPh} />
            </div>
            <div className="field">
              <label htmlFor="bk-problem">{f.problem}</label>
              <textarea id="bk-problem" name="problem" placeholder={f.problemPh} rows={3} />
            </div>
            {wa ? (
              <Btn type="submit" variant="gold" icon={<IconChat />} className="mt-2 w-full" magnetic={false}>
                {f.submit}
              </Btn>
            ) : (
              <div className={cn("mt-2 flex flex-col gap-3")}>
                <p className="t-body text-[0.9rem] text-cream/70">{f.noWhatsapp}</p>
                <Fill field="whatsapp" label={f.submit} className="w-full" />
                {tel && (
                  <Btn href={tel} variant="line" icon={<IconPhone />} className="w-full">
                    {t.cta.call}
                  </Btn>
                )}
              </div>
            )}
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
