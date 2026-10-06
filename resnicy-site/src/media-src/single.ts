/**
 * Однофайловая сборка: каждое фото встроено один раз (CSS-класс .img-<имя>),
 * ролик встроен в скрипт и подключается только в браузере (в HTML-разметке его нет).
 */
import "../../single-img/images.css";
import reel from "../../public/media/reel.mp4?inline";

export const single = true;
export const videoUrl: string = reel;
