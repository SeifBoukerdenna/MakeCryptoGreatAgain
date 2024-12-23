// src/stores/useThemeStore.ts
import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const lightThemeColors = {
  "--bg-color": "#F7F9FB",
  "--text-color": "#212529",
  "--toggle-bg-light": "#D8DFE4",
  "--toggle-handle-light": "#FFFFFF",
  "--toggle-bg-dark": "#4A5568",
  "--toggle-handle-dark": "#2D3748",
  "--button-bg": "linear-gradient(90deg, #5B6FE1 0%, #C61FEE 100%)",
  "--button-hover-bg": "linear-gradient(90deg, #4757D3 0%, #B219D9 100%)",
};

const darkThemeColors = {
  "--bg-color": "#121212",
  "--text-color": "#E5E7EB",
  "--toggle-bg-light": "#4A5568",
  "--toggle-handle-light": "#2D3748",
  "--toggle-bg-dark": "#D8DFE4",
  "--toggle-handle-dark": "#FFFFFF",
  "--button-bg": "linear-gradient(90deg, #6366F1 0%, #D946EF 100%)",
  "--button-hover-bg": "linear-gradient(90deg, #4F46E5 0%, #C026D3 100%)",
};

const updateCSSVariables = (colors: Record<string, string>) => {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "light",
  toggleTheme: () => {
    const currentTheme = get().theme;
    const newTheme = currentTheme === "light" ? "dark" : "light";
    set({ theme: newTheme });
    updateCSSVariables(
      newTheme === "light" ? lightThemeColors : darkThemeColors
    );
  },
  setTheme: (theme: Theme) => {
    set({ theme });
    updateCSSVariables(theme === "light" ? lightThemeColors : darkThemeColors);
  },
}));

export default useThemeStore;
