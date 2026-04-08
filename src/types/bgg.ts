/** BGG rank entry from statistics.ratings.ranks */
export interface BggRank {
  /** e.g., "strategygames", "partygames" (see `bggSubdomainLabel` for display) */
  name: string;
}

/** One game row normalized from `public/bgg.json` for the UI. */
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
  /** Minimum age from BGG, if available */
  minAge: number | null;
  numPlays: number | null;
  /** BGG category link values */
  categories: string[];
  mechanics: string[];
  /** BGG ranks from statistics.ratings.ranks (e.g., Strategy, Party) */
  ranks: BggRank[];
  /** Full plain-text description from BGG (HTML stripped when loading from bgg.json). */
  bggDescription?: string;
  /** Optional shorter or custom blurb from `public/custom.json`. */
  customDescription?: string;
  /** Convenience: `customDescription ?? bggDescription` (used by picker / fullscreen). */
  description?: string;
  /** Set from `friendOwner` in `public/custom.json`; hidden unless "Friends' games" is on */
  owner?: string | null;
}

export interface GamesPayload {
  syncedAt: string | null;
  username: string | null;
  games: BggGame[];
}
