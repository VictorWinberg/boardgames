import { useEffect, useMemo, useState } from "react";

import { GameFiltersPanel } from "@/components/GameFiltersPanel";
import { GeekdoCoverModal } from "@/components/GeekdoCoverModal";
import { ShelfQuickFilterIcons } from "@/components/ShelfQuickFilterIcons";
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

const SHELF_VIEW_STORAGE_KEY = "boardgames-shelf-view";

type ShelfViewMode = "card" | "list" | "grid";

function readShelfViewMode(): ShelfViewMode {
  if (typeof window === "undefined") return "card";
  const raw = localStorage.getItem(SHELF_VIEW_STORAGE_KEY);
  if (raw === "list" || raw === "grid" || raw === "card") return raw;
  return "card";
}

function IconViewCard({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="10" rx="1" />
      <line x1="3" y1="17" x2="21" y2="17" />
      <line x1="3" y1="21" x2="15" y2="21" />
    </svg>
  );
}

function IconViewList({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="5" y2="6" />
      <line x1="3" y1="12" x2="5" y2="12" />
      <line x1="3" y1="18" x2="5" y2="18" />
    </svg>
  );
}

function IconViewGrid({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ShelfViewSelector({
  value,
  onChange,
}: {
  value: ShelfViewMode;
  onChange: (mode: ShelfViewMode) => void;
}) {
  const modes: { mode: ShelfViewMode; label: string; Icon: typeof IconViewCard }[] =
    [
      { mode: "card", label: "Card view", Icon: IconViewCard },
      { mode: "list", label: "List view", Icon: IconViewList },
      { mode: "grid", label: "Grid view (covers only)", Icon: IconViewGrid },
    ];

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border bg-card p-0.5 shadow-sm"
      role="group"
      aria-label="Shelf layout"
    >
      {modes.map(({ mode, label, Icon }) => {
        const selected = value === mode;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-pressed={selected}
            title={label}
            className={[
              "flex h-9 w-9 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            ].join(" ")}
          >
            <span className="sr-only">{label}</span>
            <Icon className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
}

function GameCoverBlock({
  game,
  onRequestCoverPicker,
  className,
  imageLink,
  compactPlaceholder = false,
}: {
  game: BggGame;
  onRequestCoverPicker: () => void;
  className?: string;
  /** When set and a cover exists, wraps the image in a link (avoid nesting link + cover-picker button). */
  imageLink?: { href: string; ariaLabel: string };
  compactPlaceholder?: boolean;
}) {
  const src = game.image || game.thumbnail;
  const boxClass = className ?? "aspect-square w-full overflow-hidden bg-muted";
  if (src && imageLink) {
    return (
      <div className={boxClass}>
        <a
          href={imageLink.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block h-full w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={imageLink.ariaLabel}
        >
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </a>
      </div>
    );
  }
  return (
    <div className={boxClass}>
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
          className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-0.5 px-1 text-center text-base text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {compactPlaceholder ? (
            <>
              <span className="text-base leading-tight">No cover</span>
              <span className="text-base font-medium leading-tight text-primary">
                Choose
              </span>
            </>
          ) : (
            <>
              <span>No cover yet</span>
              <span className="text-base font-medium text-primary">
                Tap to choose
              </span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

function GameListRow({
  game,
  onRequestCoverPicker,
}: {
  game: BggGame;
  onRequestCoverPicker: () => void;
}) {
  return (
    <article className="board-card flex min-w-0 gap-3 overflow-hidden rounded-lg border border-border bg-card p-3">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted sm:h-28 sm:w-28">
        <GameCoverBlock
          game={game}
          onRequestCoverPicker={onRequestCoverPicker}
          className="h-full w-full overflow-hidden bg-muted"
          compactPlaceholder
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <h2 className="line-clamp-2 min-w-0 text-base font-semibold leading-snug text-card-foreground sm:text-lg">
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
        <p className="text-base text-muted-foreground">
          {formatPlayerCount(game)} players · {formatPlayTimeRange(game)}
          {game.averageWeight != null ? (
            <>
              {" "}
              · weight{" "}
              <span className={bggWeightTextClass(game.averageWeight)}>
                {game.averageWeight.toFixed(2)}
              </span>
            </>
          ) : null}
        </p>
        {game.categories.length > 0 ? (
          <p
            className="line-clamp-1 min-w-0 text-base text-muted-foreground"
            title={game.categories.join(", ")}
          >
            {game.categories.join(" · ")}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function GameGridThumb({
  game,
  onRequestCoverPicker,
}: {
  game: BggGame;
  onRequestCoverPicker: () => void;
}) {
  return (
    <article
      className="board-card overflow-hidden rounded-md border border-border bg-card shadow-sm"
      title={game.name}
    >
      <GameCoverBlock
        game={game}
        onRequestCoverPicker={onRequestCoverPicker}
        compactPlaceholder
        imageLink={{
          href: bggBoardGameUrl(game.id),
          ariaLabel: `${game.name} on BoardGameGeek`,
        }}
      />
    </article>
  );
}

function GameCard({
  game,
  onRequestCoverPicker,
}: {
  game: BggGame;
  onRequestCoverPicker: () => void;
}) {
  return (
    <article className="board-card flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <GameCoverBlock game={game} onRequestCoverPicker={onRequestCoverPicker} />
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
          <p
            className="min-w-0 truncate text-base font-medium leading-snug text-muted-foreground"
            title={game.categories.join(", ")}
            aria-label={`Categories: ${game.categories.join(", ")}`}
          >
            {game.categories.join(" · ")}
          </p>
        ) : null}
        {game.owner?.trim() ? (
          <p className="text-base text-muted-foreground">
            <span className="font-medium text-foreground">Owner</span>{" "}
            {game.owner.trim()}
          </p>
        ) : null}
        <dl className="mt-auto flex flex-col gap-y-1 text-base text-muted-foreground sm:grid sm:grid-cols-2 sm:gap-x-2 sm:gap-y-1">
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
    includeFriendsGames,
    setIncludeFriendsGames,
  } = useGameFilters();
  const [query, setQuery] = useState("");
  const [coverModalGameId, setCoverModalGameId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [shelfView, setShelfView] = useState<ShelfViewMode>(readShelfViewMode);

  useEffect(() => {
    localStorage.setItem(SHELF_VIEW_STORAGE_KEY, shelfView);
  }, [shelfView]);

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
    ],
  );

  const filteredBySearch = useMemo(() => {
    if (status !== "ok" || !data) return [];
    const q = query.trim().toLowerCase();
    return data.games.filter((g) => {
      if (!includeFriendsGames && isFriendsOwnedGame(g)) return false;
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        g.categories.some((c) => c.toLowerCase().includes(q)) ||
        g.mechanics.some((m) => m.toLowerCase().includes(q))
      );
    });
  }, [status, data, query, includeFriendsGames]);

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
            <ShelfViewSelector value={shelfView} onChange={setShelfView} />
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
              Showing {filtered.length} of {filteredBySearch.length}
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
              includeFriendsGames={includeFriendsGames}
              setIncludeFriendsGames={setIncludeFriendsGames}
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
        <ul
          className={
            shelfView === "card"
              ? "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              : shelfView === "list"
                ? "flex flex-col gap-3"
                : "grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12"
          }
        >
          {filtered.map((game) => (
            <li key={game.id} className={shelfView === "list" ? "min-w-0" : undefined}>
              {shelfView === "card" ? (
                <GameCard
                  game={game}
                  onRequestCoverPicker={() => setCoverModalGameId(game.id)}
                />
              ) : shelfView === "list" ? (
                <GameListRow
                  game={game}
                  onRequestCoverPicker={() => setCoverModalGameId(game.id)}
                />
              ) : (
                <GameGridThumb
                  game={game}
                  onRequestCoverPicker={() => setCoverModalGameId(game.id)}
                />
              )}
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
