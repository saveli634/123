import type { CSSProperties } from "react";
import { singleFile } from "@/content/imgsrc";
import { img, type ImgName } from "@/content/media";

interface Props {
  name: ImgName;
  alt: string;
  sizes?: string;
  className?: string;
  eager?: boolean;
  /** contain — для просмотра на весь экран */
  fit?: "cover" | "contain";
  style?: CSSProperties;
}

/**
 * Фото. Обычная сборка: <picture> с WebP разных ширин и JPG для старых Safari.
 * Однофайловая: <span> с CSS-классом .img-<имя> — картинка встроена в файл один раз.
 * Кадр центрируется по точке лица из manifest.csv.
 */
export function Photo({ name, alt, sizes = "50vw", className = "", eager, fit = "cover", style }: Props) {
  const i = img(name);
  if (!i) return null;
  const pos = `${Math.round(i.fx * 100)}% ${Math.round(i.fy * 100)}%`;
  if (singleFile) {
    return (
      <span
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={`ph img-${name} ${className}`}
        style={{ backgroundPosition: fit === "cover" ? pos : "center", backgroundSize: fit, backgroundColor: i.color, ...style }}
      />
    );
  }
  return (
    <picture className={`ph ${className}`} style={{ backgroundColor: i.color, ...style }}>
      <source type="image/webp" srcSet={i.widths.map((w) => `./img/${name}-${w}.webp ${w}w`).join(", ")} sizes={sizes} />
      <img
        src={`./img/${name}.${i.ext}`}
        alt={alt}
        width={i.w}
        height={i.h}
        loading={eager ? "eager" : "lazy"}
        decoding={eager ? "sync" : "async"}
        {...(eager ? { fetchPriority: "high" as const } : {})}
        style={{ objectPosition: pos, objectFit: fit }}
      />
    </picture>
  );
}

/** URL фото для текстуры WebGL: файл (обычная сборка) или data-URL из встроенного CSS. */
export function photoUrl(name: ImgName, width: number): string {
  if (!singleFile) {
    const i = img(name);
    const w = i.widths.filter((x) => x <= width).pop() ?? i.widths[0];
    return `./img/${name}-${w}.webp`;
  }
  const probe = document.createElement("span");
  probe.className = `img-${name}`;
  probe.style.display = "none";
  document.body.appendChild(probe);
  const bg = getComputedStyle(probe).backgroundImage;
  probe.remove();
  const m = bg.match(/url\(["']?(.*?)["']?\)$/);
  return m ? m[1] : "";
}
