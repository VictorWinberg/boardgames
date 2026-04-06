import { useEffect, useMemo, useRef, useState } from "react";

import {
  PLAYER_SLIDER_MAX,
  collectCategories,
  filterPillClass,
  formatPlayerFilterLabel,
  playerCountToSliderStep,
  sliderStepToPlayerCount,
} from "@/lib/gameFilters";
import type { BggGame } from "@/types/bgg";

type OpenKind = "players" | "category" | null;

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

/** Top-right of the value label (flex row ends with text; icon stays clear) */
const clearOnLabelClass =
  "absolute right-0 top-0 z-[2] m-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground shadow-sm transition-colors hover:border-muted-foreground/40 hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const triggerBase =
  "flex h-9 max-w-[9rem] min-w-9 shrink-0 items-center gap-1 rounded-md px-1.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export type ShelfQuickFilterIconsProps = {
  games: BggGame[];
  players: number | null;
  setPlayers: (n: number | null) => void;
  category: string | null;
  setCategory: (c: string | null) => void;
};

export function ShelfQuickFilterIcons({
  games,
  players,
  setPlayers,
  category,
  setCategory,
}: ShelfQuickFilterIconsProps) {
  const [open, setOpen] = useState<OpenKind>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const categoryOptions = useMemo(() => collectCategories(games), [games]);

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

  return (
    <div
      ref={rootRef}
      className="flex shrink-0 items-center gap-0.5 border-l border-border pl-1"
    >
      <div className="relative shrink-0">
        <button
          type="button"
          className={[
            triggerBase,
            playersActive ? "pr-5 text-primary" : "",
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
          <IconUsers className="h-[1.125rem] w-[1.125rem] shrink-0" />
          {playersActive ? (
            <span className="hidden min-w-0 flex-1 truncate text-left text-xs font-semibold tabular-nums text-current sm:block">
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
            <IconX className="h-2.5 w-2.5 stroke-[2.5]" />
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
            categoryActive ? "pr-5 text-primary" : "",
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
          <IconTag className="h-[1.125rem] w-[1.125rem] shrink-0" />
          {categoryActive ? (
            <span className="hidden min-w-0 flex-1 truncate text-left text-xs font-medium leading-tight text-current sm:block">
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
            <IconX className="h-2.5 w-2.5 stroke-[2.5]" />
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
    </div>
  );
}
