// src/stores/useLanguageStore.ts
import { create } from "zustand";

/** Supported languages across all characters */
export type Language = "english" | "german" | "japanese";

interface LanguageState {
  /**
   * Currently selected language for each character:
   * { "6": "english", "10": "japanese", ... }
   */
  languages: Record<string, Language>;

  /**
   * Allowed languages for each character:
   * { "6": ["english","german"], "10":["english","japanese"], ... }
   */
  allowedLanguages: Record<string, Language[]>;

  /**
   * Update the selected language for a specific character
   */
  setLanguage: (id: string, language: Language) => void;
}

const useLanguageStore = create<LanguageState>((set) => ({
  /**
   * If you want to initialize certain characters
   * with specific languages, do so here.
   *
   * Example: By default, let Hitler(6) → "english",
   *          Satoshi(10) → "english",
   *          Everyone else → "english".
   */
  languages: {
    "6": "english", // Hitler
    "10": "english", // Satoshi
  },

  /**
   * Allowed languages per character ID
   *
   * - Hitler (ID "6"): can choose English or German
   * - Satoshi (ID "10"): can choose English or Japanese
   * - Everyone else gets only English
   */
  allowedLanguages: {
    "6": ["english", "german"],
    "10": ["english", "japanese"],
    // If you want to predefine others, do so here:
    // '1': ['english'],
    // '2': ['english'],
    // ...
  },

  /**
   * Update the chosen language for a given character
   */
  setLanguage: (id, language) =>
    set((state) => {
      // Optional safety: ensure the language is allowed
      // by that character
      const allowed = state.allowedLanguages[id];
      if (allowed && allowed.includes(language)) {
        return {
          languages: { ...state.languages, [id]: language },
        };
      }

      // If not allowed or not found, fallback to 'english'
      return {
        languages: { ...state.languages, [id]: "english" },
      };
    }),
}));

export default useLanguageStore;
