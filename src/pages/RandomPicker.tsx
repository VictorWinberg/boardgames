import { useCallback, useEffect, useMemo, useState } from "react";

import { GameFiltersPanel } from "@/components/GameFiltersPanel";
import { GeekdoCoverModal } from "@/components/GeekdoCoverModal";
import { useGameFilters } from "@/context/game-filters-context";
import { useGamesData } from "@/context/games-data-context";
import { bggBoardGameUrl } from "@/lib/bggGameUrl";
import { bggWeightTextClass } from "@/lib/bggWeightColor";
import {
  MAX_TIME_BY_INDEX,
  isFriendsOwnedGame,
  matchesFilters,
  weightFromSlider,
  type FilterState,
} from "@/lib/gameFilters";
import { formatPlayerCount } from "@/lib/formatPlayerCount";
import { formatPlayTimeRange } from "@/lib/formatPlayTimeRange";
import type { BggGame } from "@/types/bgg";

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  const i = Math.floor(Math.random() * items.length);
  return items[i] ?? null;
}

function formatWeight(w: number | null): string {
  if (w == null) return "—";
  const rounded = Math.round(w * 100) / 100;
  return `${rounded} / 5`;
}

function playersLine(game: BggGame): string {
  const raw = formatPlayerCount(game);
  if (raw === "—") return "—";
  return `${raw} players`;
}

