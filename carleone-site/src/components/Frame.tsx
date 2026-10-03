import type { CSSProperties, ReactNode } from "react";
import meta from "@/generated/frames.json";
import { singleFile } from "@/imgsrc";
import { ALT, type FrameName } from "@/content/frames";
import { useLang } from "@/lib/lang";
import { cn } from "@/lib/cn";

type Meta = { w: number; h: number; widths: number[]; color: string };
const FRAMES = meta as Record<FrameName, Meta>;
const base = `${import.meta.env.BASE_URL}frames/`;

/**
 * Кадр из ролика в «окне»: единый грейд уже «запечён» при сборке (scripts/images.mjs),
 * поверх — градиент снизу, виньетка, зерно и тонкая золотая рамка (CSS .frame).
 * ratio — пропорция окна (ширина / высота); без неё — пропорция кадра; fill — окно растягивается по родителю.
 * В однофайловой версии кадр — фон из встроенного CSS-класса (каждый кадр встроен один раз).
 */
export function Frame({
  name,
  ratio,
  fill,
  sizes = "(max-width: 767px) 90vw, 40vw",
  position,
  alt,
  decorative,
  eager,
  className,
  imgClassName,
  style,
  children,
}: {
  name: FrameName;
  ratio?: number;
  fill?: boolean;
  sizes?: string;
  position?: string;
  alt?: string;
  decorative?: boolean;
  eager?: boolean;
  className?: string;
  imgClassName?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  const m = FRAMES[name];
  const { lang } = useLang();
  const label = decorative ? "" : (alt ?? ALT[name][lang]);
  const pad = ((ratio ? 1 / ratio : m.h / m.w) * 100).toFixed(3);
  const vars = { "--fc": m.color, ...style } as CSSProperties;

  return (
    <div className={cn("frame", fill && "absolute inset-0", className)} style={vars}>
      {!fill && <div className="frame-box" style={{ paddingTop: `${pad}%` }} />}
      {singleFile ? (
        <span
          role={label ? "img" : undefined}
          aria-label={label || undefined}
          aria-hidden={label ? undefined : true}
          className={cn("frame-bg", `f-${name}`, imgClassName)}
          style={{ backgroundPosition: position ?? "50% 50%" }}
        />
      ) : (
        <picture>
          <source
            type="image/webp"
            sizes={sizes}
            srcSet={m.widths.map((w) => `${base}${name}-${w}.webp ${w}w`).join(", ")}
          />
          <img
            className={cn("frame-img", imgClassName)}
            src={`${base}${name}.jpg`}
            alt={label}
            width={m.w}
            height={m.h}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={eager ? "high" : undefined}
            decoding="async"
            draggable={false}
            style={{ objectPosition: position }}
          />
        </picture>
      )}
      {children}
    </div>
  );
}
