"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Banknote,
  Folder,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { BrandMark } from "@/components/brand-mark";
import { DashboardHeaderClock, DashboardProfileMenu } from "@/components/dashboard-header-actions";
import { useDashboardPageMetaState } from "@/components/dashboard-page-meta";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function userInitial(user: { nom?: string | null; email?: string | null } | null): string {
  const raw = user?.nom?.trim() || user?.email?.trim() || "";
  const c = raw.charAt(0);
  return c ? c.toUpperCase() : "?";
}

function NavLink({
  href,
  label,
  icon: Icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const normalized = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  const active =
    href === "/superadmin"
      ? normalized === "/superadmin"
      : normalized === href || normalized.startsWith(href + "/");

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "group relative w-full flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-2xl text-sm font-semibold tracking-tight transition-all duration-300",
        active
          ? "text-white bg-white/[0.14] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.12),0_8px_24px_-8px_rgba(0,0,0,0.35)] ring-1 ring-white/20 backdrop-blur-md"
          : "text-white/70 hover:text-white hover:bg-white/[0.08] hover:ring-1 hover:ring-white/10",
      )}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[62%] rounded-full bg-gradient-to-b from-amber-200 via-white to-rose-200 shadow-[0_0_12px_rgba(255,255,255,0.55)]"
          aria-hidden
        />
      )}
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
          active
            ? "bg-white/20 text-white shadow-inner ring-1 ring-white/25"
            : "bg-white/5 text-white/80 group-hover:bg-white/12 group-hover:text-white ring-1 ring-transparent group-hover:ring-white/10",
        )}
      >
        <Icon size={18} strokeWidth={active ? 2.25 : 2} className="shrink-0" />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {active && (
        <span className="hidden xl:block h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.85)] shrink-0" aria-hidden />
      )}
    </Link>
  );
}

const sidebarWidthClass = "w-[19rem] xl:w-80";

