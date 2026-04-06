import {
  filtersEqualToDefaults,
  useGameFilters,
} from "@/context/game-filters-context";
import {
  MAX_TIME_BY_INDEX,
  PLAYER_SLIDER_MAX,
  WEIGHT_FILTER_SLIDER_MAX,
  collectCategories,
  filterPillClass,
  formatPlayerFilterLabel,
  playerCountToSliderStep,
  sliderStepToPlayerCount,
  weightFilterSliderStep,
  weightFilterStepToTenths,
  weightFromSlider,
} from "@/lib/gameFilters";
import { bggWeightTextClass } from "@/lib/bggWeightColor";
import type { BggGame } from "@/types/bgg";

/** Mobile: label + value stacked | control. sm+: label | value | control */
const FILTER_ROW_GRID =
  "grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] gap-x-2 gap-y-1.5 items-start sm:grid-cols-[7.5rem_minmax(0,10rem)_minmax(0,1fr)]";

const filterLabelValueStack = "flex min-w-0 flex-col gap-0.5 sm:contents";

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
  includeFriendsGames: boolean;
  setIncludeFriendsGames: (v: boolean) => void;
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
  includeFriendsGames,
  setIncludeFriendsGames,
}: GameFiltersPanelProps) {
  const categoryOptions = collectCategories(games);
  const maxTimeLabel =
    maxTimeIndex === 0
      ? "No limit"
      : `Up to ${MAX_TIME_BY_INDEX[maxTimeIndex]} min`;
  const playersLabel = formatPlayerFilterLabel(players);
  const playersSliderStep = playerCountToSliderStep(players);
  const minWeightValueLabel = minWeightActive
    ? `${weightFromSlider(minWeightTenths).toFixed(1)} / 5`
    : "Any";
  const maxWeightValueLabel = maxWeightActive
    ? `${weightFromSlider(maxWeightTenths).toFixed(1)} / 5`
    : "Any";
  const categoryValueLabel = category ?? "Any";
  const friendsGamesValueLabel = includeFriendsGames ? "On" : "Off";
  const minWeightSliderStep = weightFilterSliderStep(
    minWeightActive,
    minWeightTenths,
  );
  const maxWeightSliderStep = weightFilterSliderStep(
    maxWeightActive,
    maxWeightTenths,
  );

  const { clearFilters } = useGameFilters();
  const filtersAreDefault = filtersEqualToDefaults({
    players,
    maxTimeIndex,
    minWeightTenths,
    maxWeightTenths,
    minWeightActive,
    maxWeightActive,
    category,
    includeFriendsGames,
  });

  return (
    <fieldset className="board-card space-y-3 rounded-lg border border-border bg-card p-3">
      <legend className="sr-only">Filters</legend>

      <div className={FILTER_ROW_GRID}>
        <div className={filterLabelValueStack}>
          <span
            className="text-base font-medium text-foreground"
            id="filter-players-label"
          >
            Players
          </span>
          <span className="min-w-0 truncate text-left text-xs leading-tight tabular-nums text-muted-foreground sm:text-base">
            {playersLabel}
          </span>
        </div>
        <div className="min-w-0">
          <input
            type="range"
            min={0}
            max={PLAYER_SLIDER_MAX}
            step={1}
            value={playersSliderStep}
            onChange={(e) =>
              setPlayers(sliderStepToPlayerCount(Number(e.target.value)))
            }
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
            aria-labelledby="filter-players-label"
            aria-valuetext={playersLabel}
          />
          <div className="mt-0.5 flex justify-between text-sm text-muted-foreground">
            <span>Any</span>
            <span>10</span>
          </div>
        </div>
      </div>

      {categoryOptions.length > 0 ? (
        <div className={FILTER_ROW_GRID}>
          <div className={filterLabelValueStack}>
            <span
              className="text-base font-medium text-foreground"
              id="filter-category-label"
            >
              Category
            </span>
            <span
              className="min-w-0 truncate text-left text-xs leading-tight text-muted-foreground sm:text-base"
              title={category ?? undefined}
            >
              {categoryValueLabel}
            </span>
          </div>
          <div
            className="flex min-w-0 flex-wrap gap-1.5"
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

      <div className={FILTER_ROW_GRID}>
        <div className={filterLabelValueStack}>
          <span
            className="text-base font-medium text-foreground"
            id="filter-friends-games-label"
          >
            Friends&apos; games
          </span>
          <span className="min-w-0 truncate text-left text-xs leading-tight text-muted-foreground sm:text-base">
            {friendsGamesValueLabel}
          </span>
        </div>
        <div
          className="flex min-w-0 flex-wrap gap-1.5"
          role="radiogroup"
          aria-labelledby="filter-friends-games-label"
        >
          <button
            type="button"
            role="radio"
            aria-checked={!includeFriendsGames}
            onClick={() => setIncludeFriendsGames(false)}
            className={filterPillClass(!includeFriendsGames)}
          >
            Off
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={includeFriendsGames}
            onClick={() => setIncludeFriendsGames(true)}
            className={filterPillClass(includeFriendsGames)}
          >
            On
          </button>
        </div>
      </div>

      <div className="space-y-2 border-t border-border pt-3">
        <div className={FILTER_ROW_GRID}>
          <div className={filterLabelValueStack}>
            <span
              className="text-base font-medium text-foreground"
              id="filter-min-weight-label"
            >
              Min weight
            </span>
            <span
              className={[
                "min-w-0 truncate text-left text-xs sm:text-base",
                minWeightActive
                  ? bggWeightTextClass(weightFromSlider(minWeightTenths))
                  : "tabular-nums text-muted-foreground",
              ].join(" ")}
            >
              {minWeightValueLabel}
            </span>
          </div>
          <div className="min-w-0">
            <input
              type="range"
              min={0}
              max={WEIGHT_FILTER_SLIDER_MAX}
              step={1}
              value={minWeightSliderStep}
              onChange={(e) => {
                const step = Number(e.target.value);
                if (step === 0) setMinWeightActive(false);
                else {
                  setMinWeightActive(true);
                  setMinWeightTenths(weightFilterStepToTenths(step));
                }
              }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              aria-labelledby="filter-min-weight-label"
              aria-valuetext={minWeightValueLabel}
            />
            <div className="mt-0.5 flex justify-between text-sm text-muted-foreground">
              <span>Any</span>
              <span>5.0</span>
            </div>
          </div>
        </div>

        <div className={FILTER_ROW_GRID}>
          <div className={filterLabelValueStack}>
            <span
              className="text-base font-medium text-foreground"
              id="filter-max-weight-label"
            >
              Max weight
            </span>
            <span
              className={[
                "min-w-0 truncate text-left text-xs sm:text-base",
                maxWeightActive
                  ? bggWeightTextClass(weightFromSlider(maxWeightTenths))
                  : "tabular-nums text-muted-foreground",
              ].join(" ")}
            >
              {maxWeightValueLabel}
            </span>
          </div>
          <div className="min-w-0">
            <input
              type="range"
              min={0}
              max={WEIGHT_FILTER_SLIDER_MAX}
              step={1}
              value={maxWeightSliderStep}
              onChange={(e) => {
                const step = Number(e.target.value);
                if (step === 0) setMaxWeightActive(false);
                else {
                  setMaxWeightActive(true);
                  setMaxWeightTenths(weightFilterStepToTenths(step));
                }
              }}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              aria-labelledby="filter-max-weight-label"
              aria-valuetext={maxWeightValueLabel}
            />
            <div className="mt-0.5 flex justify-between text-sm text-muted-foreground">
              <span>Any</span>
              <span>5.0</span>
            </div>
          </div>
        </div>

        <div className={FILTER_ROW_GRID}>
          <div className={filterLabelValueStack}>
            <span
              className="text-base font-medium text-foreground"
              id="filter-time-label"
            >
              Max time
            </span>
            <span
              className="min-w-0 truncate text-left text-xs leading-tight tabular-nums text-muted-foreground sm:text-base"
              title={maxTimeLabel}
            >
              {maxTimeLabel}
            </span>
          </div>
          <div className="min-w-0">
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
            <div className="mt-0.5 flex justify-between text-sm text-muted-foreground">
              <span>No limit</span>
              <span>240 min</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-base leading-snug text-muted-foreground">
          {matchCount} / {totalCount} games match
        </p>
        <button
          type="button"
          onClick={clearFilters}
          disabled={filtersAreDefault}
          className="shrink-0 self-start rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-45 sm:self-auto"
        >
          Clear filters
        </button>
      </div>
    </fieldset>
  );
}
