/** Évite les redirections ouvertes : chemins relatifs internes uniquement. */
export function safeInternalPath(next: string | null | undefined): string | null {
  if (next == null || typeof next !== "string") return null;
  const t = next.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return null;
  if (t.includes("://")) return null;
  if (t.length > 512) return null;
  return t;
}

/** Lit le paramètre `next` dans l’URL courante (client uniquement). */
export function getNextQueryFromWindow(): string | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  return safeInternalPath(params.get("next"));
}
