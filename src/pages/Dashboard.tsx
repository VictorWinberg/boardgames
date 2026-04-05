import { useMemo, useState } from "react";

import { useGames } from "@/hooks/useGames";
import type { BggGame } from "@/types/bgg";

function formatPlayers(g: BggGame): string {
  if (g.minPlayers != null && g.maxPlayers != null) {
    return `${g.minPlayers}–${g.maxPlayers}`;
  }
  if (g.minPlayers != null) return `${g.minPlayers}+`;
  if (g.maxPlayers != null) return `≤${g.maxPlayers}`;
  return "—";
}

function formatTime(g: BggGame): string {
  const t = g.playingTime ?? g.maxPlayTime ?? g.minPlayTime;
  if (t == null || t <= 0) return "—";
  return `${t} min`;
}

function GameCard({ game }: { game: BggGame }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="aspect-[2/3] w-full overflow-hidden bg-muted">
        {game.thumbnail || game.image ? (
          <img
            src={game.thumbnail || game.image || ""}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-card-foreground">
          {game.name}
          {game.yearPublished != null ? (
            <span className="font-normal text-muted-foreground">
              {" "}
              ({game.yearPublished})
            </span>
          ) : null}
        </h2>
        <dl className="mt-auto grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <div>
            <dt className="sr-only">Players</dt>
            <dd>{formatPlayers(game)} players</dd>
          </div>
          <div>
            <dt className="sr-only">Time</dt>
            <dd>{formatTime(game)}</dd>
          </div>
          {game.averageWeight != null ? (
            <div className="col-span-2">
              <dt className="sr-only">Weight</dt>
              <dd>Weight {game.averageWeight.toFixed(2)} / 5</dd>
            </div>
          ) : null}
          {game.numPlays != null && game.numPlays > 0 ? (
            <div className="col-span-2">
              <dt className="sr-only">Plays logged</dt>
              <dd>{game.numPlays} plays logged</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </article>
  );
}

export function Dashboard() {
  const state = useGames();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (state.status !== "ok") return [];
    const q = query.trim().toLowerCase();
    if (!q) return state.data.games;
    return state.data.games.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.categories.some((c) => c.toLowerCase().includes(q)) ||
        g.mechanics.some((m) => m.toLowerCase().includes(q))
    );
  }, [state, query]);

  const stats = useMemo(() => {
    if (state.status !== "ok") return null;
    const games = state.data.games;
    const n = games.length;
    if (n === 0) return { n: 0, byDecade: [] as { label: string; count: number }[] };

    const decades = new Map<string, number>();
    for (const g of games) {
      const y = g.yearPublished;
      if (y == null) continue;
      const d = Math.floor(y / 10) * 10;
      const label = `${d}s`;
      decades.set(label, (decades.get(label) ?? 0) + 1);
    }
    const byDecade = [...decades.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, count]) => ({ label, count }));

    const withTime = games.filter(
      (g) => (g.playingTime ?? g.maxPlayTime ?? 0) > 0
    );
    const avgTime =
      withTime.length > 0
        ? Math.round(
            withTime.reduce(
              (s, g) => s + (g.playingTime ?? g.maxPlayTime ?? 0),
              0
            ) / withTime.length
          )
        : null;

    return { n, byDecade, avgTime };
  }, [state]);

  if (state.status === "idle" || state.status === "loading") {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Loading your collection…
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="rounded-lg border border-red-500/40 bg-card p-8 text-center text-red-400">
        {state.message}
      </div>
    );
  }

  const { data } = state;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Collection</h1>
        {data.username ? (
          <p className="mt-1 text-sm text-muted-foreground">
            BoardGameGeek user:{" "}
            <span className="text-foreground">{data.username}</span>
            {data.syncedAt ? (
              <>
                {" "}
                · synced{" "}
                <time dateTime={data.syncedAt}>
                  {new Date(data.syncedAt).toLocaleString()}
                </time>
              </>
            ) : null}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Run <code className="rounded bg-muted px-1 py-0.5">npm run sync:bgg</code>{" "}
            with <code className="rounded bg-muted px-1 py-0.5">BGG_USERNAME</code>{" "}
            and <code className="rounded bg-muted px-1 py-0.5">BGG_ACCESS_TOKEN</code>{" "}
            (see README), or configure GitHub Actions secrets.
          </p>
        )}
      </div>

      {stats && stats.n > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">Games owned</p>
            <p className="text-3xl font-semibold tabular-nums">{stats.n}</p>
          </div>
          {stats.avgTime != null ? (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">
                Avg. listed play time
              </p>
              <p className="text-3xl font-semibold tabular-nums">
                {stats.avgTime} min
              </p>
            </div>
          ) : null}
          {stats.byDecade.length > 0 ? (
            <div className="rounded-lg border border-border bg-card p-4 sm:col-span-2 lg:col-span-1">
              <p className="text-sm text-muted-foreground">By decade</p>
              <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                {stats.byDecade.map(({ label, count }) => (
                  <li
                    key={label}
                    className="rounded-md bg-muted px-2 py-1 text-foreground"
                  >
                    {label}: {count}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="block w-full sm:max-w-md">
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, category, mechanic…"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </label>
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {data.games.length}
        </p>
      </div>

      {data.games.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          No games in <code className="rounded bg-muted px-1">games.json</code>.
          Sync your BGG collection to populate this list.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((game) => (
            <li key={game.id}>
              <GameCard game={game} />
            </li>
          ))}
        </ul>
      )}

      {filtered.length === 0 && data.games.length > 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          No games match your search.
        </p>
      ) : null}
    </div>
  );
}
