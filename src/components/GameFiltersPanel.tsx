import {
  MAX_TIME_BY_INDEX,
  PLAYER_OPTIONS,
  collectCategories,
  filterPillClass,
  weightFromSlider,
} from "@/lib/gameFilters";
import type { BggGame } from "@/types/bgg";

export type GameFiltersPanelProps = {
  games: BggGame[];
  matchCount: number;
  totalCount: number;
  players: number | null;
  setPlayers: (n: number | null) => void;
  maxTimeIndex: number;
  setMaxTimeIndex: (i: number) => void;
  minWeightTenths: number;
  setMinWeightTenths: (n: number) => void;
  maxWeightTenths: number;
  setMaxWeightTenths: (n: number) => void;
  minWeightActive: boolean;
  setMinWeightActive: (v: boolean) => void;
  maxWeightActive: boolean;
  setMaxWeightActive: (v: boolean) => void;
  category: string | null;
  setCategory: (c: string | null) => void;
};

export function GameFiltersPanel({
  games,
  matchCount,
  totalCount,
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
}: GameFiltersPanelProps) {
  const categoryOptions = collectCategories(games);
  const maxTimeLabel =
    maxTimeIndex === 0
      ? "No limit"
      : `Up to ${MAX_TIME_BY_INDEX[maxTimeIndex]} min`;

  return (
    <fieldset className="board-card space-y-3 rounded-lg border border-border bg-card p-3">
      <legend className="sr-only">Filters</legend>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span
          className="shrink-0 text-base font-medium text-foreground"
          id="filter-players-label"
        >
          Players
        </span>
        <div
          className="flex min-w-0 flex-1 flex-wrap gap-1.5"
          role="radiogroup"
          aria-labelledby="filter-players-label"
        >
          {PLAYER_OPTIONS.map((n) => {
            const selected = players === n;
            const label = n == null ? "Any" : String(n);
            return (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setPlayers(n)}
                className={filterPillClass(selected)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {categoryOptions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
          <span
            className="shrink-0 text-base font-medium text-foreground"
            id="filter-category-label"
          >
            Category
          </span>
          <div
            className="flex min-w-0 flex-1 flex-wrap gap-1.5"
            role="radiogroup"
            aria-labelledby="filter-category-label"
          >
            <button
              type="button"
              role="radio"
              aria-checked={category === null}
              onClick={() => setCategory(null)}
              className={filterPillClass(category === null)}
            >
              Any
            </button>
            {categoryOptions.map((c) => {
              const selected = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setCategory(c)}
                  className={filterPillClass(selected)}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-2 border-t border-border pt-2">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-base font-medium text-foreground">
              Min weight
            </span>
            <button
              type="button"
              onClick={() => setMinWeightActive(false)}
              className={filterPillClass(!minWeightActive)}
            >
              Any
            </button>
            <button
              type="button"
              onClick={() => setMinWeightActive(true)}
              className={filterPillClass(minWeightActive)}
            >
              At least…
            </button>
            {minWeightActive ? (
              <span className="text-base tabular-nums text-muted-foreground">
                {weightFromSlider(minWeightTenths).toFixed(1)} / 5
              </span>
            ) : null}
          </div>
          {minWeightActive ? (
            <input
              type="range"
              min={10}
              max={50}
              step={1}
              value={minWeightTenths}
              onChange={(e) => setMinWeightTenths(Number(e.target.value))}
              className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              aria-label="Minimum BGG weight"
            />
          ) : null}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-base font-medium text-foreground">
              Max weight
            </span>
            <button
              type="button"
              onClick={() => setMaxWeightActive(false)}
              className={filterPillClass(!maxWeightActive)}
            >
              Any
            </button>
            <button
              type="button"
              onClick={() => setMaxWeightActive(true)}
              className={filterPillClass(maxWeightActive)}
            >
              At most…
            </button>
            {maxWeightActive ? (
              <span className="text-base tabular-nums text-muted-foreground">
                {weightFromSlider(maxWeightTenths).toFixed(1)} / 5
              </span>
            ) : null}
          </div>
          {maxWeightActive ? (
            <input
              type="range"
              min={10}
              max={50}
              step={1}
              value={maxWeightTenths}
              onChange={(e) => setMaxWeightTenths(Number(e.target.value))}
              className="mt-1.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              aria-label="Maximum BGG weight"
            />
          ) : null}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <span
              className="text-base font-medium text-foreground"
              id="filter-time-label"
            >
              Max time
            </span>
            <span className="shrink-0 text-base tabular-nums text-muted-foreground">
              {maxTimeLabel}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={MAX_TIME_BY_INDEX.length - 1}
            step={1}
            value={maxTimeIndex}
            onChange={(e) => setMaxTimeIndex(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
            aria-labelledby="filter-time-label"
            aria-valuetext={maxTimeLabel}
          />
          <div className="mt-0.5 flex justify-between text-base text-muted-foreground">
            <span>No limit</span>
            <span>240 min</span>
          </div>
        </div>
      </div>

      <p className="text-base leading-snug text-muted-foreground">
        {matchCount} / {totalCount} games match
      </p>
    </fieldset>
  );
}
