"use client";

import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Media = {
  id: number;
  fichier: string;
  thumbnail?: string | null;
  type: "photo" | "video";
  legende: string;
  approuve: boolean;
  created_at: string;
};

type Album = {
  id: number;
  nom: string;
  slug: string;
};

export default function EvenementMediasPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [tab, setTab] = useState<"medias" | "moderation">("medias");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<Media | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadLegend, setUploadLegend] = useState("");
  const [uploadAlbum, setUploadAlbum] = useState("public");
  const [uploadResult, setUploadResult] = useState<{ uploaded: number; failed: Array<{ name: string; detail: string }> } | null>(
    null,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: medias, refetch: refetchMedias } = useQuery({
    queryKey: ["evenement-medias", slug],
    queryFn: async () => (await api.get<Media[]>(`/api/evenements/${slug}/medias/`)).data,
  });
  const { data: albums } = useQuery({
    queryKey: ["evenement-albums", slug],
    queryFn: async () => (await api.get<Album[]>(`/api/evenements/${slug}/albums/`)).data,
  });

  const pending = (medias ?? []).filter((m) => !m.approuve);
  const list = tab === "moderation" ? pending : medias ?? [];

  async function deleteMedia(id: number) {
    setDeletingId(id);
    try {
      await api.delete(`/api/medias/${id}/`);
      await refetchMedias();
    } finally {
      setDeletingId(null);
    }
  }

  async function approveMedia(id: number, approved: boolean) {
    setApprovingId(id);
    try {
      await api.patch(`/api/medias/${id}/approuver/`, { approved });
      await refetchMedias();
    } finally {
      setApprovingId(null);
    }
  }

  function openPreview(m: Media) {
    setPreview(m);
    setPreviewOpen(true);
  }

  async function uploadBatch() {
    setUploadError(null);
    setUploadResult(null);
    if (uploadFiles.length === 0) {
      setUploadError("Sélectionne au moins un fichier.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      uploadFiles.forEach((f) => fd.append("fichiers", f));
      if (uploadLegend.trim()) fd.append("legende", uploadLegend.trim());

      const { data } = await api.post<{
        uploaded: number;
        failed: Array<{ name: string; detail: string }>;
      }>(`/api/evenements/${slug}/medias/?album=${encodeURIComponent(uploadAlbum || "public")}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadResult({
        uploaded: data.uploaded ?? 0,
        failed: data.failed ?? [],
      });
      setUploadFiles([]);
      setUploadLegend("");
      await refetchMedias();
    } catch (e: any) {
      setUploadError(e?.response?.data?.detail || "Upload impossible.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Médias"
        description={slug}
        actions={
          <>
            <Button variant="outline" className="rounded-xl border-border/70" asChild>
              <Link href={`/dashboard/evenements/${slug}/partage`}>QR & Partage</Link>
            </Button>
            <Button variant="outline" className="rounded-xl border-border/70" asChild>
              <Link href="/dashboard">Retour</Link>
            </Button>
          </>
        }
      />

      <div className="dashboard-panel p-5 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Upload en masse (organisateur)</h2>
            <p className="text-sm text-muted-foreground">
              Envoie plusieurs photos/vidéos d’un coup sur l’album de ton choix.
            </p>
          </div>
          <span className="text-xs rounded-full px-2.5 py-1 bg-muted text-muted-foreground">
            {uploadFiles.length} fichier(s) prêt(s)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="text-xs text-muted-foreground">Album cible</label>
            <select
              className="mt-1 h-10 w-full rounded-[var(--radius-input)] border bg-background px-3 text-sm"
              value={uploadAlbum}
              onChange={(e) => setUploadAlbum(e.target.value)}
            >
              {(albums ?? []).map((a) => (
                <option key={a.id} value={a.slug}>
                  {a.nom}
                </option>
              ))}
              {albums?.length ? null : <option value="public">Public</option>}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-muted-foreground">Légende (optionnelle, appliquée à tous les fichiers)</label>
            <input
              className="mt-1 h-10 w-full rounded-[var(--radius-input)] border bg-background px-3 text-sm"
              value={uploadLegend}
              onChange={(e) => setUploadLegend(e.target.value)}
              placeholder="Ex: Backstage cérémonie"
              maxLength={255}
            />
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <input
            type="file"
            multiple
            accept="image/*,video/*"
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-2"
            onChange={(e) => setUploadFiles(Array.from(e.target.files ?? []))}
          />
          <Button onClick={uploadBatch} disabled={uploading || uploadFiles.length === 0} className="md:whitespace-nowrap">
            {uploading ? "Envoi en cours..." : "Uploader en masse"}
          </Button>
        </div>

        {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
        {uploadResult && (
          <div className="rounded-[var(--radius-card)] border bg-muted/30 p-3 space-y-2">
            <p className="text-sm">
              <span className="font-semibold text-[var(--color-primary)]">{uploadResult.uploaded}</span> fichier(s) envoyé(s)
              {uploadResult.failed.length ? `, ${uploadResult.failed.length} en erreur` : ""}.
            </p>
            {uploadResult.failed.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-1">
                {uploadResult.failed.slice(0, 5).map((f, idx) => (
                  <li key={`${f.name}-${idx}`}>
                    {f.name}: {f.detail}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex p-1 rounded-xl bg-muted/50 border border-border/50">
          <button
            type="button"
            className={cn(
              "h-9 px-4 rounded-lg text-sm font-medium transition-all",
              tab === "medias" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTab("medias")}
          >
            Tous
          </button>
          <button
            type="button"
            className={cn(
              "h-9 px-4 rounded-lg text-sm font-medium transition-all",
              tab === "moderation" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setTab("moderation")}
          >
            En attente {pending.length ? `(${pending.length})` : ""}
          </button>
        </div>
        <span className="text-sm text-muted-foreground font-medium tabular-nums">{(medias ?? []).length} élément(s)</span>
      </div>

      <div className="dashboard-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/40">
                <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4">Aperçu</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4">Légende</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4">Type</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4">Statut</th>
                <th className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id} className="border-b border-border/40 last:border-0 hover:bg-muted/25 transition-colors">
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => openPreview(m)}
                      className="h-12 w-12 rounded-xl bg-muted overflow-hidden block ring-1 ring-border/40 hover:ring-primary/25 transition-all"
                      aria-label="Voir le média"
                    >
                      {m.type === "photo" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.thumbnail || m.fichier} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                          VIDEO
                        </div>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-sm">{m.legende || <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-5 py-3 text-sm">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-muted/80 ring-1 ring-border/30">
                      {m.type}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        m.approuve ? "bg-primary/12 text-primary ring-1 ring-primary/20" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {m.approuve ? "Approuvé" : "En attente"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {tab === "moderation" && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => approveMedia(m.id, true)}
                            disabled={approvingId === m.id}
                          >
                            Approuver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveMedia(m.id, false)}
                            disabled={approvingId === m.id}
                          >
                            Rejeter
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMedia(m.id)}
                        disabled={deletingId === m.id}
                      >
                        <Trash2 size={16} className="mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-sm text-muted-foreground text-center">
                    {tab === "moderation" ? "Aucun média en attente." : "Aucun média pour l’instant."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={previewOpen}
        onOpenChange={(o) => {
          setPreviewOpen(o);
          if (!o) setPreview(null);
        }}
        title={preview?.approuve ? "Média approuvé" : "Prévisualisation (en attente)"}
        size="lg"
        footer={
          <div className="flex flex-wrap gap-3 justify-end">
            {preview && tab === "moderation" && (
              <>
                <Button
                  variant="primary"
                  onClick={async () => {
                    await approveMedia(preview.id, true);
                    setPreviewOpen(false);
                  }}
                  disabled={approvingId === preview.id}
                >
                  Approuver
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await approveMedia(preview.id, false);
                    setPreviewOpen(false);
                  }}
                  disabled={approvingId === preview.id}
                >
                  Rejeter
                </Button>
              </>
            )}
            {preview && (
              <a href={preview.fichier} target="_blank" rel="noreferrer">
                <Button variant="outline">Ouvrir dans un nouvel onglet</Button>
              </a>
            )}
          </div>
        }
      >
        {preview ? (
          <div className="space-y-4">
            <div className="rounded-[var(--radius-card)] border bg-muted/30 overflow-hidden">
              {preview.type === "photo" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.fichier} alt={preview.legende || ""} className="w-full max-h-[70vh] object-contain bg-black" />
              ) : (
                <video src={preview.fichier} controls className="w-full max-h-[70vh] bg-black" />
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-card rounded-[var(--radius-card)] border p-4">
                <p className="text-xs text-muted-foreground">Légende</p>
                <p className="text-sm mt-1">{preview.legende || "—"}</p>
              </div>
              <div className="bg-card rounded-[var(--radius-card)] border p-4">
                <p className="text-xs text-muted-foreground">Infos</p>
                <p className="text-sm mt-1">
                  Type: <span className="font-medium">{preview.type}</span>
                </p>
                <p className="text-sm">
                  Statut:{" "}
                  <span className="font-medium">{preview.approuve ? "Approuvé" : "En attente"}</span>
                </p>
                <p className="text-sm">
                  Date:{" "}
                  <span className="font-medium">{new Date(preview.created_at).toLocaleString("fr-FR")}</span>
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

