"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { CalendarClock, Camera, Images } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type PublicEvent = {
  titre: string;
  slug: string;
  public_code: string;
  date: string;
  expires_at: string | null;
  description: string;
  album_public: {
    slug: string;
    public_code: string;
    guest_upload_enabled: boolean;
  };
};

type EventStatus = "en_cours" | "a_venir" | "termine";

function getEventStatus(evt: PublicEvent, now: Date): EventStatus {
  const start = new Date(evt.date);
  const end = evt.expires_at ? new Date(evt.expires_at) : null;
  if (start > now) return "a_venir";
  if (end && end < now) return "termine";
  return "en_cours";
}

function getStatusBadge(status: EventStatus) {
  if (status === "en_cours") {
    return "bg-[color-mix(in_srgb,var(--color-primary)_14%,transparent)] text-[var(--color-primary)] border-[color-mix(in_srgb,var(--color-primary)_35%,transparent)]";
  }
  if (status === "a_venir") {
    return "bg-[color-mix(in_srgb,var(--color-secondary)_14%,transparent)] text-[var(--color-secondary)] border-[color-mix(in_srgb,var(--color-secondary)_35%,transparent)]";
  }
  return "bg-muted text-muted-foreground border-border/70";
}

function getStatusLabel(status: EventStatus) {
  if (status === "en_cours") return "En cours";
  if (status === "a_venir") return "À venir";
  return "Terminé";
}

export default function MarketingEventsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-events-list"],
    queryFn: async () => (await api.get<PublicEvent[]>("/api/evenements/public/list/")).data,
  });

  const now = new Date();
  const events = (data ?? [])
    .map((evt) => ({ evt, status: getEventStatus(evt, now) }))
    .sort((a, b) => {
      const rank: Record<EventStatus, number> = { en_cours: 0, a_venir: 1, termine: 2 };
      const byStatus = rank[a.status] - rank[b.status];
      if (byStatus !== 0) return byStatus;
      const da = new Date(a.evt.date).getTime();
      const db = new Date(b.evt.date).getTime();
      return db - da;
    });

  return (
    <section className="container mx-auto max-w-5xl px-4 py-12 md:py-16">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight">Événements en cours et à venir</h1>
        <p className="mt-3 text-muted-foreground">
          Choisissez un événement puis soit vous envoyez des photos dans l&apos;album public, soit vous consultez uniquement la galerie.
        </p>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Chargement des événements...</p>}
      {isError && <p className="text-sm text-destructive">Impossible de charger les événements publics.</p>}

      <div className="space-y-4">
        {events.map(({ evt, status }) => {
          const albumCode = evt.album_public.public_code;
          const photosHref = `/${evt.public_code}/${albumCode}`;
          const uploadHref = `/${evt.public_code}/${albumCode}/upload`;
          return (
            <article key={evt.public_code} className="dashboard-panel p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold font-display">{evt.titre}</h2>
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusBadge(status)}`}>
                      {getStatusLabel(status)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground font-mono">
                    Code événement: {evt.public_code} · Album public: {albumCode}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground inline-flex items-center gap-1.5">
                    <CalendarClock className="size-4" />
                    {new Date(evt.date).toLocaleString("fr-FR")}
                    {evt.expires_at ? ` → ${new Date(evt.expires_at).toLocaleString("fr-FR")}` : ""}
                  </p>
                  {evt.description ? <p className="mt-2 text-sm text-muted-foreground">{evt.description}</p> : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  {status === "en_cours" ? (
                    <>
                      <Link href={photosHref}>
                        <Button variant="outline" className="rounded-xl">
                          <Images className="size-4" />
                          Voir les photos
                        </Button>
                      </Link>
                      {evt.album_public.guest_upload_enabled ? (
                        <Link href={uploadHref}>
                          <Button variant="gradient" className="rounded-xl shadow-glow">
                            <Camera className="size-4" />
                            Envoyer des photos
                          </Button>
                        </Link>
                      ) : (
                        <Button variant="outline" className="rounded-xl" disabled>
                          Upload fermé
                        </Button>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
        {!isLoading && !events.length && (
          <p className="text-sm text-muted-foreground">Aucun événement public en cours ou à venir pour le moment.</p>
        )}
      </div>
    </section>
  );
}
