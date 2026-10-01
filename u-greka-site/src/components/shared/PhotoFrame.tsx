import { useRef, type RefObject } from "react";
import type { Photo } from "@/data/types";
import { useScrollVar, useTilt } from "@/lib/scrollFx";
import { cn } from "@/lib/utils";
import { Img } from "./Img";

const ratios = { "4/5": "aspect-[4/5]", "4/3": "aspect-[4/3]", "1/1": "aspect-square", "16/9": "aspect-video", "3/4": "aspect-[3/4]" } as const;
export type Ratio = keyof typeof ratios;

const none: RefObject<HTMLElement | null> = { current: null };

/**
 * Единая рамка фото: пропорция, ярлык-подпись, ховер; если передан onOpen — открывает просмотр.
 * parallax — фото медленнее рамки при прокрутке; tilt — 3D-наклон за курсором (только мышь).
 */
export function PhotoFrame({
  photo,
  ratio = "4/3",
  sizes,
  onOpen,
  className,
  priority,
  parallax,
  tilt,
  onFocus,
}: {
  photo: Photo;
  ratio?: Ratio;
  sizes: string;
  onOpen?: () => void;
  className?: string;
  priority?: boolean;
  parallax?: boolean;
  tilt?: boolean;
  onFocus?: () => void;
}) {
  const frame = useRef<HTMLElement>(null);
  useScrollVar(parallax ? frame : none);
  useTilt(tilt ? frame : none, 5);

  const img = <Img name={photo.name} alt={photo.alt} sizes={sizes} position={photo.position} priority={priority} />;
  const inner = (
    <>
      <span className={cn("frame-media block overflow-hidden", ratios[ratio])}>{parallax ? <span className="par block h-full w-full">{img}</span> : img}</span>
      {photo.tag && (
        <span className="caption-tag mono absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-[2px] bg-bg/88 px-2.5 py-1.5 text-[0.72rem] text-text">
          <span aria-hidden="true" className="mr-1.5 text-accent">■</span>
          {photo.tag}
        </span>
      )}
      {tilt && <span aria-hidden="true" className="tilt-glare" />}
    </>
  );
  if (onOpen) {
    return (
      <button
        ref={frame as RefObject<HTMLButtonElement>}
        type="button"
        onClick={onOpen}
        onFocus={onFocus}
        aria-label={`Открыть фото: ${photo.alt}`}
        data-ratio={ratio}
        className={cn("photo-frame relative block w-full cursor-zoom-in overflow-hidden rounded-[3px] border border-line text-left", tilt && "tilt", className)}
      >
        {inner}
      </button>
    );
  }
  return (
    <figure ref={frame} data-ratio={ratio} className={cn("photo-frame relative overflow-hidden rounded-[3px] border border-line", tilt && "tilt", className)}>
      {inner}
    </figure>
  );
}
