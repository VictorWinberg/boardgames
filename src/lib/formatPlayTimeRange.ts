import type { BggGame } from "@/types/bgg";

/** e.g. "30–45 min", or "30 min" when min and max match or only one value exists. */
export function formatPlayTimeRange(game: BggGame): string {
  const min = game.minPlayTime;
  const max = game.maxPlayTime;
  const fallback =
    game.playingTime ??
    (min != null && max != null ? Math.max(min, max) : null) ??
    max ??
    min;

  const lo = min != null && min > 0 ? min : null;
  const hi = max != null && max > 0 ? max : null;

  if (lo != null && hi != null) {
    const a = Math.min(lo, hi);
    const b = Math.max(lo, hi);
    if (a === b) return `${a} min`;
    return `${a}–${b} min`;
  }
  if (lo != null) return `${lo} min`;
  if (hi != null) return `${hi} min`;
  if (fallback != null && fallback > 0) return `${fallback} min`;
  return "—";
}
