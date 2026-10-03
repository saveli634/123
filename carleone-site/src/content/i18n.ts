/**
 * Все тексты сайта, RU и EN.
 *
 * Правило: факты — только из подписей к роликам (caption.txt), ТЗ и подтверждений заказчика.
 * Рядом с каждой фразой — источник: [006] = подпись к ролику 006, [ТЗ] = интерфейс из ТЗ,
 * [кадры] = frames/manifest.csv, [З2] = подтверждено заказчиком во второй итерации (направления
 * работ, город, проект «Волга», слова о команде), [UI] = служебная подсказка без фактов.
 * Английский — перевод тех же фраз, без новых утверждений.
 * Разметка: *слово* — акцент (курсив Playfair), элементы массива title — строки заголовка.
 * Неразрывные пробелы расставляются при сборке (scripts/typograph.mjs).
 */
import type { FrameName } from "./frames";

export type Lang = "ru" | "en";

export type StageCode = "KZ" | "DE" | "FR" | "BE" | "ALL";
export type Stage = {
  code: StageCode;
  kicker: string;
  /** Штамп в «паспорте» — только у стран, откуда приезжали гости. */
  stamp: string;
  title?: string[];
  text?: string;
  lead?: string;
  quote?: string;
  after?: string;
  inset?: string;
};

/** Направление в «Техническом ядре». Кадр — реальный; схема — там, где своих кадров пока нет. */
export type CoreCat = {
  id: "engine" | "transmission" | "performance" | "service";
  code: string;
  name: string;
  desc: string;
  services: string[];
  details: string[];
  media: { frame: FrameName; position?: string } | { scheme: "engine" | "turbo" };
  related: { href: string; label: string };
};

/** Реальный кейс: «проблема» (или «задача», если проблема в ролике не названа) → «что сделано». */
export type Case = {
  id: string;
  tag: string;
  title: string;
  kind: "problem" | "task";
  problem: string;
  done: string;
  frame?: FrameName;
  /** второй кадр — проявляется при наведении (было → стало) */
  frameAfter?: FrameName;
  route?: boolean;
  link?: { href: string; label: string };
};

