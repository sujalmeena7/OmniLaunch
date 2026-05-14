"use client";

import { useEffect } from "react";
import { useThemeStore, type Theme } from "@/stores/themeStore";

const STORAGE_KEY = "omnilaunch_theme";

function isValidTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}

/**
 * Reads the user's preferred theme from localStorage, falling back to
 * the system preference (prefers-color-scheme), then defaulting to "light".
 */
function resolveInitialTheme(): Theme {
  // 1. Try localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isValidTheme(stored)) {
      return stored;
    }
  } catch {
    // localStorage unavailable — fall through to system preference
  }

  // 2. Fall back to system preference
  try {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  } catch {
    // matchMedia unavailable — fall through to default
  }

  // 3. Default to light
  return "light";
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const setTheme = useThemeStore((state) => state.setTheme);

  // On mount: resolve theme, sync to store, apply data-theme, remove no-transition
  useEffect(() => {
    const resolved = resolveInitialTheme();

    // Sync resolved theme into Zustand store
    setTheme(resolved);

    // Apply data-theme attribute to <html>
    document.documentElement.setAttribute("data-theme", resolved);

    // Remove no-transition class after first paint to enable CSS transitions
    requestAnimationFrame(() => {
      document.documentElement.classList.remove("no-transition");
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to store changes and update data-theme attribute reactively
  useEffect(() => {
    const unsubscribe = useThemeStore.subscribe((state) => {
      document.documentElement.setAttribute("data-theme", state.theme);
    });

    return unsubscribe;
  }, []);

  return <>{children}</>;
}
