# Carleone Service — сайт автосервиса

Одностраничный сайт автосервиса Carleone Service (Казахстан). Одна идея — «Ещё одна страна на карте
Carleone Service»: тёмный 3D-глобус, на котором золотые дуги маршрутов путешественников сходятся
в Казахстане. Vite + React 19 + TypeScript + Tailwind CSS v4, Three.js (лениво), Lenis (мышь и тачпад),
Radix Dialog (форма записи). Шрифты Playfair Display и Manrope (@fontsource, только кириллица и латиница).

## Что где

| Что | Где |
| --- | --- |
| Настройки владельца (город, телефон, WhatsApp, Instagram, флаги) | `src/config.ts` |
| Все тексты RU/EN с источником каждой фразы | `src/content/i18n.ts`, `src/content/frames.ts` |
| Глобус (Three.js), сценарий этапов, кадры камеры | `src/globe/` |
| Разделы страницы | `src/sections/` |
| Таблица «строка на сайте → источник» | `TEXT_SOURCES.md` |
| Отчёт для владельца | `REPORT.md` |
| Самопроверка: круг 1 и круг 2 | `qa/ROUND1.md`, `qa/ROUND2.md`, скриншоты `qa/round1/`, `qa/round2/` |

## Команды

```bash
npm install
npm run dev            # разработка
npm run build          # dist/ — версия для хостинга (index.html RU + en.html EN), демо с плашками «ЗАПОЛНИТЬ»
npm run build:single   # site.html — один файл, открывается двойным щелчком без интернета (≤ 5 МБ)
npm run build:release  # то же без плашек; падает, пока в src/config.ts пусты city, phone/whatsapp, instagram
npm run typecheck
```

Подготовка материалов (результат уже в репозитории, повторять нужно только при замене исходников):

```bash
npm run assets   # кадры (грейд, размытие чужих логотипов, WebP), лев в SVG, данные глобуса, шрифты
npm run renders  # рендеры глобуса и картинка Open Graph через headless Chromium (нужен Chromium:
                 # PLAYWRIGHT_BROWSERS_PATH или CHROME_PATH)
```

Проверка (нужен Chromium): `npm run qa:shots -- --out qa/shots` (скриншоты всех режимов),
`node scripts/qa/interact.mjs` (переключатель языка, форма, наклейка, шторка),
`node scripts/qa/intro.mjs` (кадры прелоадера), `node scripts/qa/links.mjs --seo` (кнопки и ссылки
в релизной сборке с тестовыми значениями; config.ts возвращается как был),
`node scripts/qa/lighthouse.mjs [--desktop] [--page en.html]` (Lighthouse 13.0.1 под Chromium 141).

## Как это устроено

- **Пререндер.** Страница собирается в HTML на этапе сборки (`src/entry-server.tsx` →
  `scripts/prerender.mjs`): весь текст виден без JavaScript. Анимации появления прячут элементы
  только при классе `.js` на `<html>`; если приложение не ожило за 2 с, класс снимается.
- **Глобус.** ~9 000 точек суши — спираль Фибоначчи по маске суши Natural Earth 1:110m
  (`scripts/globe-data.mjs`, хранится битовой маской ≈5 КБ). Three.js грузится по первому действию
  пользователя (прокрутка, мышь, касание), рисует только когда сцену видно и вкладка активна;
  если кадры медленные (<40 fps за 2 с) — снижает плотность пикселей и число точек. Без WebGL 2,
  при «уменьшить движение» и без JS — готовые рендеры того же глобуса (`src/assets/renders/`).
- **Кадры.** Единый грейд `sepia(.18) contrast(1.1) saturate(.8) brightness(.9)` запекается при сборке
  (`scripts/images.mjs`, sharp), поверх — градиент снизу, виньетка, зерно и тонкая золотая рамка.
  Надписи производителей на подъёмнике, шлеме и канистре размыты по маске.
- **Лев.** `logo/lion.png` векторизован (`scripts/lion.mjs`, potrace по альфе + упрощение контуров):
  4 КБ пути. Из него же — прелоадер (контур прорисовывается чистым CSS), медальон на глобусе,
  наклейка с высечкой и значок вкладки.
- **Однофайловая версия.** `vite-plugin-singlefile`: скрипты, стили, шрифты, кадры (WebP ≤1200 px,
  q74, каждый встроен один раз — в CSS-класс) и рендеры глобуса внутри одного HTML.
- **Старые браузеры.** Сборка скриптов под es2017 / Safari 12+, CSS понижается lightningcss,
  каскадные слои `@layer` «расплющиваются» (`scripts/compat.mjs`).

## Хостинг

Залить содержимое `dist/` на любой статический хостинг (сжатие gzip/brotli включено почти везде
по умолчанию). После подключения домена вписать его в `CONFIG.siteUrl` и пересобрать: `canonical`,
`hreflang` и `og:image` станут абсолютными.
