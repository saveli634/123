import { brand } from "@/content/site";
import { Img } from "@/components/Img";
import { ArrowIcon, Button } from "@/components/ui/button";
import { typo } from "@/lib/utils";

/** Финальный шаг: крупная типографика, одно фото, одна кнопка. */
export function Booking() {
  return (
    <section
      id="booking"
      tabIndex={-1}
      aria-labelledby="booking-title"
      className="on-dark relative overflow-hidden bg-ink text-ivory"
    >
      <div className="grid lg:min-h-[48rem] lg:grid-cols-2">
        <div className="container-x section-y flex flex-col justify-center lg:mr-0 lg:max-w-none lg:pr-16">
          <p className="eyebrow reveal text-sand/70">Онлайн-запись</p>
          <h2 id="booking-title" className="font-display mt-6 text-[clamp(3.2rem,8vw,7.4rem)] leading-[0.92]">
            <span className="line-mask">
              <span>Время</span>
            </span>
            <span className="line-mask">
              <span style={{ ["--delay" as string]: "110ms" }}>
                <em className="pl-[0.7em] text-sand">для себя</em>
              </span>
            </span>
          </h2>
          <p className="reveal mt-8 max-w-sm text-ivory/70" style={{ ["--delay" as string]: "200ms" }}>
            {typo("Выберите услугу, мастера и удобное время онлайн — а мы позаботимся об остальном.")}
          </p>
          <div className="reveal mt-10" style={{ ["--delay" as string]: "280ms" }}>
            <Button asChild variant="light" size="lg" className="w-full sm:w-auto sm:px-12">
              <a href={brand.bookingUrl} target="_blank" rel="noopener">
                Записаться
                <ArrowIcon />
              </a>
            </Button>
            <p className="mt-5 text-xs text-ivory/45">Запись через сервис zapis.kz</p>
          </div>
        </div>

        <div className="img-reveal relative h-[70svh] min-h-[26rem] lg:h-auto">
          <Img
            name="06_hair_back"
            alt="Длинные волосы, уложенные крупными волнами"
            sizes="(min-width: 1024px) 50vw, 100vw"
            position="50% 40%"
            className="absolute inset-0 h-full"
          />
        </div>
      </div>
    </section>
  );
}
