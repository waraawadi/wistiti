"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Expand, Wifi, WifiOff } from "lucide-react";

import { AppName } from "@/components/app-name";
import { initTheme } from "@/lib/theme";
import { api } from "@/lib/api";

type MediaItem = {
  id: number;
  url: string;
  type: "photo" | "video";
  legende: string;
  created_at: string;
};

type Evenement = {
  titre: string;
  slug: string;
  /** Image PNG — même ressource que GET /albums/public/qrcode/ */
  qrcode_url: string;
};

function wsUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_WS_URL || "").replace(/\/$/, "");
  if (!base) return path;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function PhotoWallPage({ params }: { params: { slug: string } }) {
  const slug = params.slug;
  const [connected, setConnected] = useState(false);
  const [playlist, setPlaylist] = useState<MediaItem[]>([]);
  const [queue, setQueue] = useState<MediaItem[]>([]);
  const [current, setCurrent] = useState<MediaItem | null>(null);
  const [fade, setFade] = useState(true);
  const [progress, setProgress] = useState(0);
  const [evt, setEvt] = useState<Evenement | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const slideStartRef = useRef<number>(0);

  const slideMs = 5000;
  const playlistIdxRef = useRef<number>(0);

  useEffect(() => {
    (async () => {
      try {
        await initTheme();
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<{ evenement: { titre: string; slug: string; qrcode_url: string }; medias: any[] }>(
          `/api/evenements/${slug}/photowall/medias/`,
        );
        const ev = data.evenement;
        setEvt({
          titre: ev.titre,
          slug: ev.slug,
          qrcode_url: ev.qrcode_url,
        });
        const initial: MediaItem[] = (data.medias ?? []).map((m) => ({
          id: m.id,
          url: m.fichier,
          type: m.type,
          legende: m.legende ?? "",
          created_at: m.created_at,
        }));
        // Médias existants -> playlist en boucle
        setPlaylist(initial);
        setQueue([]);
        playlistIdxRef.current = 0;
      } catch {
        setEvt({ titre: slug, slug, qrcode_url: "" });
      }
    })();
  }, [slug]);

  const connectWs = useMemo(() => {
    return () => {
      const url = wsUrl(`/ws/photowall/${slug}/`);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        backoffRef.current = 1000;
      };
      ws.onclose = () => {
        setConnected(false);
        const delay = backoffRef.current;
        backoffRef.current = Math.min(30000, backoffRef.current * 2);
        window.setTimeout(() => connectWs(), delay);
      };
      ws.onerror = () => {
        // onclose gère la reconnexion
      };
      ws.onmessage = (msg) => {
        try {
          const data = JSON.parse(msg.data);
          if (data?.type === "new_media" && data.media) {
            setQueue((q) => [...q, data.media as MediaItem]);
          }
        } catch {
          // ignore
        }
      };
    };
  }, [slug]);

  useEffect(() => {
    connectWs();
    return () => {
      wsRef.current?.close();
    };
  }, [connectWs]);

  // slideshow loop
  useEffect(() => {
    if (current) return;

    // Priorité aux nouveaux médias arrivés
    if (queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
      slideStartRef.current = performance.now();
      setProgress(0);
      return;
    }

    // Sinon boucle sur playlist existante
    if (playlist.length > 0) {
      const idx = playlistIdxRef.current % playlist.length;
      playlistIdxRef.current = idx + 1;
      setCurrent(playlist[idx]);
      slideStartRef.current = performance.now();
      setProgress(0);
    }
  }, [queue, current, playlist]);

  useEffect(() => {
    if (!current) return;

    // progress via RAF
    const tick = () => {
      const now = performance.now();
      const elapsed = now - slideStartRef.current;
      setProgress(Math.min(1, elapsed / slideMs));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    timerRef.current = window.setTimeout(() => {
      setFade(false);
      window.setTimeout(() => {
        setFade(true);
        let next: MediaItem | null = null;
        if (queue.length > 0) {
          next = queue[0];
          setQueue((q) => q.slice(1));
        } else if (playlist.length > 0) {
          const idx = playlistIdxRef.current % playlist.length;
          playlistIdxRef.current = idx + 1;
          next = playlist[idx];
        }
        setCurrent(next);
        slideStartRef.current = performance.now();
        setProgress(0);
      }, 2000); // fade 2s
    }, slideMs);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [current, queue, playlist]);

  async function goFullscreen() {
    const el = document.documentElement;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await el.requestFullscreen();
    }
  }

  return (
    <div className="fixed inset-0" style={{ background: "#000000" }}>
      {/* header overlay */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ background: "rgba(0,0,0,0.35)" }}
      >
        <div className="text-lg font-extrabold font-display" style={{ color: "var(--color-primary)" }}>
          <AppName />
        </div>
        <div className="text-sm md:text-base" style={{ color: "rgba(255,255,255,0.9)" }}>
          {evt?.titre ?? slug}
        </div>
      </div>

      {/* slide */}
      <div className="absolute inset-0 flex items-center justify-center">
        {current ? (
          <div className="absolute inset-0">
            {current.type === "video" ? (
              <video
                key={current.id}
                src={current.url}
                className="h-full w-full object-contain"
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={current.id} src={current.url} alt="" className="h-full w-full object-contain" />
            )}
            <div
              className="absolute inset-0 transition-opacity duration-[2000ms]"
              style={{ opacity: fade ? 1 : 0 }}
            />

            {/* bottom legend overlay */}
            <div
              className="absolute left-0 right-0 bottom-0 px-6 py-5"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0))" }}
            >
              <p className="text-sm md:text-base" style={{ color: "rgba(255,255,255,0.95)" }}>
                {current.legende || ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-4xl font-extrabold font-display" style={{ color: "var(--color-primary)" }}>
              <AppName />
            </div>
            <p
              className="mt-3 text-lg"
              style={{
                color: "var(--color-secondary)",
                animation: "pulse 1.8s ease-in-out infinite",
              }}
            >
              En attente de photos...
            </p>
          </div>
        )}
      </div>

      {/* QR upload (bottom-left) */}
      <div className="absolute bottom-4 left-4 z-20">
        <div
          className="rounded-[var(--radius-card)] border overflow-hidden shadow-glow"
          style={{
            width: 220,
            background: "rgba(0,0,0,0.45)",
            borderColor: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.95)" }}>
              Ajoutez vos photos
            </p>
            <span
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.85)" }}
            >
              QR
            </span>
          </div>
          <div className="px-4 pb-4">
            {evt?.qrcode_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={evt.qrcode_url}
                alt="QR code album public"
                className="w-full rounded-[var(--radius-button)] bg-white p-2"
              />
            ) : (
              <div className="aspect-square rounded-[var(--radius-button)] bg-white/10 text-xs flex items-center justify-center p-2 text-white/70">
                Chargement du QR…
              </div>
            )}
            <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.75)" }}>
              Scannez pour envoyer vos photos (album public).
            </p>
          </div>
        </div>
      </div>

      {/* progress bar */}
      <div className="absolute left-0 right-0 bottom-0 h-[3px]" style={{ background: "rgba(255,255,255,0.12)" }}>
        <div className="h-full" style={{ width: `${progress * 100}%`, background: "var(--color-primary)" }} />
      </div>

      {/* bottom-right controls */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3">
        <button
          onClick={goFullscreen}
          className="h-10 w-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.45)", color: "rgba(255,255,255,0.95)" }}
          aria-label="Plein écran"
        >
          <Expand size={18} />
        </button>

        <div
          className="h-3 w-3 rounded-full"
          title={connected ? "WebSocket connecté" : "WebSocket déconnecté"}
          style={{ background: connected ? "#22c55e" : "#ef4444" }}
        />
      </div>
    </div>
  );
}

