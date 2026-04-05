import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

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
};

const GameFiltersContext = createContext<GameFiltersContextValue | null>(
  null,
);

export function GameFiltersProvider({ children }: { children: ReactNode }) {
  const [players, setPlayers] = useState<number | null>(null);
  const [maxTimeIndex, setMaxTimeIndex] = useState(0);
  const [minWeightTenths, setMinWeightTenths] = useState(10);
  const [maxWeightTenths, setMaxWeightTenths] = useState(50);
  const [minWeightActive, setMinWeightActive] = useState(false);
  const [maxWeightActive, setMaxWeightActive] = useState(false);
  const [category, setCategory] = useState<string | null>(null);

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
    }),
    [
      players,
      maxTimeIndex,
      minWeightTenths,
      maxWeightTenths,
      minWeightActive,
      maxWeightActive,
      category,
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
