/**
 * Весь контент сайта Beauty Soul KZ.
 *
 * Правило: только подтверждённые факты из профиля @beautysoulkz.
 * Цены, часы работы, телефоны, стаж, награды и отзывы здесь НЕ указываются,
 * пока не подтверждены салоном. Чтобы добавить их — дополните этот файл.
 */

export type ImageName =
  | "01_hero"
  | "02_master_makeup"
  | "03_nails_white"
  | "04_hair_waves"
  | "05_hair_long"
  | "06_hair_back"
  | "07_makeup_updo"
  | "08_makeup_profile"
  | "09_nails_red"
  | "10_nails_detail"
  | "11_pedicure"
  | "12_lashes"
  | "13_interior"
  | "14_interior_nails"
  | "15_master_aruzhan";

export const brand = {
  name: "Beauty Soul",
  fullName: "Beauty Soul KZ",
  instagramHandle: "@beautysoulkz",
  instagramUrl: "https://www.instagram.com/beautysoulkz/",
  bookingUrl: "https://zapis.kz/beauty-soul",
  city: "Алматы",
  address: "Аксай, 1, 15",
  /** Поиск адреса в картах — без выдуманных координат. */
  maps: {
    twoGis: "https://2gis.kz/almaty/search/" + encodeURIComponent("Аксай 1, 15"),
    yandex:
      "https://yandex.kz/maps/?text=" + encodeURIComponent("Алматы, Аксай 1, 15"),
  },
} as const;

export const nav = [
  { href: "#salon", label: "Салон" },
  { href: "#services", label: "Услуги" },
  { href: "#works", label: "Работы" },
  { href: "#masters", label: "Мастера" },
  { href: "#reviews", label: "Отзывы" },
  { href: "#contacts", label: "Контакты" },
] as const;

export type ServiceId = "manicure" | "pedicure" | "hair" | "makeup" | "brows" | "lashes";

export interface Service {
  id: ServiceId;
  title: string;
  short: string;
  image?: ImageName;
  imageAlt?: string;
  /** Куда ведёт «Подробнее» */
  href: string;
}

export const services: Service[] = [
  {
    id: "manicure",
    title: "Маникюр",
    short: "Чистая форма и покрытие, которое хочется разглядывать: от молочного нюда до глубокого красного.",
    image: "09_nails_red",
    imageAlt: "Маникюр с глянцевым красным покрытием, миндалевидная форма",
    href: "#service-manicure",
  },
  {
    id: "pedicure",
    title: "Педикюр",
    short: "Ухоженные стопы и деликатное покрытие — спокойный уход, после которого легко идти дальше.",
    image: "11_pedicure",
    imageAlt: "Педикюр с нежно-розовым покрытием",
    href: "#service-pedicure",
  },
  {
    id: "hair",
    title: "Волосы",
    short: "Укладки, объёмные волны и локоны — от лёгкой естественности до праздничного образа.",
    image: "06_hair_back",
    imageAlt: "Длинные волосы, уложенные крупными волнами, вид со спины",
    href: "#service-hair",
  },
  {
    id: "makeup",
    title: "Макияж",
    short: "Выразительный и при этом бережный к вашим чертам: для события, съёмки или особенного вечера.",
    image: "08_makeup_profile",
    imageAlt: "Вечерний макияж и локоны, портрет в салоне",
    href: "#service-makeup",
  },
  {
    id: "brows",
    title: "Брови",
    short: "Форма, которая подчёркивает лицо и при этом выглядит естественно.",
    href: "#booking",
  },
  {
    id: "lashes",
    title: "Ресницы",
    short: "Открытый взгляд и мягкий изгиб — ресницы остаются вашими, только выразительнее.",
    image: "12_lashes",
    imageAlt: "Крупный план глаз: ресницы с естественным изгибом",
    href: "#service-lashes",
  },
];

