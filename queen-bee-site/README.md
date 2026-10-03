# Queen Bee · Boheme Residence — сайт

Одностраничный сайт салона Queen Bee, проект Queen Bee Boheme Residence.
Vite + React 19 + TypeScript + Tailwind CSS v4, Three.js (лениво), Lenis (только мышь и тачпад),
Radix Dialog для формы записи. Шрифты Cormorant Garamond 500/600 и курсив, Manrope Variable,
только кириллица и латиница, только woff2.

Отчёт для владельца, вопросы и самопроверка текста: [`deliver/ОТЧЁТ.md`](deliver/ОТЧЁТ.md).

## Команды

```bash
npm install
npm run dev            # разработка, http://localhost:5173
npm run build          # dist/: хостинг (пререндер, CSS встроен, preload шрифтов)
npm run build:single   # dist-single/index.html: один файл (лимит 5 МБ проверяется)
npm run build:release  # то же, но без плашек «ЗАПОЛНИТЬ»; падает, пока config.ts не заполнен
npm run images         # пересобрать фото из source-media/ (sharp: грейд, виньетирование, размытие брендов)
npm run renders        # рендеры спирали для режима без WebGL и og-image (нужен запущенный npm run dev)
npm run fonts          # пересобрать src/fonts.css
```

## Где что

- `src/config.ts`: настройки владельца (контакты, услуги, флаги согласий). Пустое поле не выводится.
- `src/content/text.ts`: весь видимый текст, у каждой строки указан источник. Неразрывные пробелы ставятся при сборке (`vite.config.ts`, плагин `qb-typograf`).
- `src/content/guests.ts`: какие фото гостий показываются (кадры с мастером — только при `showStaffFaces`).
- `src/three/scene.ts`, `src/three/bee.ts`: 3D-сцена «Пчела ведёт по резиденции» и процедурная пчела.
- `src/components/sections/*`: разделы страницы. `src/lib/*`: прокрутка, проявления, магниты, перелив фона.
- `scripts/`: картинки, рендеры, пререндер, совместимость CSS (Safari 12+, без `@layer`), проверка релиза, скриншоты.

## Режимы и запасные варианты

- **Без JS** (предпросмотр на iPhone, мессенджеры): разметка пререндерена, всё видно. Элементы, которые проявляются, прячутся только при классе `.js` на `<html>`; через 2 с без скрипта класс снимается.
- **Без WebGL 2 / reduced motion**: вместо 3D статичная лента из рендеров той же спирали (`renders/` → `public/images/spiral-*`).
- **Медленные кадры** (меньше 40 fps за 2 с): сцена снижает pixelRatio, число частиц и убирает мягкие тени.
- WebGL проверяется только при подходе к сцене, чтобы не тормозить первый экран.

## Фото

- `source-media/interiors/`: 10 кадров интерьера (720 px). Зоны размытия (надпись на коробке, отражения людей) — в `scripts/images.mjs`.
- `source-media/guests/`: **не в git** (нужно письменное согласие гостий). Обработанные копии — в `media-guests/`, тоже не в git. В сборку попадают только при `showGuestPhotos: true` и только показываемые кадры.

## Проверки

```bash
node scripts/shots.mjs <url> <папка> webgl,nowebgl,rm,nojs 1440x900,390x844   # скриншоты, ошибки консоли, горизонтальная прокрутка
node scripts/res-shots.mjs <url> <папка> 1440x900 0,0.115,0.485,0.97           # кадры 3D-сцены на заданном прогрессе
sh scripts/lh.sh <url> lighthouse/out.json                                      # Lighthouse, мобильный профиль
```

Проверить ссылки и форму с тестовыми контактами (в git не попадают):
`QB_CONFIG='{"phone":"+7 700 000 00 00","whatsapp":"+7 700 000 00 01"}' npm run build:single`.
Предпросмотр с фото гостий: `QB_SHOW_GUESTS=1 npm run build:single`.
