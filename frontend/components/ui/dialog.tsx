"use client";

import { useEffect } from "react";

export function Dialog({
  open,
  onOpenChange,
  title,
  children,
  footer,
  size = "md",
  presentation = "card",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Plein écran sombre centré sur le contenu (photos / vidéos). */
  presentation?: "card" | "media";
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  if (presentation === "media") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-6">
        <button
          type="button"
          className="absolute inset-0 bg-black/88 backdrop-blur-[2px]"
          aria-label="Fermer"
          onClick={() => onOpenChange(false)}
        />
        <div className="relative z-10 flex w-full max-w-[min(100%,1200px)] flex-col gap-3 max-h-[100dvh]">
          <div className="flex items-center justify-between gap-3 text-white px-1 shrink-0">
            {title ? (
              <h3 className="font-semibold font-display text-sm sm:text-base flex-1 min-w-0 truncate drop-shadow-md">
                {title}
              </h3>
            ) : (
              <span className="flex-1" />
            )}
            <button
              type="button"
              className="h-9 shrink-0 px-4 rounded-full border border-white/25 bg-white/10 text-sm text-white hover:bg-white/20 backdrop-blur-md transition-colors"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto">
            <div className="w-full flex items-center justify-center">{children}</div>
          </div>
          {footer ? (
            <div className="shrink-0 rounded-[var(--radius-card)] border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/90 backdrop-blur-md">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const maxW =
    size === "sm"
      ? "max-w-md"
      : size === "lg"
        ? "max-w-3xl"
        : size === "xl"
          ? "max-w-6xl"
          : "max-w-xl";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <button
        className="absolute inset-0 bg-black/40"
        aria-label="Fermer"
        onClick={() => onOpenChange(false)}
      />
      <div className={`relative mx-auto my-6 w-[92%] ${maxW}`}>
        <div className="bg-card border rounded-[var(--radius-card)] shadow-glow overflow-hidden max-h-[calc(100vh-3rem)] flex flex-col">
          <div className="px-5 py-4 border-b flex items-center justify-between gap-3 shrink-0">
            {title ? <h3 className="font-bold font-display flex-1 min-w-0">{title}</h3> : <span className="flex-1" />}
            <button
              className="h-9 shrink-0 px-3 rounded-[var(--radius-button)] border bg-background text-sm"
              onClick={() => onOpenChange(false)}
            >
              Fermer
            </button>
          </div>
          <div className="p-5 overflow-y-auto flex-1 min-h-0">{children}</div>
          {footer ? <div className="px-5 py-4 border-t shrink-0">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

