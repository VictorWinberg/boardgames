import type { BggGame } from "@/types/bgg";

export type FilterState = {
  players: number | null;
  maxTime: number | null;
  minWeight: number | null;
  maxWeight: number | null;
  category: string | null;
};

export function matchesFilters(g: BggGame, f: FilterState): boolean {
  if (f.players != null) {
    const p = f.players;
    const minOk = g.minPlayers == null || g.minPlayers <= p;
    const maxOk = g.maxPlayers == null || g.maxPlayers >= p;
    if (!minOk || !maxOk) return false;
  }

  if (f.maxTime != null) {
    const play =
      g.playingTime ?? g.maxPlayTime ?? g.minPlayTime ?? null;
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

  if (f.category != null && !g.categories.includes(f.category)) {
    return false;
  }

  return true;
}

export const PLAYER_OPTIONS: (number | null)[] = [
  null,
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
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
  return players == null ? "Any" : `${players} ${players === 1 ? "player" : "players"}`;
}

/** Index 0 = no limit; otherwise minutes */
export const MAX_TIME_BY_INDEX = [
  null,
  30, 45, 60, 75, 90, 120, 150, 180, 240,
] as const;

export function weightFromSlider(v: number): number {
  return Math.round(v) / 10;
}

/** Step 0 = no filter; 1–41 → tenths 10–50 (weights 1.0–5.0). */
export const WEIGHT_FILTER_SLIDER_MAX = 41;

export function weightFilterSliderStep(active: boolean, tenths: number): number {
  if (!active) return 0;
  const s = tenths - 9;
  return Math.min(WEIGHT_FILTER_SLIDER_MAX, Math.max(1, s));
}

export function weightFilterStepToTenths(step: number): number {
  return step + 9;
}

export function collectCategories(games: BggGame[]): string[] {
  const set = new Set<string>();
  for (const g of games) {
    for (const c of g.categories) {
      set.add(c);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function filterPillClass(selected: boolean): string {
  return [
    "rounded-full border px-2 py-0.5 text-base font-medium transition-colors",
    selected
      ? "border-primary bg-primary text-primary-foreground shadow-sm"
      : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground",
  ].join(" ");
}