function StatBox({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="min-w-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h3>
      <p
        className={["mt-0.5 text-base", valueClassName ?? "text-foreground"].join(
          " ",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-md border border-border bg-muted/50 px-2 py-1 text-sm text-foreground"
        >
          {item}
        </li>
      ))}
    </ul>
  );
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
    includeFriendsGames,
    setIncludeFriendsGames,
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
      includeFriendsGames,
    }),
    [
      players,
      maxTime,
      minWeightActive,
      minWeightTenths,
      maxWeightActive,
      maxWeightTenths,
      category,
      includeFriendsGames,
    ]
  );

  const pickerEligibleCount = useMemo(() => {
    if (status !== "ok" || !data) return 0;
    return data.games.filter(
      (g) => includeFriendsGames || !isFriendsOwnedGame(g),
    ).length;
  }, [status, data, includeFriendsGames]);

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
    ? "mx-auto max-w-5xl space-y-6"
    : "mx-auto w-full max-w-3xl space-y-4";

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
            totalCount={pickerEligibleCount}
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
            includeFriendsGames={includeFriendsGames}
            setIncludeFriendsGames={setIncludeFriendsGames}
          />
        </div>
      </div>

      {!showResultHero ? (
        <div className="flex flex-wrap justify-center gap-2">
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
            showResultHero ? "relative ring-1 ring-primary/25" : "",
          ].join(" ")}
        >
          {showResultHero ? (
            <>
              <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-3 py-2 sm:relative sm:z-auto sm:border-b sm:border-border sm:bg-card sm:px-5 sm:py-3">
                <h2 className="min-w-0 flex-1 text-base font-semibold leading-tight text-white [text-shadow:0_0_1px_rgba(0,0,0,0.95),0_1px_2px_rgba(0,0,0,0.92),0_2px_8px_rgba(0,0,0,0.65),0_0_20px_rgba(0,0,0,0.45)] sm:text-xl sm:leading-normal sm:text-foreground sm:[text-shadow:none]">
                  {picked.name}
                  {picked.yearPublished != null ? (
                    <span className="font-normal text-white/85 sm:text-muted-foreground">
                      {" "}
                      ({picked.yearPublished})
                    </span>
                  ) : null}
                </h2>
              </div>
              <div className="flex flex-col sm:flex-row">
                <div className="flex min-h-[40vh] shrink-0 items-center justify-center bg-muted/40 px-6 pt-8 pb-2 sm:min-h-0 sm:w-[min(100%,28rem)] sm:flex-1 sm:max-w-[50%] sm:px-8 sm:pt-10 sm:pb-4">
                  {picked.thumbnail || picked.image ? (
                    <img
                      src={picked.image || picked.thumbnail || ""}
                      alt=""
                      className="max-h-[min(70vh,100%)] w-full max-w-full object-contain shadow-md"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 px-2 text-center">
                      <p className="text-base text-muted-foreground">
                        No cover image
                      </p>
                      <button
                        type="button"
                        onClick={() => setCoverModalOpen(true)}
                        className="rounded-lg border border-border bg-card px-4 py-2 text-base font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        Choose cover
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-4 border-t border-border p-4 sm:min-w-[20rem] sm:max-w-xl sm:flex-1 sm:border-l sm:border-t-0 sm:p-5">
                  {picked.owner?.trim() ? (
                    <p className="text-sm font-semibold text-primary">
                      {picked.owner.trim()}&apos;s copy
                    </p>
                  ) : null}

                  {picked.description?.trim() ? (
                    <section aria-labelledby="oracle-picked-description">
                      <h3
                        id="oracle-picked-description"
                        className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        Description
                      </h3>
                      <p className="text-base leading-relaxed text-muted-foreground">
                        {picked.description.trim()}
                      </p>
                    </section>
                  ) : null}

                  <section
                    aria-label="Game stats"
                    className="grid grid-cols-2 gap-x-4 gap-y-3"
                  >
                    <StatBox label="Players" value={playersLine(picked)} />
                    <StatBox
                      label="Play time"
                      value={formatPlayTimeRange(picked)}
                    />
                    <StatBox
                      label="Complexity"
                      value={formatWeight(picked.averageWeight)}
                      valueClassName={
                        picked.averageWeight != null
                          ? bggWeightTextClass(picked.averageWeight)
                          : undefined
                      }
                    />
                    {picked.numPlays != null && picked.numPlays > 0 ? (
                      <StatBox
                        label="Your plays"
                        value={String(picked.numPlays)}
                      />
                    ) : null}
                  </section>

                  {picked.geekdoImages != null &&
                  picked.geekdoImages.length > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {picked.geekdoImages.length} alternate cover
                      {picked.geekdoImages.length === 1 ? "" : "s"} in gallery
                      data
                    </p>
                  ) : null}

                  {picked.categories.length > 0 ? (
                    <section aria-labelledby="oracle-picked-categories">
                      <h3
                        id="oracle-picked-categories"
                        className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        Categories
                      </h3>
                      <TagList items={picked.categories} />
                    </section>
                  ) : null}

                  {picked.mechanics.length > 0 ? (
                    <section aria-labelledby="oracle-picked-mechanics">
                      <h3
                        id="oracle-picked-mechanics"
                        className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        Mechanics
                      </h3>
                      <TagList items={picked.mechanics} />
                    </section>
                  ) : null}

                  <p className="mt-auto pt-2">
                    <a
                      href={bggBoardGameUrl(picked.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-sm text-base font-medium text-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                    >
                      Open on BoardGameGeek
                    </a>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-[140px_1fr] sm:items-start">
              <div className="aspect-square w-full max-w-[200px] overflow-hidden bg-muted">
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
                    className="flex h-full min-h-[140px] w-full cursor-pointer flex-col items-center justify-center gap-1 px-3 text-center text-base text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span>No image</span>
                    <span className="text-base font-medium text-primary">
                      Tap to choose
                    </span>
                  </button>
                )}
              </div>
              <div className="min-w-0 p-4 sm:py-4 sm:pr-4">
                <h2 className="line-clamp-1 min-w-0 text-xl font-bold text-card-foreground">
                  <a
                    href={bggBoardGameUrl(picked.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
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
                <dl className="mt-3 grid grid-cols-1 gap-2 text-base text-muted-foreground sm:grid-cols-2">
                  <div>
                    <dt className="font-medium text-foreground">Time</dt>
                    <dd>{formatPlayTimeRange(picked)}</dd>
                  </div>
                  {picked.numPlays != null && picked.numPlays > 0 ? (
                    <div>
                      <dt className="font-medium text-foreground">
                        Your plays
                      </dt>
                      <dd>{picked.numPlays}</dd>
                    </div>
                  ) : null}
                </dl>
                {picked.categories.length > 0 ? (
                  <p className="mt-3 text-base text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Categories:{" "}
                    </span>
                    {picked.categories.join(", ")}
                  </p>
                ) : null}
                {picked.owner?.trim() ? (
                  <p className="mt-2 text-base text-muted-foreground">
                    <span className="font-medium text-foreground">Owner</span>{" "}
                    {picked.owner.trim()}
                  </p>
                ) : null}
                <a
                  href={bggBoardGameUrl(picked.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block text-base font-medium text-primary underline-offset-2 hover:underline"
                >
                  Open on BoardGameGeek
                </a>
              </div>
            </div>
          )}
        </article>
      ) : null}
      </div>
    </>
  );
}
