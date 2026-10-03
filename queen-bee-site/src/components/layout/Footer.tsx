import { footer } from "@/content/text";
import { site } from "@/lib/site";
import { HexMark } from "@/components/shared/Bee";
import { FillPlate } from "@/components/shared/Fill";
import { Wave } from "@/components/shared/Wave";

export function Footer() {
  return (
    <footer className="tone-bordo relative overflow-hidden" data-tone="milk">
      <Wave edge="top" color="var(--color-milk)" />
      <div aria-hidden="true" className="honeycomb" />
      <div className="container-x relative pt-28 pb-14 md:pt-36 md:pb-16">
        <p aria-hidden="true" className="display pointer-events-none select-none text-[clamp(5rem,17vw,15rem)] leading-[0.8] tracking-[-0.03em] text-milk/[0.07]">
          Queen <span className="it">Bee</span>
        </p>
        <span aria-hidden="true" className="mt-8 mb-10 block h-px w-full bg-gold/60" />
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-end">
          <div className="flex items-center gap-4">
            <HexMark className="size-12" />
            <p className="display text-[clamp(1.6rem,3vw,2.4rem)] text-milk" translate="no">{footer.line}</p>
          </div>
          <div className="flex items-center gap-6">
            {site.instagram ? (
              <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="label link-thread text-gold-soft">
                Instagram
              </a>
            ) : (
              <FillPlate field="Instagram" />
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
