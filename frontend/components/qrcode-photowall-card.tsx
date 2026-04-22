"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { downloadQrPngFromPath } from "@/lib/download-qr-png";

type QRCodePhotoWallCardProps = {
  slug: string;
};

export function QRCodePhotoWallCard({ slug }: QRCodePhotoWallCardProps) {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
  const src = `${apiBase}/api/evenements/${slug}/qrcode-photowall/`;
  const [pending, setPending] = useState(false);

  return (
    <div className="bg-card rounded-[var(--radius-card)] border p-6">
      <h2 className="font-bold text-lg font-display">QR code Photo Wall</h2>
      <p className="text-sm text-muted-foreground mt-1">À afficher sur écran : diaporama en temps réel.</p>
      <div className="mt-4 rounded-[var(--radius-card)] border bg-white p-4 inline-flex">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="QR code Photo Wall" className="w-48 h-48" />
      </div>
      <div className="mt-4">
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
          {pending ? "Téléchargement…" : "Télécharger"}
        </Button>
      </div>
    </div>
  );
}

