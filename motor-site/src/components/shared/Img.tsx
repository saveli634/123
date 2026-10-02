import { IMAGES, type ImageName } from "@/content/images";
import { singleFile } from "@/content/imgsrc";
import { cn } from "@/lib/utils";

export interface ImgProps {
  name: ImageName;
  alt: string;
  /** Атрибут sizes: какую ширину картинка занимает в вёрстке */
  sizes: string;
  priority?: boolean;
  className?: string;
  /** object-position / background-position */
  position?: string;
  contain?: boolean;
}

const url = (name: string, w: number) => `./img/${name}-${w}.webp`;

/**
 * Фото: на хостинге — <img> c srcset (две ширины webp), реальные width/height (CLS = 0),
 * ленивую загрузку ниже первого экрана. В однофайловой версии — элемент с CSS-классом,
 * где картинка встроена один раз (data-URL), поэтому повторы не утяжеляют файл.
 */
export function Img({ name, alt, sizes, priority = false, className, position = "50% 50%", contain = false }: ImgProps) {
  const meta = IMAGES[name];
  if (singleFile) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={cn("img-bg", contain ? "img-contain" : "img-cover", `im-${name}`, className)}
        style={{ backgroundPosition: position }}
      />
    );
  }
  const largest = meta.widths[meta.widths.length - 1];
  return (
    <img
      src={url(name, largest)}
      srcSet={meta.widths.map((w) => `${url(name, w)} ${w}w`).join(", ")}
      sizes={sizes}
      alt={alt}
      width={meta.w}
      height={meta.h}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      draggable={false}
      className={cn("img-el", contain ? "img-contain" : "img-cover", className)}
      style={{ objectPosition: position }}
    />
  );
}
