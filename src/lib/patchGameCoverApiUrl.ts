/** Dev-only: Vite middleware path (respects `base` e.g. `/boardgames/`). */
export function patchGameCoverApiUrl(): string {
  const base = import.meta.env.BASE_URL;
  const root = base.endsWith("/") ? base : `${base}/`;
  return `${root}api/patch-game-cover`.replace(/([^:]\/)\/+/g, "$1");
}
