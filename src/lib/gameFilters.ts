import { bggSubdomainLabel } from "@/lib/bggSubdomainRanks";
import type { MechanicBucketId } from "@/lib/mechanicBuckets";
import { gameMatchesMechanicBucket } from "@/lib/mechanicBuckets";
import type { BggGame } from "@/types/bgg";

/** Short label for a BGG subdomain rank from API `name` (hardcoded map; not friendlyName). */
export function rankDisplayName(rankName: string): string {
  return bggSubdomainLabel(rankName);
}

/**
 * Collects all unique rank display names from games, sorted alphabetically.
 */
export function collectRankCategories(games: BggGame[]): string[] {
  const rankSet = new Set<string>();
  for (const game of games) {
    for (const rank of game.ranks) {
      const displayName = rankDisplayName(rank.name);
      if (displayName) rankSet.add(displayName);
    }
  }
  return Array.from(rankSet).sort();
}

/**
 * Checks if a game has a specific rank category.
 */
export function gameHasRankCategory(
  game: BggGame,
  categoryDisplayName: string,
): boolean {
  return game.ranks.some(
    (rank) => rankDisplayName(rank.name) === categoryDisplayName,
  );
}

export type FilterState = {
  players: number | null;
  maxTime: number | null;
  minWeight: number | null;
  maxWeight: number | null;
  category: string | null;
  /** One of ten grouped mechanic families; matches if any BGG mechanic maps to it */
  mechanicBucket: MechanicBucketId | null;
  /** When false, games with `owner` set (from custom `friendOwner`) are excluded */
  includeFriendsGames: boolean;
};

/** True if this row is a friend’s copy (`owner` from `custom.json` `friendOwner`). */
export function isFriendsOwnedGame(g: BggGame): boolean {
  return typeof g.owner === "string" && g.owner.trim() !== "";
}

export function matchesFilters(g: BggGame, f: FilterState): boolean {
  if (!f.includeFriendsGames && isFriendsOwnedGame(g)) {
    return false;
  }

  if (f.players != null) {
    const p = f.players;
    const minOk = g.minPlayers == null || g.minPlayers <= p;
    const maxOk = g.maxPlayers == null || g.maxPlayers >= p;
    if (!minOk || !maxOk) return false;
  }

  if (f.maxTime != null) {
    const play = g.playingTime ?? g.maxPlayTime ?? g.minPlayTime ?? null;
    if (play == null || play > f.maxTime) return false;
  }

  if (f.minWeight != null) {
    if (g.averageWeight == null || g.averageWeight < f.minWeight) {
      return false;
    }
  }

  if (f.maxWeight != null) {
    if (g.averageWeight == null || g.averageWeight > f.maxWeight) {
      return false;
    }
  }

  if (f.category != null) {
    if (!gameHasRankCategory(g, f.category)) {
      return false;
    }
  }

  if (
    f.mechanicBucket != null &&
    !gameMatchesMechanicBucket(g, f.mechanicBucket)
  ) {
    return false;
  }

  return true;
}

export const PLAYER_OPTIONS: (number | null)[] = [
  null,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
];

export const PLAYER_SLIDER_MAX = PLAYER_OPTIONS.length - 1;

export function playerCountToSliderStep(players: number | null): number {
  const i = PLAYER_OPTIONS.indexOf(players);
  return i === -1 ? 0 : i;
}

export function sliderStepToPlayerCount(step: number): number | null {
  return PLAYER_OPTIONS[step] ?? null;
}

export function formatPlayerFilterLabel(players: number | null): string {
  return players == null
    ? "Any"
    : `${players} ${players === 1 ? "player" : "players"}`;
}

/** Index 0 = no limit; otherwise minutes */
export const MAX_TIME_BY_INDEX = [
  null,
  30,
  45,
  60,
  75,
  90,
  120,
  150,
  180,
  240,
] as const;

export function weightFromSlider(v: number): number {
  return Math.round(v) / 10;
}

/** Step 0 = no filter; 1–41 → tenths 10–50 (weights 1.0–5.0). */
export const WEIGHT_FILTER_SLIDER_MAX = 41;

export function weightFilterSliderStep(
  active: boolean,
  tenths: number,
): number {
  if (!active) return 0;
  const s = tenths - 9;
  return Math.min(WEIGHT_FILTER_SLIDER_MAX, Math.max(1, s));
}

export function weightFilterStepToTenths(step: number): number {
  return step + 9;
}


export function filterPillClass(selected: boolean): string {
  return [
    "rounded-full border px-2 py-0.5 text-base font-medium transition-colors",
    selected
      ? "border-primary bg-primary text-primary-foreground shadow-sm"
      : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
  ].join(" ");
}

export type { MechanicBucketId } from "@/lib/mechanicBuckets";
export {
  collectMechanicBuckets,
  MECHANIC_BUCKET_LABELS,
} from "@/lib/mechanicBuckets";
