/**
 * Все тексты сайта, RU и EN.
 *
 * Правило: факты — только из подписей к роликам (caption.txt) и ТЗ. Рядом с каждой фразой —
 * источник: [006] = подпись к ролику 006, [ТЗ] = интерфейс из ТЗ, [кадры] = frames/manifest.csv,
 * [UI] = служебная подсказка без фактов. Английский — перевод тех же фраз, без новых утверждений.
 * Разметка: *слово* — акцент (курсив Playfair), элементы массива title — строки заголовка.
 * Неразрывные пробелы расставляются при сборке (scripts/typograph.mjs).
 */
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

const ru = {
  meta: {
    /** [ТЗ 8] название + «Казахстан»; город добавляется из CONFIG.city */
    title: "Carleone Service — автосервис, Казахстан",
    titleCity: "Carleone Service — автосервис, {city}, Казахстан",
    /** [006] проверка, [012] ремонт, [005] техника путешественников и мотоциклы, [007][014] радиатор АКПП */
    description:
      "Carleone Service, Казахстан: проверка и ремонт автомобилей, обслуживание техники путешественников, в том числе мотоциклов, установка дополнительного радиатора охлаждения АКПП.",
    ogTitle: "Carleone Service — ещё одна страна на карте",
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
  },
  nav: {
    map: "Карта",
    services: "Услуги",
    works: "Работы",
    contacts: "Контакты",
  },
  /** [ТЗ 3] формулировки кнопок */
  cta: {
    call: "Позвонить",
    whatsapp: "Написать в WhatsApp",
    whatsappShort: "WhatsApp",
    book: "Записаться",
    price: "Узнать цену",
    route: "Построить маршрут",
    works: "Смотреть работы",
    reel: "Ролик в Instagram",
  },
  /** [ТЗ 3] «Спорное — уточняйте по телефону» */
  priceAnswer: "Цену уточняйте по телефону",
  fill: "ЗАПОЛНИТЬ",
  hero: {
    country: "Казахстан", // [ТЗ 3] страна
    title: ["Carleone", "*Service*"], // [ТЗ 3] название
    sub: "Пришло время проверить свою машину", // [006]
    scroll: "Листайте", // [UI]
  },
  /** [ТЗ 6.3] бегущая лента */
  marquee: ["Проверка авто", "Ремонт", "Радиатор АКПП", "Мотоциклы и авто путешественников"],
  map: {
    label: "Карта Carleone", // [ТЗ 5]
    scheme: "Схема, не карта", // [ТЗ 5]
    stages: <Stage[]>[
      {
        code: "KZ",
        kicker: "Казахстан",
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
  services: {
    label: "Услуги",
    title: ["Что", "*делаем*"],
    items: [
      {
        id: "check",
        title: "Проверка автомобиля", // [ТЗ 3] [006]
        text: "Пришло время проверить свою машину в Carleone Service. Приезжай, ждём тебя.", // [006]
      },
      {
        id: "repair",
        title: "Ремонт при поломке", // [ТЗ 6.5]
        text: "«В дороге случилась поломка, но теперь всё позади — автомобиль отремонтирован и снова готов покорять километры.»", // [012]
      },
      {
        id: "radiator",
        title: "Дополнительный радиатор охлаждения АКПП", // [007] [014]
        text: "Установка дополнительного радиатора охлаждения АКПП — на Rav4 и на Toyota.", // [007] [014]
      },
      {
        id: "travel",
        title: "Техника путешественников", // [ТЗ 3]
        text: "Обслуживание и ремонт техники путешественников, в том числе мотоциклов.", // [005] [012]
      },
    ],
    underbodyText: "Работа по арке и днищу.", // [004] — показывается только с CONFIG.underbodyServiceName
    carSales: { title: "Продажа автомобилей", text: "Уточняйте по телефону." }, // только с CONFIG.showCarSales
  },
  radiator: {
    kicker: "Rav4 · АКПП",
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
    label: "Было / стало",
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
  works: {
    label: "Работы",
    title: ["Наши *работы*"],
    hint: "Листайте", // [UI]
    of: "из",
  },
  contacts: {
    label: "Контакты",
    title: ["Приезжай,", "*ждём тебя*"], // [006]
    phone: "Телефон",
    whatsapp: "WhatsApp",
    address: "Адрес",
    hours: "Часы работы",
    instagram: "Instagram",
    country: "Казахстан",
    note: "Цены и сроки — уточняйте по телефону.", // [ТЗ 3]
    bookText: "Оставьте имя, телефон и пару слов о машине — заявка откроется в WhatsApp.", // [UI]
  },
  form: {
    title: "Записаться",
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
    noWhatsapp: "Номер WhatsApp ещё не указан в настройках сайта.",
    msgHello: "Здравствуйте! Хочу записаться в Carleone Service.",
    msgName: "Имя",
    msgPhone: "Телефон",
    msgCar: "Автомобиль",
    msgProblem: "Что случилось",
  },
  footer: {
    country: "Казахстан",
    scheme: "Схема, не карта: глобус показывает страны, откуда приезжали гости, а не точные маршруты.", // [ТЗ 5]
    top: "Наверх",
  },
  cursor: { drag: "Тянуть", scroll: "Листать", compare: "Двигать" },
};

type Dict = typeof ru;

const en: Dict = {
  meta: {
    title: "Carleone Service — car service, Kazakhstan",
    titleCity: "Carleone Service — car service, {city}, Kazakhstan",
    description:
      "Carleone Service, Kazakhstan: car checks and repair, servicing travellers' vehicles including motorcycles, installation of an additional automatic transmission (ATF) cooler.",
    ogTitle: "Carleone Service — one more country on the map",
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
  },
  nav: {
    map: "Map",
    services: "Services",
    works: "Work",
    contacts: "Contacts",
  },
  cta: {
    call: "Call",
    whatsapp: "Message on WhatsApp",
    whatsappShort: "WhatsApp",
    book: "Book a visit",
    price: "Ask the price",
    route: "Get directions",
    works: "See our work",
    reel: "Reel on Instagram",
  },
  priceAnswer: "Please ask for the price by phone",
  fill: "TO FILL",
  hero: {
    country: "Kazakhstan",
    title: ["Carleone", "*Service*"],
    sub: "It's time to check your car",
    scroll: "Scroll",
  },
  marquee: ["Car check", "Repair", "ATF cooler", "Travellers' motorcycles and cars"],
  map: {
    label: "The Carleone map",
    scheme: "A diagram, not a map",
    stages: <Stage[]>[
      {
        code: "KZ",
        kicker: "Kazakhstan",
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
  services: {
    label: "Services",
    title: ["What", "*we do*"],
    items: [
      {
        id: "check",
        title: "Car check",
        text: "It's time to check your car at Carleone Service. Come by, we're waiting for you.",
      },
      {
        id: "repair",
        title: "Repair after a breakdown",
        text: "“A breakdown happened on the road, but now it's all behind — the car has been repaired and is ready to conquer the kilometres again.”",
      },
      {
        id: "radiator",
        title: "Additional ATF cooler",
        text: "Installation of an additional automatic transmission (ATF) cooler — on a Rav4 and on a Toyota.",
      },
      {
        id: "travel",
        title: "Travellers' vehicles",
        text: "Servicing and repair of travellers' vehicles, including motorcycles.",
      },
    ],
    underbodyText: "Work on the wheel arch and underbody.",
    carSales: { title: "Car sales", text: "Please ask by phone." },
  },
  radiator: {
    kicker: "Rav4 · Automatic transmission",
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
    label: "Before / after",
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
  works: { label: "Work", title: ["Our *work*"], hint: "Scroll", of: "of" },
  contacts: {
    label: "Contacts",
    title: ["Come by,", "*we're waiting*"],
    phone: "Phone",
    whatsapp: "WhatsApp",
    address: "Address",
    hours: "Opening hours",
    instagram: "Instagram",
    country: "Kazakhstan",
    note: "Prices and timing — please ask by phone.",
    bookText: "Leave your name, phone and a few words about the car — the request opens in WhatsApp.",
  },
  form: {
    title: "Book a visit",
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
    noWhatsapp: "The WhatsApp number is not set in the site settings yet.",
    msgHello: "Hello! I would like to book a visit to Carleone Service.",
    msgName: "Name",
    msgPhone: "Phone",
    msgCar: "Car",
    msgProblem: "What happened",
  },
  footer: {
    country: "Kazakhstan",
    scheme: "A diagram, not a map: the globe shows the countries our guests came from, not exact routes.",
    top: "Back to top",
  },
  cursor: { drag: "Drag", scroll: "Scroll", compare: "Slide" },
};

export const DICT: Record<Lang, Dict> = { ru, en };
export type { Dict };
