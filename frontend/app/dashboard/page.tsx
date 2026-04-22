"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CalendarPlus, Camera, FolderOpen, HardDrive, Users } from "lucide-react";

import { DashboardChartsSection, type DashboardStatsPayload } from "@/components/dashboard-analytics";
import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Usage = {
  plan: string;
  uploads_used: number;
  uploads_max: number;
  evenements_used: number;
  evenements_max: number;
  albums_per_event_max: number;
  upload_credits: number;
  expires_at: string | null;
};

function formatBytes(n: number): string {
  if (n <= 0) return "0 Mo";
  const mb = n / (1024 * 1024);
  if (mb < 1024) return mb < 10 ? `${mb.toFixed(1)} Mo` : `${Math.round(mb)} Mo`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} Go`;
}

export default function DashboardPage() {
  const token = useAppStore((s) => s.token);

  const { data: usage } = useQuery({
    queryKey: ["paiements-usage"],
    enabled: Boolean(token),
    queryFn: async () => (await api.get<Usage>("/api/paiements/usage/")).data,
  });

  const { data: stats } = useQuery({
    queryKey: ["evenements-dashboard-stats"],
    enabled: Boolean(token),
    queryFn: async () => (await api.get<DashboardStatsPayload>("/api/evenements/dashboard-stats/")).data,
  });

  const planName = usage?.plan ?? "Gratuit";
  const expiresAt = usage?.expires_at ? new Date(usage.expires_at) : null;
  const expSoon = expiresAt ? (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24) < 7 : false;

  const uploadsUsed = usage?.uploads_used ?? null;
  const uploadsMax = usage?.uploads_max ?? null;
  const progressPct =
    uploadsUsed != null && uploadsMax != null && uploadsMax > 0 && uploadsMax !== -1
      ? Math.min(100, Math.round((uploadsUsed / uploadsMax) * 100))
      : uploadsMax === -1
        ? 100
        : 0;

  const planBadgeStyle: React.CSSProperties =
    planName.toLowerCase() === "pro"
      ? { background: "var(--color-primary)", color: "var(--color-white)" }
      : planName.toLowerCase() === "plus"
        ? { background: "var(--color-secondary)", color: "var(--color-white)" }
        : { background: "var(--muted)", color: "var(--muted-foreground)" };

  const eventsLabel =
    usage?.evenements_used != null && usage?.evenements_max != null
      ? usage.evenements_max === -1
        ? `${usage.evenements_used} / ∞`
        : `${usage.evenements_used} / ${usage.evenements_max}`
      : "—";

  const photosLabel =
    uploadsUsed != null && uploadsMax != null
      ? uploadsMax === -1
        ? `${uploadsUsed} / ∞`
        : `${uploadsUsed} / ${uploadsMax}`
      : "—";

  const guestsLabel = stats != null ? String(stats.guest_contributions) : "—";
  const storageLabel = stats != null ? formatBytes(stats.storage_bytes) : "—";
  const albumsSubtitle = stats != null ? `${stats.albums_total} album${stats.albums_total !== 1 ? "s" : ""}` : "";

  const statCards = [
    {
      label: "Événements",
      value: eventsLabel,
      sub: usage?.albums_per_event_max != null && usage.albums_per_event_max !== -1 ? `max ${usage.albums_per_event_max} albums / evt.` : "Albums / evt. selon plan",
      icon: CalendarPlus,
    },
    {
      label: "Médias (quota)",
      value: photosLabel,
      sub:
        usage?.upload_credits != null && usage.upload_credits > 0
          ? `+ ${usage.upload_credits} crédit${usage.upload_credits !== 1 ? "s" : ""} recharge`
          : "Photos & vidéos comptées",
      icon: Camera,
    },
    {
      label: "Envoi invité",
      value: guestsLabel,
      sub: "Médias avec IP invitée",
      icon: Users,
    },
    {
      label: "Stockage",
      value: storageLabel,
      sub: albumsSubtitle || "Fichiers hébergés",
      icon: HardDrive,
    },
  ];

  return (
    <div className="min-w-0 max-w-full space-y-6 sm:space-y-8 overflow-x-hidden">
      <DashboardPageHeader
        title="Tableau de bord"
        description="Chiffres synchronisés avec ton forfait et l’activité réelle de tes événements."
      />

      <div className="dashboard-panel p-4 sm:p-6 md:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 min-[420px]:flex-row min-[420px]:flex-wrap min-[420px]:items-center sm:gap-3">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-sm w-fit" style={planBadgeStyle}>
              Plan {planName}
            </span>
            <span className="text-xs sm:text-sm text-muted-foreground leading-snug">
              Expiration :{" "}
              {expiresAt ? (
                <span className={cn("font-medium text-foreground", expSoon && "text-primary")}>{expiresAt.toLocaleDateString("fr-FR")}</span>
              ) : (
                "—"
              )}
            </span>
          </div>
          <Link href="/dashboard/abonnements" className="w-full sm:w-auto shrink-0">
            <Button variant="outline" size="sm" className="rounded-xl border-border/70 shadow-sm w-full sm:w-auto">
              Mettre à niveau
            </Button>
          </Link>
        </div>
        <div className="mt-4 sm:mt-5">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3 text-sm mb-2">
            <span className="text-muted-foreground font-medium leading-snug">Utilisation du quota médias</span>
            <span className="font-semibold tabular-nums shrink-0">{photosLabel}</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden bg-muted/80 ring-1 ring-border/30">
            <div
              className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-primary to-secondary"
              style={{
                width: uploadsMax === -1 ? "100%" : `${progressPct}%`,
                boxShadow: "0 0 16px color-mix(in srgb, var(--color-primary) 25%, transparent)",
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {statCards.map((s) => (
          <div key={s.label} className="dashboard-stat-card p-4 sm:p-5 md:p-6 relative overflow-hidden min-w-0">
            <div className="absolute top-0 left-0 right-0 h-1 gradient-bg opacity-90" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground leading-tight">
                  {s.label}
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl font-extrabold mt-1 sm:mt-1.5 font-display tabular-nums tracking-tight break-words">
                  {s.value}
                </p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-3">{s.sub}</p>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10 border border-primary/10 flex items-center justify-center shrink-0">
                <s.icon className="text-primary shrink-0" size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <DashboardChartsSection stats={stats} />

      <div className="dashboard-panel p-4 sm:p-6 md:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5">
        <div className="flex gap-3 sm:gap-4 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl gradient-bg flex items-center justify-center shrink-0 shadow-glow">
            <FolderOpen className="text-white" size={19} />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold font-display tracking-tight">Mes événements</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
              Liste, QR, albums et médias au même endroit.
            </p>
          </div>
        </div>
        <Link href="/dashboard/evenements" className="w-full sm:w-auto shrink-0">
          <Button variant="gradient" className="rounded-xl px-6 shadow-glow w-full sm:w-auto min-h-11">
            Ouvrir
          </Button>
        </Link>
      </div>
    </div>
  );
}