export function SuperAdminShell({ children }: { children: React.ReactNode }) {
  const setAuth = useAppStore((s) => s.setAuth);
  const user = useAppStore((s) => s.user);
  const pageMeta = useDashboardPageMetaState();
  const hasPageHead = Boolean(pageMeta?.title || pageMeta?.description || pageMeta?.actions);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const initial = userInitial(user);

  useEffect(() => setMobileOpen(false), [pathname]);

  function logout() {
    setAuth({ token: null, refreshToken: null, user: null });
    window.location.href = "/login";
  }

  const navItems = (
    <>
      <NavLink href="/superadmin" label="Vue d’ensemble" icon={LayoutDashboard} onNavigate={() => setMobileOpen(false)} />
      <NavLink href="/superadmin/utilisateurs" label="Utilisateurs" icon={Users} onNavigate={() => setMobileOpen(false)} />
      <NavLink href="/superadmin/evenements" label="Événements" icon={Folder} onNavigate={() => setMobileOpen(false)} />
      <NavLink href="/superadmin/plans" label="Plans" icon={Package} onNavigate={() => setMobileOpen(false)} />
      <NavLink href="/superadmin/paiements" label="Paiements" icon={Banknote} onNavigate={() => setMobileOpen(false)} />
      <NavLink href="/admin/config" label="Thème & tarifs" icon={Settings} onNavigate={() => setMobileOpen(false)} />
    </>
  );

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <aside
        className={cn(
          "dashboard-sidebar-surface hidden lg:flex fixed left-0 top-0 z-30 h-svh flex-col shrink-0 overflow-hidden border-r border-white/[0.1]",
          sidebarWidthClass,
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" aria-hidden />

        <div className="relative shrink-0 px-5 pt-6 pb-5">
          <BrandMark linkHref="/superadmin" variant="light" size="md" />
          <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/45 mt-4">Super admin</p>
          <p className="text-sm text-white/80 mt-1 leading-snug font-medium">Console système</p>
        </div>

        <div className="relative mx-3 mb-2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden />

        <nav className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
          <p className="px-3 pt-2 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Menu</p>
          {navItems}
        </nav>

        <div className="relative shrink-0 p-4 pt-3 border-t border-white/[0.07] bg-gradient-to-t from-black/15 to-transparent">
          <div className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-xl p-3.5 flex items-center gap-3 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
            <div className="relative">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent opacity-50 blur-sm" aria-hidden />
              <div className="relative w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white text-sm font-bold shadow-lg ring-1 ring-white/20 shrink-0">
                {initial}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.nom ?? "Super admin"}</p>
              <p className="text-xs text-white/50 truncate">{user?.email ?? ""}</p>
            </div>
            <button
              type="button"
              className="rounded-xl p-2.5 text-white/50 hover:text-white hover:bg-white/12 transition-all shrink-0 ring-1 ring-transparent hover:ring-white/15"
              onClick={logout}
              aria-label="Se déconnecter"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[min(88vw,20rem)] bg-sidebar text-sidebar-foreground shadow-2xl flex flex-col border-r border-white/10 overflow-hidden">
            <div
              className="pointer-events-none absolute inset-0 opacity-80"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse 100% 60% at 0% 0%, rgba(99,102,241,0.18) 0%, transparent 55%), radial-gradient(ellipse 80% 50% at 100% 100%, rgba(251,146,60,0.08) 0%, transparent 45%)",
              }}
            />
            <div className="relative p-4 flex items-center justify-between border-b border-white/10">
              <BrandMark linkHref="/superadmin" variant="light" size="sm" />
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-white/10 text-white/90 ring-1 ring-white/10"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="relative p-3 space-y-1 flex-1 min-h-0 overflow-y-auto">
              <p className="px-3 pt-1 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Menu</p>
              {navItems}
            </div>
            <div className="relative p-4 border-t border-white/[0.07]">
              <div className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-md p-3 flex items-center gap-3 ring-1 ring-white/10">
                <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white text-xs font-bold shrink-0 ring-1 ring-white/20">
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user?.nom ?? "Super admin"}</p>
                  <p className="text-xs text-white/50 truncate">{user?.email ?? ""}</p>
                </div>
                <button type="button" className="text-white/50 hover:text-white p-2 rounded-xl hover:bg-white/10" onClick={logout} aria-label="Déconnexion">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col min-h-0 min-w-0 lg:pl-[19rem] xl:pl-80">
        <header className="sticky top-0 z-40 shrink-0 border-b border-border/50 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
          <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-2.5">
            <div className="flex flex-col gap-3 w-full">
              <div className="flex items-center justify-between gap-3 lg:hidden">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    className="p-2 rounded-xl border border-border/60 bg-background/80 hover:bg-muted/50 transition-colors"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Ouvrir le menu"
                  >
                    <Menu size={18} />
                  </button>
                  <div className="min-w-0 truncate">
                    <BrandMark linkHref="/superadmin" size="sm" />
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <DashboardHeaderClock />
                  <DashboardProfileMenu user={user} onLogout={logout} />
                </div>
              </div>

              <div
                className={cn(
                  "flex flex-col gap-2.5",
                  hasPageHead &&
                    "border-t border-border/40 pt-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-x-4 lg:gap-y-0 lg:border-t-0 lg:pt-0",
                  !hasPageHead && "hidden lg:grid lg:grid-cols-1 lg:justify-items-end",
                )}
              >
                {hasPageHead && (pageMeta?.title || pageMeta?.description) ? (
                  <div className="min-w-0 text-left lg:col-start-1 lg:row-start-1 lg:justify-self-start">
                    {pageMeta?.title ? (
                      <h1 className="text-lg sm:text-[1.05rem] lg:text-xl font-extrabold font-display tracking-tight text-balance leading-tight line-clamp-2">
                        {pageMeta.title}
                      </h1>
                    ) : null}
                    {pageMeta?.description != null && pageMeta.description !== "" ? (
                      <div className="text-xs sm:text-sm text-muted-foreground leading-snug mt-0.5 line-clamp-2 max-w-3xl">
                        {pageMeta.description}
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {hasPageHead && pageMeta?.actions ? (
                  <div className="flex flex-wrap items-center justify-start gap-2 lg:col-start-2 lg:row-start-1 lg:justify-center">
                    {pageMeta.actions}
                  </div>
                ) : null}
                <div
                  className={cn(
                    "hidden lg:flex items-center gap-2 sm:gap-3",
                    hasPageHead && "lg:col-start-3 lg:row-start-1 lg:justify-self-end",
                    !hasPageHead && "col-start-1",
                  )}
                >
                  <DashboardHeaderClock />
                  <DashboardProfileMenu user={user} onLogout={logout} />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-canvas flex flex-1 flex-col min-h-0">
          <div className="max-w-7xl mx-auto w-full min-w-0 flex-1 px-3 sm:px-4 lg:px-8 py-5 sm:py-6 lg:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
