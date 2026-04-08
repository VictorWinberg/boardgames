import { useEffect, useMemo, useRef, useState } from "react";

import {
  PLAYER_SLIDER_MAX,
  collectRankCategories,
  collectMechanicBuckets,
  filterPillClass,
  formatPlayerFilterLabel,
  MECHANIC_BUCKET_LABELS,
  playerCountToSliderStep,
  sliderStepToPlayerCount,
  type MechanicBucketId,
} from "@/lib/gameFilters";
import type { BggGame } from "@/types/bgg";

type OpenKind = "players" | "category" | "mechanic" | null;

function IconUsers({ className }: { className?: string }) {
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
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconTag({ className }: { className?: string }) {
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
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function IconSliders({ className }: { className?: string }) {
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
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function IconX({ className }: { className?: string }) {
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

/** Top-right corner of the trigger (value text ends before it; icon stays clear on the left) */
const clearOnLabelClass =
  "absolute right-0 top-0 z-[2] m-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground shadow-sm transition-colors hover:border-muted-foreground/40 hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const triggerBase =
  "flex h-8 shrink-0 items-center gap-0.5 rounded-md text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export type ShelfQuickFilterIconsProps = {
  games: BggGame[];
  players: number | null;
  setPlayers: (n: number | null) => void;
  category: string | null;
  setCategory: (c: string | null) => void;
  mechanicBucket: MechanicBucketId | null;
  setMechanicBucket: (b: MechanicBucketId | null) => void;
};

export function ShelfQuickFilterIcons({
  games,
  players,
  setPlayers,
  category,
  setCategory,
  mechanicBucket,
  setMechanicBucket,
}: ShelfQuickFilterIconsProps) {
  const [open, setOpen] = useState<OpenKind>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const categoryOptions = useMemo(() => collectRankCategories(games), [games]);
  const mechanicOptions = useMemo(
    () => collectMechanicBuckets(games),
    [games],
  );

  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("keydown", onKey);

    let removePointer: (() => void) | undefined;
    const raf = requestAnimationFrame(() => {
      const onPointerDown = (e: PointerEvent) => {
        if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
      };
      document.addEventListener("pointerdown", onPointerDown, true);
      removePointer = () =>
        document.removeEventListener("pointerdown", onPointerDown, true);
    });

    return () => {
      cancelAnimationFrame(raf);
      removePointer?.();
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const playersActive = players != null;
  const categoryActive = category != null;
  const mechanicActive = mechanicBucket != null;
  const mechanicLabel =
    mechanicBucket != null ? MECHANIC_BUCKET_LABELS[mechanicBucket] : "";

  return (
    <div
      ref={rootRef}
      className="flex shrink-0 items-center gap-px border-l border-border pl-0.5"
    >
      <div className="relative shrink-0">
        <button
          type="button"
          className={[
            triggerBase,
            playersActive
              ? "max-w-[4.25rem] min-w-0 justify-start pl-1 pr-3.5 text-primary"
              : "min-w-8 justify-center px-1",
            open === "players" ? "bg-muted/80 text-foreground" : "",
          ].join(" ")}
          aria-label={
            playersActive
              ? `Players: ${players}. Change player count filter`
              : "Filter by player count"
          }
          aria-expanded={open === "players"}
          aria-haspopup="dialog"
          aria-controls="shelf-quick-players-panel"
          onClick={() =>
            setOpen((o) => (o === "players" ? null : "players"))
          }
        >
          <IconUsers className="h-3.5 w-3.5 shrink-0" />
          {playersActive ? (
            <span className="min-w-0 flex-1 truncate text-left text-[0.6875rem] font-semibold leading-none tabular-nums text-current">
              {players}
            </span>
          ) : null}
        </button>
        {playersActive ? (
          <button
            type="button"
            className={clearOnLabelClass}
            aria-label="Clear player count filter"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPlayers(null);
              setOpen((o) => (o === "players" ? null : o));
            }}
          >
            <IconX className="h-2 w-2 stroke-[2.5]" />
          </button>
        ) : null}
        {open === "players" ? (
          <div
            id="shelf-quick-players-panel"
            role="group"
            aria-label="Player count"
            className="absolute right-0 z-50 mt-1 w-[min(100vw-2rem,12rem)] rounded-md border border-border bg-card p-2 shadow-lg"
          >
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-foreground">Players</span>
              <span className="tabular-nums text-muted-foreground">
                {formatPlayerFilterLabel(players)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={PLAYER_SLIDER_MAX}
              step={1}
              value={playerCountToSliderStep(players)}
              onChange={(e) =>
                setPlayers(sliderStepToPlayerCount(Number(e.target.value)))
              }
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary"
              aria-label="Filter by player count"
              aria-valuetext={formatPlayerFilterLabel(players)}
            />
            <div className="mt-1 flex justify-between text-[0.65rem] text-muted-foreground">
              <span>Any</span>
              <span>10</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative shrink-0">
        <button
          type="button"
          className={[
            triggerBase,
            categoryActive
              ? "max-w-[6.75rem] min-w-0 justify-start pl-1 pr-3.5 text-primary"
              : "min-w-8 justify-center px-1",
            open === "category" ? "bg-muted/80 text-foreground" : "",
          ].join(" ")}
          aria-label={
            categoryActive
              ? `Category: ${category}. Change category filter`
              : "Filter by category"
          }
          aria-expanded={open === "category"}
          aria-haspopup="listbox"
          aria-controls="shelf-quick-category-list"
          title={categoryActive ? category : undefined}
          onClick={() =>
            setOpen((o) => (o === "category" ? null : "category"))
          }
        >
          <IconTag className="h-3.5 w-3.5 shrink-0" />
          {categoryActive ? (
            <span className="min-w-0 flex-1 truncate text-left text-[0.6875rem] font-medium leading-tight text-current">
              {category}
            </span>
          ) : null}
        </button>
        {categoryActive ? (
          <button
            type="button"
            className={clearOnLabelClass}
            aria-label="Clear category filter"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCategory(null);
              setOpen((o) => (o === "category" ? null : o));
            }}
          >
            <IconX className="h-2 w-2 stroke-[2.5]" />
          </button>
        ) : null}
        {open === "category" ? (
          <div
            id="shelf-quick-category-list"
            role="listbox"
            aria-label="Category"
            className="absolute right-0 z-50 mt-1 max-h-64 w-[min(100vw-2rem,14rem)] overflow-y-auto rounded-md border border-border bg-card p-1.5 shadow-lg"
          >
            <div className="flex flex-col gap-1">
              <button
                type="button"
                role="option"
                aria-selected={category === null}
                onClick={() => {
                  setCategory(null);
                  setOpen(null);
                }}
                className={`${filterPillClass(category === null)} flex w-full justify-start`}
              >
                Any
              </button>
              {categoryOptions.map((c) => {
                const selected = category === c;
                return (
                  <button
                    key={c}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setCategory(c);
                      setOpen(null);
                    }}
                    className={`${filterPillClass(selected)} flex w-full justify-start text-left`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {mechanicOptions.length > 0 ? (
        <div className="relative shrink-0">
          <button
            type="button"
            className={[
              triggerBase,
              mechanicActive
                ? "max-w-[10rem] min-w-0 justify-start pl-1 pr-3.5 text-primary"
                : "min-w-8 justify-center px-1",
              open === "mechanic" ? "bg-muted/80 text-foreground" : "",
            ].join(" ")}
            aria-label={
              mechanicActive
                ? `Mechanics: ${mechanicLabel}. Change mechanics filter`
                : "Filter by mechanics"
            }
            aria-expanded={open === "mechanic"}
            aria-haspopup="listbox"
            aria-controls="shelf-quick-mechanic-list"
            title={mechanicActive ? mechanicLabel : undefined}
            onClick={() =>
              setOpen((o) => (o === "mechanic" ? null : "mechanic"))
            }
          >
            <IconSliders className="h-3.5 w-3.5 shrink-0" />
            {mechanicActive ? (
              <span className="min-w-0 flex-1 truncate text-left text-[0.6875rem] font-medium leading-tight text-current">
                {mechanicLabel}
              </span>
            ) : null}
          </button>
          {mechanicActive ? (
            <button
              type="button"
              className={clearOnLabelClass}
              aria-label="Clear mechanics filter"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMechanicBucket(null);
                setOpen((o) => (o === "mechanic" ? null : o));
              }}
            >
              <IconX className="h-2 w-2 stroke-[2.5]" />
            </button>
          ) : null}
          {open === "mechanic" ? (
            <div
              id="shelf-quick-mechanic-list"
              role="listbox"
              aria-label="Mechanics"
              className="absolute right-0 z-50 mt-1 max-h-80 w-[min(100vw-2rem,20rem)] overflow-y-auto rounded-md border border-border bg-card p-1.5 shadow-lg"
            >
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  role="option"
                  aria-selected={mechanicBucket === null}
                  onClick={() => {
                    setMechanicBucket(null);
                    setOpen(null);
                  }}
                  className={`${filterPillClass(mechanicBucket === null)} flex w-full justify-start`}
                >
                  Any
                </button>
                {mechanicOptions.map((id) => {
                  const selected = mechanicBucket === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        setMechanicBucket(id);
                        setOpen(null);
                      }}
                      className={`${filterPillClass(selected)} flex w-full justify-start text-left`}
                    >
                      {MECHANIC_BUCKET_LABELS[id]}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
