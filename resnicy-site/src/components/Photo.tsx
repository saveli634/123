import meta from "@/content/media.generated.json";
import { single } from "@/media-src";

export type PhotoName = keyof typeof meta;

interface Props {
  name: PhotoName;
  alt: string;
  sizes: string;
  className?: string;
  /** Точка кадрирования (как object-position). */
  position?: string;
  eager?: boolean;
}

/**
 * Фото: в обычной сборке — <img> с несколькими ширинами WebP,
 * в однофайловой — элемент с фоном из встроенного CSS-класса (каждое фото встроено один раз).
 */
export function Photo({ name, alt, sizes, className = "", position, eager }: Props) {
  const m = meta[name];
  if (single)
    return (
      <span
        {...(alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true })}
        className={`photo img-${name} ${className}`}
        style={position ? { backgroundPosition: position } : undefined}
      />
    );
  const files = m.files;
  return (
    <img
      className={`photo ${className}`}
      src={`./media/${files[files.length - 1].file}`}
      srcSet={files.map((f) => `./media/${f.file} ${f.w}w`).join(", ")}
      sizes={sizes}
      alt={alt}
      width={m.w}
      height={m.h}
      loading={eager ? "eager" : "lazy"}
      decoding={eager ? "sync" : "async"}
      fetchPriority={eager ? "high" : undefined}
      draggable={false}
      style={position ? { objectPosition: position } : undefined}
    />
  );
}

export const ratio = (name: PhotoName) => meta[name].w / meta[name].h;