const ru = {
  meta: {
    /** [З2] город — Алматы; если CONFIG.city пуст — без города */
    title: "Carleone Service — автосервис, Казахстан",
    titleCity: "Carleone Service — автосервис в {city}",
    /** [З2] направления работ; {city} — CONFIG.city, иначе «Казахстане» */
    description:
      "Carleone Service — автосервис в {city}: двигатели, ремонт АКПП, прошивка ЭБУ и тюнинг, турбонаддув, дополнительное охлаждение ATF, техническое обслуживание.",
    cityFallback: "Казахстане",
    ogTitle: "Carleone Service — сложные задачи, технические решения",
    locale: "ru_RU",
  },
  a11y: {
    skip: "К содержанию",
    home: "Carleone Service — наверх",
    nav: "Разделы",
    lang: "Язык сайта",
    menuMobile: "Быстрые действия",
    close: "Закрыть",
    stamps: "Страны на карте Carleone Service",
    progress: "Этапы карты",
    sticker: "Фирменная наклейка Carleone Service. Нажмите Enter, чтобы отклеить или вернуть.",
    slider: "Шторка «было / стало»: стрелки влево и вправо",
    globe:
      "Схема: золотые дуги маршрутов путешественников из Германии, Франции и Бельгии сходятся в Казахстане, дальше — в Японию.",
    core: "Направления работ",
    scheme: "Схема",
  },
  nav: {
    services: "Направления",
    cases: "Работы",
    project: "Проект",
    team: "Команда",
    map: "Карта",
    contacts: "Контакты",
  },
  /** [ТЗ 3] [UI] формулировки кнопок */
  cta: {
    call: "Позвонить",
    whatsapp: "Написать в WhatsApp",
    whatsappShort: "WhatsApp",
    book: "Записаться на сервис",
    bookShort: "Записаться",
    cases: "Смотреть реальные работы",
    casesShort: "Работы",
    route: "Построить маршрут",
    works: "Ролики в Instagram",
    reel: "Ролик в Instagram",
  },
  hero: {
    brand: "Carleone Service", // [ТЗ 3] название
    city: "Алматы · Казахстан", // [З2]
    title: ["Сложные задачи.", "*Технические решения.*"], // [З2] позиционирование
    spec: ["Двигатели", "АКПП", "Тюнинг", "Performance"], // [З2]
    sub: "Пришло время проверить свою машину.", // [006]
    scroll: "Листайте", // [UI]
    media: ["Гидроблок АКПП", "Доп. радиатор АКПП · Rav4", "Бокс с подъёмником"], // [кадры]
  },
  /** [З2] бегущая лента — направления работ */
  marquee: [
    "Двигатели",
    "Ремонт АКПП",
    "Прошивка ЭБУ",
    "Турбонаддув",
    "Охлаждение ATF",
    "Техобслуживание",
    "Нестандартные проекты",
  ],
  core: {
    label: "Направления",
    title: ["Двигатель. АКПП.", "*Тюнинг. Сервис.*"],
    lead: "Выберите направление — кадр, услуги и связанный кейс сменятся.", // [UI]
    services: "Что делаем",
    details: "Детали",
    related: "Связанный кейс",
    scheme: "Схема, не фото работы", // [UI] честная подпись к схеме
    cats: <CoreCat[]>[
      {
        id: "engine",
        code: "ENGINE",
        name: "Двигатель",
        desc: "Работы по двигателю и его усиление — вплоть до проектов с Lexus 3UZ‑FE на базе Mercedes‑Benz W124.", // [З2]
        services: ["Работы по двигателю", "Усиление двигателя"], // [З2]
        details: ["Lexus 3UZ‑FE · V8", "Mercedes‑Benz W124"], // [З2]
        media: { scheme: "engine" },
        related: { href: "#project", label: "Проект «Волга»: W124 + 3UZ‑FE" },
      },
      {
        id: "transmission",
        code: "TRANSMISSION",
        name: "АКПП",
        desc: "Ремонт автоматических коробок передач и дополнительное охлаждение ATF — установка дополнительного радиатора охлаждения АКПП.", // [З2] [007] [014]
        services: ["Ремонт АКПП", "Дополнительное охлаждение ATF"], // [З2]
        details: ["Гидроблок АКПП", "Доп. радиатор ATF", "Toyota Rav4"], // [кадры] [007]
        media: { frame: "valve_body_hand", position: "50% 55%" },
        related: { href: "#rav4", label: "Rav4: дополнительный радиатор охлаждения АКПП" },
      },
      {
        id: "performance",
        code: "PERFORMANCE",
        name: "Performance",
        desc: "Прошивка и настройка ЭБУ, тюнинг двигателя, турбонаддув и нестандартные технические проекты.", // [З2]
        services: ["Прошивка и настройка ЭБУ", "Тюнинг двигателя", "Турбонаддув", "Нестандартные технические проекты"], // [З2]
        details: ["ЭБУ", "Турбонаддув", "Проекты под задачу"],
        media: { scheme: "turbo" },
        related: { href: "#project", label: "Проект «Волга»: W124 + 3UZ‑FE" },
      },
      {
        id: "service",
        code: "SERVICE",
        name: "Сервис",
        desc: "Техническое обслуживание и проверка автомобиля, работа по арке и днищу, обслуживание техники путешественников — в том числе мотоциклов.", // [З2] [006] [004] [005]
        services: ["Техническое обслуживание", "Проверка автомобиля", "Ремонт арок и днища", "Мотоциклы и техника путешественников"], // [З2] [006] [005]
        details: ["Подъёмник", "Бокс"], // [кадры]
        media: { frame: "garage_lift_wide", position: "50% 50%" },
        related: { href: "#before-after", label: "Арка и днище: было / стало" },
      },
    ],
  },
  cases: {
    label: "Реальные работы",
    title: ["Реальные", "*работы*"],
    lead: "Проблема — и что сделано. Кадры из роликов Carleone Service, без досочинённых результатов.", // [UI]
    problem: "Проблема",
    task: "Задача",
    done: "Что сделано",
    items: <Case[]>[
      {
        id: "case-rav4",
        tag: "АКПП · охлаждение ATF",
        title: "Toyota Rav4",
        kind: "task",
        problem: "Дополнительное охлаждение АКПП.", // [007]
        done: "Установлен дополнительный радиатор охлаждения АКПП.", // [007] [кадры]
        frame: "radiator_installed",
        link: { href: "#rav4", label: "Смотреть по шагам" },
      },
      {
        id: "case-atf",
        tag: "АКПП",
        title: "Автоматическая коробка передач",
        kind: "task",
        problem: "Ремонт АКПП.", // [З2]
        done: "Работа с гидроблоком АКПП.", // [кадры] valve_body_hand
        frame: "valve_body_hand",
      },
      {
        id: "case-arch",
        tag: "Кузов · днище",
        title: "Арка и днище",
        kind: "problem",
        problem: "Ржавая арка, днище и узел подвески.", // [кадры] underbody_before_1, _2
        done: "Работа по арке и днищу: нанесено покрытие.", // [004] [кадры] underbody_after_1, _2
        frame: "underbody_before_1",
        frameAfter: "underbody_after_1",
        link: { href: "#before-after", label: "Шторка «было / стало»" },
      },
      {
        id: "case-route",
        tag: "Ремонт в дороге",
        title: "Бельгия → Казахстан → Япония",
        kind: "problem",
        problem: "В дороге случилась поломка — на пути из Бельгии через Казахстан в Японию.", // [011] [012]
        done: "Автомобиль отремонтирован и снова готов покорять километры.", // [012]
        route: true,
        link: { href: "#map", label: "Карта гостей" },
      },
      {
        id: "case-moto",
        tag: "Сервис · мотоциклы",
        title: "Мотоциклы гостей из Германии",
        kind: "task",
        problem: "Спокойно обслужить технику перед продолжением пути через Казахстан.", // [005]
        done: "Мотоциклы обслужены в боксе Carleone Service. «Мы с удовольствием помогли!»", // [005]
        frame: "bike_in_garage",
      },
      /*
       * Prado и Iveco: ролики есть в архиве заказчика, но подписи и кадры к ним в материалы сайта
       * не попали. Кейс добавляется сюда так же — только с проблемой и работой из подписи к ролику.
       */
    ],
  },
  project: {
    label: "Фирменный проект",
    title: ["*Волга*"], // [З2]
    sub: "W124 · 3UZ‑FE",
    lead: "Mercedes‑Benz W124, элементы кузова «Волги» и двигатель Lexus 3UZ‑FE — в одном автомобиле.", // [З2]
    dossier: "Досье проекта",
    rows: [
      ["Основа", "Mercedes‑Benz W124"],
      ["Кузов", "Элементы кузова ГАЗ «Волга»"],
      ["Двигатель", "Lexus 3UZ‑FE · V8"],
    ] as [string, string][], // [З2]
    callouts: ["Основа W124", "Кузов «Волга»", "3UZ‑FE V8"],
    note: "Схема, не чертёж проекта.", // [UI]
    stamp: "Проект",
    stampRing: "Carleone Service · Алматы ·",
  },
  team: {
    label: "Мастерская и команда",
    title: ["Не только", "*Сергей*"], // [З2]
    quote: "Carleone Service — это не только Сергей. Это целая команда специалистов.", // [З2]
    text: "Подъёмники, инструмент и работа в боксе — кадры из роликов.", // [кадры]
    hint: "Листайте", // [UI]
    of: "из",
  },
  map: {
    label: "Карта Carleone", // [ТЗ 5]
    scheme: "Схема, не карта", // [ТЗ 5]
    intro: {
      kicker: "Путешественники",
      title: ["Люди из разных стран", "останавливались в Carleone,", "*путешествуя через Казахстан*"], // [З2]
    },
    stages: <Stage[]>[
      {
        code: "KZ",
        kicker: "Алматы · Казахстан",
        title: ["Ещё одна страна", "*на карте*"], // [012]
        text: "Carleone Service", // [012]
        stamp: "",
      },
      {
        code: "DE",
        kicker: "Германия",
        stamp: "Германия",
        lead: "Гости из Германии", // [005] «принимал гостей из Германии»
        quote:
          "Путешествуя на мотоциклах через Казахстан, ребятам понадобилось место, где можно спокойно обслужить технику перед продолжением пути.", // [005]
        after: "Мы с удовольствием помогли!", // [005]
        inset: "Мотоцикл путешественников в боксе", // [кадры] bike_in_garage
      },
      {
        code: "FR",
        kicker: "Франция",
        stamp: "Франция",
        lead: "Гости из Франции",
        quote: "…к нам заехала милая семейная пара путешественников из Франции", // [005]
      },
      {
        code: "BE",
        kicker: "Бельгия → Казахстан → Япония",
        stamp: "Бельгия",
        lead: "Маршрут",
        quote: "прямиком из Бельгии через Казахстан в Японию", // [011]
        after:
          "В дороге случилась поломка, но теперь всё позади — автомобиль отремонтирован и снова готов покорять километры.", // [012]
      },
      {
        code: "ALL",
        kicker: "Ваш путь",
        title: ["Если ваш путь", "проходит через", "*наш город*"], // [005]
        text: "Мы всегда рады гостям, независимо от того, откуда вы приехали.", // [005]
        stamp: "",
      },
    ],
    stampRing: "Carleone Service · Казахстан ·", // [ТЗ 3] название + страна
  },
  radiator: {
    kicker: "Кейс · Toyota Rav4 · АКПП",
    title: ["Установка дополнительного", "радиатора охлаждения", "*АКПП на Rav4*"], // [ТЗ 6.6] [007]
    steps: [
      "Rav4 на подъёмнике", // [кадры]
      "Плашка Carleone Service на бампере", // [кадры]
      "Радиатор и шланги крупно", // [кадры]
      "Дополнительный радиатор установлен", // [кадры]
    ],
    details: "Детали",
    detailHand: "Радиатор и вентиляторы", // [кадры]
    detailValve: "Гидроблок АКПП", // [кадры]
  },
  beforeAfter: {
    label: "Кейс · арка и днище",
    title: ["Было / *стало*"],
    caption: "Работа по арке и днищу", // [ТЗ 6.7] [004]
    before: "Было",
    after: "Стало",
    pair: "Пара",
    hint: "Потяните шторку", // [UI]
  },
  sticker: {
    label: "Фирменная наклейка", // [012]
    title: ["По доброй", "*традиции*"], // [012] «по нашей доброй традиции»
    text: "По нашей доброй традиции отправляем в путь с фирменной наклейкой Carleone Service.", // [ТЗ 6.8] [012]
    wish: "Пусть она станет маленьким напоминанием о Казахстане и о людях, которые всегда готовы прийти на помощь.", // [012]
    hintDesktop: "Потяните за уголок — наклейку можно отклеить и перенести", // [UI]
    hintTouch: "Листайте — наклейка отклеится", // [UI]
    reset: "Вернуть на место", // [UI]
  },
  travellers: {
    label: "Гостям из-за границы",
    title: ["Гостям из-за *границы*"],
    text: "Мы всегда рады гостям, независимо от того, откуда вы приехали. Если ваш путь проходит через наш город — знайте, что в Carleone Service вас встретят, помогут и сделают всё, чтобы ваше путешествие продолжилось без лишних забот.", // [005]
    route: "Германия · Франция · Бельгия → Казахстан → Япония", // [005] [011] [012]
  },
  quotes: {
    label: "Отзыв",
    text: "Отличный сервис! Нам здесь очень помогли! Огромное спасибо!", // [005] титры ролика
    author: "Путешественники из Германии",
  },
  contacts: {
    label: "Контакты",
    title: ["Приезжай,", "*ждём тебя*"], // [006]
    city: "Город",
    phone: "Телефон",
    whatsapp: "WhatsApp",
    address: "Адрес",
    hours: "Часы работы",
    instagram: "Instagram",
    country: "Казахстан",
    /** демо-сборка без телефона, WhatsApp и Instagram — одна спокойная строка вместо пустых полей */
    demo: "Контакты появятся в финальной версии после согласования.", // [UI]
    note: "Цены и сроки — уточняйте по телефону.", // [ТЗ 3]
    bookText: "Оставьте имя, телефон и пару слов о машине — заявка откроется в WhatsApp.", // [UI]
  },
  form: {
    title: "Записаться на сервис",
    lead: "Заполните форму — мы соберём сообщение и откроем WhatsApp. Останется нажать «Отправить».", // [UI]
    name: "Имя",
    namePh: "Как к вам обращаться…",
    phone: "Телефон",
    phonePh: "+7 …",
    car: "Марка и модель",
    carPh: "Например, Toyota Rav4…",
    problem: "Что случилось",
    problemPh: "Опишите в двух словах…",
    submit: "Отправить в WhatsApp",
    errName: "Укажите имя",
    errPhone: "Укажите телефон — хотя бы 10 цифр",
    msgHello: "Здравствуйте! Хочу записаться в Carleone Service.",
    msgName: "Имя",
    msgPhone: "Телефон",
    msgCar: "Автомобиль",
    msgProblem: "Что случилось",
  },
  footer: {
    country: "Алматы · Казахстан",
    scheme: "Схема, не карта: глобус показывает страны, откуда приезжали гости, а не точные маршруты.", // [ТЗ 5]
    top: "Наверх",
  },
  cursor: { drag: "Тянуть", scroll: "Листать", compare: "Двигать" },
};

