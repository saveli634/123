import manifest from "@/content/images.generated.json";
import type { ImageName } from "@/content/site";
import { cn } from "@/lib/utils";

type Manifest = Record<string, { w: number; h: number; widths: number[]; color: string }>;
const images = manifest as Manifest;

const src = (name: string, w: number, ext: "webp" | "jpg") =>
  `${import.meta.env.BASE_URL}img/${name}-${w}.${ext}`;

export interface ImgProps {
  name: ImageName;
  alt: string;
  /** Атрибут sizes: насколько широко картинка показана в вёрстке */
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  /** CSS object-position — чтобы кадр не резал лица */
  position?: string;
  /** Цветной фон-плейсхолдер пока фото грузится */
  placeholder?: boolean;
}

/** Адаптивное фото: webp + jpg-фолбэк, реальные размеры, цветной плейсхолдер. */
export function Img({
  name,
  alt,
  sizes,
  priority = false,
  className,
  imgClassName,
  position = "50% 50%",
  placeholder = true,
}: ImgProps) {
  const meta = images[name];
  const largest = meta.widths[meta.widths.length - 1];
  const fallbackW = meta.widths.find((w) => w >= 800) ?? largest;
  const set = (ext: "webp" | "jpg") =>
    meta.widths.map((w) => `${src(name, w, ext)} ${w}w`).join(", ");

  return (
    <picture className={cn("block overflow-hidden", className)} style={placeholder ? { backgroundColor: meta.color } : undefined}>
      <source type="image/webp" srcSet={set("webp")} sizes={sizes} />
      <img
        src={src(name, fallbackW, "jpg")}
        srcSet={set("jpg")}
        sizes={sizes}
        alt={alt}
        width={meta.w}
        height={meta.h}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        draggable={false}
        className={cn("h-full w-full object-cover", imgClassName)}
        style={{ objectPosition: position }}
      />
    </picture>
  );
}