export interface PortfolioItem {
  image: ImageName;
  category: Exclude<ServiceId, "brows">;
  alt: string;
  /** Композиция в сетке на десктопе */
  layout: "tall" | "wide" | "square" | "portrait";
}

export const portfolioCategories = [
  { value: "all", label: "Все работы" },
  { value: "manicure", label: "Маникюр" },
  { value: "hair", label: "Волосы" },
  { value: "makeup", label: "Макияж" },
  { value: "pedicure", label: "Педикюр" },
  { value: "lashes", label: "Ресницы" },
] as const;

export const portfolio: PortfolioItem[] = [
  { image: "07_makeup_updo", category: "makeup", layout: "tall", alt: "Нежный макияж и собранная причёска с выпущенными прядями" },
  { image: "03_nails_white", category: "manicure", layout: "portrait", alt: "Молочно-перламутровый маникюр, длинная миндалевидная форма" },
  { image: "04_hair_waves", category: "hair", layout: "portrait", alt: "Объёмная укладка: мягкие волны на волосах средней длины" },
  { image: "09_nails_red", category: "manicure", layout: "square", alt: "Маникюр с глянцевым красным покрытием" },
  { image: "08_makeup_profile", category: "makeup", layout: "tall", alt: "Вечерний макияж и голливудские локоны" },
  { image: "06_hair_back", category: "hair", layout: "portrait", alt: "Длинные волосы, уложенные крупными волнами, вид со спины" },
  { image: "12_lashes", category: "lashes", layout: "portrait", alt: "Ресницы с естественным изгибом, крупный план" },
  { image: "15_master_aruzhan", category: "manicure", layout: "square", alt: "Маникюр: бордовое и нюдовое покрытие с декором" },
  { image: "02_master_makeup", category: "makeup", layout: "portrait", alt: "Праздничный макияж и причёска, портрет в салоне" },
  { image: "11_pedicure", category: "pedicure", layout: "portrait", alt: "Педикюр с нежно-розовым покрытием" },
  { image: "05_hair_long", category: "hair", layout: "tall", alt: "Длинные волосы с мягкими светлыми прядями" },
  { image: "10_nails_detail", category: "manicure", layout: "square", alt: "Светлый маникюр с квадратной формой ногтей" },
];

/**
 * Мастера. Имена взяты из подборки материалов салона (IMAGE_MAP).
 * Специализация указана по работам, с которыми мастер опубликован.
 * Перед публикацией сайта подтвердите данные у салона.
 */
export interface Master {
  name: string;
  specialty: string;
  image: ImageName;
  imageAlt: string;
  caption: string;
}

export const masters: Master[] = [
  {
    name: "Аружан",
    specialty: "Маникюр",
    image: "15_master_aruzhan",
    imageAlt: "Работа мастера Аружан: маникюр с бордовым и нюдовым покрытием",
    caption: "Работа мастера",
  },
  {
    name: "Гульжан",
    specialty: "Волосы",
    image: "05_hair_long",
    imageAlt: "Работа мастера Гульжан: длинные волосы с мягкими светлыми прядями",
    caption: "Работа мастера",
  },
];

/**
 * Отзывы гостей. Добавляйте только настоящие отзывы с разрешения автора.
 * Пока список пуст, раздел показывает работы и ведёт в Instagram.
 */
export interface Review {
  text: string;
  author: string;
  service?: string;
}

export const reviews: Review[] = [];

export const instagramPicks: { image: ImageName; alt: string }[] = [
  { image: "01_hero", alt: "Вечерний макияж с красной помадой и прямые длинные волосы" },
  { image: "10_nails_detail", alt: "Светлый маникюр квадратной формы" },
  { image: "08_makeup_profile", alt: "Вечерний макияж и локоны" },
  { image: "13_interior", alt: "Интерьер салона: зеркала с мягкой подсветкой и бежевые кресла" },
  { image: "03_nails_white", alt: "Перламутровый маникюр" },
  { image: "04_hair_waves", alt: "Укладка волнами" },
];
