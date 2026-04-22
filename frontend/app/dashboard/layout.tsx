"use client";

import { useEffect } from "react";

import { DashboardPageMetaProvider } from "@/components/dashboard-page-meta";
import { DashboardShell } from "@/components/dashboard-shell";
import { useAppStore } from "@/lib/store";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = useAppStore((s) => s.token);
  const hasHydrated = useAppStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      const path = `${window.location.pathname}${window.location.search}`;
      window.location.href = `/login?next=${encodeURIComponent(path)}`;
    }
  }, [hasHydrated, token]);

  return (
    <DashboardPageMetaProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardPageMetaProvider>
  );
}

