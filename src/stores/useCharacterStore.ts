// src/stores/useCharacterStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface CharacterState {
  selectedCharacter: string | null;
  setSelectedCharacter: (name: string | null) => void;
}

const useCharacterStore = create<CharacterState>()(
  persist(
    (set) => ({
      selectedCharacter: null, // Initialize with no selection
      setSelectedCharacter: (name: string | null) =>
        set({ selectedCharacter: name }),
    }),
    {
      name: "character-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useCharacterStore;
