import { songs as all, type Song } from "./songs.generated";
import { media } from "@/data/songs-media";

export type { Song };

/** Песни, у которых есть звук в этой сборке */
export const songs: (Song & { url: string })[] = all.filter((s) => media[s.file]).map((s) => ({ ...s, url: media[s.file] }));
export const hasSongs = songs.length > 0;
