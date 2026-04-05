import { useEffect, useState } from "react";

import type { GamesPayload } from "@/types/bgg";

type LoadState =
  | { status: "idle" | "loading" }
  | { status: "ok"; data: GamesPayload }
  | { status: "error"; message: string };

export function useGames(): LoadState {
  const [state, setState] = useState<LoadState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    const url = `${import.meta.env.BASE_URL}games.json`.replace(/\/{2,}/g, "/");

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load games (${res.status})`);
        }
        return res.json() as Promise<GamesPayload>;
      })
      .then((data) => {
        if (cancelled) return;
        if (!data || !Array.isArray(data.games)) {
          setState({ status: "error", message: "Invalid games.json format" });
          return;
        }
        setState({ status: "ok", data });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const message =
          e instanceof Error ? e.message : "Could not load collection";
        setState({ status: "error", message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
