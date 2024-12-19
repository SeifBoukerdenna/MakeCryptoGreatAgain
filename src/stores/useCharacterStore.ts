// src/store/useCharacterStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { characters } from "../characters"; // Adjust the path as needed

interface CharacterState {
  selectedCharacter: string;
  setSelectedCharacter: (name: string) => void;
}

const useCharacterStore = create<CharacterState>()(
  persist(
    (set) => ({
      selectedCharacter: characters[0].name, // Initialize with the first character
      setSelectedCharacter: (name: string) => set({ selectedCharacter: name }),
    }),
    {
      name: "character-storage", // Unique name for localStorage
      storage: createJSONStorage(() => localStorage), // Use createJSONStorage to wrap localStorage
    }
  )
);

export default useCharacterStore;
