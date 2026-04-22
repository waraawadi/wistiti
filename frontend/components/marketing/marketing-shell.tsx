"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogIn, Menu, Shield, UserPlus, X } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { AppName } from "@/components/app-name";
import { Button } from "@/components/ui/button";
import { MARKETING_USE_CASES } from "@/lib/marketing-use-cases";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/fonctionnalites", label: "Fonctionnalités" },
  { href: "/comment-ca-marche", label: "Comment ça marche" },
  { href: "/pricing", label: "Tarifs" },
] as const;

const navPill =
  "inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 py-2.5 px-3 md:py-1.5 md:px-3 rounded-full md:rounded-xl";

function UseCasesNav({
  currentPath,
  onNavigate,
  mode,
}: {
  currentPath: string;
  onNavigate?: () => void;
  mode: "desktop" | "mobile";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const useCasesActive = currentPath.startsWith("/cas-usage");

  useEffect(() => {
    if (!open || mode !== "desktop") return;
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open, mode]);

  useEffect(() => {
    setOpen(false);
  }, [currentPath]);

  if (mode === "mobile") {
    return (
      <div className="flex flex-col gap-1 border-l-2 border-primary/25 pl-3 ml-1 py-1">
        <Link
          href="/cas-usage"
          onClick={onNavigate}
          className={cn(
            navPill,
            currentPath === "/cas-usage"
              ? "text-foreground bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
          )}
        >
          Cas d&apos;usage — vue d&apos;ensemble
        </Link>
        {MARKETING_USE_CASES.map(({ slug, navLabel }) => {
          const href = `/cas-usage/${slug}`;
          const active = currentPath === href;
          return (
            <Link
              key={slug}
              href={href}
              onClick={onNavigate}
              className={cn(
                navPill,
                "pl-5 text-[13px]",
                active
                  ? "text-foreground bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
              )}
            >
              {navLabel}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className={cn(
          navPill,
          useCasesActive
            ? "text-foreground bg-primary/10 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
        )}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        Cas d&apos;usage
        <ChevronDown className={cn("size-4 opacity-70 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div
          className={cn(
            "absolute left-0 top-[calc(100%+0.35rem)] z-[60] min-w-[16.5rem] rounded-xl border border-border py-1.5 shadow-xl bg-[var(--background)]",
            "animate-in fade-in-0 zoom-in-95 duration-150",
          )}
          role="menu"
        >
          <Link
            href="/cas-usage"
            role="menuitem"
            className="block px-3.5 py-2.5 text-sm font-semibold text-foreground hover:bg-muted/80"
            onClick={() => setOpen(false)}
          >
            Tous les cas d&apos;usage
          </Link>
          <div className="mx-2 h-px bg-border/60" />
          {MARKETING_USE_CASES.map(({ slug, navLabel }) => (
            <Link
              key={slug}
              href={`/cas-usage/${slug}`}
              role="menuitem"
              className="block px-3.5 py-2 text-sm text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {navLabel}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function NavLinks({
  className,
  onNavigate,
  currentPath,
  isLoggedIn,
  isSuperuser,
  useCasesPresentation,
}: {
  className?: string;
  onNavigate?: () => void;
  currentPath: string;
  isLoggedIn: boolean;
  isSuperuser: boolean;
  /** Barre desktop : menu déroulant ; tiroir mobile : liste détaillée */
  useCasesPresentation: "dropdown" | "list";
}) {
  return (
    <nav className={cn("flex flex-col gap-1 md:flex-row md:items-center md:gap-1 md:flex-wrap", className)}>
      {NAV.slice(0, 1).map(({ href, label }) => {
        const active = currentPath === href || currentPath.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              navPill,
              active
                ? "text-foreground bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
            )}
          >
            {label}
          </Link>
        );
      })}

      <UseCasesNav
        currentPath={currentPath}
        onNavigate={onNavigate}
        mode={useCasesPresentation === "dropdown" ? "desktop" : "mobile"}
      />

      {NAV.slice(1).map(({ href, label }) => {
        const active = currentPath === href || currentPath.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              navPill,
              active
                ? "text-foreground bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
            )}
          >
            {label}
          </Link>
        );
      })}

      {isLoggedIn ? (
        <>
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className={cn(
              navPill,
              currentPath.startsWith("/dashboard")
                ? "text-foreground bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
            )}
          >
            <LayoutDashboard size={16} className="opacity-80 shrink-0" aria-hidden />
            Tableau de bord
          </Link>
          {isSuperuser ? (
            <Link
              href="/superadmin"
              onClick={onNavigate}
              className={cn(
                navPill,
                currentPath.startsWith("/superadmin") || currentPath.startsWith("/admin")
                  ? "text-foreground bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80",
              )}
            >
              <Shield size={16} className="opacity-80 shrink-0" aria-hidden />
              Super admin
            </Link>
          ) : null}
        </>
      ) : (
        <>
          <Link
            href="/login"
            onClick={onNavigate}
            className={cn(navPill, "text-muted-foreground hover:text-foreground hover:bg-muted/80")}
          >
            <LogIn size={16} className="opacity-80 shrink-0" aria-hidden />
            Connexion
          </Link>
          <Link
            href="/register"
            onClick={onNavigate}
            className={cn(navPill, "text-muted-foreground hover:text-foreground hover:bg-muted/80")}
          >
            <UserPlus size={16} className="opacity-80 shrink-0" aria-hidden />
            Inscription
          </Link>
        </>
      )}
    </nav>
  );
}

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);
  /** Ne pas dépendre de `hasHydrated` : le token est injecté par persist avant/sans que ce flag soit à jour (Strict Mode, etc.). */
  const isLoggedIn = Boolean(token);
  const isSuperuser = Boolean(user?.is_superuser);
  const eventsListPath = "/dashboard/evenements";
  const createEventHref = isLoggedIn
    ? eventsListPath
    : `/login?next=${encodeURIComponent(eventsListPath)}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b border-border/55 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/72",
          "shadow-[0_1px_0_0_rgba(0,0,0,0.04)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.06)]",
        )}
      >
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
          <div className="mx-auto flex max-w-[1920px] flex-col">
            <div className="flex h-14 sm:h-[3.75rem] items-center justify-between gap-3">
              <BrandMark size="md" />

              <div className="hidden md:flex items-center gap-2 lg:gap-3 min-w-0">
                <NavLinks
                  currentPath={pathname}
                  isLoggedIn={isLoggedIn}
                  isSuperuser={isSuperuser}
                  useCasesPresentation="dropdown"
                />
                <Link href={createEventHref} className="shrink-0 ml-1 lg:ml-2">
                  <Button variant="gradient" size="sm" className="rounded-xl shadow-glow px-4 lg:px-5 whitespace-nowrap">
                    Créer un événement
                  </Button>
                </Link>
              </div>

              <div className="flex items-center gap-2 md:hidden shrink-0">
                <Link href={createEventHref}>
                  <Button variant="gradient" size="sm" className="px-3 rounded-xl whitespace-nowrap">
                    Créer
                  </Button>
                </Link>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/80 bg-muted/30 text-foreground"
                  aria-expanded={open}
                  aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
                  onClick={() => setOpen((o) => !o)}
                >
                  {open ? <X size={20} /> : <Menu size={20} />}
                </button>
              </div>
            </div>

            {open && (
              <div className="md:hidden border-t border-border/50 bg-muted/15 px-0 py-4 animate-in slide-in-from-top-1 duration-200">
                <NavLinks
                  currentPath={pathname}
                  onNavigate={() => setOpen(false)}
                  isLoggedIn={isLoggedIn}
                  isSuperuser={isSuperuser}
                  useCasesPresentation="list"
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-auto relative overflow-hidden border-t border-border/50 bg-gradient-to-b from-muted/25 via-muted/40 to-muted/55">
        <div className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-[0.35]" aria-hidden />
        <div className="container relative mx-auto px-4 py-16 md:py-20">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-4">
              <BrandMark size="sm" />
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                La collecte de photos d’événements, simple pour vous et transparente pour vos invités.
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Produit</p>
              <ul className="mt-4 space-y-3 text-sm">
                {NAV.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/cas-usage"
                    className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1 font-medium"
                  >
                    Cas d&apos;usage
                  </Link>
                </li>
              </ul>
              <p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Par type d&apos;événement</p>
              <ul className="mt-3 space-y-2 text-sm">
                {MARKETING_USE_CASES.map(({ slug, navLabel }) => (
                  <li key={slug}>
                    <Link
                      href={`/cas-usage/${slug}`}
                      className="text-muted-foreground hover:text-primary transition-colors text-[13px]"
                    >
                      {navLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Compte</p>
              <ul className="mt-4 space-y-3 text-sm">
                {isLoggedIn ? (
                  <>
                    <li>
                      <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">
                        Tableau de bord
                      </Link>
                    </li>
                    {isSuperuser ? (
                      <li>
                        <Link href="/superadmin" className="text-muted-foreground hover:text-primary transition-colors">
                          Super admin
                        </Link>
                      </li>
                    ) : null}
                  </>
                ) : (
                  <>
                    <li>
                      <Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">
                        Connexion
                      </Link>
                    </li>
                    <li>
                      <Link href="/register" className="text-muted-foreground hover:text-primary transition-colors">
                        Inscription
                      </Link>
                    </li>
                  </>
                )}
                <li>
                  <Link
                    href={createEventHref}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Nouvel événement
                  </Link>
                </li>
              </ul>
            </div>
            <div className="marketing-glass-subtle rounded-2xl p-5 lg:p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Pour qui ?</p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Mariages, anniversaires, galas, séminaires, lancements… partout où la foule tire son téléphone, votre
                album gagne en émotion et en volume.
              </p>
            </div>
          </div>
          <div className="mt-14 flex flex-col gap-3 border-t border-border/50 pt-8 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
            <p>
              © {new Date().getFullYear()} <AppName className="font-medium text-foreground" />. Tous droits réservés.
            </p>
            <p className="sm:text-right tracking-wide">Événements mémorables, albums sans effort.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
