/* ============================================================
   OmniLaunch — Theme Store (Zustand)
   ============================================================ */

import { create } from "zustand";

export type Theme = "dark" | "light";

export interface ThemeState {
  theme: Theme;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "omnilaunch_theme";

function isValidTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

function getStoredTheme(): Theme {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isValidTheme(stored)) {
        return stored;
      }
    }
  } catch {
    // localStorage unavailable (e.g., private browsing) — fall through to default
  }
  return "light";
}

function persistTheme(theme: Theme): void {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, theme);
    }
  } catch {
    // localStorage unavailable — silently ignore persistence failure
  }
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getStoredTheme(),

  setTheme: (value: string) => {
    if (!isValidTheme(value)) {
      return;
    }
    persistTheme(value);
    set({ theme: value });
  },

  toggleTheme: () =>
    set((state) => {
      const next: Theme = state.theme === "dark" ? "light" : "dark";
      persistTheme(next);
      return { theme: next };
    }),
}));
