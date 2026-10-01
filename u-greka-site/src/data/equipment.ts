import type { Photo } from "./types";

/** Оборудование: подписи называют только функцию; бренды — лишь те, что видны/написаны (LAUNCH, «Радиатор 5.0»). */
export const equipment: (Photo & { title: string })[] = [
  { name: "equip-lift-bay", title: "Четырёхстоечный подъёмник", alt: "Синий четырёхстоечный подъёмник в боксе" },
  { name: "equip-alignment", title: "Стенд развал-схождения", alt: "Датчик стенда развал-схождения на колесе" },
  { name: "ac-station-grey", title: "Станция заправки кондиционеров", alt: "Станция заправки кондиционеров у автомобиля" },
  { name: "heater-flush-unit", title: "Аппарат промывки «Радиатор 5.0»", alt: "Аппарат импульсной промывки «Радиатор 5.0»" },
  { name: "fuel-injector-stand", title: "Стенд чистки форсунок LAUNCH", alt: "Стенд LAUNCH для чистки и проверки форсунок" },
  { name: "equip-launch-case", title: "Сканер LAUNCH для диагностики", alt: "Кейс диагностического сканера LAUNCH" },
];
