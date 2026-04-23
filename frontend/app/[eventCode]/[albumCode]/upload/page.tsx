import { notFound } from "next/navigation";

import { MarketingShell } from "@/components/marketing/marketing-shell";
import { GuestAlbumByCodesClient } from "../guest-album-by-codes-client";

const CODE_RE = /^[A-Za-z]{3}\d{3}$/;

export default function GuestAlbumUploadByCodesPage({ params }: { params: { eventCode: string; albumCode: string } }) {
  const eventCode = params.eventCode.trim().toUpperCase();
  const albumCode = params.albumCode.trim().toUpperCase();
  if (!CODE_RE.test(eventCode) || !CODE_RE.test(albumCode)) {
    notFound();
  }
  return (
    <MarketingShell>
      <GuestAlbumByCodesClient eventCode={eventCode} albumCode={albumCode} mode="upload" />
    </MarketingShell>
  );
}
