import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GameFiltersPanel } from "@/components/GameFiltersPanel";
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
import {
  FULLSCREEN_TRANSITION_MS,
  oracleFullscreenCardClasses,
  oracleFullscreenShellClasses,
} from "@/lib/fullscreenMotion";
import {
  mechanicBucketDisplayLabels,
  mechanicBucketIdsForGame,
} from "@/lib/mechanicBuckets";
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
        className={[
          "mt-0.5 text-base",
          valueClassName ?? "text-foreground",
        ].join(" ")}
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

function OraclePickedHeroBody({ picked }: { picked: BggGame }) {
  const playStyleLabels = mechanicBucketDisplayLabels(
    mechanicBucketIdsForGame(picked),
  );
  return (
    <>
      <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 px-3 py-2 sm:relative sm:z-auto sm:border-b sm:border-border sm:bg-card sm:px-5 sm:py-3">
        <h2
          id="oracle-fullscreen-title"
          className="min-w-0 flex-1 text-base font-semibold leading-tight text-white [text-shadow:0_0_1px_rgba(0,0,0,0.95),0_1px_2px_rgba(0,0,0,0.92),0_2px_8px_rgba(0,0,0,0.65),0_0_20px_rgba(0,0,0,0.45)] sm:text-xl sm:leading-normal sm:text-foreground sm:[text-shadow:none]"
        >
          {picked.name}
          {picked.yearPublished != null ? (
            <span className="font-normal text-white/85 sm:text-muted-foreground">
              {" "}
              ({picked.yearPublished})
            </span>
          ) : null}
        </h2>
      </div>
      <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
        <div className="flex min-h-0 shrink-0 items-center justify-center bg-muted/40 px-6 pt-8 pb-2 sm:min-h-0 sm:w-[min(100%,28rem)] sm:flex-1 sm:max-w-[50%] sm:px-8 sm:pt-10 sm:pb-4">
          {picked.thumbnail || picked.image ? (
            <div className="aspect-square w-full max-w-[min(100%,min(55dvh,28rem))] shrink-0 overflow-hidden rounded-lg shadow-md sm:max-w-[min(100%,min(70dvh,24rem))]">
              <img
                src={picked.image || picked.thumbnail || ""}
                alt=""
                className="h-full w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 px-2 text-center">
              <p className="text-base text-muted-foreground">No cover image</p>
            </div>
          )}
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain border-t border-border p-4 pb-28 sm:min-w-[20rem] sm:max-w-xl sm:border-l sm:border-t-0 sm:p-5 sm:pb-24">
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
            <StatBox label="Play time" value={formatPlayTimeRange(picked)} />
            <StatBox
              label="Complexity"
              value={formatWeight(picked.averageWeight)}
              valueClassName={
                picked.averageWeight != null
                  ? bggWeightTextClass(picked.averageWeight)
                  : undefined
              }
            />
            {picked.categories.length > 0 ? (
              <div
                className="min-w-0"
                aria-labelledby="oracle-picked-categories"
              >
                <h3
                  id="oracle-picked-categories"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Categories
                </h3>
                <div className="mt-0.5">
                  <TagList items={picked.categories} />
                </div>
              </div>
            ) : null}
            {picked.numPlays != null && picked.numPlays > 0 ? (
              <StatBox label="Your plays" value={String(picked.numPlays)} />
            ) : null}
          </section>

          {picked.mechanics.length > 0 ? (
            <>
              {playStyleLabels.length > 0 ? (
                <section
                  className="min-w-0"
                  aria-labelledby="oracle-picked-play-style"
                >
                  <h3
                    id="oracle-picked-play-style"
                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Play style
                  </h3>
                  <div className="mt-0.5">
                    <TagList items={playStyleLabels} />
                  </div>
                </section>
              ) : null}
              <section
                className="min-w-0"
                aria-labelledby="oracle-picked-mechanics"
              >
                <h3
                  id="oracle-picked-mechanics"
                  className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  BGG mechanics
                </h3>
                <div className="mt-0.5">
                  <TagList items={picked.mechanics} />
                </div>
              </section>
            </>
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
  );
}

export function RandomPicker() {
  const { status, errorMessage, data } = useGamesData();
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
    mechanicBucket,
    setMechanicBucket,
    includeFriendsGames,
    setIncludeFriendsGames,
  } = useGameFilters();
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

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
      mechanicBucket,
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
      mechanicBucket,
      includeFriendsGames,
    ],
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
  }, [pool]);

  const expandFilters = useCallback(() => {
    setFiltersCollapsed(false);
  }, []);

  const showResultHero = Boolean(pickedId && filtersCollapsed);
  const heroWanted = Boolean(showResultHero && picked);
  const [heroMounted, setHeroMounted] = useState(false);
  const [heroEntered, setHeroEntered] = useState(false);
  const heroGameRef = useRef<BggGame | null>(null);

  useEffect(() => {
    if (heroWanted && picked) {
      heroGameRef.current = picked;
      setHeroMounted(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setHeroEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }
  }, [heroWanted, picked]);

  useEffect(() => {
    if (!heroWanted && heroMounted) {
      setHeroEntered(false);
      const t = window.setTimeout(() => {
        setHeroMounted(false);
        heroGameRef.current = null;
      }, FULLSCREEN_TRANSITION_MS);
      return () => window.clearTimeout(t);
    }
  }, [heroWanted, heroMounted]);

  const heroGame = picked ?? heroGameRef.current;

  useEffect(() => {
    if (!heroMounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [heroMounted]);

  useEffect(() => {
    if (!heroMounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") expandFilters();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [heroMounted, expandFilters]);

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

  const containerClass = "mx-auto w-full max-w-3xl space-y-4";

  return (
    <>
      {heroMounted && heroGame ? (
        <div
          className={[
            "fixed inset-0 z-[95] flex flex-col bg-background",
            oracleFullscreenShellClasses(heroEntered),
          ].join(" ")}
          role="dialog"
          aria-modal="true"
          aria-labelledby="oracle-fullscreen-title"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-3 py-2.5 sm:px-5 sm:py-3">
            <p className="min-w-0 text-sm text-muted-foreground sm:text-base">
              <span className="font-medium text-foreground">
                {pool.length} game{pool.length === 1 ? "" : "s"}
              </span>{" "}
              in your current pool
            </p>
            <button
              type="button"
              onClick={expandFilters}
              className="shrink-0 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60 sm:px-4 sm:py-2 sm:text-base"
            >
              Adjust filters
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 sm:items-stretch sm:justify-center sm:p-4">
            <article
              className={[
                "board-card relative flex h-full min-h-0 w-full max-w-5xl flex-col overflow-hidden border-border bg-card ring-1 ring-primary/25 sm:mx-auto sm:max-h-[min(100dvh-5rem,56rem)] sm:rounded-xl sm:border sm:ring-0",
                oracleFullscreenCardClasses(heroEntered),
              ].join(" ")}
            >
              <OraclePickedHeroBody picked={heroGame} />
            </article>
          </div>
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[99] flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={roll}
              disabled={pool.length === 0}
              className="pointer-events-auto rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-black/20 ring-1 ring-primary/20 transition-[opacity,transform] hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Pick again
            </button>
          </div>
        </div>
      ) : null}
      <div className={containerClass}>
        <div
          className={[
            "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
            filtersCollapsed && pickedId
              ? "grid-rows-[0fr]"
              : "grid-rows-[1fr]",
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
              mechanicBucket={mechanicBucket}
              setMechanicBucket={setMechanicBucket}
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
      </div>
    </>
  );
}
