"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Download, ExternalLink, Lock, Plus, Trash2, Unlock } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { QRCodePhotoWallCard } from "@/components/qrcode-photowall-card";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { downloadQrPngFromPath } from "@/lib/download-qr-png";
import { dashboardInput } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";
import { ApiErrorCodes, getApiErrorPayload } from "@/lib/api-error-codes";

type Evenement = {
  id: number;
  titre: string;
  slug: string;
  public_code: string;
  date: string;
  description: string;
  actif: boolean;
  moderation_active?: boolean;
};

type Media = {
  id: number;
  approuve: boolean;
};

type Album = {
  id: number;
  nom: string;
  slug: string;
  public_code: string;
  is_public: boolean;
  guest_upload_enabled?: boolean;
  medias_count?: number;
  qrcode_url: string;
  entry_url: string;
};

export default function EvenementSharePage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const qc = useQueryClient();
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  const [newAlbumName, setNewAlbumName] = useState("");
  const [albumNotice, setAlbumNotice] = useState<{ variant: "error" | "info"; text: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Album | null>(null);
  const [downloadingAlbumQrId, setDownloadingAlbumQrId] = useState<number | null>(null);

  const { data, refetch: refetchEvt } = useQuery({
    queryKey: ["evenement", slug],
    queryFn: async () => (await api.get<Evenement>(`/api/evenements/${slug}/`)).data,
  });

  const { data: medias, refetch: refetchMedias } = useQuery({
    queryKey: ["evenement-medias-min", slug],
    queryFn: async () => (await api.get<Media[]>(`/api/evenements/${slug}/medias/`)).data,
  });

  const { data: albums, refetch: refetchAlbums } = useQuery({
    queryKey: ["evenement-albums", slug],
    queryFn: async () => (await api.get<Album[]>(`/api/evenements/${slug}/albums/`)).data,
  });

  const sortedAlbums = useMemo(() => (albums ?? []).slice().sort((a, b) => a.slug.localeCompare(b.slug)), [albums]);
  const publicAlbum = useMemo(
    () => sortedAlbums.find((a) => a.is_public || a.slug === "public") ?? null,
    [sortedAlbums],
  );

  const createAlbum = useMutation({
    mutationFn: async () => {
      const nom = newAlbumName.trim();
      if (!nom) throw new Error("nom");
      await api.post(`/api/evenements/${slug}/albums/`, { nom, is_public: false });
    },
    onSuccess: async () => {
      setNewAlbumName("");
      setAlbumNotice(null);
      await refetchAlbums();
      await qc.invalidateQueries({ queryKey: ["album", slug] });
    },
    onError: (err) => {
      const p = getApiErrorPayload(err);
      if (p?.code === ApiErrorCodes.SINGLE_PUBLIC_ALBUM_ONLY) {
        setAlbumNotice({
          variant: "error",
          text:
            p.detail ??
            "Un seul album public est possible : celui nommé « Public ». Crée des albums privés pour regrouper d’autres photos.",
        });
        return;
      }
      setAlbumNotice({
        variant: "error",
        text: p?.detail ?? "Impossible de créer l’album.",
      });
    },
  });

  const patchGuestUpload = useMutation({
    mutationFn: async (p: { albumSlug: string; enabled: boolean }) => {
      await api.patch(`/api/evenements/${slug}/albums/${p.albumSlug}/`, {
        guest_upload_enabled: p.enabled,
      });
    },
    onSuccess: async () => {
      setAlbumNotice(null);
      await refetchAlbums();
      await qc.invalidateQueries({ queryKey: ["album", slug] });
    },
    onError: (err) => {
      const p = getApiErrorPayload(err);
      setAlbumNotice({ variant: "error", text: p?.detail ?? "Impossible de mettre à jour l’upload invité." });
    },
  });

  const deleteAlbum = useMutation({
    mutationFn: async (a: Album) => {
      await api.delete(`/api/evenements/${slug}/albums/${a.slug}/`);
    },
    onSuccess: async () => {
      setDeleteTarget(null);
      setAlbumNotice(null);
      await refetchAlbums();
      await qc.invalidateQueries({ queryKey: ["album", slug] });
    },
    onError: (err) => {
      const p = getApiErrorPayload(err);
      if (p?.code === ApiErrorCodes.CANNOT_DELETE_DEFAULT_PUBLIC_ALBUM) {
        setAlbumNotice({
          variant: "error",
          text: p.detail ?? "L’album « Public » ne peut pas être supprimé.",
        });
        setDeleteTarget(null);
        return;
      }
      setAlbumNotice({ variant: "error", text: p?.detail ?? "Suppression impossible." });
    },
  });

  const pendingCount = (medias ?? []).filter((m) => !m.approuve).length;

  async function setModerationActive(next: boolean) {
    await api.patch(`/api/evenements/${slug}/`, { moderation_active: next });
    await refetchEvt();
    await refetchMedias();
  }

  async function downloadAlbumQrPng(a: Album) {
    setDownloadingAlbumQrId(a.id);
    setAlbumNotice(null);
    try {
      await downloadQrPngFromPath(a.qrcode_url, `qr-${slug}-${a.slug}.png`);
    } catch {
      setAlbumNotice({ variant: "error", text: "Impossible de télécharger le QR code." });
    } finally {
      setDownloadingAlbumQrId(null);
    }
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={data?.titre ?? "Événement"}
        description={
          <>
            {slug}
            {data?.public_code && (
              <span className="ml-2 font-mono text-xs">· code {data.public_code}</span>
            )}
          </>
        }
        actions={
          <>
            <Button variant="outline" className="rounded-xl border-border/70" asChild>
              <Link href={`/dashboard/evenements/${slug}/medias`}>Voir les médias</Link>
            </Button>
            <Button variant="outline" className="rounded-xl border-border/70" asChild>
              <Link href="/dashboard">Retour</Link>
            </Button>
          </>
        }
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="dashboard-panel p-6 md:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight">Partage invité</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              L&apos;album <span className="font-medium text-foreground">Public</span> représente l&apos;accès invité.
              Son QR code est dans la section Albums ci-dessous.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Lien direct invité (album public)
            </label>
            <div className="flex items-center gap-2">
              <input
                className={cn(dashboardInput, "flex-1 min-w-0 font-mono text-xs h-10 py-0")}
                value={publicAlbum?.entry_url ?? ""}
                readOnly
                placeholder="L’URL invité sera disponible dès que l’album Public est chargé."
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 shrink-0 rounded-xl border border-[color-mix(in_srgb,var(--color-secondary)_32%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,transparent)] px-3.5 text-xs font-semibold text-[var(--color-secondary)] shadow-sm transition-all hover:!bg-[color-mix(in_srgb,var(--color-secondary)_18%,transparent)] hover:shadow-md hover:!text-[var(--color-secondary)]"
                disabled={!publicAlbum?.entry_url}
                onClick={async () => {
                  if (!publicAlbum?.entry_url) return;
                  await navigator.clipboard.writeText(publicAlbum.entry_url);
                }}
              >
                <Copy className="size-3.5" aria-hidden />
                Copier
              </Button>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="gradient"
                className="rounded-xl h-11 shadow-glow"
                onClick={() => window.open(`/evenement/${slug}`, "_blank")}
              >
                Ouvrir la page invité
              </Button>
              <a href={`/api/evenements/${slug}/download-zip/`} target="_blank" rel="noreferrer">
                <Button variant="outline" className="rounded-xl h-11 border-border/70">
                  Télécharger tout (ZIP)
                </Button>
              </a>
            </div>
          </div>

          <div className="pt-5 border-t border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h3 className="font-bold font-display tracking-tight">Modération</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Si activée, les uploads sont en attente d’approbation.
                </p>
                {data?.moderation_active && (
                  <p className="text-sm mt-3">
                    En attente : <span className="font-semibold tabular-nums">{pendingCount}</span>{" "}
                    <Link href={`/dashboard/evenements/${slug}/medias`} className="underline text-primary font-medium">
                      gérer
                    </Link>
                  </p>
                )}
              </div>
              <button
                type="button"
                className={cn(
                  "h-11 px-5 rounded-xl border text-sm font-semibold transition-all shrink-0",
                  data?.moderation_active
                    ? "border-border/70 bg-background hover:bg-muted/40"
                    : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15",
                )}
                onClick={() => setModerationActive(!data?.moderation_active)}
              >
                {data?.moderation_active ? "Désactiver" : "Activer"}
              </button>
            </div>
          </div>
        </div>
        <QRCodePhotoWallCard slug={slug} />

        <div className="dashboard-panel p-6 md:p-8 space-y-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold font-display tracking-tight">Albums</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                L’album <span className="font-medium text-foreground">Public</span> est unique par événement. Tu peux
                ajouter des albums <span className="font-medium text-foreground">privés</span> (chacun avec son QR).
                Invité sur un album privé : galerie scindée (public événement + contenu de cet album seulement).
              </p>
            </div>
          </div>

          {albumNotice && (
            <p
              className={cn(
                "text-sm rounded-xl border px-4 py-3 font-medium",
                albumNotice.variant === "error"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-primary/30 bg-primary/8 text-foreground",
              )}
            >
              {albumNotice.text}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className={dashboardInput}
              placeholder="Nom de l’album privé (ex: Famille)"
              value={newAlbumName}
              onChange={(e) => {
                setNewAlbumName(e.target.value);
                setAlbumNotice(null);
              }}
            />
            <Button
              variant="gradient"
              className="rounded-xl h-11 gap-1.5 px-6 shadow-glow font-semibold"
              onClick={() => {
                setAlbumNotice(null);
                createAlbum.mutate();
              }}
              disabled={createAlbum.isPending || !newAlbumName.trim()}
            >
              <Plus className="size-4 shrink-0" aria-hidden />
              {createAlbum.isPending ? "Création…" : "Créer un album privé"}
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {sortedAlbums.map((a) => {
              const qrSrc = a.qrcode_url.startsWith("http") ? a.qrcode_url : `${apiBase}${a.qrcode_url}`;
              return (
                <div
                  key={a.id}
                  className="rounded-2xl border border-border/50 bg-muted/15 p-5 space-y-4 ring-1 ring-border/20 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset] dark:shadow-none"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold font-display">{a.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        code album <span className="font-mono">{a.public_code}</span> · slug {a.slug}
                        {typeof a.medias_count === "number" && (
                          <> · {a.medias_count} média{a.medias_count !== 1 ? "s" : ""}</>
                        )}
                      </p>
                      <p className="text-xs mt-1">
                        <span className="text-muted-foreground">Envoi invité (QR / page) :</span>{" "}
                        <span className={a.guest_upload_enabled === false ? "text-amber-600 font-medium" : "text-emerald-600 font-medium"}>
                          {a.guest_upload_enabled === false ? "fermé" : "ouvert"}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={patchGuestUpload.isPending}
                        onClick={() => {
                          setAlbumNotice(null);
                          const next = a.guest_upload_enabled === false;
                          patchGuestUpload.mutate({ albumSlug: a.slug, enabled: next });
                        }}
                        className={cn(
                          "h-9 rounded-xl px-3.5 text-xs font-semibold shadow-sm transition-all",
                          a.guest_upload_enabled === false
                            ? "border border-[color-mix(in_srgb,var(--color-primary)_38%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_9%,transparent)] text-[var(--color-primary)] hover:!bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] hover:shadow-md hover:!text-[var(--color-primary)]"
                            : "border border-[color-mix(in_srgb,var(--color-secondary)_35%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,transparent)] text-[var(--color-secondary)] hover:!bg-[color-mix(in_srgb,var(--color-secondary)_18%,transparent)] hover:shadow-md hover:!text-[var(--color-secondary)]",
                        )}
                      >
                        {a.guest_upload_enabled === false ? (
                          <>
                            <Unlock className="size-3.5" aria-hidden />
                            Autoriser l&apos;upload
                          </>
                        ) : (
                          <>
                            <Lock className="size-3.5" aria-hidden />
                            Bloquer l&apos;upload
                          </>
                        )}
                      </Button>
                      {a.slug !== "public" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-9 rounded-xl px-3.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            setAlbumNotice(null);
                            setDeleteTarget(a);
                          }}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex flex-col items-stretch gap-2 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={qrSrc}
                        alt={`QR ${a.nom}`}
                        className="h-28 w-28 rounded-2xl border border-border/50 bg-background shadow-sm ring-1 ring-border/30"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 w-full sm:w-auto rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_9%,transparent)] px-3.5 text-xs font-semibold text-[var(--color-primary)] shadow-sm transition-all hover:!bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] hover:shadow-md hover:!text-[var(--color-primary)]"
                        disabled={downloadingAlbumQrId === a.id}
                        onClick={() => {
                          void downloadAlbumQrPng(a);
                        }}
                      >
                        <Download className="size-3.5" aria-hidden />
                        {downloadingAlbumQrId === a.id ? "Téléchargement…" : "Télécharger le QR"}
                      </Button>
                    </div>
                    <div className="flex-1 min-w-[220px]">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Lien QR (API → redirection vers l’album)
                      </label>
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          className={cn(dashboardInput, "flex-1 min-w-0 font-mono text-xs h-10 py-0")}
                          value={a.entry_url}
                          readOnly
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-10 shrink-0 rounded-xl border border-[color-mix(in_srgb,var(--color-secondary)_32%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,transparent)] px-3.5 text-xs font-semibold text-[var(--color-secondary)] shadow-sm transition-all hover:!bg-[color-mix(in_srgb,var(--color-secondary)_18%,transparent)] hover:shadow-md hover:!text-[var(--color-secondary)]"
                          onClick={async () => {
                            await navigator.clipboard.writeText(a.entry_url);
                          }}
                        >
                          <Copy className="size-3.5" aria-hidden />
                          Copier
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-muted-foreground">Page web directe</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-lg border border-border/60 bg-background/80 px-2.5 text-[11px] font-mono font-medium text-foreground shadow-sm hover:bg-muted/60"
                          onClick={() => window.open(`${origin}/${data?.public_code ?? ""}/${a.public_code}`, "_blank")}
                          disabled={!data?.public_code || !a.public_code}
                        >
                          /{data?.public_code}/{a.public_code}
                          <ExternalLink className="ml-1 size-3 opacity-70" aria-hidden />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Statut: <span className="font-medium">{a.is_public ? "Public" : "Privé"}</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            {sortedAlbums.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucun album.</p>
            )}
          </div>
        </div>

      </div>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={deleteTarget ? `Supprimer « ${deleteTarget.nom} » ?` : "Supprimer l’album ?"}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" type="button" className="rounded-xl border-border/70" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button
              variant="secondary"
              className="rounded-xl !bg-[#b91c1c] !text-white hover:!opacity-90 border-0"
              type="button"
              disabled={deleteAlbum.isPending}
              onClick={() => {
                if (deleteTarget) deleteAlbum.mutate(deleteTarget);
              }}
            >
              {deleteAlbum.isPending ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </div>
        }
      >
        {deleteTarget && (
          <div className="space-y-3 text-sm">
            <p>
              Toutes les <span className="font-semibold">photos et vidéos</span> présentes dans cet album seront{" "}
              <span className="font-semibold">supprimées définitivement</span> (fichiers inclus). Cette action est{" "}
              irréversible.
            </p>
            <p className="text-muted-foreground">
              Le QR code et le lien <span className="font-mono">/{data?.public_code}/{deleteTarget.public_code}</span> ne
              fonctionneront plus. Les médias des autres albums ne sont pas affectés.
            </p>
            {typeof deleteTarget.medias_count === "number" && (
              <p className="text-muted-foreground">
                Médias concernés : <span className="font-medium text-foreground">{deleteTarget.medias_count}</span>
              </p>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}

