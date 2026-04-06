import { useEffect, useRef, useState } from "react";

import { bggBoardGameUrl } from "@/lib/bggGameUrl";
import {
  FULLSCREEN_TRANSITION_MS,
  fullscreenBackdropClasses,
  fullscreenPanelClasses,
} from "@/lib/fullscreenMotion";
import { bggWeightTextClass } from "@/lib/bggWeightColor";
import { formatPlayerCount } from "@/lib/formatPlayerCount";
import { formatPlayTimeRange } from "@/lib/formatPlayTimeRange";
import type { BggGame } from "@/types/bgg";

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

function StatBlock({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  /** Overrides default value color (e.g. BGG weight scale). */
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

/** Renders stored description as up to three paragraphs when sentence boundaries are clear. */
function DescriptionBody({ text }: { text: string }) {
  const parts = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 1) {
    return (
      <p className="text-base leading-relaxed text-muted-foreground">{text}</p>
    );
  }
  return (
    <div className="space-y-2">
      {parts.map((sentence, i) => (
        <p key={i} className="text-base leading-relaxed text-muted-foreground">
          {sentence}
        </p>
      ))}
    </div>
  );
}

type Props = {
  open: boolean;
  game: BggGame | null;
  onClose: () => void;
  /** Opens the Geekdo cover picker; shown when there is no cover or as an extra action. */
  onRequestCoverPicker?: () => void;
};

export function GameFullscreenModal({
  open,
  game,
  onClose,
  onRequestCoverPicker,
}: Props) {
  const gameRef = useRef<BggGame | null>(null);
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (open && game) {
      gameRef.current = game;
      setMounted(true);
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(id);
    }
  }, [open, game]);

  useEffect(() => {
    if (!open && mounted) {
      setEntered(false);
      const t = window.setTimeout(() => {
        setMounted(false);
        gameRef.current = null;
      }, FULLSCREEN_TRANSITION_MS);
      return () => window.clearTimeout(t);
    }
  }, [open, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mounted, onClose]);

  const displayGame = game ?? gameRef.current;
  if (!mounted || !displayGame) return null;

  const src = displayGame.image || displayGame.thumbnail;
  const titleId = `game-fullscreen-title-${displayGame.id}`;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-stretch justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className={[
          "absolute inset-0 bg-background/90 backdrop-blur-sm",
          fullscreenBackdropClasses(entered),
        ].join(" ")}
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={[
          "board-card relative z-10 flex h-full w-full max-h-full max-w-5xl flex-col border-border bg-card sm:max-h-[min(100dvh,56rem)] sm:rounded-xl sm:border",
          fullscreenPanelClasses(entered),
        ].join(" ")}
      >
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-2 px-3 py-2 sm:relative sm:z-auto sm:gap-3 sm:border-b sm:border-border sm:bg-card sm:px-5 sm:py-3">
          <h2
            id={titleId}
            className="min-w-0 text-base font-semibold leading-tight text-white [text-shadow:0_0_1px_rgba(0,0,0,0.95),0_1px_2px_rgba(0,0,0,0.92),0_2px_8px_rgba(0,0,0,0.65),0_0_20px_rgba(0,0,0,0.45)] sm:text-xl sm:leading-normal sm:text-foreground sm:[text-shadow:none]"
          >
            {displayGame.name}
            {displayGame.yearPublished != null ? (
              <span className="font-normal text-white/85 sm:text-muted-foreground">
                {" "}
                ({displayGame.yearPublished})
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border-0 bg-transparent px-2 py-1 text-sm font-medium text-white [text-shadow:0_0_1px_rgba(0,0,0,0.95),0_1px_2px_rgba(0,0,0,0.9),0_2px_6px_rgba(0,0,0,0.6),0_0_16px_rgba(0,0,0,0.4)] hover:underline sm:border sm:border-border sm:bg-background sm:px-3 sm:py-1.5 sm:text-base sm:text-foreground sm:[text-shadow:none] sm:hover:no-underline sm:hover:bg-muted"
          >
            Close
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain sm:flex-row">
          <div className="flex min-h-0 shrink-0 items-center justify-center bg-muted/40 px-6 pt-8 pb-2 sm:min-h-0 sm:w-[min(100%,28rem)] sm:flex-1 sm:max-w-[50%] sm:px-8 sm:pt-10 sm:pb-4">
            {src ? (
              <div className="aspect-square w-full max-w-[min(100%,min(70dvh,28rem))] shrink-0 overflow-hidden rounded-lg shadow-md sm:max-w-[min(100%,min(70dvh,24rem))]">
                <img
                  src={src}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 px-2 text-center">
                <p className="text-base text-muted-foreground">
                  No cover image
                </p>
                {onRequestCoverPicker ? (
                  <button
                    type="button"
                    onClick={() => {
                      onRequestCoverPicker();
                      onClose();
                    }}
                    className="rounded-lg border border-border bg-card px-4 py-2 text-base font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Choose cover
                  </button>
                ) : null}
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-4 border-t border-border p-4 sm:min-w-[20rem] sm:max-w-xl sm:flex-1 sm:border-l sm:border-t-0 sm:p-5">
            {displayGame.owner?.trim() ? (
              <p className="text-sm font-semibold text-primary">
                {displayGame.owner.trim()}&apos;s copy
              </p>
            ) : null}

            {displayGame.description?.trim() ? (
              <section aria-labelledby={`${titleId}-description`}>
                <h3
                  id={`${titleId}-description`}
                  className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Description
                </h3>
                <DescriptionBody text={displayGame.description.trim()} />
              </section>
            ) : null}

            <section
              aria-label="Game stats"
              className="grid grid-cols-2 gap-x-4 gap-y-3"
            >
              <StatBlock label="Players" value={playersLine(displayGame)} />
              <StatBlock
                label="Play time"
                value={formatPlayTimeRange(displayGame)}
              />
              <StatBlock
                label="Complexity"
                value={formatWeight(displayGame.averageWeight)}
                valueClassName={
                  displayGame.averageWeight != null
                    ? bggWeightTextClass(displayGame.averageWeight)
                    : undefined
                }
              />
              {displayGame.categories.length > 0 ? (
                <div className="min-w-0" aria-labelledby={`${titleId}-categories`}>
                  <h3
                    id={`${titleId}-categories`}
                    className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Categories
                  </h3>
                  <div className="mt-0.5">
                    <TagList items={displayGame.categories} />
                  </div>
                </div>
              ) : null}
            </section>

            {displayGame.geekdoImages != null &&
            displayGame.geekdoImages.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {displayGame.geekdoImages.length} alternate cover
                {displayGame.geekdoImages.length === 1 ? "" : "s"} in gallery
                data
              </p>
            ) : null}

            <p className="mt-auto pt-2">
              <a
                href={bggBoardGameUrl(displayGame.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-medium text-primary underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-sm"
              >
                Open on BoardGameGeek
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
