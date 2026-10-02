import { useEffect, useRef, useState, type FormEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Arrow } from "./Glyphs";
import { Fill } from "./Fill";
import { FILL, FORM } from "@/content/copy";
import { waHref } from "@/lib/links";

/**
 * Запись: имя, телефон, модель авто → готовое сообщение в WhatsApp (wa.me/…?text=…).
 * Без сервера и без сбора данных — сайт только открывает WhatsApp с текстом.
 */
type Errors = Partial<Record<"name" | "phone" | "model", string>>;

export function BookingDialog() {
  const [open, setOpen] = useState(false);
  const [model, setModel] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [preview, setPreview] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const onOpen = () => {
      setErrors({});
      setPreview("");
      setOpen(true);
    };
    window.addEventListener("booking:open", onOpen);
    return () => window.removeEventListener("booking:open", onOpen);
  }, []);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const other = String(fd.get("model_other") || "").trim();
    const car = model === "other" ? other : model;
    const next: Errors = {};
    if (name.length < 2) next.name = FORM.required;
    if (phone.replace(/\D/g, "").length < 10) next.phone = phone ? FORM.phoneInvalid : FORM.required;
    if (!car) next.model = FORM.required;
    setErrors(next);
    const firstBad = (["name", "phone", "model"] as const).find((k) => next[k]);
    if (firstBad) {
      const sel = firstBad === "model" ? (model === "other" ? "[name='model_other']" : "[data-slot='toggle-group-item']") : `[name='${firstBad}']`;
      formRef.current?.querySelector<HTMLElement>(sel)?.focus();
      return;
    }
    const text = [FORM.greeting, `${FORM.nameLine}: ${name}`, `${FORM.phoneLine}: ${phone}`, `${FORM.modelLine}: ${car}`].join("\n");
    const href = waHref(text);
    if (!href) {
      setPreview(text);
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent closeLabel={FORM.close} aria-describedby="book-desc">
        <DialogHeader>
          <DialogTitle className="display">{FORM.title}</DialogTitle>
          <DialogDescription id="book-desc">{FORM.lead}</DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={submit} noValidate>
          <FieldGroup>
            <Field data-invalid={errors.name ? "" : undefined}>
              <FieldLabel htmlFor="bk-name">{FORM.name}</FieldLabel>
              <Input id="bk-name" name="name" autoComplete="name" placeholder={FORM.namePlaceholder} aria-invalid={!!errors.name} aria-describedby={errors.name ? "bk-name-err" : undefined} />
              <FieldError id="bk-name-err">{errors.name}</FieldError>
            </Field>
            <Field data-invalid={errors.phone ? "" : undefined}>
              <FieldLabel htmlFor="bk-phone">{FORM.phone}</FieldLabel>
              <Input id="bk-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder={FORM.phonePlaceholder} aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "bk-phone-err" : undefined} />
              <FieldError id="bk-phone-err">{errors.phone}</FieldError>
            </Field>
            <FieldSet data-invalid={errors.model ? "" : undefined}>
              <FieldLegend>{FORM.model}</FieldLegend>
              <ToggleGroup type="single" value={model} onValueChange={(v) => setModel(v)} aria-label={FORM.model}>
                {FORM.models.map((m) => (
                  <ToggleGroupItem key={m} value={m} aria-invalid={!!errors.model && !model}>
                    {m}
                  </ToggleGroupItem>
                ))}
                <ToggleGroupItem value="other">{FORM.modelOther}</ToggleGroupItem>
              </ToggleGroup>
              {model === "other" && (
                <Input name="model_other" autoComplete="off" placeholder={FORM.modelPlaceholder} aria-label={FORM.model} aria-invalid={!!errors.model} className="field-gap" />
              )}
              <FieldError>{errors.model}</FieldError>
            </FieldSet>
          </FieldGroup>
          {preview && (
            <div className="bk-preview" aria-live="polite">
              <Fill what={FILL.whatsapp} />
              <FieldDescription>{FORM.noWhatsapp}</FieldDescription>
              <pre>{preview}</pre>
            </div>
          )}
          <Button type="submit" size="lg" className="bk-submit" data-cursor="link">
            <span className="btn-t">{FORM.submit}</span>
            <Arrow className="btn-arrow" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
