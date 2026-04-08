import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { normalizeBggJsonPayload } from "@/lib/normalizeBggJson";
import type { GamesPayload } from "@/types/bgg";

type Status = "idle" | "loading" | "ok" | "error";

type GamesDataContextValue = {
  status: Status;
  errorMessage: string | null;
  data: GamesPayload | null;
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

    const base = import.meta.env.BASE_URL;
    const bggUrl = `${base}bgg.json`.replace(/\/{2,}/g, "/");
    const customUrl = `${base}custom.json`.replace(/\/{2,}/g, "/");

    Promise.all([
      fetch(bggUrl).then((res) => {
        if (!res.ok) throw new Error(`Failed to load games (${res.status})`);
        return res.json() as Promise<unknown>;
      }),
      fetch(customUrl)
        .then((res) => (res.ok ? res.json() : null))
        .catch(() => null),
    ])
      .then(([bggRaw, customRaw]) => {
        if (cancelled) return;
        const payload = normalizeBggJsonPayload(
          bggRaw,
          customRaw ?? undefined
        );
        if (!payload) {
          setStatus("error");
          setErrorMessage("Invalid bgg.json format");
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

  const value = useMemo(
    (): GamesDataContextValue => ({
      status,
      errorMessage,
      data,
    }),
    [status, errorMessage, data]
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
