"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type DashboardPageMeta = {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
};

type Ctx = {
  meta: DashboardPageMeta | null;
  setMeta: (m: DashboardPageMeta | null) => void;
};

const DashboardPageMetaContext = createContext<Ctx | null>(null);

export function DashboardPageMetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<DashboardPageMeta | null>(null);
  const value = useMemo(() => ({ meta, setMeta }), [meta]);
  return <DashboardPageMetaContext.Provider value={value}>{children}</DashboardPageMetaContext.Provider>;
}

export function useDashboardPageMetaSetter() {
  const ctx = useContext(DashboardPageMetaContext);
  if (!ctx) {
    throw new Error("DashboardPageMetaProvider est requis autour du dashboard.");
  }
  return ctx.setMeta;
}

export function useDashboardPageMetaState() {
  const ctx = useContext(DashboardPageMetaContext);
  return ctx?.meta ?? null;
}