type Dict = typeof ru;

const en: Dict = {
  meta: {
    title: "Carleone Service — Auto Service, Kazakhstan",
    titleCity: "Carleone Service — Auto Service in {city}",
    description:
      "Carleone Service — auto service in {city}: engines, automatic transmission repair, ECU flashing and tuning, turbocharging, additional ATF cooling, maintenance.",
    cityFallback: "Kazakhstan",
    ogTitle: "Carleone Service — complex problems, technical solutions",
    locale: "en_US",
  },
  a11y: {
    skip: "Skip to content",
    home: "Carleone Service — back to top",
    nav: "Sections",
    lang: "Site language",
    menuMobile: "Quick actions",
    close: "Close",
    stamps: "Countries on the Carleone Service map",
    progress: "Map stages",
    sticker: "Carleone Service sticker. Press Enter to peel it off or put it back.",
    slider: "Before / after curtain: use the left and right arrows",
    globe:
      "Diagram: golden arcs of travellers' routes from Germany, France and Belgium meet in Kazakhstan, then continue to Japan.",
    core: "Areas of work",
    scheme: "Diagram",
  },
  nav: {
    services: "Services",
    cases: "Work",
    project: "Project",
    team: "Team",
    map: "Map",
    contacts: "Contacts",
  },
  cta: {
    call: "Call",
    whatsapp: "Message on WhatsApp",
    whatsappShort: "WhatsApp",
    book: "Book a service",
    bookShort: "Book",
    cases: "View real work",
    casesShort: "Work",
    route: "Get directions",
    works: "Videos on Instagram",
    reel: "Reel on Instagram",
  },
  hero: {
    brand: "Carleone Service",
    city: "Almaty · Kazakhstan",
    title: ["Complex problems.", "*Technical solutions.*"],
    spec: ["Engines", "Automatic transmissions", "Tuning", "Performance"],
    sub: "It's time to check your car.",
    scroll: "Scroll",
    media: ["Transmission valve body", "Extra ATF cooler · Rav4", "The bay with a lift"],
  },
  marquee: [
    "Engines",
    "Automatic transmission repair",
    "ECU flashing",
    "Turbocharging",
    "ATF cooling",
    "Maintenance",
    "Custom projects",
  ],
  core: {
    label: "Services",
    title: ["Engine. Transmission.", "*Performance. Service.*"],
    lead: "Pick an area — the frame, services and related case will change.",
    services: "What we do",
    details: "Details",
    related: "Related case",
    scheme: "A diagram, not a photo of the job",
    cats: <CoreCat[]>[
      {
        id: "engine",
        code: "ENGINE",
        name: "Engine",
        desc: "Engine work and engine strengthening — up to projects like a Lexus 3UZ‑FE on a Mercedes‑Benz W124 base.",
        services: ["Engine work", "Engine strengthening"],
        details: ["Lexus 3UZ‑FE · V8", "Mercedes‑Benz W124"],
        media: { scheme: "engine" },
        related: { href: "#project", label: "The Volga project: W124 + 3UZ‑FE" },
      },
      {
        id: "transmission",
        code: "TRANSMISSION",
        name: "Transmission",
        desc: "Automatic transmission repair and additional ATF cooling — installing an additional automatic transmission cooler.",
        services: ["Automatic transmission repair", "Additional ATF cooling"],
        details: ["Valve body", "Extra ATF cooler", "Toyota Rav4"],
        media: { frame: "valve_body_hand", position: "50% 55%" },
        related: { href: "#rav4", label: "Rav4: additional transmission cooler" },
      },
      {
        id: "performance",
        code: "PERFORMANCE",
        name: "Performance",
        desc: "ECU flashing and tuning, engine tuning, turbocharging and custom technical projects.",
        services: ["ECU flashing and tuning", "Engine tuning", "Turbocharging", "Custom technical projects"],
        details: ["ECU", "Turbocharging", "Built to the task"],
        media: { scheme: "turbo" },
        related: { href: "#project", label: "The Volga project: W124 + 3UZ‑FE" },
      },
      {
        id: "service",
        code: "SERVICE",
        name: "Service",
        desc: "Maintenance and car checks, wheel arch and underbody work, servicing travellers' vehicles — including motorcycles.",
        services: ["Maintenance and technical service", "Car check", "Wheel arch and underbody repair", "Motorcycles and travellers' vehicles"],
        details: ["Lift", "Bay"],
        media: { frame: "garage_lift_wide", position: "50% 50%" },
        related: { href: "#before-after", label: "Arch and underbody: before / after" },
      },
    ],
  },
  cases: {
    label: "Real work",
    title: ["Real", "*work*"],
    lead: "The problem — and what was done. Frames from Carleone Service videos, no made-up results.",
    problem: "Problem",
    task: "Task",
    done: "What was done",
    items: <Case[]>[
      {
        id: "case-rav4",
        tag: "Transmission · ATF cooling",
        title: "Toyota Rav4",
        kind: "task",
        problem: "Additional automatic transmission cooling.",
        done: "An additional automatic transmission cooler was installed.",
        frame: "radiator_installed",
        link: { href: "#rav4", label: "See it step by step" },
      },
      {
        id: "case-atf",
        tag: "Transmission",
        title: "Automatic transmission",
        kind: "task",
        problem: "Automatic transmission repair.",
        done: "Work on the transmission valve body.",
        frame: "valve_body_hand",
      },
      {
        id: "case-arch",
        tag: "Body · underbody",
        title: "Wheel arch and underbody",
        kind: "problem",
        problem: "A rusty wheel arch, underbody and suspension mount.",
        done: "Wheel arch and underbody work: a coating was applied.",
        frame: "underbody_before_1",
        frameAfter: "underbody_after_1",
        link: { href: "#before-after", label: "Before / after curtain" },
      },
      {
        id: "case-route",
        tag: "Repair on the road",
        title: "Belgium → Kazakhstan → Japan",
        kind: "problem",
        problem: "A breakdown on the road — on the way from Belgium through Kazakhstan to Japan.",
        done: "The car has been repaired and is ready to conquer the kilometres again.",
        route: true,
        link: { href: "#map", label: "Our guests' map" },
      },
      {
        id: "case-moto",
        tag: "Service · motorcycles",
        title: "Motorcycles of our guests from Germany",
        kind: "task",
        problem: "Calmly service the bikes before continuing the journey through Kazakhstan.",
        done: "The motorcycles were serviced in the Carleone Service bay. “We were happy to help!”",
        frame: "bike_in_garage",
      },
    ],
  },
  project: {
    label: "Signature project",
    title: ["*Volga*"],
    sub: "W124 · 3UZ‑FE",
    lead: "A Mercedes‑Benz W124, Volga body elements and a Lexus 3UZ‑FE engine — in one car.",
    dossier: "Project dossier",
    rows: [
      ["Base", "Mercedes‑Benz W124"],
      ["Body", "GAZ Volga body elements"],
      ["Engine", "Lexus 3UZ‑FE · V8"],
    ] as [string, string][],
    callouts: ["W124 base", "Volga body", "3UZ‑FE V8"],
    note: "A diagram, not the project's drawing.",
    stamp: "Project",
    stampRing: "Carleone Service · Almaty ·",
  },
  team: {
    label: "Workshop & team",
    title: ["Not just", "*Sergey*"],
    quote: "Carleone Service is not just Sergey. It is a whole team of specialists.",
    text: "Lifts, tools and work in the bay — frames from our videos.",
    hint: "Scroll",
    of: "of",
  },
  map: {
    label: "The Carleone map",
    scheme: "A diagram, not a map",
    intro: {
      kicker: "Travellers",
      title: ["People from different countries", "have stopped at Carleone", "*while travelling through Kazakhstan*"],
    },
    stages: <Stage[]>[
      {
        code: "KZ",
        kicker: "Almaty · Kazakhstan",
        title: ["One more country", "*on the map*"],
        text: "Carleone Service",
        stamp: "",
      },
      {
        code: "DE",
        kicker: "Germany",
        stamp: "Germany",
        lead: "Guests from Germany",
        quote:
          "Travelling through Kazakhstan on motorcycles, the guys needed a place where they could calmly service their bikes before continuing their journey.",
        after: "We were happy to help!",
        inset: "The travellers' motorcycle in our bay",
      },
      {
        code: "FR",
        kicker: "France",
        stamp: "France",
        lead: "Guests from France",
        quote: "…a lovely couple of travellers from France stopped by",
      },
      {
        code: "BE",
        kicker: "Belgium → Kazakhstan → Japan",
        stamp: "Belgium",
        lead: "The route",
        quote: "straight from Belgium through Kazakhstan to Japan",
        after:
          "A breakdown happened on the road, but now it's all behind — the car has been repaired and is ready to conquer the kilometres again.",
      },
      {
        code: "ALL",
        kicker: "Your route",
        title: ["If your route", "passes through", "*our city*"],
        text: "We are always glad to welcome guests, no matter where you have come from.",
        stamp: "",
      },
    ],
    stampRing: "Carleone Service · Kazakhstan ·",
  },
  radiator: {
    kicker: "Case · Toyota Rav4 · Transmission",
    title: ["Installing an additional", "automatic transmission", "*cooler on a Rav4*"],
    steps: [
      "Rav4 on the lift",
      "Carleone Service plate on the bumper",
      "The cooler and hoses up close",
      "The additional cooler installed",
    ],
    details: "Details",
    detailHand: "Radiator and fans",
    detailValve: "Automatic transmission valve body",
  },
  beforeAfter: {
    label: "Case · arch and underbody",
    title: ["Before / *after*"],
    caption: "Work on the wheel arch and underbody",
    before: "Before",
    after: "After",
    pair: "Pair",
    hint: "Drag the curtain",
  },
  sticker: {
    label: "Our sticker",
    title: ["A good", "*tradition*"],
    text: "By our good tradition, we send travellers on their way with a Carleone Service sticker.",
    wish: "May it become a small reminder of Kazakhstan and of the people who are always ready to help.",
    hintDesktop: "Pull the corner — the sticker peels off and can be moved",
    hintTouch: "Keep scrolling — the sticker will peel off",
    reset: "Put it back",
  },
  travellers: {
    label: "For travellers",
    title: ["For *travellers*"],
    text: "We are always glad to welcome guests, no matter where you have come from. If your route passes through our city, know that at Carleone Service you will be met, helped, and we will do everything so that your journey continues without unnecessary worries.",
    route: "Germany · France · Belgium → Kazakhstan → Japan",
  },
  quotes: {
    label: "Review",
    text: "Great service! We got a lot of help here! Thank you so much!",
    author: "Travellers from Germany",
  },
  contacts: {
    label: "Contacts",
    title: ["Come by,", "*we're waiting*"],
    city: "City",
    phone: "Phone",
    whatsapp: "WhatsApp",
    address: "Address",
    hours: "Opening hours",
    instagram: "Instagram",
    country: "Kazakhstan",
    demo: "Contacts will be connected in the final version after approval.",
    note: "Prices and timing — please ask by phone.",
    bookText: "Leave your name, phone and a few words about the car — the request opens in WhatsApp.",
  },
  form: {
    title: "Book a service",
    lead: "Fill in the form — we will compose the message and open WhatsApp. Then just tap “Send”.",
    name: "Name",
    namePh: "Your name…",
    phone: "Phone",
    phonePh: "+7 …",
    car: "Make and model",
    carPh: "For example, Toyota Rav4…",
    problem: "What happened",
    problemPh: "A few words…",
    submit: "Send via WhatsApp",
    errName: "Please enter your name",
    errPhone: "Please enter a phone number — at least 10 digits",
    msgHello: "Hello! I would like to book a service at Carleone Service.",
    msgName: "Name",
    msgPhone: "Phone",
    msgCar: "Car",
    msgProblem: "What happened",
  },
  footer: {
    country: "Almaty · Kazakhstan",
    scheme: "A diagram, not a map: the globe shows the countries our guests came from, not exact routes.",
    top: "Back to top",
  },
  cursor: { drag: "Drag", scroll: "Scroll", compare: "Slide" },
};

export const DICT: Record<Lang, Dict> = { ru, en };
export type { Dict };
