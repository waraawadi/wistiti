"use client";

import axios from "axios";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, CheckCircle2, Mail, Upload, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { ApiErrorCodes } from "@/lib/api-error-codes";

export type GuestQuotaFullInfo = {
  detail?: string;
  code?: string;
  organizer?: { nom?: string; email?: string };
  evenement?: { titre?: string; public_code?: string };
  album?: { nom?: string; public_code?: string };
};

type GuestUploadProps = {
  /** Mode slug : /api/evenements/{slug}/medias/?album= */
  slug?: string;
  albumSlug?: string;
  /** Mode codes QR : /api/evenements/by-code/{eventCode}/{albumCode}/medias/ */
  eventCode?: string;
  albumCode?: string;
  /** Si false, zone de dépôt masquée (défaut : true si non renseigné) */
  uploadEnabled?: boolean;
  onUploaded?: () => void;
};

export function GuestUpload({
  slug,
  albumSlug = "public",
  eventCode,
  albumCode,
  uploadEnabled = true,
  onUploaded,
}: GuestUploadProps) {
  const [progress, setProgress] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [quotaDialogOpen, setQuotaDialogOpen] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<GuestQuotaFullInfo | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setError(null);
      setSuccess(null);
      const url =
        eventCode && albumCode
          ? `/api/evenements/by-code/${encodeURIComponent(eventCode)}/${encodeURIComponent(albumCode)}/medias/`
          : `/api/evenements/${slug}/medias/?album=${encodeURIComponent(albumSlug)}`;
      if (!eventCode && !slug) {
        setError("Configuration d’upload invalide.");
        return;
      }
      setLoading(true);
      setProgress(0);

      try {
        for (let i = 0; i < acceptedFiles.length; i++) {
          const f = acceptedFiles[i];
          const form = new FormData();
          form.append("fichier", f);
          if (comment.trim()) {
            form.append("legende", comment.trim());
          }
          await api.post(url, form, {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (evt) => {
              if (!evt.total) return;
              const p = Math.round((evt.loaded / evt.total) * 100);
              setProgress(p);
            },
          });
        }
        setSuccess(
          acceptedFiles.length > 1
            ? `${acceptedFiles.length} fichiers ont bien été uploadés.`
            : "Le fichier a bien été uploadé.",
        );
        setComment("");
        onUploaded?.();
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const status = err.response?.status;
          const data = err.response?.data as GuestQuotaFullInfo & { code?: string };
          if (status === 403 && data?.code === ApiErrorCodes.GUEST_UPLOAD_DISABLED) {
            setError(
              data.detail ??
                "L’organisateur a désactivé les envois sur cet album.",
            );
            return;
          }
          if (status === 402) {
            if (data?.code === "GUEST_QUOTA_FULL") {
              setQuotaInfo(data);
              setQuotaDialogOpen(true);
              setError(
                data.detail ??
                  "L’espace photo de cet événement est complet. Les coordonnées de l’organisateur sont affichées dans la fenêtre d’information.",
              );
              return;
            }
            if (typeof data?.detail === "string") {
              setError(data.detail);
              return;
            }
          }
        }
        setError("Upload impossible (format ou limite).");
      } finally {
        setLoading(false);
        setProgress(0);
      }
    },
    [slug, albumSlug, eventCode, albumCode, onUploaded, comment]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxFiles: 1,
    accept: {
      "image/*": [],
      "video/*": [],
    },
    disabled: loading || uploadEnabled === false,
  });

  if (uploadEnabled === false) {
    return (
      <div
        className="rounded-[var(--radius-card)] border border-border bg-muted/40 px-6 py-10 text-center"
        role="status"
      >
        <p className="text-sm font-medium text-foreground">Envoi de photos désactivé</p>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          L’organisateur a momentanément fermé l’upload sur cet album. Tu peux toujours consulter les photos
          ci‑dessous ; pour envoyer des fichiers, contacte l’hôte de l’événement.
        </p>
      </div>
    );
  }

  const borderClass = isDragActive ? "border-primary" : "border-border";

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Commentaire (optionnel)</label>
        <textarea
          className="mt-2 w-full rounded-[var(--radius-input)] border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[var(--color-primary)]"
          rows={3}
          maxLength={255}
          placeholder="Ajoutez un petit message avec votre photo..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={loading}
        />
      </div>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-[var(--radius-card)] p-10 text-center transition-colors cursor-pointer group bg-card hover:border-primary ${borderClass}`}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 mx-auto rounded-full bg-accent flex items-center justify-center group-hover:scale-110 transition-transform">
          <Upload className="text-primary" size={28} />
        </div>
        <p className="mt-4 font-medium font-display">Glissez vos photos ici</p>
        <p className="text-sm text-muted-foreground mt-1">ou cliquez pour sélectionner un fichier — photo ou vidéo</p>
        <Button className="mt-4" size="sm" type="button" disabled={loading}>
          <Camera size={16} className="mr-1" /> Sélectionner un fichier
        </Button>

        {loading && (
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full gradient-bg rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && (
        <p className="text-sm rounded-xl border px-3 py-2 font-medium flex items-center gap-2 bg-[var(--color-primary-light)] border-[var(--color-primary)] text-[var(--color-primary)]">
          <CheckCircle2 size={16} />
          {success}
        </p>
      )}

      {quotaInfo?.code === "GUEST_QUOTA_FULL" && (
        <p className="text-sm text-muted-foreground">
          <button type="button" className="underline text-primary font-medium" onClick={() => setQuotaDialogOpen(true)}>
            Voir les coordonnées de l’organisateur
          </button>
        </p>
      )}

      <Dialog
        open={quotaDialogOpen}
        onOpenChange={setQuotaDialogOpen}
        title="Quota photos atteint"
        size="md"
        footer={
          <div className="flex flex-wrap gap-2 justify-end w-full">
            {quotaInfo?.organizer?.email ? (
              <Button
                variant="primary"
                size="sm"
                type="button"
                onClick={() => {
                  const sub = encodeURIComponent(`Photos — ${quotaInfo.evenement?.titre ?? "événement"}`);
                  window.location.href = `mailto:${quotaInfo.organizer!.email}?subject=${sub}`;
                }}
              >
                <Mail size={16} className="mr-1" /> Écrire à l’organisateur
              </Button>
            ) : null}
            <Button variant="outline" size="sm" type="button" onClick={() => setQuotaDialogOpen(false)}>
              Fermer
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            Ton hôte doit passer à un forfait supérieur ou acheter des crédits photos pour que de nouveaux envois soient
            acceptés. Un e-mail d’information lui a été envoyé automatiquement.
          </p>
          {quotaInfo?.evenement?.titre && (
            <p>
              <span className="text-muted-foreground">Événement :</span>{" "}
              <span className="font-medium">{quotaInfo.evenement.titre}</span>
              {quotaInfo.evenement.public_code ? (
                <span className="ml-1 font-mono text-xs text-muted-foreground">({quotaInfo.evenement.public_code})</span>
              ) : null}
            </p>
          )}
          <div className="rounded-[var(--radius-card)] border bg-muted/30 p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Organisateur</p>
            {quotaInfo?.organizer?.nom ? (
              <p className="flex items-center gap-2">
                <User size={16} className="shrink-0 text-muted-foreground" />
                <span>{quotaInfo.organizer.nom}</span>
              </p>
            ) : null}
            {quotaInfo?.organizer?.email ? (
              <p className="flex items-center gap-2 break-all">
                <Mail size={16} className="shrink-0 text-muted-foreground" />
                <span className="font-mono text-xs">{quotaInfo.organizer.email}</span>
              </p>
            ) : (
              <p className="text-muted-foreground">Aucune adresse de contact renseignée.</p>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}

