"use client";

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { downloadQrPngFromPath } from "@/lib/download-qr-png";
import { dashboardInput } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

type QRCodePhotoWallCardProps = {
  slug: string;
  eventCode?: string;
};

export function QRCodePhotoWallCard({ slug, eventCode }: QRCodePhotoWallCardProps) {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  const src = `${apiBase}/api/evenements/${slug}/qrcode-photowall/`;
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const photoWallPath = `/photowall/${eventCode || slug}`;

  return (
    <div className="bg-card rounded-[var(--radius-card)] border p-6">
      <h2 className="font-bold text-lg font-display">QR code Photo Wall</h2>
      <p className="text-sm text-muted-foreground mt-1">À afficher sur écran : diaporama en temps réel.</p>
      <div className="mt-4 rounded-[var(--radius-card)] border bg-white p-4 inline-flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="QR code Photo Wall" className="w-48 h-48" />
      </div>
      <div className="mt-4">
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Lien Photo Wall</label>
        <div className="mt-2 flex items-center gap-2">
          <input className={cn(dashboardInput, "flex-1 min-w-0 font-mono text-xs h-10 py-0")} value={photoWallPath} readOnly />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 shrink-0 rounded-xl border border-[color-mix(in_srgb,var(--color-secondary)_32%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,transparent)] px-3.5 text-xs font-semibold text-[var(--color-secondary)] shadow-sm transition-all hover:!bg-[color-mix(in_srgb,var(--color-secondary)_18%,transparent)] hover:shadow-md hover:!text-[var(--color-secondary)]"
            onClick={async () => {
              const absolute = `${window.location.origin}${photoWallPath}`;
              await navigator.clipboard.writeText(absolute);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            }}
          >
            <Copy className="size-3.5" aria-hidden />
            {copied ? "Copié" : "Copier le lien"}
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              try {
                await downloadQrPngFromPath(
                  `/api/evenements/${slug}/qrcode-photowall/`,
                  `qr-photowall-${slug}.png`,
                );
              } finally {
                setPending(false);
              }
            }}
          >
            {pending ? "Téléchargement…" : "Télécharger le QR"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-[color-mix(in_srgb,var(--color-primary)_35%,transparent)] text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
            onClick={() => window.open(photoWallPath, "_blank")}
          >
            Ouvrir Photo Wall
            <ExternalLink className="size-3.5" aria-hidden />
          </Button>
        </div>
      </div>
    </div>
  );
}

