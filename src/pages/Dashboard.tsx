import { useMemo, useState } from "react";

import { GameFiltersPanel } from "@/components/GameFiltersPanel";
import { GeekdoCoverModal } from "@/components/GeekdoCoverModal";
import { ShelfQuickFilterIcons } from "@/components/ShelfQuickFilterIcons";
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
import type { BggGame } from "@/types/bgg";

function GameCard({
  game,
  onRequestCoverPicker,
}: {
  game: BggGame;
  onRequestCoverPicker: () => void;
}) {
  const src = game.image || game.thumbnail;

  return (
    <article className="board-card flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="aspect-square w-full overflow-hidden bg-muted">
        {src ? (
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <button
            type="button"
            onClick={onRequestCoverPicker}
            className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 px-2 text-center text-base text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span>No cover yet</span>
            <span className="text-base font-medium text-primary">
              Tap to choose
            </span>
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h2 className="line-clamp-1 min-w-0 text-lg font-semibold leading-snug text-card-foreground">
          <a
            href={bggBoardGameUrl(game.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-sm"
          >
            {game.name}
            {game.yearPublished != null ? (
              <span className="font-normal text-muted-foreground">
                {" "}
                ({game.yearPublished})
              </span>
            ) : null}
          </a>
        </h2>
        {game.categories.length > 0 ? (
          <div
            className="flex flex-wrap gap-1"
            role="list"
            aria-label="Categories"
          >
            {game.categories.map((c) => (
              <span
                key={c}
                role="listitem"
                className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-base font-medium leading-snug text-muted-foreground"
              >
                {c}
              </span>
            ))}
          </div>
        ) : null}
        <dl className="mt-auto grid grid-cols-2 gap-x-2 gap-y-1 text-base text-muted-foreground">
          <div>
            <dt className="sr-only">Players</dt>
            <dd>{formatPlayerCount(game)} players</dd>
          </div>
          <div>
            <dt className="sr-only">Time</dt>
            <dd>{formatPlayTimeRange(game)}</dd>
          </div>
          {game.averageWeight != null ? (
            <div className="col-span-2">
              <dt className="sr-only">Weight</dt>
              <dd>
                Weight{" "}
                <span className={bggWeightTextClass(game.averageWeight)}>
                  {game.averageWeight.toFixed(2)}
                </span>
                <span className="text-muted-foreground"> / 5</span>
              </dd>
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
  const [query, setQuery] = useState("");
  const [coverModalGameId, setCoverModalGameId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const coverModalGame = useMemo(() => {
    if (!coverModalGameId || !data) return null;
    return data.games.find((g) => g.id === coverModalGameId) ?? null;
  }, [coverModalGameId, data]);

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
    ],
  );

  const filteredBySearch = useMemo(() => {
    if (status !== "ok" || !data) return [];
    const q = query.trim().toLowerCase();
    if (!q) return data.games;
    return data.games.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.categories.some((c) => c.toLowerCase().includes(q)) ||
        g.mechanics.some((m) => m.toLowerCase().includes(q)),
    );
  }, [status, data, query]);

  const filtered = useMemo(
    () => filteredBySearch.filter((g) => matchesFilters(g, filters)),
    [filteredBySearch, filters],
  );

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
        {errorMessage}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <GeekdoCoverModal
        open={coverModalGameId != null}
        game={coverModalGame}
        onClose={() => setCoverModalGameId(null)}
        onPick={(thumbnail, image) => {
          if (coverModalGameId) {
            setImagePick(coverModalGameId, { thumbnail, image });
          }
        }}
      />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="relative z-20 flex w-full min-w-0 items-stretch rounded-lg border border-border bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring sm:max-w-md sm:flex-1">
            <label className="flex min-w-0 flex-1">
              <span className="sr-only">Search</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, category, mechanic…"
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
              />
            </label>
            <ShelfQuickFilterIcons
              games={data.games}
              players={players}
              setPlayers={setPlayers}
              category={category}
              setCategory={setCategory}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              aria-controls="shelf-filters-panel"
              className="rounded-lg border border-border bg-card px-3 py-2 text-base font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {filtersOpen ? "Hide filters" : "Filters"}
            </button>
            <p className="text-base text-muted-foreground">
              Showing {filtered.length} of {data.games.length}
            </p>
          </div>
        </div>

        <div
          id="shelf-filters-panel"
          className={[
            "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
            filtersOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          ].join(" ")}
        >
          <div
            className="min-h-0 overflow-hidden"
            aria-hidden={!filtersOpen}
          >
            <GameFiltersPanel
              games={data.games}
              matchCount={filtered.length}
              totalCount={filteredBySearch.length}
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
              <GameCard
                game={game}
                onRequestCoverPicker={() => setCoverModalGameId(game.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {filtered.length === 0 && data.games.length > 0 ? (
        <p className="text-center text-base text-muted-foreground">
          No games match your search or filters.
        </p>
      ) : null}
    </div>
  );
}
