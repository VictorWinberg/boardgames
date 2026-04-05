import { useCallback, useMemo, useState } from "react";

import { useGames } from "@/hooks/useGames";
import type { BggGame } from "@/types/bgg";

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  const i = Math.floor(Math.random() * items.length);
  return items[i] ?? null;
}

function matchesFilters(
  g: BggGame,
  f: {
    players: string;
    maxTime: string;
    minWeight: string;
    maxWeight: string;
  }
): boolean {
  const players = f.players.trim();
  if (players !== "") {
    const p = Number(players);
    if (!Number.isFinite(p)) return false;
    const minOk = g.minPlayers == null || g.minPlayers <= p;
    const maxOk = g.maxPlayers == null || g.maxPlayers >= p;
    if (!minOk || !maxOk) return false;
  }

  const maxTime = f.maxTime.trim();
  if (maxTime !== "") {
    const t = Number(maxTime);
    if (!Number.isFinite(t)) return false;
    const play =
      g.playingTime ?? g.maxPlayTime ?? g.minPlayTime ?? null;
    if (play == null || play > t) return false;
  }

  const minW = f.minWeight.trim();
  if (minW !== "") {
    const w = Number(minW);
    if (!Number.isFinite(w)) return false;
    if (g.averageWeight == null || g.averageWeight < w) return false;
  }

  const maxW = f.maxWeight.trim();
  if (maxW !== "") {
    const w = Number(maxW);
    if (!Number.isFinite(w)) return false;
    if (g.averageWeight == null || g.averageWeight > w) return false;
  }

  return true;
}

export function RandomPicker() {
  const state = useGames();
  const [players, setPlayers] = useState("");
  const [maxTime, setMaxTime] = useState("");
  const [minWeight, setMinWeight] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  const [picked, setPicked] = useState<BggGame | null>(null);

  const filters = useMemo(
    () => ({ players, maxTime, minWeight, maxWeight }),
    [players, maxTime, minWeight, maxWeight]
  );

  const pool = useMemo(() => {
    if (state.status !== "ok") return [];
    return state.data.games.filter((g) => matchesFilters(g, filters));
  }, [state, filters]);

  const roll = useCallback(() => {
    setPicked(pickRandom(pool));
  }, [pool]);

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

  if (state.data.games.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        Add games by syncing your BGG collection first.
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Random game</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Optional filters narrow the pool. Empty fields are ignored.
        </p>
      </div>

      <fieldset className="space-y-4 rounded-lg border border-border bg-card p-4">
        <legend className="sr-only">Filters</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-muted-foreground">Players at table</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={players}
              onChange={(e) => setPlayers(e.target.value)}
              placeholder="e.g. 4"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Max play time (min)</span>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={maxTime}
              onChange={(e) => setMaxTime(e.target.value)}
              placeholder="e.g. 90"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Min weight (1–5)</span>
            <input
              type="number"
              min={1}
              max={5}
              step={0.1}
              inputMode="decimal"
              value={minWeight}
              onChange={(e) => setMinWeight(e.target.value)}
              placeholder="e.g. 2"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          <label className="block text-sm">
            <span className="text-muted-foreground">Max weight (1–5)</span>
            <input
              type="number"
              min={1}
              max={5}
              step={0.1}
              inputMode="decimal"
              value={maxWeight}
              onChange={(e) => setMaxWeight(e.target.value)}
              placeholder="e.g. 3.5"
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          {pool.length} game{pool.length === 1 ? "" : "s"} match your filters
          (of {state.data.games.length} total).
        </p>
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={roll}
          disabled={pool.length === 0}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Pick a game
        </button>
      </div>

      {pool.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No games match these filters. Loosen a constraint and try again.
        </p>
      ) : null}

      {picked ? (
        <article className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="grid gap-4 sm:grid-cols-[140px_1fr] sm:items-start">
            <div className="aspect-square w-full max-w-[200px] overflow-hidden bg-muted sm:aspect-auto sm:h-full sm:max-h-[220px]">
              {picked.thumbnail || picked.image ? (
                <img
                  src={picked.image || picked.thumbnail || ""}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[140px] items-center justify-center text-xs text-muted-foreground">
                  No image
                </div>
              )}
            </div>
            <div className="p-4 sm:py-4 sm:pr-4">
              <h2 className="text-xl font-bold text-card-foreground">
                {picked.name}
                {picked.yearPublished != null ? (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    ({picked.yearPublished})
                  </span>
                ) : null}
              </h2>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>
                  <dt className="font-medium text-foreground">Players</dt>
                  <dd>
                    {picked.minPlayers ?? "?"}
                    {picked.maxPlayers != null
                      ? `–${picked.maxPlayers}`
                      : picked.minPlayers != null
                        ? "+"
                        : ""}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Time</dt>
                  <dd>
                    {picked.playingTime ??
                      picked.maxPlayTime ??
                      picked.minPlayTime ??
                      "—"}
                    {picked.playingTime ||
                    picked.maxPlayTime ||
                    picked.minPlayTime
                      ? " min"
                      : ""}
                  </dd>
                </div>
                {picked.averageWeight != null ? (
                  <div>
                    <dt className="font-medium text-foreground">Weight</dt>
                    <dd>{picked.averageWeight.toFixed(2)} / 5</dd>
                  </div>
                ) : null}
                {picked.numPlays != null && picked.numPlays > 0 ? (
                  <div>
                    <dt className="font-medium text-foreground">Your plays</dt>
                    <dd>{picked.numPlays}</dd>
                  </div>
                ) : null}
              </dl>
              {picked.categories.length > 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Categories:{" "}
                  </span>
                  {picked.categories.join(", ")}
                </p>
              ) : null}
              <a
                href={`https://boardgamegeek.com/boardgame/${picked.id}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                Open on BoardGameGeek
              </a>
            </div>
          </div>
        </article>
      ) : null}
    </div>
  );
}
