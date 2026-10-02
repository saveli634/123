/**
 * ВЕСЬ видимый текст сайта. Источник каждой строки — в отчёте (таблица «строка → источник»):
 *   ТЗ §3 — подтверждённые факты из подписей публикаций (переносятся дословно);
 *   manifest.csv — описания кадров;
 *   ТЗ §5–6 — названия этапов, разделов и служебные подписи; словарь кнопок — ТЗ §3.
 * Ничего не добавлять без источника. Строки — в двойных кавычках (типограф при сборке).
 */
import type { ImageName } from "./images.ts";

export const SITE = {
  demoName: "Моторный цех",
  city: "Алматы",
  country: "Казахстан",
  title: "Капитальный ремонт 1VD‑FTV в Алматы",
  description:
    "Капитальный ремонт 1VD‑FTV в Алматы: Land Cruiser 200, Lexus LX450d, Land Cruiser 105. Демонтаж мотора, замеры и компрессия, сборка на масле Yacco, обкатка.",
  schemeNote: "Схема, не чертёж",
  footerNote: "Схема мотора иллюстративная",
  skip: "Перейти к содержимому",
};

export const BUTTONS = {
  call: "Позвонить",
  whatsapp: "Написать в WhatsApp",
  book: "Записаться",
  price: "Узнать цену",
  route: "Построить маршрут",
  works: "Смотреть работы",
};

export const FILL = {
  prefix: "Заполнить",
  confirm: "Подтвердить",
  name: "название",
  phone: "телефон",
  whatsapp: "WhatsApp",
  address: "адрес",
  workHours: "часы работы",
  instagram: "Instagram",
  mapLink: "ссылка на карту",
  reels: "ссылки на ролики (source_url.txt)",
  hardkorr: "свет HARDKORR",
  gearbox: "МКПП",
};

export const UI = {
  nav: "Разделы",
  menu: "Меню",
  close: "Закрыть",
  quick: "Быстрая связь",
  drag: "Тяни",
  next: "Следующий ракурс",
  scheme: "Схема мотора",
};

export const NAV = [
  { id: "etapy", label: "Этапы" },
  { id: "ceh", label: "Цех" },
  { id: "uslugi", label: "Что делаем" },
  { id: "raboty", label: "Работы" },
  { id: "razbory", label: "Разборы" },
  { id: "kontakty", label: "Контакты" },
];

export const HERO = {
  eyebrow: "Алматы · Казахстан",
  lines: ["Капитальный", "ремонт 1VD‑FTV"],
  city: "Алматы",
  models: ["Land Cruiser 200", "Lexus LX450d", "Land Cruiser 105"],
  scroll: "Прокрути",
};

export const MARQUEE = ["Land Cruiser 200", "Lexus LX450d", "Land Cruiser 105", "1VD‑FTV", "Jeep Gladiator", "Chevrolet Tahoe"];

export interface Inset {
  img: ImageName;
  caption: string;
}

export interface Stage {
  n: string;
  title: string;
  note: string;
  node: string;
  insets: Inset[];
}

export const STAGES_HEAD = {
  label: "Капиталка за один прокрут",
  hudStage: "Этап",
  hudNode: "Узел",
};

