import { useEffect, useMemo, useState, type KeyboardEvent } from "react";

import { GameFiltersPanel } from "@/components/GameFiltersPanel";
import { GameFullscreenModal } from "@/components/GameFullscreenModal";
import { ShelfQuickFilterIcons } from "@/components/ShelfQuickFilterIcons";
import { useGameFilters } from "@/context/game-filters-context";
import { useGamesData } from "@/context/games-data-context";
import {
  MAX_TIME_BY_INDEX,
  isFriendsOwnedGame,
  matchesFilters,
  weightFromSlider,
  type FilterState,
} from "@/lib/gameFilters";
import { rankDisplayName } from "@/lib/gameFilters";
import { formatPlayTimeRange } from "@/lib/formatPlayTimeRange";
import {
  MECHANIC_BUCKET_LABELS,
  mechanicBucketIdsForGame,
} from "@/lib/mechanicBuckets";
import type { BggGame } from "@/types/bgg";

const SHELF_VIEW_STORAGE_KEY = "boardgames-shelf-view";

type ShelfViewMode = "card" | "compact" | "grid";

function readShelfViewMode(): ShelfViewMode {
  if (typeof window === "undefined") return "card";
  const raw = localStorage.getItem(SHELF_VIEW_STORAGE_KEY);
  if (raw === "list") return "compact";
  if (raw === "compact" || raw === "grid" || raw === "card") return raw;
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

function IconViewCompactCard({ className }: { className?: string }) {
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
      <rect x="3" y="3" width="7" height="18" rx="1" />
      <rect x="14" y="3" width="7" height="18" rx="1" />
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

function IconClearSearch({ className }: { className?: string }) {
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
      <path d="M18 6 6 18M6 6l12 12" />
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
  const modes: {
    mode: ShelfViewMode;
    label: string;
    Icon: typeof IconViewCard;
  }[] = [
    { mode: "card", label: "Card view", Icon: IconViewCard },
    {
      mode: "compact",
      label: "Compact cards",
      Icon: IconViewCompactCard,
    },
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

function friendsGameOwnerName(game: BggGame): string | null {
  const o = game.owner?.trim();
  return o || null;
}

/** Shown when `game.owner` is set (friend’s copy). */
function FriendsGameOwnerBadge({
  ownerName,
  variant,
}: {
  ownerName: string;
  variant: "inline" | "cover" | "cover-top";
}) {
  if (variant === "cover") {
    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent px-1 pb-1 pt-7">
        <p className="truncate text-center text-[0.65rem] font-semibold leading-tight text-white drop-shadow-sm sm:text-xs">
          <span className="sr-only">Owner: </span>
          {ownerName}&apos;s
        </p>
      </div>
    );
  }
  if (variant === "cover-top") {
    return (
      <div
        className="pointer-events-none absolute right-1.5 top-1.5 z-10 max-w-[min(11rem,calc(100%-0.75rem))]"
        title={`${ownerName}'s copy`}
      >
        <p className="truncate rounded-md border border-primary/45 bg-card px-1.5 py-0.5 text-right text-[0.65rem] font-semibold leading-tight text-primary shadow-[0_2px_14px_rgb(0_0_0/0.55)] sm:text-xs">
          <span className="sr-only">Owner: </span>
          {ownerName}&apos;s
        </p>
      </div>
    );
  }
  return (
    <span
      className="inline-flex max-w-[12rem] shrink-0 items-center truncate rounded-md border border-primary/40 bg-primary/15 px-1.5 py-0.5 text-xs font-semibold text-primary"
      title={`${ownerName}'s copy`}
    >
      {ownerName}&apos;s
    </span>
  );
}

function activateOnKey(e: KeyboardEvent, action: () => void): void {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    action();
  }
}

function GameCoverBlock({
  game,
  className,
  onImageClick,
  onEmptyCoverPrimary,
  onOpenFullscreen,
  compactPlaceholder = false,
  preferThumbnail = false,
}: {
  game: BggGame;
  className?: string;
  /** When set and a cover exists, image opens fullscreen (keyboard-activable). */
  onImageClick?: () => void;
  /** When set, empty-cover tap prefers this (e.g. grid → fullscreen). */
  onEmptyCoverPrimary?: () => void;
  /** When no cover image, tap opens details (e.g. card layout). */
  onOpenFullscreen?: () => void;
  compactPlaceholder?: boolean;
  /** Dense grid tiles: load smaller BGG thumbnail first to save bandwidth. */
  preferThumbnail?: boolean;
}) {
  const src = preferThumbnail
    ? game.thumbnail || game.image
    : game.image || game.thumbnail;
  const boxClass = className ?? "aspect-square w-full overflow-hidden bg-muted";
  if (src && onImageClick) {
    return (
      <div className={boxClass}>
        <div
          role="button"
          tabIndex={0}
          aria-label={`View ${game.name} fullscreen`}
          className="block h-full w-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={onImageClick}
          onKeyDown={(e) => activateOnKey(e, onImageClick)}
        >
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
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
      ) : (onEmptyCoverPrimary ?? onOpenFullscreen) ? (
        <button
          type="button"
          onClick={onEmptyCoverPrimary ?? onOpenFullscreen}
          className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-0.5 px-1 text-center text-base text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {compactPlaceholder ? (
            <>
              <span className="text-base leading-tight">No cover</span>
              <span className="text-base font-medium leading-tight text-primary">
                Details
              </span>
            </>
          ) : (
            <>
              <span>No cover yet</span>
              <span className="text-base font-medium text-primary">
                Tap for details
              </span>
            </>
          )}
        </button>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 px-1 text-center text-base text-muted-foreground">
          <span>No cover</span>
        </div>
      )}
    </div>
  );
}

function GameGridThumb({
  game,
  onOpenFullscreen,
}: {
  game: BggGame;
  onOpenFullscreen: () => void;
}) {
  const ownerName = friendsGameOwnerName(game);
  const thumbTitle = ownerName
    ? `${game.name} (${ownerName}'s copy)`
    : game.name;
  return (
    <article
      className="board-card overflow-hidden rounded-md border border-border bg-card shadow-sm"
      title={thumbTitle}
    >
      <div className="relative w-full">
        <GameCoverBlock
          game={game}
          compactPlaceholder
          preferThumbnail
          onImageClick={onOpenFullscreen}
          onEmptyCoverPrimary={onOpenFullscreen}
        />
        {ownerName ? (
          <FriendsGameOwnerBadge variant="cover" ownerName={ownerName} />
        ) : null}
      </div>
    </article>
  );
}

function GameCard({
  game,
  onOpenFullscreen,
}: {
  game: BggGame;
  onOpenFullscreen: () => void;
}) {
  const ownerName = friendsGameOwnerName(game);
  return (
    <article className="board-card flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="relative w-full">
        <GameCoverBlock
          game={game}
          onImageClick={onOpenFullscreen}
          onOpenFullscreen={onOpenFullscreen}
        />
        {ownerName ? (
          <FriendsGameOwnerBadge variant="cover-top" ownerName={ownerName} />
        ) : null}
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${game.name}, view fullscreen details`}
        className="flex flex-1 cursor-pointer flex-col gap-1 p-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        onClick={onOpenFullscreen}
        onKeyDown={(e) => activateOnKey(e, onOpenFullscreen)}
      >
        <h2 className="line-clamp-1 min-w-0 text-lg font-semibold leading-snug text-card-foreground">
          {game.name}
          {game.yearPublished != null ? (
            <span className="font-normal text-muted-foreground">
              {" "}
              ({game.yearPublished})
            </span>
          ) : null}
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
        <dl className="mt-auto flex flex-col gap-y-1 text-base text-muted-foreground">
          <div>
            <dt className="sr-only">Time</dt>
            <dd>{formatPlayTimeRange(game)}</dd>
          </div>
          {game.numPlays != null && game.numPlays > 0 ? (
            <div>
              <dt className="sr-only">Plays logged</dt>
              <dd>{game.numPlays} plays logged</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </article>
  );
}

function GameCompactCard({
  game,
  onOpenFullscreen,
}: {
  game: BggGame;
  onOpenFullscreen: () => void;
}) {
  const ownerName = friendsGameOwnerName(game);
  return (
    <article className="board-card flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm">
      <div className="relative w-full">
        <GameCoverBlock
          game={game}
          compactPlaceholder
          onImageClick={onOpenFullscreen}
          onOpenFullscreen={onOpenFullscreen}
        />
        {ownerName ? (
          <FriendsGameOwnerBadge variant="cover-top" ownerName={ownerName} />
        ) : null}
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-label={`${game.name}, view fullscreen details`}
        className="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5 p-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
        onClick={onOpenFullscreen}
        onKeyDown={(e) => activateOnKey(e, onOpenFullscreen)}
      >
        <h2 className="line-clamp-1 min-w-0 text-sm font-semibold leading-snug text-card-foreground">
          {game.name}
          {game.yearPublished != null ? (
            <span className="font-normal text-muted-foreground">
              {" "}
              ({game.yearPublished})
            </span>
          ) : null}
        </h2>
        {game.categories.length > 0 ? (
          <p
            className="line-clamp-1 min-w-0 text-xs font-medium leading-tight text-muted-foreground"
            title={game.categories.join(", ")}
            aria-label={`Categories: ${game.categories.join(", ")}`}
          >
            {game.categories.join(" · ")}
          </p>
        ) : null}
        <p className="mt-auto line-clamp-2 min-w-0 text-xs leading-tight text-muted-foreground">
          {formatPlayTimeRange(game)}
          {game.numPlays != null && game.numPlays > 0 ? (
            <> · {game.numPlays} plays</>
          ) : null}
        </p>
      </div>
    </article>
  );
}

export function Dashboard() {
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
  const [query, setQuery] = useState("");
  const [fullscreenGameId, setFullscreenGameId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [shelfView, setShelfView] = useState<ShelfViewMode>(readShelfViewMode);

  useEffect(() => {
    localStorage.setItem(SHELF_VIEW_STORAGE_KEY, shelfView);
  }, [shelfView]);

  const fullscreenGame = useMemo(() => {
    if (!fullscreenGameId || !data) return null;
    return data.games.find((g) => g.id === fullscreenGameId) ?? null;
  }, [fullscreenGameId, data]);

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

  const filteredBySearch = useMemo(() => {
    if (status !== "ok" || !data) return [];
    const q = query.trim().toLowerCase();
    return data.games.filter((g) => {
      if (!includeFriendsGames && isFriendsOwnedGame(g)) return false;
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        g.categories.some((c) => c.toLowerCase().includes(q)) ||
        g.ranks.some((rank) =>
          rankDisplayName(rank.name).toLowerCase().includes(q),
        ) ||
        g.mechanics.some((m) => m.toLowerCase().includes(q)) ||
        mechanicBucketIdsForGame(g).some((id) =>
          MECHANIC_BUCKET_LABELS[id].toLowerCase().includes(q),
        )
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
      <GameFullscreenModal
        open={fullscreenGameId != null}
        game={fullscreenGame}
        onClose={() => setFullscreenGameId(null)}
      />
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="relative z-20 flex w-full min-w-0 items-stretch rounded-lg border border-border bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring sm:max-w-md sm:flex-1">
            <label className="relative flex min-w-0 flex-1">
              <span className="sr-only">Search</span>
              <input
                type="text"
                role="searchbox"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, category, mechanic…"
                className={[
                  "min-w-0 flex-1 border-0 bg-transparent py-2 pl-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0",
                  query.length > 0 ? "pr-11" : "pr-3",
                ].join(" ")}
              />
              {query.length > 0 ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 z-[2] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <IconClearSearch className="h-4 w-4 shrink-0" />
                </button>
              ) : null}
            </label>
            <ShelfQuickFilterIcons
              games={data.games}
              players={players}
              setPlayers={setPlayers}
              category={category}
              setCategory={setCategory}
              mechanicBucket={mechanicBucket}
              setMechanicBucket={setMechanicBucket}
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
          <div className="min-h-0 overflow-hidden" aria-hidden={!filtersOpen}>
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
              mechanicBucket={mechanicBucket}
              setMechanicBucket={setMechanicBucket}
              includeFriendsGames={includeFriendsGames}
              setIncludeFriendsGames={setIncludeFriendsGames}
            />
          </div>
        </div>
      </div>

      {data.games.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          No games in <code className="rounded bg-muted px-1">bgg.json</code>.
          Sync your BGG collection to populate this list.
        </p>
      ) : (
        <ul
          className={
            shelfView === "card"
              ? "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              : shelfView === "compact"
                ? "grid grid-cols-3 gap-2 min-[400px]:grid-cols-4 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7"
                : "grid grid-cols-4 gap-1.5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12"
          }
        >
          {filtered.map((game) => (
            <li
              key={game.id}
              className={shelfView === "compact" ? "min-w-0" : undefined}
            >
              {shelfView === "card" ? (
                <GameCard
                  game={game}
                  onOpenFullscreen={() => setFullscreenGameId(game.id)}
                />
              ) : shelfView === "compact" ? (
                <GameCompactCard
                  game={game}
                  onOpenFullscreen={() => setFullscreenGameId(game.id)}
                />
              ) : (
                <GameGridThumb
                  game={game}
                  onOpenFullscreen={() => setFullscreenGameId(game.id)}
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
