import type { Photo } from "@/data/types";
import { cn } from "@/lib/utils";
import { Img } from "./Img";

const ratios = { "4/5": "aspect-[4/5]", "4/3": "aspect-[4/3]", "1/1": "aspect-square", "16/9": "aspect-video", "3/4": "aspect-[3/4]" } as const;
export type Ratio = keyof typeof ratios;

/** Единая рамка фото: пропорция, ярлык-подпись, ховер; если передан onOpen — открывает просмотр. */
export function PhotoFrame({
  photo,
  ratio = "4/3",
  sizes,
  onOpen,
  className,
  priority,
}: {
  photo: Photo;
  ratio?: Ratio;
  sizes: string;
  onOpen?: () => void;
  className?: string;
  priority?: boolean;
}) {
  const inner = (
    <>
      <span className={cn("frame-media block overflow-hidden", ratios[ratio])}>
        <Img name={photo.name} alt={photo.alt} sizes={sizes} position={photo.position} priority={priority} />
      </span>
      {photo.tag && (
        <span className="caption-tag mono absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-[2px] bg-bg/88 px-2.5 py-1.5 text-[0.72rem] text-text">
          <span aria-hidden="true" className="mr-1.5 text-accent">■</span>
          {photo.tag}
        </span>
      )}
    </>
  );
  if (onOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Открыть фото: ${photo.alt}`}
        className={cn("photo-frame relative block w-full cursor-zoom-in overflow-hidden rounded-[3px] border border-line text-left", className)}
      >
        {inner}
      </button>
    );
  }
  return <figure className={cn("photo-frame relative overflow-hidden rounded-[3px] border border-line", className)}>{inner}</figure>;
}
