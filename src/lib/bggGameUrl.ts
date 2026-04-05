/** Canonical BGG page for a board game thing. */
export function bggBoardGameUrl(gameId: string): string {
  return `https://boardgamegeek.com/boardgame/${encodeURIComponent(gameId)}`;
}
