import type { Photo } from "./types";

/** Галерея «Работы»: реальные фото + подписи по содержанию постов. Ничего не придумано. */
export type WorkCategory = "kondicionery" | "pechki" | "dvigatel" | "hodovaya" | "obves";

export const workFilters: { value: "all" | WorkCategory; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "kondicionery", label: "Кондиционеры" },
  { value: "pechki", label: "Печки" },
  { value: "dvigatel", label: "Двигатель" },
  { value: "hodovaya", label: "Ходовая" },
  { value: "obves", label: "Обвес" },
];

export interface Work extends Photo {
  category: WorkCategory;
  ratio: "4/5" | "4/3" | "1/1";
}

export const works: Work[] = [
  { category: "obves", ratio: "4/3", name: "obves-lc70-front", alt: "Land Cruiser 70 с силовым бампером и лебёдкой, вид спереди", tag: "Land Cruiser 70 · бампер с лебёдкой" },
  { category: "kondicionery", ratio: "4/5", name: "ac-gwagen", alt: "Заправка кондиционера на Mercedes G-класса", tag: "Mercedes G · кондиционер" },
  { category: "obves", ratio: "4/5", name: "obves-rear-carrier", alt: "Калитка запасного колеса и фаркоп на Subaru Forester", tag: "Subaru Forester · калитка и фаркоп" },
  { category: "dvigatel", ratio: "1/1", name: "trans-transfer-chain", alt: "Цепь раздаточной коробки", tag: "Раздатка · замена цепи" },
  { category: "pechki", ratio: "1/1", name: "heater-flush-blue-1", alt: "Промывка печки на аппарате: кроссовер Nissan", tag: "Промывка печки на аппарате" },
  { category: "hodovaya", ratio: "4/5", name: "chassis-offroad-alignment", alt: "Развал-схождение на внедорожнике", tag: "Геометрия внедорожника" },
  { category: "obves", ratio: "4/3", name: "obves-prado120-front", alt: "Передняя защита (кенгурятник) на Toyota Prado 120", tag: "Prado 120 · передняя защита" },
  { category: "kondicionery", ratio: "1/1", name: "ac-evaporator-prado", alt: "Чистка испарителя кондиционера на Toyota Prado", tag: "Prado · чистка испарителя" },
  { category: "dvigatel", ratio: "1/1", name: "engine-valvetrain", alt: "Двигатель со снятой клапанной крышкой", tag: "Клапанная крышка · ремонт" },
  { category: "obves", ratio: "4/3", name: "obves-pickup-rollbar-3", alt: "Ролл-бар в кузове пикапа", tag: "Пикап · ролл-бар" },
  { category: "pechki", ratio: "1/1", name: "heater-flush-blue-3", alt: "Промывка печки: Nissan с подключёнными шлангами аппарата", tag: "Nissan · промывка печки" },
  { category: "kondicionery", ratio: "4/5", name: "ac-evaporator-dirty", alt: "Грязный испаритель кондиционера до чистки", tag: "Испаритель до чистки" },
  { category: "dvigatel", ratio: "1/1", name: "trans-lsd-differential", alt: "Дифференциал LSD", tag: "Редуктор LSD" },
  { category: "obves", ratio: "4/3", name: "obves-prado120-rear", alt: "Задний бампер с калиткой запаски на Toyota Prado 120", tag: "Prado 120 · задний бампер" },
  { category: "hodovaya", ratio: "4/3", name: "equip-alignment", alt: "Датчик развала-схождения на колесе", tag: "Развал-схождение" },
  { category: "obves", ratio: "4/5", name: "obves-step", alt: "Боковой порог на внедорожнике", tag: "Пороги" },
  { category: "pechki", ratio: "1/1", name: "heater-flush-blue-2", alt: "Промывка печки на внедорожнике Nissan", tag: "Промывка печки" },
  { category: "obves", ratio: "4/3", name: "obves-rear-spare-2", alt: "Задний силовой бампер на зелёном внедорожнике", tag: "Задний силовой бампер" },
];