export const STAGES: Stage[] = [
  {
    n: "01",
    title: "Капитальный ремонт 1VD‑FTV",
    note: "Land Cruiser 200 · Lexus LX450d",
    node: "Блок цилиндров",
    insets: [{ img: "engine_on_stand", caption: "Мотор на стойке" }],
  },
  {
    n: "02",
    title: "Демонтаж мотора",
    note: "Демонтаж мотора TLC 200",
    node: "Навесное",
    insets: [{ img: "engine_on_crane", caption: "Мотор на кране" }],
  },
  {
    n: "03",
    title: "Замеры и компрессия",
    note: "Какая компрессия в цилиндрах допустима?",
    node: "Головки блока · поршни",
    insets: [
      { img: "dial_gauge_measuring", caption: "Замер индикатором" },
      { img: "cylinder_head_valves", caption: "Головка блока, клапаны" },
      { img: "pistons_closeup", caption: "Поршни в блоке" },
    ],
  },
  {
    n: "04",
    title: "Сборка на масле Yacco",
    note: "Доверяем исключительно продукции Yacco",
    node: "Коленвал",
    insets: [
      { img: "crankshaft_block", caption: "Коленвал в блоке" },
      { img: "crankshaft_caps", caption: "Постель коленвала" },
      { img: "oil_yacco_1", caption: "Заливка масла Yacco" },
    ],
  },
  {
    n: "05",
    title: "Обкатка",
    note: "Обкатка 1VD",
    node: "Мотор в сборе",
    insets: [
      { img: "break_in_cluster", caption: "Приборка и дорога" },
      { img: "break_in_road", caption: "Дорога из салона" },
    ],
  },
  {
    n: "06",
    title: "Первый выезд после капитального ремонта",
    note: "1VD‑FTV",
    node: "Мотор в сборе",
    insets: [],
  },
];

export const WORKSHOP = {
  label: "Цех",
  quote: "Мы очень любим то, что делаем",
  quoteLines: ["«Мы очень", "любим то,", "что делаем»"],
  frames: [
    { img: "lift_red_land_cruiser", caption: "Land Cruiser на подъёмнике" },
    { img: "engine_on_stand", caption: "Мотор на стойке" },
    { img: "land_cruiser_silver_side", caption: "Land Cruiser 200" },
  ] as Inset[],
};

export interface Service {
  n: string;
  title: string;
  text: string;
  /** Показывать только после подтверждения владельцем (флаг в CONFIG). */
  flag?: "showHardkorr" | "showGearbox";
  fill?: keyof typeof FILL;
}

export const SERVICES_HEAD = {
  label: "Что делаем",
  titleLines: ["Что", "делаем"],
  priceAnswer: "Цену уточняйте по телефону",
};

export const SERVICES: Service[] = [
  { n: "01", title: "Капитальный ремонт 1VD‑FTV", text: "Land Cruiser 200 · Lexus LX450d. Демонтаж, замеры, сборка, обкатка." },
  { n: "02", title: "Демонтаж и замена мотора", text: "Привозной мотор или капиталка — уточняйте у мастера." },
  { n: "03", title: "Проверка компрессии", text: "Замеры и компрессия в цилиндрах." },
  { n: "04", title: "Тюнинг Jeep Gladiator", text: "Jeep Gladiator с электронной регулировкой. Подробности уточняйте по телефону." },
  { n: "05", title: "Свет HARDKORR", text: "Land Cruiser 200. Подробности уточняйте по телефону.", flag: "showHardkorr", fill: "hardkorr" },
  { n: "06", title: "МКПП", text: "Уточняйте по телефону.", flag: "showGearbox", fill: "gearbox" },
];

export const CARE = {
  label: "Аккуратность",
  titleLines: ["Аккуратность"],
  text: "Салон закрыт плёнкой на время работ",
  photos: [
    { img: "interior_wheel_wrap_1", caption: "Салон Land Cruiser 200, плёнка на руле" },
    { img: "interior_wheel_wrap_2", caption: "Салон, плёнка на кресле" },
    { img: "interior_wheel_wrap_3", caption: "Салон, селектор КПП и плёнка" },
    { img: "interior_wheel_wrap_4", caption: "Руль, приборка" },
  ] as Inset[],
};

export interface Work extends Inset {
  flag?: "showHardkorr";
  captionConfirmed?: string;
}

