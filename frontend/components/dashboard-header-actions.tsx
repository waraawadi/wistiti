"use client";

import Link from "next/link";
import {
  ChevronDown,
  CreditCard,
  Folder,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { AppUser } from "@/lib/store";
import { cn } from "@/lib/utils";

function userInitial(user: AppUser): string {
  const raw = user?.nom?.trim() || user?.email?.trim() || "";
  const c = raw.charAt(0);
  return c ? c.toUpperCase() : "?";
}

function formatNow(now: Date) {
  const date = now.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return { date, time };
}

export function DashboardHeaderClock() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setMounted(true);
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const { date, time } = formatNow(now);

  return (
    <div
      className={cn(
        "relative flex flex-col justify-center rounded-2xl border border-border/55 bg-gradient-to-br from-muted/50 via-background/90 to-muted/30 px-3.5 py-2 sm:px-4 sm:py-2.5",
        "shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_8px_24px_-12px_rgba(0,0,0,0.12)]",
        "dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_12px_32px_-16px_rgba(0,0,0,0.45)]",
        "backdrop-blur-md min-w-0 max-w-[11rem] sm:max-w-none min-h-[3.25rem]",
      )}
    >
      {!mounted ? (
        <>
          <span className="h-2.5 w-24 rounded-md bg-muted/60 animate-pulse" />
          <span className="mt-2 block h-6 w-20 rounded-md bg-muted/50 animate-pulse sm:h-7 sm:w-24" />
        </>
      ) : (
        <>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground truncate leading-tight">
            {date}
          </span>
          <time
            dateTime={now.toISOString()}
            className="text-base sm:text-lg font-bold tabular-nums tracking-tight font-display text-foreground leading-none mt-1 sm:mt-1.5"
          >
            {time}
          </time>
        </>
      )}
    </div>
  );
}

type ProfileMenuProps = {
  user: AppUser;
  onLogout: () => void;
};

export function DashboardProfileMenu({ user, onLogout }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = userInitial(user);
  const displayName = user?.nom?.trim() || "Organisateur";
  const email = user?.email ?? "";

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const rowClass =
    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25";

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "flex items-center gap-2 rounded-2xl border border-border bg-background pl-2 pr-2.5 py-1.5 sm:pl-2 sm:pr-3",
          "shadow-sm transition-all duration-200",
          "hover:border-primary/40 hover:bg-muted hover:shadow-md",
          open && "border-primary/50 ring-2 ring-primary/20 bg-muted",
        )}
      >
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-bg text-xs font-bold text-white shadow-md ring-1 ring-white/25">
          {initial}
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" aria-hidden />
        </span>
        <div className="hidden min-w-0 text-left md:block max-w-[9rem] lg:max-w-[11rem]">
          <p className="truncate text-sm font-semibold leading-tight">{displayName}</p>
          <p className="truncate text-[11px] text-muted-foreground leading-tight">Profil & réglages</p>
        </div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={cn(
            "absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(calc(100vw-2rem),18rem)] sm:w-72",
            "overflow-hidden rounded-2xl border border-border bg-background shadow-[0_18px_50px_-12px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.04)]",
            "dark:shadow-[0_22px_56px_-14px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.08)]",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200",
          )}
        >
          <div className="border-b border-border bg-muted px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-bg text-sm font-bold text-white shadow-lg ring-1 ring-white/20">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">{displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{email}</p>
              </div>
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              Espace organisateur
            </p>
          </div>

          <nav className="bg-background p-2" onClick={() => close()}>
            <Link href="/dashboard" role="menuitem" className={rowClass}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
                <LayoutDashboard size={17} />
              </span>
              Tableau de bord
            </Link>
            <Link href="/dashboard/evenements" role="menuitem" className={rowClass}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
                <Folder size={17} />
              </span>
              Mes événements
            </Link>
            <Link href="/dashboard/abonnements" role="menuitem" className={rowClass}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
                <CreditCard size={17} />
              </span>
              Abonnement
            </Link>
            {user?.is_superuser && (
              <>
                <Link href="/superadmin" role="menuitem" className={rowClass}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Shield size={17} />
                  </span>
                  Super admin
                </Link>
                <Link href="/admin/config" role="menuitem" className={rowClass}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
                    <Settings size={17} />
                  </span>
                  Thème & tarifs
                </Link>
              </>
            )}
          </nav>

          <div className="border-t border-border bg-background p-2">
            <button
              type="button"
              role="menuitem"
              className={cn(
                rowClass,
                "w-full text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:ring-destructive/20",
              )}
              onClick={() => {
                close();
                onLogout();
              }}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                <LogOut size={17} />
              </span>
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
