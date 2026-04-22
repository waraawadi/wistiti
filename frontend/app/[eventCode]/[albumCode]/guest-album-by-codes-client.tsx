"use client";

import Image from "next/image";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MessageSquarePlus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { GuestUpload } from "@/components/guest-upload";
import { api } from "@/lib/api";
import { AppName } from "@/components/app-name";
import { Dialog } from "@/components/ui/dialog";
import { FedaCheckoutEmbed } from "@/components/fedapay/feda-checkout-embed";

type AlbumResponse = {
  evenement: {
    titre: string;
    slug: string;
    public_code?: string;
    date: string;
    description: string;
    qrcode_url: string;
    album?: { public_code?: string; slug?: string; is_public?: boolean; guest_upload_enabled?: boolean };
  };
  galerie_split?: boolean;
  section?: string | null;
  section_counts?: { public: number; private: number };
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
    page_size: number;
  };
  medias: Array<{
    id: number;
    fichier: string;
    thumbnail?: string | null;
    type: "photo" | "video";
    legende: string;
    created_at: string;
  }>;
};

type MediaItem = AlbumResponse["medias"][number];

function nextPageFromLink(next: string | null): number | undefined {
  if (!next) return undefined;
  try {
    const u = new URL(next);
    const p = u.searchParams.get("page");
    return p ? Number(p) : undefined;
  } catch {
    const m = next.match(/[?&]page=(\d+)/);
    return m ? Number(m[1]) : undefined;
  }
}

