"use client";

import Link from "next/link";
import { useId } from "react";

import { cn } from "@/lib/utils";

export type DashboardStatsPayload = {
  albums_total: number;
  medias_photo: number;
  medias_video: number;
  guest_contributions: number;
  pending_moderation: number;
  storage_bytes: number;
  medias_per_day: { date: string; count: number }[];
  medias_by_event: { slug: string; titre: string; medias_count: number }[];
};

const primary = "var(--color-primary)";
const secondary = "var(--color-secondary)";

function formatShortDate(iso: string, compact?: boolean) {
  try {
    const d = new Date(iso + "T12:00:00");
    if (compact) {
      return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
    }
    return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

/** Anneau photo / vidéo */
export function MediaMixDonut({ photo, video }: { photo: number; video: number }) {
  const total = photo + video;
  const pctPhoto = total > 0 ? (photo / total) * 100 : 50;
  const pctVideo = total > 0 ? (video / total) * 100 : 50;
  const r = 52;
  const c = 2 * Math.PI * r;
  const lenPhoto = (pctPhoto / 100) * c;
  const lenVideo = (pctVideo / 100) * c;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full max-w-full min-w-0">
      <div className="relative h-32 w-32 sm:h-36 sm:w-36 shrink-0">
        <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--muted)" strokeWidth="14" opacity={0.35} />
          {total > 0 ? (
            <>
              <circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={primary}
                strokeWidth="14"
                strokeDasharray={`${lenPhoto} ${c}`}
                strokeLinecap="round"
                className="transition-all duration-500"
                style={{ filter: "drop-shadow(0 0 10px color-mix(in srgb, var(--color-primary) 40%, transparent))" }}
              />
              <circle
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={secondary}
                strokeWidth="14"
                strokeDasharray={`${lenVideo} ${c}`}
                strokeDashoffset={-lenPhoto}
                strokeLinecap="round"
                className="transition-all duration-500"
                style={{ filter: "drop-shadow(0 0 8px color-mix(in srgb, var(--color-secondary) 35%, transparent))" }}
              />
            </>
          ) : (
            <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="10" strokeDasharray="6 10" />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none rotate-0">
          <span className="text-2xl font-extrabold tabular-nums font-display text-foreground">{total}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">médias</span>
        </div>
      </div>
      <ul className="w-full space-y-3 text-sm">
        <li className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/25 px-3 py-2">
          <span className="flex items-center gap-2 font-medium">
            <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: primary }} />
            Photos
          </span>
          <span className="tabular-nums font-bold">{photo}</span>
        </li>
        <li className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/25 px-3 py-2">
          <span className="flex items-center gap-2 font-medium">
            <span className="h-2.5 w-2.5 rounded-full shadow-sm" style={{ background: secondary }} />
            Vidéos
          </span>
          <span className="tabular-nums font-bold">{video}</span>
        </li>
      </ul>
    </div>
  );
}

