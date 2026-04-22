"use client";

import { useEffect, useState } from "react";

import { initTheme } from "@/lib/theme";

type ThemeProviderProps = {
  children: React.ReactNode;
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initTheme();
      } catch {
        /* garde les valeurs par défaut du CSS / store */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Chargement du thème…
      </div>
    );
  }

  return <>{children}</>;
}
