import manifest from "@/content/images.generated.json";
import { guestMeta } from "@/content/guestsrc";
import { singleFile } from "@/content/imgsrc";
import { cn } from "@/lib/utils";

type Meta = { w: number; h: number; widths: number[]; color: string };
const images = { ...(manifest as Record<string, Meta>), ...guestMeta };
const base = `${import.meta.env.BASE_URL}images/`;

export const hasImage = (name: string) => name in images;

/**
 * Адаптивное фото: WebP разных ширин + JPG-запаска.
 * В однофайловой версии — фон из встроенного CSS (каждый кадр встроен один раз).
 * Размеры заданы заранее (width/height + aspect-ratio контейнера) — без сдвигов вёрстки.
 */
export function Img({
  name,
  alt,
  sizes,
  priority = false,
  className,
  position,
}: {
  name: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  position?: string;
}) {
  const meta = images[name];
  if (!meta) return null;
  if (singleFile) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={cn("photo block h-full w-full bg-cover bg-no-repeat", `img-${name}`, className)}
        style={{ backgroundPosition: position ?? "50% 50%", backgroundColor: meta.color }}
      />
    );
  }
  return (
    <picture className="contents">
      <source type="image/webp" sizes={sizes} srcSet={meta.widths.map((w) => `${base}${name}-${w}.webp ${w}w`).join(", ")} />
      <img
        src={`${base}${name}.jpg`}
        alt={alt}
        width={meta.w}
        height={meta.h}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        draggable={false}
        className={cn("photo block h-full w-full object-cover", className)}
        style={{ objectPosition: position, backgroundColor: meta.color }}
      />
    </picture>
  );
}

/** Адрес кадра для текстуры 3D-сцены: файл (хостинг) или встроенные данные (один файл). */
export function imageUrl(name: string, width = 720): string {
  if (!singleFile) return `${base}${name}-${width}.webp`;
  const probe = document.createElement("span");
  probe.className = `img-${name}`;
  probe.style.display = "none";
  document.body.appendChild(probe);
  const bg = getComputedStyle(probe).backgroundImage;
  probe.remove();
  const m = bg.match(/url\(["']?(.*?)["']?\)$/);
  return m ? m[1] : "";
}
