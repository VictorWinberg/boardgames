import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import {
  MAX_TIME_BY_INDEX,
  PLAYER_OPTIONS,
  WEIGHT_FILTER_SLIDER_MAX,
} from "@/lib/gameFilters";
import {
  MECHANIC_BUCKET_ORDER,
  type MechanicBucketId,
} from "@/lib/mechanicBuckets";

const FILTERS_STORAGE_KEY = "boardgames:game-filters:v2";

type PersistedGameFilters = {
  players: number | null;
  maxTimeIndex: number;
  minWeightTenths: number;
  maxWeightTenths: number;
  minWeightActive: boolean;
  maxWeightActive: boolean;
  category: string | null;
  mechanicBucket: MechanicBucketId | null;
  includeFriendsGames: boolean;
};

const DEFAULT_FILTERS: PersistedGameFilters = {
  players: null,
  maxTimeIndex: 0,
  minWeightTenths: 10,
  maxWeightTenths: 50,
  minWeightActive: false,
  maxWeightActive: false,
  category: null,
  mechanicBucket: null,
  includeFriendsGames: false,
};

const LEGACY_FILTERS_STORAGE_KEY = "boardgames:game-filters:v1";

function isMechanicBucketId(v: string): v is MechanicBucketId {
  return (MECHANIC_BUCKET_ORDER as readonly string[]).includes(v);
}

/** True when every field matches the default filter state (Clear filters would be a no-op). */
export function filtersEqualToDefaults(f: PersistedGameFilters): boolean {
  return (
    f.players === DEFAULT_FILTERS.players &&
    f.maxTimeIndex === DEFAULT_FILTERS.maxTimeIndex &&
    f.minWeightTenths === DEFAULT_FILTERS.minWeightTenths &&
    f.maxWeightTenths === DEFAULT_FILTERS.maxWeightTenths &&
    f.minWeightActive === DEFAULT_FILTERS.minWeightActive &&
    f.maxWeightActive === DEFAULT_FILTERS.maxWeightActive &&
    f.category === DEFAULT_FILTERS.category &&
    f.mechanicBucket === DEFAULT_FILTERS.mechanicBucket &&
    f.includeFriendsGames === DEFAULT_FILTERS.includeFriendsGames
  );
}

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function parseStoredFilters(raw: string | null): PersistedGameFilters {
  if (raw == null || raw === "") return { ...DEFAULT_FILTERS };
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    if (!o || typeof o !== "object") return { ...DEFAULT_FILTERS };

    let players: number | null = DEFAULT_FILTERS.players;
    if (o.players === null) players = null;
    else if (typeof o.players === "number" && Number.isFinite(o.players)) {
      const p = Math.trunc(o.players);
      if (PLAYER_OPTIONS.includes(p as (typeof PLAYER_OPTIONS)[number]))
        players = p;
    }

    let maxTimeIndex = DEFAULT_FILTERS.maxTimeIndex;
    if (typeof o.maxTimeIndex === "number" && Number.isFinite(o.maxTimeIndex)) {
      maxTimeIndex = clampInt(
        o.maxTimeIndex,
        0,
        MAX_TIME_BY_INDEX.length - 1,
      );
    }

    let minWeightTenths = DEFAULT_FILTERS.minWeightTenths;
    if (typeof o.minWeightTenths === "number" && Number.isFinite(o.minWeightTenths)) {
      minWeightTenths = clampInt(o.minWeightTenths, 10, 10 + WEIGHT_FILTER_SLIDER_MAX);
    }

    let maxWeightTenths = DEFAULT_FILTERS.maxWeightTenths;
    if (typeof o.maxWeightTenths === "number" && Number.isFinite(o.maxWeightTenths)) {
      maxWeightTenths = clampInt(o.maxWeightTenths, 10, 10 + WEIGHT_FILTER_SLIDER_MAX);
    }

    const minWeightActive =
      typeof o.minWeightActive === "boolean"
        ? o.minWeightActive
        : DEFAULT_FILTERS.minWeightActive;
    const maxWeightActive =
      typeof o.maxWeightActive === "boolean"
        ? o.maxWeightActive
        : DEFAULT_FILTERS.maxWeightActive;

    let category: string | null = DEFAULT_FILTERS.category;
    if (o.category === null) category = null;
    else if (typeof o.category === "string" && o.category.trim() !== "")
      category = o.category;

    let mechanicBucket: MechanicBucketId | null = DEFAULT_FILTERS.mechanicBucket;
    if (o.mechanicBucket === null) mechanicBucket = null;
    else if (
      typeof o.mechanicBucket === "string" &&
      isMechanicBucketId(o.mechanicBucket)
    ) {
      mechanicBucket = o.mechanicBucket;
    }

    const includeFriendsGames =
      typeof o.includeFriendsGames === "boolean"
        ? o.includeFriendsGames
        : DEFAULT_FILTERS.includeFriendsGames;

    return {
      players,
      maxTimeIndex,
      minWeightTenths,
      maxWeightTenths,
      minWeightActive,
      maxWeightActive,
      category,
      mechanicBucket,
      includeFriendsGames,
    };
  } catch {
    return { ...DEFAULT_FILTERS };
  }
}

