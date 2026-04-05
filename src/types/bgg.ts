/** Shape written by `scripts/sync-bgg.mjs` and read by the app. */
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
  categories: string[];
  mechanics: string[];
}

export interface GamesPayload {
  syncedAt: string | null;
  username: string | null;
  games: BggGame[];
}
