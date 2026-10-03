/**
 * Кадры из роликов: подписи (alt) и подписи в «Работах».
 * Источники: frames/manifest.csv [кадры] и подписи к роликам (номер в reel).
 * Неразрывные пробелы расставляются при сборке (scripts/typograph.mjs).
 */
import type { Lang } from "./i18n";

export type FrameName =
  | "bike_in_garage"
  | "garage_lift_wide"
  | "lion_plaque_bumper"
  | "radiator_close"
  | "radiator_hand"
  | "radiator_installed"
  | "rav4_on_lift"
  | "underbody_after_1"
  | "underbody_after_2"
  | "underbody_after_3"
  | "underbody_before_1"
  | "underbody_before_2"
  | "valve_body_hand";

type Text = Record<Lang, string>;

/** Описание кадра для alt — по manifest.csv, без лиц и номеров. */
export const ALT: Record<FrameName, Text> = {
  bike_in_garage: {
    ru: "Мотоцикл путешественников в боксе",
    en: "The travellers' motorcycle in the bay",
  },
  garage_lift_wide: {
    ru: "Бокс с подъёмником, Rav4 с открытым капотом",
    en: "The bay with a lift, a Rav4 with its bonnet open",
  },
  lion_plaque_bumper: {
    ru: "Фирменная плашка со львом на бампере",
    en: "The lion plate on the bumper",
  },
  radiator_close: {
    ru: "Радиатор и шланги крупно",
    en: "The cooler and hoses up close",
  },
  radiator_hand: {
    ru: "Радиатор и вентиляторы, рука мастера",
    en: "Radiator and fans, the mechanic's hand",
  },
  radiator_installed: {
    ru: "Дополнительный радиатор охлаждения АКПП установлен",
    en: "The additional transmission cooler installed",
  },
  rav4_on_lift: {
    ru: "Rav4 на подъёмнике, капот открыт, на бампере плашка со львом",
    en: "A Rav4 on the lift, bonnet open, the lion plate on the bumper",
  },
  underbody_after_1: {
    ru: "Стало: арка с белым слоем покрытия",
    en: "After: the arch with a white coating layer",
  },
  underbody_after_2: {
    ru: "Стало: тёмное покрытие",
    en: "After: dark coating",
  },
  underbody_after_3: {
    ru: "Фактура покрытия крупно",
    en: "Coating texture up close",
  },
  underbody_before_1: {
    ru: "Было: ржавая арка и днище",
    en: "Before: a rusty arch and underbody",
  },
  underbody_before_2: {
    ru: "Было: ржавый узел подвески и арка",
    en: "Before: a rusty suspension mount and arch",
  },
  valve_body_hand: {
    ru: "Гидроблок АКПП в руках мастера",
    en: "An automatic transmission valve body in the mechanic's hands",
  },
};

export type WorkItem = {
  frame: FrameName;
  title: Text;
  reel?: string;
  quote?: Text;
};

/** Галерея «Мастерская и команда»: кадр + подпись. reel — номер ролика (ссылка из CONFIG.reels). */
export const WORKS: WorkItem[] = [
  {
    frame: "garage_lift_wide",
    title: { ru: "Бокс с подъёмником", en: "The bay with a lift" }, // [кадры]
  },
  {
    frame: "valve_body_hand",
    title: { ru: "Гидроблок АКПП", en: "Transmission valve body" }, // [кадры]
    quote: { ru: "В руках мастера", en: "In the mechanic's hands" }, // [кадры]
  },
  {
    frame: "rav4_on_lift",
    reel: "007",
    title: { ru: "Rav4 на подъёмнике", en: "A Rav4 on the lift" },
    quote: {
      ru: "«Установка дополнительного радиатора охлаждения АКПП»",
      en: "“Installation of an additional transmission cooler”",
    }, // [007]
  },
  {
    frame: "radiator_hand",
    title: { ru: "Радиатор и вентиляторы", en: "Radiator and fans" }, // [кадры]
  },
  {
    frame: "lion_plaque_bumper",
    title: { ru: "Плашка со львом", en: "The lion plate" },
    quote: {
      ru: "Carleone Service на бампере",
      en: "Carleone Service on the bumper",
    }, // [кадры]
  },
  {
    frame: "radiator_close",
    reel: "007",
    title: {
      ru: "Радиатор и шланги крупно",
      en: "The cooler and hoses up close",
    }, // [кадры]
  },
  {
    frame: "underbody_after_2",
    reel: "004",
    title: {
      ru: "Работа по арке и днищу",
      en: "Wheel arch and underbody work",
    }, // [ТЗ 6.7] [004]
    quote: { ru: "Стало: тёмное покрытие", en: "After: dark coating" }, // [кадры]
  },
  {
    frame: "bike_in_garage",
    reel: "005",
    title: { ru: "Мотоцикл гостей в боксе", en: "Our guests' motorcycle in the bay" }, // [кадры] [005]
  },
];
