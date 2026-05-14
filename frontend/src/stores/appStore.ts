/* ============================================================
   OmniLaunch — Zustand Store
   ============================================================ */

import { create } from "zustand";
import type { UserProfile, VoiceProfile, PlatformRule, GeneratedPost } from "@/types";

interface AppState {
  // Auth
  user: UserProfile | null;
  isAuthenticated: boolean;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;

  // Voice
  voiceProfiles: VoiceProfile[];
  activeVoice: VoiceProfile | null;
  setVoiceProfiles: (profiles: VoiceProfile[]) => void;
  setActiveVoice: (profile: VoiceProfile | null) => void;

  // Platforms
  platformRules: PlatformRule[];
  setPlatformRules: (rules: PlatformRule[]) => void;

  // Edited posts (session-only, keyed by postId)
  editedPosts: Record<string, Partial<GeneratedPost>>;
  updatePost: (bundleId: string, postId: string, changes: Partial<GeneratedPost>) => void;
  revertPost: (bundleId: string, postId: string) => void;

  // UI State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("omnilaunch_token");
      localStorage.removeItem("omnilaunch_refresh");
    }
    set({ user: null, isAuthenticated: false });
  },

  // Voice
  voiceProfiles: [],
  activeVoice: null,
  setVoiceProfiles: (profiles) => set({ voiceProfiles: profiles }),
  setActiveVoice: (profile) => set({ activeVoice: profile }),

  // Platforms
  platformRules: [],
  setPlatformRules: (rules) => set({ platformRules: rules }),

  // Edited posts
  editedPosts: {},
  updatePost: (_bundleId, postId, changes) =>
    set((state) => ({
      editedPosts: {
        ...state.editedPosts,
        [postId]: { ...state.editedPosts[postId], ...changes },
      },
    })),
  revertPost: (_bundleId, postId) =>
    set((state) => {
      const next = { ...state.editedPosts };
      delete next[postId];
      return { editedPosts: next };
    }),

  // UI
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
