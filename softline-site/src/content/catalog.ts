/**
 * Контент сайта Soft Line.
 *
 * Правило: только то, что подтверждено материалами из Instagram.
 * Цен, размеров, материалов, гарантий, часов работы и отзывов здесь нет.
 * Описания моделей — по тому, что видно на фото. Страна производства
 * и механизмы указываются только для конкретной модели, если это подтверждено.
 */

export type ImageName =
  | "01_hero_prado"
  | "02_prado_alt"
  | "03_minotti_hero"
  | "04_minotti_wide"
  | "05_mondi_hero"
  | "06_mondi_alt"
  | "07_oscar_product"
  | "08_oscar_detail"
  | "09_polo_hero"
  | "10_polo_detail"
  | "11_etno_hero"
  | "12_etno_detail"
  | "13_bigboss_showroom"
  | "14_client_interior"
  | "15_showroom_wide";

const PHONE_MAIN = "77075596070";

export const brand = {
  name: "Soft Line",
  secondaryName: "Soft Home",
  city: "Алматы",
  showroom: "ТЦ\u00A0ADEM\u00A01",
  showroomDetails: "3 этаж, оранжевый сектор",
  phones: [
    { display: "+7 (707) 559-60-70", tel: "+77075596070" },
    { display: "+7 (775) 991-36-82", tel: "+77759913682" },
  ],
  instagramHandle: "@softlinekz",
  instagramUrl: "https://www.instagram.com/softlinekz/",
  /** Поиск ТЦ в картах — без выдуманных координат, маршрут строится в приложении карт. */
  maps: {
    twoGis: "https://2gis.kz/almaty/search/" + encodeURIComponent("ТЦ ADEM 1"),
    yandex: "https://yandex.kz/maps/?text=" + encodeURIComponent("Алматы, ТЦ ADEM 1"),
  },
} as const;

/** Ссылка в WhatsApp с заранее набранным сообщением. */
export function whatsapp(message = "Здравствуйте! Хочу подобрать диван.") {
  return `https://wa.me/${PHONE_MAIN}?text=${encodeURIComponent(message)}`;
}

export const priceMessage = (model: string) =>
  `Здравствуйте! Подскажите, пожалуйста, цену на диван ${model}.`;

export const nav = [
  { href: "#catalog", label: "Каталог" },
  { href: "#about", label: "О компании" },
  { href: "#showroom", label: "Шоурум" },
  { href: "#delivery", label: "Доставка" },
  { href: "#contacts", label: "Контакты" },
] as const;

export type ProductType = "straight" | "corner";

export const productTypes: { value: "all" | ProductType; label: string }[] = [
  { value: "all", label: "Все модели" },
  { value: "straight", label: "Прямые" },
  { value: "corner", label: "Угловые" },
];

export interface ProductImage {
  name: ImageName;
  alt: string;
  /** object-position: держим силуэт дивана в кадре */
  position?: string;
}

export interface Product {
  id: string;
  name: string;
  /** Тип по фото. null — по снимку тип однозначно не определить. */
  type: ProductType | null;
  /** Короткое описание — только то, что видно на фотографиях */
  descriptor: string;
  images: ProductImage[];
  /** Что видно на фото — для карточки детали */
  details: string[];
}

export const products: Product[] = [
  {
    id: "prado",
    name: "Prado",
    type: "straight",
    descriptor: "Мягкие округлые формы и деревянные вставки на подлокотниках.",
    images: [
      { name: "02_prado_alt", alt: "Диван Prado со столиком, вид сбоку", position: "35% 62%" },
      { name: "01_hero_prado", alt: "Диван Prado светлого оттенка у панорамного окна", position: "30% 60%" },
    ],
    details: ["Прямой диван", "Округлые подлокотники с деревянной вставкой", "Декоративные подушки"],
  },
  {
    id: "minotti",
    name: "Minotti",
    type: "straight",
    descriptor: "Длинный низкий силуэт на изогнутых деревянных опорах.",
    images: [
      { name: "03_minotti_hero", alt: "Диван Minotti светлого оттенка в шоуруме", position: "45% 62%" },
      { name: "04_minotti_wide", alt: "Диван Minotti с оранжевыми подушками в шоуруме", position: "40% 60%" },
    ],
    details: ["Прямой диван", "Изогнутые деревянные опоры", "Декоративные подушки"],
  },
  {
    id: "mondi",
    name: "Mondi",
    type: "straight",
    descriptor: "Плавная изогнутая линия спинки и округлые подлокотники.",
    images: [
      { name: "05_mondi_hero", alt: "Серый диван Mondi с плавной изогнутой спинкой", position: "50% 62%" },
      { name: "06_mondi_alt", alt: "Диван Mondi с декоративными подушками, вид сбоку", position: "35% 65%" },
    ],
    details: ["Прямой диван с изогнутой спинкой", "Округлые подлокотники", "Декоративные подушки"],
  },
  {
    id: "oscar",
    name: "Oscar",
    type: "straight",
    descriptor: "Стёганые сиденья, контрастный кант и деревянные ножки.",
    images: [
      { name: "07_oscar_product", alt: "Диван Oscar светлого оттенка на белом фоне", position: "50% 50%" },
      { name: "08_oscar_detail", alt: "Oscar крупным планом: стёжка сиденья и подушка с кантом", position: "50% 50%" },
    ],
    details: ["Прямой диван", "Стёганые сиденья", "Контрастный кант", "Деревянные ножки"],
  },
  {
    id: "polo",
    name: "Polo",
    type: "corner",
    descriptor: "Угловой диван на деревянном основании, фактурная обивка.",
    images: [
      { name: "09_polo_hero", alt: "Угловой диван Polo светлого оттенка в шоуруме", position: "45% 62%" },
      { name: "10_polo_detail", alt: "Polo крупным планом: фактурная обивка и деревянное основание", position: "50% 55%" },
    ],
    details: ["Угловой диван", "Деревянное основание", "Фактурная обивка", "Декоративные подушки"],
  },
  {
    id: "etno",
    name: "Etno",
    type: "straight",
    descriptor: "Светлая обивка и массивные деревянные подлокотники.",
    images: [
      { name: "11_etno_hero", alt: "Диван Etno с креслом и круглым столиком в шоуруме", position: "40% 60%" },
      { name: "12_etno_detail", alt: "Etno крупным планом: деревянный подлокотник и светлое сиденье", position: "50% 55%" },
    ],
    details: ["Прямой диван", "Деревянные подлокотники", "На фото — с креслом и столиком"],
  },
  {
    id: "big-boss",
    name: "Big Boss",
    type: null,
    descriptor: "Модель из экспозиции шоурума — её лучше посмотреть вживую.",
    images: [
      { name: "13_bigboss_showroom", alt: "Экспозиция Big Boss в шоуруме: светлая мягкая мебель и деревянный столик", position: "50% 60%" },
    ],
    details: ["Снимок из шоурума в ТЦ ADEM 1", "Размеры и комплектацию уточняйте у менеджера"],
  },
];