/** Courbe d’activité sur 7 jours */
export function ActivityAreaChart({ data }: { data: { date: string; count: number }[] }) {
  const gradId = useId().replace(/:/g, "");
  const areaGrad = `dashAreaGrad-${gradId}`;
  const lineGrad = `dashLineGrad-${gradId}`;
  const max = Math.max(1, ...data.map((d) => d.count));
  const w = 320;
  const h = 120;
  const pad = 8;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2 - 18;
  const n = Math.max(data.length, 1);
  const step = n > 1 ? innerW / (n - 1) : innerW;
  const points = data.map((d, i) => {
    const x = n === 1 ? pad + innerW / 2 : pad + i * step;
    const y = pad + innerH - (d.count / max) * innerH;
    return `${x},${y}`;
  });
  const linePath = points.length ? `M ${points.join(" L ")}` : "";
  const lastX = n === 1 ? pad + innerW / 2 : pad + (data.length - 1) * step;
  const firstX = n === 1 ? pad + innerW / 2 : pad;
  const areaPath = linePath
    ? `${linePath} L ${lastX} ${pad + innerH} L ${firstX} ${pad + innerH} Z`
    : "";

  return (
    <div className="w-full min-w-0 max-w-full">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full max-w-full aspect-[8/3] min-h-[88px] min-w-0 sm:min-h-[100px]"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Activité des uploads sur 7 jours"
      >
        <defs>
          <linearGradient id={areaGrad} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primary} stopOpacity={0.35} />
            <stop offset="100%" stopColor={primary} stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id={lineGrad} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={primary} />
            <stop offset="100%" stopColor={secondary} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${areaGrad})`} />
        <path
          d={linePath}
          fill="none"
          stroke={`url(#${lineGrad})`}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 2px 8px color-mix(in srgb, var(--color-primary) 25%, transparent))" }}
        />
        {data.map((d, i) => {
          const x = n === 1 ? pad + innerW / 2 : pad + i * step;
          const y = pad + innerH - (d.count / max) * innerH;
          return <circle key={d.date} cx={x} cy={y} r={d.count > 0 ? 4 : 2.5} fill={d.count > 0 ? primary : "var(--border)"} opacity={0.95} />;
        })}
      </svg>
      <div className="mt-2 grid grid-cols-7 gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-tight sm:tracking-wider text-muted-foreground leading-tight">
        {data.map((d) => (
          <span key={d.date} className="min-w-0 text-center break-words hyphens-auto">
            <span className="sm:hidden">{formatShortDate(d.date, true)}</span>
            <span className="hidden sm:inline">{formatShortDate(d.date)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** Barres horizontales par événement */
export function EventsBarChart({ rows }: { rows: { slug: string; titre: string; medias_count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.medias_count));
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">Crée un événement pour voir la répartition.</p>;
  }
  return (
    <ul className="space-y-3">
      {rows.map((r, i) => {
        const pct = Math.round((r.medias_count / max) * 100);
        return (
          <li key={r.slug} className="min-w-0">
            <div className="flex flex-col gap-0.5 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between min-[400px]:gap-2 text-sm mb-1">
              <Link
                href={`/dashboard/evenements/${r.slug}/medias`}
                className="font-medium min-w-0 hover:text-primary transition-colors break-words line-clamp-2 min-[400px]:truncate min-[400px]:flex-1"
              >
                {r.titre}
              </Link>
              <span className="tabular-nums text-muted-foreground font-semibold shrink-0">{r.medias_count}</span>
            </div>
            <div className="h-2 rounded-full bg-muted/80 overflow-hidden ring-1 ring-border/30">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${pct}%`,
                  background:
                    i % 2 === 0
                      ? `linear-gradient(90deg, var(--color-primary), var(--color-secondary))`
                      : `linear-gradient(90deg, var(--color-secondary), var(--color-primary))`,
                  boxShadow: "0 0 12px color-mix(in srgb, var(--color-primary) 20%, transparent)",
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function DashboardChartsSection({
  stats,
  className,
}: {
  stats: DashboardStatsPayload | undefined;
  className?: string;
}) {
  if (!stats) {
    return (
      <div className={cn("grid gap-4 sm:gap-6 md:grid-cols-2", className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="dashboard-panel p-4 sm:p-6">
            <div className="h-44 sm:h-48 rounded-2xl bg-muted/40 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid lg:grid-cols-2 gap-4 sm:gap-5 min-w-0 max-w-full", className)}>
      <div className="dashboard-panel p-4 sm:p-6 md:p-7 min-w-0 max-w-full">
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5">
          <h3 className="text-sm sm:text-base font-bold font-display tracking-tight">Photos & vidéos</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Mix</span>
        </div>
        <MediaMixDonut photo={stats.medias_photo} video={stats.medias_video} />
      </div>
      <div className="dashboard-panel p-4 sm:p-6 md:p-7 min-w-0 max-w-full">
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
          <h3 className="text-sm sm:text-base font-bold font-display tracking-tight">Activité (7 jours)</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">Uploads</span>
        </div>
        <ActivityAreaChart data={stats.medias_per_day} />
      </div>
      <div className="dashboard-panel p-4 sm:p-6 md:p-7 lg:col-span-2 min-w-0 max-w-full">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between mb-4 sm:mb-5">
          <h3 className="text-sm sm:text-base font-bold font-display tracking-tight">Médias par événement</h3>
          {stats.pending_moderation > 0 && (
            <span className="rounded-full bg-primary/12 text-primary text-xs font-semibold px-3 py-1 ring-1 ring-primary/20">
              {stats.pending_moderation} en modération
            </span>
          )}
        </div>
        <EventsBarChart rows={stats.medias_by_event} />
      </div>
    </div>
  );
}
