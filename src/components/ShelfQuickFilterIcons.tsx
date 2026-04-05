import { useEffect, useMemo, useRef, useState } from "react";

import {
  PLAYER_OPTIONS,
  collectCategories,
  filterPillClass,
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

const triggerBase =
  "relative flex h-9 max-w-[9rem] min-w-9 shrink-0 items-center gap-1 rounded-md px-1.5 text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";

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
      <div className="relative">
        <button
          type="button"
          className={[
            triggerBase,
            playersActive ? "text-primary" : "",
            open === "players" ? "bg-muted/80 text-foreground" : "",
          ].join(" ")}
          aria-label={
            playersActive
              ? `Players: ${players}. Change player count filter`
              : "Filter by player count"
          }
          aria-expanded={open === "players"}
          aria-haspopup="listbox"
          aria-controls="shelf-quick-players-list"
          onClick={() =>
            setOpen((o) => (o === "players" ? null : "players"))
          }
        >
          <IconUsers className="h-[1.125rem] w-[1.125rem] shrink-0" />
          {playersActive ? (
            <span className="truncate text-xs font-semibold tabular-nums text-current">
              {players}
            </span>
          ) : null}
        </button>
        {open === "players" ? (
          <div
            id="shelf-quick-players-list"
            role="listbox"
            aria-label="Player count"
            className="absolute right-0 z-50 mt-1 max-h-64 w-[min(100vw-2rem,11rem)] overflow-y-auto rounded-md border border-border bg-card p-1.5 shadow-lg"
          >
            <div className="flex flex-wrap gap-1">
              {PLAYER_OPTIONS.map((n) => {
                const selected = players === n;
                const label = n == null ? "Any" : String(n);
                return (
                  <button
                    key={label}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setPlayers(n);
                      setOpen(null);
                    }}
                    className={filterPillClass(selected)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="relative">
        <button
          type="button"
          className={[
            triggerBase,
            categoryActive ? "text-primary" : "",
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
            <span className="min-w-0 truncate text-left text-xs font-medium leading-tight text-current">
              {category}
            </span>
          ) : null}
        </button>
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
