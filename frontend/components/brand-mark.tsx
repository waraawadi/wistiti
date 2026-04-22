"use client";

import Link from "next/link";

import { AppName } from "@/components/app-name";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  linkHref?: string;
  /** Taille visuelle du bloc logo / texte */
  size?: "sm" | "md" | "lg";
  /** Texte blanc (fond dégradé sombre). Le logo image reste inchangé. */
  variant?: "default" | "light";
};

const sizeClasses = {
  sm: "h-7 max-h-7",
  md: "h-9 max-h-9",
  lg: "h-11 max-h-11",
};

const textSizeClasses = {
  sm: "text-lg md:text-xl",
  md: "text-xl md:text-2xl",
  lg: "text-2xl md:text-3xl",
};

export function BrandMark({ className, linkHref = "/", size = "md", variant = "default" }: BrandMarkProps) {
  const logoUrl = useAppStore((s) => s.logoUrl?.trim() ?? "");
  const appName = useAppStore((s) => s.appName);

  const hasLogo = Boolean(logoUrl);

  return (
    <Link
      href={linkHref}
      className={cn("inline-flex items-center gap-2 min-w-0 shrink-0 touch-manipulation", className)}
      aria-label={`Accueil ${appName}`}
    >
      {hasLogo ? (
        <span className={cn("relative flex w-auto items-center", sizeClasses[size])}>
          {/* URL logo admin : domaine variable — pas de domaine fixe dans next/image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={appName}
            className={cn("h-full w-auto max-w-[180px] object-contain object-left")}
          />
        </span>
      ) : (
        <AppName
          className={cn(
            "font-extrabold font-display tracking-tight leading-none",
            textSizeClasses[size],
            variant === "light" ? "text-white drop-shadow-[0_1px_12px_rgba(0,0,0,0.25)]" : "gradient-text",
          )}
        />
      )}
    </Link>
  );
}
