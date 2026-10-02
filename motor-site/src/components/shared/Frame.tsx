import { useRef, type CSSProperties, type ReactNode } from "react";
import { IMAGES, type ImageName } from "@/content/images";
import { Img } from "./Img";
import { useScrollFx } from "@/lib/scroll";
import { cn } from "@/lib/utils";

export interface FrameProps {
  img: ImageName;
  alt: string;
  sizes: string;
  /** Подпись под кадром (рамка-стойка). Без подписи — просто окно. */
  caption?: ReactNode;
  /** Номер кадра в подписи: «FIG. 03» */
  index?: string;
  /** Параллакс внутри окна: сдвиг кадра в процентах высоты при прокрутке */
  parallax?: number;
  /** Шторка-проявление вдоль красной линии при появлении */
  wipe?: boolean;
  priority?: boolean;
  /** Пропорция окна (высота / ширина); по умолчанию — как у кадра */
  ratio?: number;
  position?: string;
  className?: string;
  style?: CSSProperties;
  delay?: number;
}

/**
 * Вертикальное «окно» под кадр из видео: скруглённый прямоугольник со срезанным углом 45°,
 * единый грейд поверх (красный multiply-градиент, зерно, виньетка), подпись на «стойке».
 * Кадры 720 px на весь экран не растягиваются — только такими окнами.
 */
export function Frame({ img, alt, sizes, caption, index, parallax = 0, wipe = true, priority, ratio, position, className, style, delay = 0 }: FrameProps) {
  const ref = useRef<HTMLElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const meta = IMAGES[img];
  const r = ratio ?? meta.h / meta.w;

  useScrollFx(ref, (p) => {
    if (!parallax || !inner.current) return;
    inner.current.style.transform = `translate3d(0, ${((0.5 - p) * parallax).toFixed(2)}%, 0)`;
  });

  return (
    <figure
      ref={ref}
      className={cn("frame", wipe && "rv wipe", className)}
      style={{ ...style, ["--d" as string]: `${delay}ms` }}
    >
      <span className="ph" style={{ paddingTop: `${(r * 100).toFixed(3)}%` }}>
        <span className="ph-rev">
          <span ref={inner} className={cn("ph-in", parallax ? "ph-par" : "")}>
            <Img name={img} alt={alt} sizes={sizes} priority={priority} position={position} className="ph-media" />
          </span>
        </span>
        <span className="ph-fx" aria-hidden="true" />
        {wipe && (
          <span className="ph-wipe" aria-hidden="true">
            <span />
          </span>
        )}
      </span>
      {caption && (
        <figcaption className="rack">
          <span className="rack-mark" aria-hidden="true" />
          {index && <span className="rack-n num">{index}</span>}
          <span className="rack-t">{caption}</span>
        </figcaption>
      )}
    </figure>
  );
}