export function GuestAlbumByCodesClient({ eventCode, albumCode }: { eventCode: string; albumCode: string }) {
  const qc = useQueryClient();
  const sentinelSingleRef = useRef<HTMLDivElement | null>(null);
  const sentinelPubRef = useRef<HTMLDivElement | null>(null);
  const sentinelPrivRef = useRef<HTMLDivElement | null>(null);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => Number(k)),
    [selected],
  );
  const [payOpen, setPayOpen] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [payError, setPayError] = useState<string | null>(null);
  const [paySession, setPaySession] = useState<{
    transactionId: string;
    amount: number;
    count: number;
    price_per_photo_xof: number;
    customer: { email: string; firstname: string; lastname: string };
  } | null>(null);
  const [preview, setPreview] = useState<MediaItem | null>(null);

  const basePath = `/api/evenements/by-code/${eventCode}/${albumCode}/album/`;

  const init = useQuery({
    queryKey: ["album", "codes", eventCode, albumCode, "init"],
    queryFn: async () => (await api.get<AlbumResponse>(`${basePath}?page=1`)).data,
  });

  const split = init.data?.galerie_split === true;

  const singleQ = useInfiniteQuery({
    queryKey: ["album", "codes", eventCode, albumCode, "single"],
    enabled: init.isSuccess && !split,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => (await api.get<AlbumResponse>(`${basePath}?page=${pageParam}`)).data,
    getNextPageParam: (lastPage) => nextPageFromLink(lastPage.pagination?.next ?? null),
  });

  const pubQ = useInfiniteQuery({
    queryKey: ["album", "codes", eventCode, albumCode, "section", "public"],
    enabled: init.isSuccess && split,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      (await api.get<AlbumResponse>(`${basePath}?page=${pageParam}&section=public`)).data,
    getNextPageParam: (lastPage) => nextPageFromLink(lastPage.pagination?.next ?? null),
  });

  const privQ = useInfiniteQuery({
    queryKey: ["album", "codes", eventCode, albumCode, "section", "private"],
    enabled: init.isSuccess && split,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      (await api.get<AlbumResponse>(`${basePath}?page=${pageParam}&section=private`)).data,
    getNextPageParam: (lastPage) => nextPageFromLink(lastPage.pagination?.next ?? null),
  });

  const headerData = init.data ?? singleQ.data?.pages[0] ?? pubQ.data?.pages[0] ?? privQ.data?.pages[0];

  const mediasSingle = useMemo(() => singleQ.data?.pages.flatMap((p) => p.medias) ?? [], [singleQ.data]);
  const mediasPub = useMemo(() => pubQ.data?.pages.flatMap((p) => p.medias) ?? [], [pubQ.data]);
  const mediasPriv = useMemo(() => privQ.data?.pages.flatMap((p) => p.medias) ?? [], [privQ.data]);

  const totalLabel = useMemo(() => {
    if (!headerData) return null;
    if (split && init.data?.section_counts) {
      const { public: pc, private: pv } = init.data.section_counts;
      return `${pc + pv} médias approuvés (${pc} partie publique événement, ${pv} cet album privé)`;
    }
    const n = mediasSingle.length;
    return `${n} médias approuvés`;
  }, [headerData, split, init.data?.section_counts, mediasSingle.length]);

  useEffect(() => {
    const el = sentinelSingleRef.current;
    if (!el || split) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && singleQ.hasNextPage && !singleQ.isFetchingNextPage) {
          void singleQ.fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [singleQ, split]);

  useEffect(() => {
    if (!split) return;
    const el = sentinelPubRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && pubQ.hasNextPage && !pubQ.isFetchingNextPage) {
          void pubQ.fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pubQ, split]);

  useEffect(() => {
    if (!split) return;
    const el = sentinelPrivRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && privQ.hasNextPage && !privQ.isFetchingNextPage) {
          void privQ.fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [privQ, split]);

  const blur = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

  function invalidateAlbum() {
    void qc.invalidateQueries({ queryKey: ["album", "codes", eventCode, albumCode] });
  }

  async function startGuestPayment() {
    setPayError(null);
    if (selectedIds.length === 0) {
      setPayError("Sélectionne au moins une photo.");
      return;
    }
    try {
      const { data } = await api.post<{
        transaction_id: string;
        amount: number;
        count: number;
        price_per_photo_xof: number;
        customer: { email: string; firstname: string; lastname: string };
        checkout_mode: "checkout_js";
      }>("/api/paiements/invite/initier-telechargement/", { media_ids: selectedIds, email: guestEmail.trim() });
      setPaySession({
        transactionId: data.transaction_id,
        amount: data.amount,
        count: data.count,
        price_per_photo_xof: data.price_per_photo_xof,
        customer: data.customer,
      });
      setPayOpen(true);
    } catch (e: any) {
      setPayError(e?.response?.data?.detail || "Impossible d’initier le paiement.");
    }
  }

  async function downloadZipAfterPayment(transactionId: string) {
    try {
      const res = await api.post(`/api/paiements/invite/telecharger-zip/`, { transaction_id: transactionId }, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `photos-${eventCode}-${albumCode}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setPayOpen(false);
      setPaySession(null);
      setSelected({});
    } catch (e: any) {
      setPayError(e?.response?.data?.detail || "Téléchargement impossible (paiement non confirmé).");
    }
  }

  function renderMasonry(medias: typeof mediasSingle) {
    return (
      <div className="mt-4 columns-2 md:columns-3 gap-3 space-y-3">
        {medias.map((m, idx) => {
          const heights = [200, 260, 180, 300, 220, 240];
          const h = heights[idx % heights.length];
          const src = m.fichier;
          const thumb = m.thumbnail || m.fichier;
          const isSelected = Boolean(selected[m.id]);
          return (
            <div
              key={m.id}
              className={`break-inside-avoid rounded-[var(--radius-button)] overflow-hidden bg-muted shadow-sm transition-[box-shadow,ring] ${
                isSelected
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md"
                  : "border border-border"
              }`}
            >
              <div className="relative">
                <button
                  type="button"
                  className="relative w-full text-left group cursor-zoom-in p-0 border-0 bg-muted block touch-manipulation"
                  style={{ height: `${h}px` }}
                  onClick={() => setPreview(m)}
                >
                  {m.type === "photo" ? (
                    <Image
                      src={thumb}
                      alt={m.legende || "photo"}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      placeholder="blur"
                      blurDataURL={blur}
                      unoptimized
                    />
                  ) : (
                    <video
                      className="w-full h-full object-cover pointer-events-none transition-transform duration-300 group-hover:scale-[1.03]"
                      src={src}
                      muted
                      preload="metadata"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="text-white text-xs font-medium px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-sm border border-white/15">
                      Voir en grand
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  className={`absolute top-2 right-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-lg transition-all touch-manipulation ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-white/90 bg-black/45 text-white backdrop-blur-sm hover:bg-black/60 active:scale-95"
                  }`}
                  aria-pressed={isSelected}
                  aria-label={
                    isSelected ? "Retirer de la sélection téléchargement" : "Ajouter au téléchargement payant"
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelected((s) => ({ ...s, [m.id]: !s[m.id] }));
                  }}
                >
                  {isSelected ? <Check size={18} strokeWidth={2.75} /> : null}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-bg py-12 px-4 text-center text-white">
        <p className="text-sm uppercase tracking-wider text-white/70">
          <AppName />
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold mt-2 font-display">{headerData?.evenement.titre ?? "Album"}</h1>
        <p className="text-white/50 text-xs mt-2 font-mono tracking-wide">
          {eventCode} / {albumCode}
        </p>
        {headerData?.evenement.date && (
          <p className="text-white/80 mt-2">{new Date(headerData.evenement.date).toLocaleString("fr-FR")}</p>
        )}
        <p className="text-white/60 text-sm mt-1">
          {init.isLoading ? "Chargement…" : totalLabel ?? "—"}
        </p>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <GuestUpload
          eventCode={eventCode}
          albumCode={albumCode}
          uploadEnabled={headerData?.evenement.album?.guest_upload_enabled !== false}
          onUploaded={() => {
            invalidateAlbum();
          }}
        />

        <div className="flex justify-center mt-4">
          <Button variant="secondary" size="sm" type="button">
            <MessageSquarePlus size={16} className="mr-1" /> Ajouter une légende
          </Button>
        </div>

        <div className="mt-6 bg-card rounded-[var(--radius-card)] border p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Télécharger</p>
            <p className="text-xs text-muted-foreground">
              Coche le cercle sur chaque image pour l’ajouter au panier, ou clique sur la photo pour l’afficher en grand.
              Chaque téléchargement est payant.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="h-10 px-3 rounded-[var(--radius-input)] border bg-background text-sm"
              placeholder="Email (optionnel)"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
            />
            <Button onClick={startGuestPayment} disabled={selectedIds.length === 0}>
              Payer & Télécharger ({selectedIds.length})
            </Button>
          </div>
        </div>
        {payError && <p className="mt-2 text-sm text-destructive">{payError}</p>}

        {init.isError && (
          <p className="mt-6 text-sm text-destructive">Impossible de charger l’album.</p>
        )}

        {!split && init.isSuccess && (
          <>
            {renderMasonry(mediasSingle)}
            <div ref={sentinelSingleRef} className="h-10" />
            {singleQ.isFetchingNextPage && (
              <p className="text-sm text-muted-foreground text-center mt-4">Chargement...</p>
            )}
          </>
        )}

        {split && init.isSuccess && (
          <>
            <section className="mt-10 rounded-[var(--radius-card)] border bg-card/50 p-4">
              <h2 className="text-lg font-semibold">Album public (événement)</h2>
              <p className="text-xs text-muted-foreground mb-1">
                Photos approuvées, tous albums publics — 20 par page ({init.data?.section_counts?.public ?? 0} au total)
              </p>
              {renderMasonry(mediasPub)}
              <div ref={sentinelPubRef} className="h-10" />
              {pubQ.isFetchingNextPage && (
                <p className="text-sm text-muted-foreground text-center mt-4">Chargement (public)...</p>
              )}
            </section>

            <section className="mt-10 rounded-[var(--radius-card)] border bg-card/50 p-4">
              <h2 className="text-lg font-semibold">Cet album privé</h2>
              <p className="text-xs text-muted-foreground mb-1">
                Photos approuvées de cet album uniquement — 20 par page ({init.data?.section_counts?.private ?? 0} au
                total)
              </p>
              {renderMasonry(mediasPriv)}
              <div ref={sentinelPrivRef} className="h-10" />
              {privQ.isFetchingNextPage && (
                <p className="text-sm text-muted-foreground text-center mt-4">Chargement (privé)...</p>
              )}
            </section>
          </>
        )}
      </div>

      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) setPreview(null);
        }}
        title={preview?.legende?.trim() || (preview?.type === "photo" ? "Photo" : "Vidéo")}
        size="xl"
        presentation="media"
      >
        {preview &&
          (preview.type === "photo" ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- URL absolue / média dynamique */}
              <img
                src={preview.fichier}
                alt={preview.legende || "Aperçu"}
                className="max-h-[min(85dvh,calc(100dvh-7rem))] max-w-full w-auto h-auto object-contain rounded-xl shadow-2xl ring-1 ring-white/10"
              />
            </>
          ) : (
            <video
              src={preview.fichier}
              controls
              className="max-h-[min(85dvh,calc(100dvh-7rem))] max-w-full rounded-xl shadow-2xl ring-1 ring-white/10"
              playsInline
            />
          ))}
      </Dialog>

      <Dialog
        open={payOpen}
        onOpenChange={(v) => {
          setPayOpen(v);
          if (!v) setPaySession(null);
        }}
        title="Paiement — téléchargement"
        size="xl"
      >
        {!paySession ? (
          <p className="text-sm text-muted-foreground">Préparation…</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {paySession.count} photo(s) — {paySession.price_per_photo_xof} XOF / photo — total{" "}
              <span className="font-medium text-foreground">{paySession.amount} XOF</span>
            </p>
            {payError && <p className="text-sm text-destructive">{payError}</p>}
            <FedaCheckoutEmbed
              key={paySession.transactionId}
              transactionId={paySession.transactionId}
              customer={paySession.customer}
              planNom={`Téléchargement (${paySession.count})`}
              amount={paySession.amount}
              onCheckoutCompleted={(txId) => {
                void downloadZipAfterPayment(txId);
              }}
              onCheckoutDismissed={() => {}}
              onError={(m) => setPayError(m)}
            />
          </div>
        )}
      </Dialog>
    </div>
  );
}