function readInitialFilters(): PersistedGameFilters {
  if (typeof window === "undefined") return { ...DEFAULT_FILTERS };
  const rawV2 = localStorage.getItem(FILTERS_STORAGE_KEY);
  if (rawV2 != null) return parseStoredFilters(rawV2);
  const rawV1 = localStorage.getItem(LEGACY_FILTERS_STORAGE_KEY);
  if (rawV1 != null) return parseStoredFilters(rawV1);
  return { ...DEFAULT_FILTERS };
}

export type GameFiltersContextValue = {
  players: number | null;
  setPlayers: Dispatch<SetStateAction<number | null>>;
  maxTimeIndex: number;
  setMaxTimeIndex: Dispatch<SetStateAction<number>>;
  minWeightTenths: number;
  setMinWeightTenths: Dispatch<SetStateAction<number>>;
  maxWeightTenths: number;
  setMaxWeightTenths: Dispatch<SetStateAction<number>>;
  minWeightActive: boolean;
  setMinWeightActive: Dispatch<SetStateAction<boolean>>;
  maxWeightActive: boolean;
  setMaxWeightActive: Dispatch<SetStateAction<boolean>>;
  category: string | null;
  setCategory: Dispatch<SetStateAction<string | null>>;
  mechanicBucket: MechanicBucketId | null;
  setMechanicBucket: Dispatch<SetStateAction<MechanicBucketId | null>>;
  includeFriendsGames: boolean;
  setIncludeFriendsGames: Dispatch<SetStateAction<boolean>>;
  /** Resets all filters to defaults (same as a fresh session). */
  clearFilters: () => void;
};

const GameFiltersContext = createContext<GameFiltersContextValue | null>(
  null,
);

export function GameFiltersProvider({ children }: { children: ReactNode }) {
  const initialRef = useRef<PersistedGameFilters | null>(null);
  if (initialRef.current === null) {
    initialRef.current = readInitialFilters();
  }
  const s0 = initialRef.current;

  const [players, setPlayers] = useState<number | null>(s0.players);
  const [maxTimeIndex, setMaxTimeIndex] = useState(s0.maxTimeIndex);
  const [minWeightTenths, setMinWeightTenths] = useState(s0.minWeightTenths);
  const [maxWeightTenths, setMaxWeightTenths] = useState(s0.maxWeightTenths);
  const [minWeightActive, setMinWeightActive] = useState(s0.minWeightActive);
  const [maxWeightActive, setMaxWeightActive] = useState(s0.maxWeightActive);
  const [category, setCategory] = useState<string | null>(s0.category);
  const [mechanicBucket, setMechanicBucket] = useState<MechanicBucketId | null>(
    s0.mechanicBucket,
  );
  const [includeFriendsGames, setIncludeFriendsGames] = useState(
    s0.includeFriendsGames,
  );

  const clearFilters = useCallback(() => {
    setPlayers(DEFAULT_FILTERS.players);
    setMaxTimeIndex(DEFAULT_FILTERS.maxTimeIndex);
    setMinWeightTenths(DEFAULT_FILTERS.minWeightTenths);
    setMaxWeightTenths(DEFAULT_FILTERS.maxWeightTenths);
    setMinWeightActive(DEFAULT_FILTERS.minWeightActive);
    setMaxWeightActive(DEFAULT_FILTERS.maxWeightActive);
    setCategory(DEFAULT_FILTERS.category);
    setMechanicBucket(DEFAULT_FILTERS.mechanicBucket);
    setIncludeFriendsGames(DEFAULT_FILTERS.includeFriendsGames);
  }, []);

  useEffect(() => {
    const payload: PersistedGameFilters = {
      players,
      maxTimeIndex,
      minWeightTenths,
      maxWeightTenths,
      minWeightActive,
      maxWeightActive,
      category,
      mechanicBucket,
      includeFriendsGames,
    };
    try {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* ignore quota / private mode */
    }
  }, [
    players,
    maxTimeIndex,
    minWeightTenths,
    maxWeightTenths,
    minWeightActive,
    maxWeightActive,
    category,
    mechanicBucket,
    includeFriendsGames,
  ]);

  const value = useMemo(
    (): GameFiltersContextValue => ({
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
      mechanicBucket,
      setMechanicBucket,
      includeFriendsGames,
      setIncludeFriendsGames,
      clearFilters,
    }),
    [
      players,
      maxTimeIndex,
      minWeightTenths,
      maxWeightTenths,
      minWeightActive,
      maxWeightActive,
      category,
      mechanicBucket,
      includeFriendsGames,
      clearFilters,
    ],
  );

  return (
    <GameFiltersContext.Provider value={value}>
      {children}
    </GameFiltersContext.Provider>
  );
}

export function useGameFilters(): GameFiltersContextValue {
  const ctx = useContext(GameFiltersContext);
  if (ctx == null) {
    throw new Error("useGameFilters must be used within GameFiltersProvider");
  }
  return ctx;
}
