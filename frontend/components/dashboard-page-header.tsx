"use client";

import { useLayoutEffect } from "react";
import type { ReactNode } from "react";

import { useDashboardPageMetaSetter } from "@/components/dashboard-page-meta";

type DashboardPageHeaderProps = {
  title: string;
  description?: ReactNode;
  /** Actions à droite (boutons, etc.) — affichées dans le header global */
  actions?: ReactNode;
};

/**
 * Enregistre titre, description et actions pour le header du {@link DashboardShell}
 * (ne rend plus de bloc sous la barre : libère l’espace du contenu).
 */
export function DashboardPageHeader({ title, description, actions }: DashboardPageHeaderProps) {
  const setMeta = useDashboardPageMetaSetter();

  useLayoutEffect(() => {
    setMeta({ title, description, actions });
    return () => setMeta(null);
  }, [title, description, actions, setMeta]);

  return null;
}
