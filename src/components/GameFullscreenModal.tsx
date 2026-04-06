import { useEffect } from "react";

import { bggBoardGameUrl } from "@/lib/bggGameUrl";
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
        className={["mt-0.5 text-base", valueClassName ?? "text-foreground"].join(
          " ",
        )}
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
        <p
          key={i}
          className="text-base leading-relaxed text-muted-foreground"
        >
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
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !game) return null;

  const src = game.image || game.thumbnail;
  const titleId = `game-fullscreen-title-${game.id}`;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-stretch justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/90 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="board-card relative flex h-full w-full max-h-full max-w-5xl flex-col border-border bg-card sm:max-h-[min(100dvh,56rem)] sm:rounded-xl sm:border">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <h2
            id={titleId}
            className="min-w-0 text-lg font-semibold text-foreground sm:text-xl"
          >
            {game.name}
            {game.yearPublished != null ? (
              <span className="font-normal text-muted-foreground">
                {" "}
                ({game.yearPublished})
              </span>
            ) : null}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-border bg-background px-3 py-1.5 text-base font-medium text-foreground hover:bg-muted"
          >
            Close
          </button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain sm:flex-row">
          <div className="flex min-h-[40vh] shrink-0 items-center justify-center bg-muted/40 p-4 sm:min-h-0 sm:w-[min(100%,28rem)] sm:flex-1 sm:max-w-[50%]">
            {src ? (
              <img
                src={src}
                alt=""
                className="max-h-[min(70vh,100%)] w-full max-w-full object-contain shadow-md"
              />
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
            {game.owner?.trim() ? (
              <p className="text-sm font-semibold text-primary">
                {game.owner.trim()}&apos;s copy
              </p>
            ) : null}

            {game.description?.trim() ? (
              <section aria-labelledby={`${titleId}-description`}>
                <h3
                  id={`${titleId}-description`}
                  className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Description
                </h3>
                <DescriptionBody text={game.description.trim()} />
              </section>
            ) : null}

            <section
              aria-label="Game stats"
              className="grid grid-cols-2 gap-x-4 gap-y-3"
            >
              <StatBlock label="Players" value={playersLine(game)} />
              <StatBlock label="Play time" value={formatPlayTimeRange(game)} />
              <StatBlock
                label="Complexity"
                value={formatWeight(game.averageWeight)}
                valueClassName={
                  game.averageWeight != null
                    ? bggWeightTextClass(game.averageWeight)
                    : undefined
                }
              />
            </section>

            {game.geekdoImages != null && game.geekdoImages.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {game.geekdoImages.length} alternate cover
                {game.geekdoImages.length === 1 ? "" : "s"} in gallery data
              </p>
            ) : null}

            {game.categories.length > 0 ? (
              <section aria-labelledby={`${titleId}-categories`}>
                <h3
                  id={`${titleId}-categories`}
                  className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Categories
                </h3>
                <TagList items={game.categories} />
              </section>
            ) : null}

            {game.mechanics.length > 0 ? (
              <section aria-labelledby={`${titleId}-mechanics`}>
                <h3
                  id={`${titleId}-mechanics`}
                  className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  Mechanics
                </h3>
                <TagList items={game.mechanics} />
              </section>
            ) : null}

            <p className="mt-auto pt-2">
              <a
                href={bggBoardGameUrl(game.id)}
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
