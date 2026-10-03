/**
 * Настройки сайта — заполняет владелец.
 *
 * Правило: пустое поле → элемент на сайте не выводится.
 * В демо-сборке (npm run build / build:single) на месте пустого поля видна плашка «ЗАПОЛНИТЬ: …».
 * Релизная сборка (npm run build:release) не соберётся, пока пусты city, instagram
 * и оба контакта phone / whatsapp.
 *
 * Формат телефонов — как удобно читать: "+7 700 000 00 00". Для ссылок цифры берутся автоматически.
 */
export interface Service {
  /** Название услуги — точно так, как его называет салон */
  name: string;
  /** Цена текстом, например "от 15 000 ₸". Пусто → «Цену уточняйте по телефону» */
  price?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  /** Имя файла фото в source-media/team/ (без расширения). Выводится только при showStaffFaces */
  photo?: string;
}

export interface SiteConfig {
  name: string;
  city: string;
  address: string;
  workHours: string;
  phone: string;
  whatsapp: string;
  /** Ссылка на профиль: https://instagram.com/… */
  instagram: string;
  /** Ссылка на карту (2ГИС, Яндекс, Google) для кнопки «Построить маршрут» */
  mapLink: string;
  services: Service[];
  team: TeamMember[];
  /** Фото гостий из guests/ — только после их письменного согласия */
  showGuestPhotos: boolean;
  /** @-аккаунты гостий — только после отдельного разрешения */
  showGuestHandles: boolean;
  /** Лица мастеров (guest_a_02, guest_a_03 и раздел «Команда») — только после их согласия */
  showStaffFaces: boolean;
  /** Ролик 004 не используется: кадры похожи на генерацию. Только по прямому указанию владельца */
  showAiReel: boolean;
}

export const CONFIG: SiteConfig = {
  name: "Queen Bee",
  city: "",
  address: "",
  workHours: "",
  phone: "",
  whatsapp: "",
  instagram: "",
  mapLink: "",
  services: [],
  team: [],
  showGuestPhotos: false,
  showGuestHandles: false,
  showStaffFaces: false,
  showAiReel: false,
};
