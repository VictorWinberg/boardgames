import { useEffect } from "react";

import { bggBoardGameUrl } from "@/lib/bggGameUrl";
import type { BggGame } from "@/types/bgg";

type Props = {
  open: boolean;
  game: BggGame | null;
  onClose: () => void;
  onPick: (thumbnail: string, image: string) => void | Promise<void>;
};

function CoverGridBody({
  game,
  onPick,
}: {
  game: BggGame;
  onPick: (thumbnail: string, image: string) => void | Promise<void>;
}) {
  const opts = game.geekdoImages ?? [];
  if (opts.length === 0) {
    return (
      <p className="text-base text-muted-foreground">
        No Geekdo gallery in <code className="rounded bg-muted px-1.5 py-0.5">games.json</code>.
        Run{" "}
        <code className="rounded bg-muted px-1.5 py-0.5">npm run images:geekdo</code> to fetch
        options.
      </p>
    );
  }

  return (
    <>
      <p className="mb-4 text-base text-muted-foreground">
        {opts.length} Geekdo photos (gallery order). Tap one to set the cover.
      </p>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {opts.map((o) => {
          const displaySrc = o.image || o.thumbnail;
          if (!displaySrc) return null;
          return (
            <li key={o.imageid}>
              <button
                type="button"
                onClick={() =>
                  onPick(o.thumbnail ?? o.image ?? "", o.image ?? o.thumbnail ?? "")
                }
                className="flex w-full flex-col gap-2 rounded-lg border border-border bg-muted/20 p-2 text-left transition-colors hover:border-primary hover:bg-card"
              >
                <span className="aspect-square w-full overflow-hidden rounded-md bg-muted">
                  <img
                    src={displaySrc}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </span>
                <span className="line-clamp-4 text-base leading-snug text-muted-foreground">
                  {o.caption || `Image ${o.imageid}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function GeekdoCoverModal({ open, game, onClose, onPick }: Props) {
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

  const handlePick = async (thumbnail: string, image: string) => {
    try {
      await Promise.resolve(onPick(thumbnail, image));
      onClose();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not save cover");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-stretch justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="geekdo-cover-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-background/85 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="board-card relative flex h-full w-full max-h-full max-w-6xl flex-col border-border bg-card sm:max-h-[min(100dvh,56rem)] sm:rounded-xl sm:border">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <h2
            id="geekdo-cover-modal-title"
            className="min-w-0 truncate text-lg font-semibold text-foreground sm:text-xl"
          >
            Choose a cover
            <span className="font-normal text-muted-foreground">
              {" · "}
              <a
                href={bggBoardGameUrl(game.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-sm"
              >
                {game.name}
              </a>
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md border border-border bg-background px-3 py-1.5 text-base font-medium text-foreground hover:bg-muted"
          >
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <CoverGridBody game={game} onPick={handlePick} />
        </div>
      </div>
    </div>
  );
}
