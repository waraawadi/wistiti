import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppUser = {
  id: number;
  email: string;
  nom: string;
  is_superuser?: boolean;
} | null;

export type ThemePayload = {
  appName: string;
  colorPrimary: string;
  colorSecondary: string;
  colorWhite: string;
  logoUrl: string;
};

type AuthPayload = {
  token: string | null;
  refreshToken: string | null;
  user: AppUser;
};

export type AppState = ThemePayload &
  AuthPayload & {
    setTheme: (patch: Partial<ThemePayload>) => void;
    setAuth: (patch: Partial<AuthPayload>) => void;
    hasHydrated: boolean;
    setHasHydrated: (v: boolean) => void;
  };

const defaultTheme: ThemePayload = {
  appName: "PhotoEvent",
  colorPrimary: "#d2016f",
  colorSecondary: "#4e07d9",
  colorWhite: "#ffffff",
  logoUrl: "",
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...defaultTheme,
      token: null,
      refreshToken: null,
      user: null,
      hasHydrated: false,
      setTheme: (patch) => set((s) => ({ ...s, ...patch })),
      setAuth: (patch) => set((s) => ({ ...s, ...patch })),
      setHasHydrated: (v) => set({ hasHydrated: v }),
    }),
    {
      name: "photoevent-store",
      partialize: (s) => ({ token: s.token, refreshToken: s.refreshToken, user: s.user }),
      /** Toujours marquer la fin de réhydratation (même si le stockage est vide ou en erreur). */
      onRehydrateStorage: () => () => {
        useAppStore.setState({ hasHydrated: true });
      },
    }
  )
);
