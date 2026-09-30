import { CreditCard, MapPin, Store, Truck, type LucideIcon } from "lucide-react";
import { typo } from "@/lib/utils";

/** Только подтверждённые материалами преимущества — без гарантий и цифр. */
const facts: { icon: LucideIcon; title: string; note: string }[] = [
  { icon: Truck, title: "Доставка по Казахстану", note: "В города по всей стране" },
  { icon: MapPin, title: "По Алматы — бесплатно", note: "Для моделей, где это указано" },
  { icon: CreditCard, title: "Рассрочка Kaspi", note: "Условия уточняйте у менеджера" },
  { icon: Store, title: "Шоурум в ТЦ ADEM 1", note: "3 этаж, оранжевый сектор" },
];

export function TrustStrip() {
  return (
    <section id="intro" tabIndex={-1} aria-labelledby="intro-title" className="bg-ivory pt-20 pb-16 lg:pt-28 lg:pb-20">
      <div className="container-x">
        <h2
          id="intro-title"
          className="display reveal max-w-5xl text-[clamp(1.9rem,3.6vw,3.3rem)] leading-[1.1] text-graphite"
        >
          {typo("Современные диваны для гостиной. Выбирайте вживую — ")}
          <span className="serif text-terracotta">{typo("в шоуруме на 3 этаже")}</span>
          {typo(" ТЦ ADEM 1.")}
        </h2>

        <ul className="mt-14 grid border-t border-graphite/12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {facts.map(({ icon: Icon, title, note }, i) => (
            <li
              key={title}
              className="reveal flex gap-4 border-b border-graphite/12 py-6 sm:pr-6 lg:border-b-0 lg:border-l lg:py-2 lg:pl-6 lg:first:border-l-0 lg:first:pl-0"
              style={{ ["--delay" as string]: `${i * 90}ms` }}
            >
              <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-terracotta" strokeWidth={1.25} />
              <div>
                <p className="font-medium text-graphite">{title}</p>
                <p className="mt-1 text-sm text-muted">{note}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
