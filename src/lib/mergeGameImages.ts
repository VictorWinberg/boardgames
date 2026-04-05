import type { BggGame } from "@/types/bgg";

function coalesceUrl(s: string | null | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

export function hasCoverImage(game: BggGame): boolean {
  return Boolean(coalesceUrl(game.thumbnail) || coalesceUrl(game.image));
}
