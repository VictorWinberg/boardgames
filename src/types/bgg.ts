/** One Geekdo gallery image (from `npm run images:geekdo`). */
export interface GeekdoGalleryImage {
  imageid: string;
  caption: string;
  /** Geekdo `imageurl@2x` */
  thumbnail: string | null;
  /** Geekdo `imageurl_lg` */
  image: string | null;
}

/** Shape written by `scripts/sync-bgg.mjs` / `fill-images-geekdo.mjs` and read by the app. */
export interface BggGame {
  id: string;
  name: string;
  yearPublished: number | null;
  thumbnail: string | null;
  image: string | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  playingTime: number | null;
  minPlayTime: number | null;
  maxPlayTime: number | null;
  /** BGG weight / complexity (1–5 scale), if available */
  averageWeight: number | null;
  numPlays: number | null;
  /** Display buckets (e.g. Family, Party, Strategy, Coop, Deduction) */
  categories: string[];
  mechanics: string[];
  /** All Geekdo user-gallery options; pick cover in the app or via exported games.json */
  geekdoImages?: GeekdoGalleryImage[];
}

export interface GamesPayload {
  syncedAt: string | null;
  username: string | null;
  games: BggGame[];
}
