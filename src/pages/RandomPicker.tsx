import { useCallback, useEffect, useMemo, useState } from "react";

import { GameFiltersPanel } from "@/components/GameFiltersPanel";
import { GeekdoCoverModal } from "@/components/GeekdoCoverModal";
import { useGameFilters } from "@/context/game-filters-context";
import { useGamesData } from "@/context/games-data-context";
import { bggBoardGameUrl } from "@/lib/bggGameUrl";
import { bggWeightTextClass } from "@/lib/bggWeightColor";
import {
  MAX_TIME_BY_INDEX,
  matchesFilters,
  weightFromSlider,
  type FilterState,
} from "@/lib/gameFilters";
import { formatPlayerCount } from "@/lib/formatPlayerCount";
import { formatPlayTimeRange } from "@/lib/formatPlayTimeRange";

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  const i = Math.floor(Math.random() * items.length);
  return items[i] ?? null;
}

export function RandomPicker() {
  const { status, errorMessage, data, setImagePick } = useGamesData();
  const {
    players,
    setPlayers,
    maxTimeIndex,
    setMaxTimeIndex,
    minWeightTenths,
    setMinWeightTenths,
    maxWeightTenths,
    setMaxWeightTenths,
    minWeightActive,
    setMinWeightActive,
    maxWeightActive,
    setMaxWeightActive,
    category,
    setCategory,
  } = useGameFilters();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [coverModalOpen, setCoverModalOpen] = useState(false);

  const picked = useMemo(() => {
    if (!pickedId || !data) return null;
    return data.games.find((g) => g.id === pickedId) ?? null;
  }, [pickedId, data]);

  const maxTime = MAX_TIME_BY_INDEX[maxTimeIndex] ?? null;

  const filters = useMemo(
    (): FilterState => ({
      players,
      maxTime,
      minWeight: minWeightActive ? weightFromSlider(minWeightTenths) : null,
      maxWeight: maxWeightActive ? weightFromSlider(maxWeightTenths) : null,
      category,
    }),
    [
      players,
      maxTime,
      minWeightActive,
      minWeightTenths,
      maxWeightActive,
      maxWeightTenths,
      category,
    ]
  );

  const pool = useMemo(() => {
    if (status !== "ok" || !data) return [];
    return data.games.filter((g) => matchesFilters(g, filters));
  }, [status, data, filters]);

  const roll = useCallback(() => {
    const g = pickRandom(pool);
    setPickedId(g?.id ?? null);
    setFiltersCollapsed(true);
    setCoverModalOpen(false);
  }, [pool]);

  useEffect(() => {
    setCoverModalOpen(false);
  }, [pickedId]);

  const expandFilters = useCallback(() => {
    setFiltersCollapsed(false);
  }, []);

  if (status === "idle" || status === "loading") {
    return (
      <div className="board-card rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        Loading your collection…
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="board-card rounded-lg border border-red-500/40 bg-card p-8 text-center text-red-400">
        {errorMessage ?? "Something went wrong"}
      </div>
    );
  }

  if (!data || data.games.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        Add games by syncing your BGG collection first.
      </p>
    );
  }

  const showResultHero = Boolean(pickedId && filtersCollapsed);
  const containerClass = showResultHero
    ? "mx-auto max-w-3xl space-y-6"
    : "mx-auto max-w-xl space-y-4";

  return (
    <>
      <GeekdoCoverModal
        open={coverModalOpen && picked != null}
        game={picked}
        onClose={() => setCoverModalOpen(false)}
        onPick={(thumbnail, image) => {
          if (picked) {
            setImagePick(picked.id, { thumbnail, image });
          }
        }}
      />
      <div className={containerClass}>
      {showResultHero ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base text-muted-foreground">
            <span className="font-medium text-foreground">
              {pool.length} game{pool.length === 1 ? "" : "s"}
            </span>{" "}
            in your current pool
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={roll}
              disabled={pool.length === 0}
              className="rounded-lg bg-primary px-4 py-2 text-base font-semibold text-primary-foreground shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Pick again
            </button>
            <button
              type="button"
              onClick={expandFilters}
              className="rounded-lg border border-border bg-card px-4 py-2 text-base font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60"
            >
              Adjust filters
            </button>
          </div>
        </div>
      ) : null}

      <div
        className={[
          "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
          filtersCollapsed && pickedId ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
        ].join(" ")}
      >
        <div
          className="min-h-0 overflow-hidden"
          aria-hidden={filtersCollapsed && pickedId != null}
        >
          <GameFiltersPanel
            games={data.games}
            matchCount={pool.length}
            totalCount={data.games.length}
            players={players}
            setPlayers={setPlayers}
            maxTimeIndex={maxTimeIndex}
            setMaxTimeIndex={setMaxTimeIndex}
            minWeightTenths={minWeightTenths}
            setMinWeightTenths={setMinWeightTenths}
            maxWeightTenths={maxWeightTenths}
            setMaxWeightTenths={setMaxWeightTenths}
            minWeightActive={minWeightActive}
            setMinWeightActive={setMinWeightActive}
            maxWeightActive={maxWeightActive}
            setMaxWeightActive={setMaxWeightActive}
            category={category}
            setCategory={setCategory}
          />
        </div>
      </div>

      {!showResultHero ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={roll}
            disabled={pool.length === 0}
            className="rounded-md bg-primary px-4 py-2 text-base font-semibold text-primary-foreground shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Pick a game
          </button>
        </div>
      ) : null}

      {!showResultHero && pool.length === 0 ? (
        <p className="text-base text-muted-foreground">
          No games match these filters. Loosen a constraint and try again.
        </p>
      ) : null}

      {picked ? (
        <article
          className={[
            "board-card overflow-hidden rounded-xl border border-border bg-card",
            showResultHero ? "ring-1 ring-primary/25" : "",
          ].join(" ")}
        >
          <div
            className={
              showResultHero
                ? "grid gap-6 md:grid-cols-[minmax(0,320px)_1fr] md:items-stretch"
                : "grid gap-4 sm:grid-cols-[140px_1fr] sm:items-start"
            }
          >
            <div
              className={
                showResultHero
                  ? "aspect-square w-full overflow-hidden bg-muted"
                  : "aspect-square w-full max-w-[200px] overflow-hidden bg-muted"
              }
            >
              {picked.thumbnail || picked.image ? (
                <img
                  src={picked.image || picked.thumbnail || ""}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setCoverModalOpen(true)}
                  className={[
                    "flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 px-3 text-center text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    showResultHero ? "min-h-[200px] text-base" : "min-h-[140px] text-base",
                  ].join(" ")}
                >
                  <span>No image</span>
                  <span className="text-base font-medium text-primary">Tap to choose</span>
                </button>
              )}
            </div>
            <div
              className={
                showResultHero
                  ? "min-w-0 p-5 md:py-8 md:pr-8"
                  : "min-w-0 p-4 sm:py-4 sm:pr-4"
              }
            >
              <h2
                className={
                  showResultHero
                    ? "line-clamp-1 min-w-0 text-2xl font-bold tracking-tight text-card-foreground md:text-3xl"
                    : "line-clamp-1 min-w-0 text-xl font-bold text-card-foreground"
                }
              >
                <a
                  href={bggBoardGameUrl(picked.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-sm"
                >
                  {picked.name}
                  {picked.yearPublished != null ? (
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      ({picked.yearPublished})
                    </span>
                  ) : null}
                </a>
              </h2>
              <dl
                className={
                  showResultHero
                    ? "mt-5 grid grid-cols-2 gap-3 text-base text-muted-foreground sm:grid-cols-4"
                    : "mt-3 grid grid-cols-2 gap-2 text-base text-muted-foreground"
                }
              >
                <div>
                  <dt className="font-medium text-foreground">Players</dt>
                  <dd>
                    {formatPlayerCount(picked, { unknownLabel: "?" })}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-foreground">Time</dt>
                  <dd>{formatPlayTimeRange(picked)}</dd>
                </div>
                {picked.averageWeight != null ? (
                  <div>
                    <dt className="font-medium text-foreground">Weight</dt>
                    <dd>
                      <span className={bggWeightTextClass(picked.averageWeight)}>
                        {picked.averageWeight.toFixed(2)}
                      </span>
                      <span className="text-muted-foreground"> / 5</span>
                    </dd>
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
                <p
                  className={
                    showResultHero
                      ? "mt-4 text-base text-muted-foreground"
                      : "mt-3 text-base text-muted-foreground"
                  }
                >
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
                className={
                  showResultHero
                    ? "mt-6 inline-block text-base font-medium text-primary underline-offset-2 hover:underline"
                    : "mt-4 inline-block text-base font-medium text-primary underline-offset-2 hover:underline"
                }
              >
                Open on BoardGameGeek
              </a>
            </div>
          </div>
        </article>
      ) : null}
      </div>
    </>
  );
}