export const WORKS = {
  label: "Работы",
  drag: "Тяни",
  items: [
    { img: "land_cruiser_black_front", caption: "Чёрный Land Cruiser" },
    { img: "hardkorr_light", caption: "Фара на решётке Toyota", captionConfirmed: "Фара HARDKORR на решётке Toyota", flag: "showHardkorr" },
    { img: "red_4x4_street", caption: "Красный внедорожник" },
    { img: "lift_red_land_cruiser", caption: "Land Cruiser на подъёмнике" },
    { img: "engine_on_crane", caption: "Демонтаж мотора · Land Cruiser 105" },
    { img: "land_cruiser_silver_side", caption: "Land Cruiser 200" },
    { img: "cylinder_head_valves", caption: "Головка блока, клапаны" },
    { img: "crankshaft_block", caption: "Коленвал в блоке" },
    { img: "oil_yacco_2", caption: "Заливка масла, воронка" },
    { img: "break_in_road", caption: "Первый выезд после капитального ремонта 1VD" },
  ] as Work[],
};

export interface Topic {
  title: string;
  cover: ImageName;
  /** Ссылка на ролик из source_url.txt — заполнить. */
  url: string;
}

export const TOPICS = {
  label: "Разборы",
  reel: "Ролик",
  items: [
    { title: "Какая компрессия в цилиндрах допустима?", cover: "pistons_closeup", url: "" },
    { title: "Что дешевле: капиталка или привозной мотор?", cover: "engine_on_stand", url: "" },
    { title: "Как дела с привозными моторами?", cover: "engine_on_crane", url: "" },
    { title: "Демонтаж мотора TLC 200", cover: "lift_red_land_cruiser", url: "" },
    { title: "Подробнее про TLC 200", cover: "land_cruiser_silver_side", url: "" },
    { title: "Не много про рабочие процессы", cover: "crankshaft_caps", url: "" },
  ] as Topic[],
};

export const MATERIALS = {
  label: "Чем работаем",
  quote: "Опыт в нашем деле это главное",
  quoteLines: ["«Опыт", "в нашем деле", "это главное»"],
  items: [
    { k: "Масла", v: "Yacco", note: "Доверяем исключительно продукции Yacco", mentionLabel: "Поставщик", mention: "@davkazakhstan" },
    { k: "Свет", v: "HARDKORR", note: "", flag: "showHardkorr" as const, fill: "hardkorr" as const },
  ],
};

export const PREDATOR = {
  label: "Аксессуар",
  title: "Гусак «Хищник»",
  sub: "Насадка на шноркель",
  facts: ["Изготовлен на 3D‑принтере", "Цена без накрутки"],
  price: "34 000",
  noDiscount: "Скидки нет",
  mentionLabel: "Купить можно у",
  mention: "@almaty_3dprint",
  photos: [
    { img: "predator_snorkel_1", caption: "Гусак «Хищник», вид спереди" },
    { img: "predator_snorkel_2", caption: "Гусак «Хищник», крупно" },
    { img: "predator_snorkel_3", caption: "Гусак «Хищник», сбоку" },
    { img: "predator_snorkel_4", caption: "Гусак «Хищник», гибкие трубки" },
  ] as Inset[],
};

export const CONTACTS = {
  label: "Контакты и запись",
  titleLines: ["Контакты", "и запись"],
  phone: "Телефон",
  whatsapp: "WhatsApp",
  address: "Адрес",
  hours: "Часы работы",
  instagram: "Instagram",
};

export const FORM = {
  title: "Записаться",
  lead: "Сообщение откроется в WhatsApp. Сайт ничего не хранит и никуда не отправляет.",
  name: "Имя",
  namePlaceholder: "Как к вам обращаться…",
  phone: "Телефон",
  phonePlaceholder: "+7 700 000 00 00…",
  model: "Модель авто",
  modelOther: "Другая",
  modelPlaceholder: "Например, Land Cruiser 200…",
  models: ["Land Cruiser 200", "Lexus LX450d", "Land Cruiser 105"],
  submit: "Написать в WhatsApp",
  close: "Закрыть",
  required: "Заполните поле",
  phoneInvalid: "Проверьте номер",
  noWhatsapp: "Номер WhatsApp ещё не заполнен — сообщение не отправится.",
  greeting: "Здравствуйте! Хочу записаться.",
  nameLine: "Имя",
  phoneLine: "Телефон",
  modelLine: "Авто",
};

export const PRELOADER = { code: "1VD‑FTV" };
