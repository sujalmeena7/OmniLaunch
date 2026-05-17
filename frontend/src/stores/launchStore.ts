/**
 * OmniLaunch — Launch Session Store
 *
 * Persists the active generation state so navigating away
 * and coming back doesn't lose progress.
 */

import { create } from "zustand";
import type { GeneratedPost } from "@/types";

interface LaunchState {
  // Active generation
  bundleId: string | null;
  generating: boolean;
  generatedPosts: GeneratedPost[];
  error: string | null;

  // Actions
  startGeneration: (bundleId: string) => void;
  completeGeneration: (posts: GeneratedPost[]) => void;
  failGeneration: (error: string) => void;
  setGeneratedPosts: (posts: GeneratedPost[]) => void;
  reset: () => void;
}

export const useLaunchStore = create<LaunchState>((set) => ({
  bundleId: null,
  generating: false,
  generatedPosts: [],
  error: null,

  startGeneration: (bundleId) =>
    set({ bundleId, generating: true, generatedPosts: [], error: null }),

  completeGeneration: (posts) =>
    set({ generating: false, generatedPosts: posts }),

  failGeneration: (error) =>
    set({ generating: false, error }),

  setGeneratedPosts: (posts) =>
    set({ generatedPosts: posts }),

  reset: () =>
    set({ bundleId: null, generating: false, generatedPosts: [], error: null }),
}));
