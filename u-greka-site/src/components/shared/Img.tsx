import manifest from "@/content/images.generated.json";
import type { ImageName } from "@/data/types";
import { singleFile } from "@/content/imgsrc";
import { cn } from "@/lib/utils";

type Meta = { w: number; h: number; widths: number[]; color: string };
const images = manifest as Record<string, Meta>;
const base = `${import.meta.env.BASE_URL}images/`;

/** Адаптивное фото: WebP-набор ширин + JPG-запаска; в однофайловой версии — фон из встроенного CSS. */
export function Img({
  name,
  alt,
  sizes,
  priority = false,
  className,
  position,
}: {
  name: ImageName;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  position?: string;
}) {
  const meta = images[name];
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
