import type { BggGame } from "@/types/bgg";

export function formatPlayerCount(
  g: Pick<BggGame, "minPlayers" | "maxPlayers">,
  opts?: { unknownLabel?: string },
): string {
  const unknown = opts?.unknownLabel ?? "—";
  if (g.minPlayers != null && g.maxPlayers != null) {
    if (g.minPlayers === g.maxPlayers) return String(g.minPlayers);
    return `${g.minPlayers}–${g.maxPlayers}`;
  }
  if (g.minPlayers != null) return `${g.minPlayers}+`;
  if (g.maxPlayers != null) return `≤${g.maxPlayers}`;
  return unknown;
}
