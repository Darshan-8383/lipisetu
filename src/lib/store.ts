"use client";

import { create } from "zustand";
import type { AssistantContext } from "@/lib/gemini";

export type View =
  | "home"
  | "login"
  | "register"
  | "dashboard"
  | "translator"
  | "history"
  | "translation"
  | "alphabet"
  | "words"
  | "sentences"
  | "vocabulary"
  | "quiz"
  | "profile";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

type NavigateParams = {
  translationId?: string;
};

type AppState = {
  view: View;
  translationId: string | null;
  user: AppUser | null;
  authChecked: boolean;
  assistantContext: AssistantContext | null;
  setAssistantContext: (ctx: AssistantContext | null) => void;
  navigate: (view: View, params?: NavigateParams) => void;
  setUser: (user: AppUser | null) => void;
  setAuthChecked: (checked: boolean) => void;
  refreshUser: () => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  view: "home",
  translationId: null,
  user: null,
  authChecked: false,
  assistantContext: null,
  setAssistantContext: (assistantContext) => set({ assistantContext }),
  navigate: (view, params) => {
    set({ view, translationId: params?.translationId ?? null });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },
  setUser: (user) => set({ user }),
  setAuthChecked: (authChecked) => set({ authChecked }),
  refreshUser: async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      set({ user: data.user ?? null, authChecked: true });
    } catch {
      set({ user: null, authChecked: true });
    }
  },
}));
