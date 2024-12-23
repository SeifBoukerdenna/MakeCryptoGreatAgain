// src/store/useModeStore.ts

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type Mode = "normal" | "secret";

interface ModeStore {
  modes: Record<string, Mode>; // key: character ID, value: mode
  toggleMode: (id: string) => void;
  setMode: (id: string, newMode: Mode) => void;
}

const useModeStore = create<ModeStore, [["zustand/persist", unknown]]>(
  persist(
    (set) => ({
      modes: {}, // initially, no modes set
      toggleMode: (id: string) =>
        set((state) => ({
          modes: {
            ...state.modes,
            [id]: state.modes[id] === "normal" ? "secret" : "normal",
          },
        })),
      setMode: (id: string, newMode: Mode) =>
        set((state) => ({
          modes: {
            ...state.modes,
            [id]: newMode,
          },
        })),
    }),
    {
      name: "character-modes", // unique name for storage
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useModeStore;
