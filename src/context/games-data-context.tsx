import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { patchGameCoverApiUrl } from "@/lib/patchGameCoverApiUrl";
import type { GamesPayload } from "@/types/bgg";

type Status = "idle" | "loading" | "ok" | "error";

export type CoverPick = {
  thumbnail: string;
  image: string;
};

type GamesDataContextValue = {
  status: Status;
  errorMessage: string | null;
  data: GamesPayload | null;
  /** Writes `public/games.json` via Vite dev server; updates in-memory state. */
  setImagePick: (gameId: string, pick: CoverPick) => Promise<void>;
};

const GamesDataContext = createContext<GamesDataContextValue | null>(null);

export function GamesDataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [data, setData] = useState<GamesPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setErrorMessage(null);

    const url = `${import.meta.env.BASE_URL}games.json`.replace(/\/{2,}/g, "/");

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load games (${res.status})`);
        return res.json() as Promise<GamesPayload>;
      })
      .then((payload) => {
        if (cancelled) return;
        if (!payload || !Array.isArray(payload.games)) {
          setStatus("error");
          setErrorMessage("Invalid games.json format");
          return;
        }
        setData(payload);
        setStatus("ok");
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          e instanceof Error ? e.message : "Could not load collection"
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setImagePick = useCallback(async (gameId: string, pick: CoverPick) => {
    if (!import.meta.env.DEV) {
      throw new Error(
        "Saving a cover to games.json only works with npm run dev. Deployed sites are static — edit public/games.json in the repo instead."
      );
    }

    const res = await fetch(patchGameCoverApiUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gameId,
        thumbnail: pick.thumbnail,
        image: pick.image,
      }),
    });

    let errBody: { error?: string } = {};
    try {
      errBody = (await res.json()) as { error?: string };
    } catch {
      /* ignore */
    }

    if (!res.ok) {
      throw new Error(errBody.error ?? `Save failed (${res.status})`);
    }

    const thumb = pick.thumbnail.trim() || null;
    const img = pick.image.trim() || null;

    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        games: prev.games.map((g) => {
          if (String(g.id) !== String(gameId)) return g;
          const { geekdoImages: _, ...rest } = g;
          return {
            ...rest,
            thumbnail: thumb,
            image: img,
          };
        }),
      };
    });
  }, []);

  const value = useMemo(
    (): GamesDataContextValue => ({
      status,
      errorMessage,
      data,
      setImagePick,
    }),
    [status, errorMessage, data, setImagePick]
  );

  return (
    <GamesDataContext.Provider value={value}>{children}</GamesDataContext.Provider>
  );
}

export function useGamesData(): GamesDataContextValue {
  const ctx = useContext(GamesDataContext);
  if (!ctx) {
    throw new Error("useGamesData must be used within GamesDataProvider");
  }
  return ctx;
}
