"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { DashboardPageMetaProvider } from "@/components/dashboard-page-meta";
import { SuperAdminShell } from "@/components/superadmin-shell";
import { useAppStore } from "@/lib/store";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);
  const hasHydrated = useAppStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!token) {
      router.replace("/login");
      return;
    }
    if (!user?.is_superuser) {
      router.replace("/dashboard");
    }
  }, [hasHydrated, router, token, user?.is_superuser]);

  return (
    <DashboardPageMetaProvider>
      <SuperAdminShell>{children}</SuperAdminShell>
    </DashboardPageMetaProvider>
  );
}

