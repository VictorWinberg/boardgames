/**
 * Tailwind text classes for BGG average weight (1–5 complexity scale).
 * Lighter = easier, warmer/redder = heavier.
 */
export function bggWeightTextClass(weight: number): string {
  const w = Math.min(5, Math.max(1, weight));
  if (w < 2) return "font-semibold tabular-nums text-emerald-400";
  if (w < 2.75) return "font-semibold tabular-nums text-lime-400";
  if (w < 3.5) return "font-semibold tabular-nums text-amber-400";
  if (w < 4.25) return "font-semibold tabular-nums text-orange-400";
  return "font-semibold tabular-nums text-rose-400";
}
