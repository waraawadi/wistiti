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
  public_code?: string;
  /** Image PNG — même ressource que GET /albums/public/qrcode/ */
  qrcode_url: string;
};

function wsUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_WS_URL || "").replace(/\/$/, "");
  if (!base) return path;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

export default function PhotoWallPage({ params }: { params: { slug: string } }) {
  const eventRef = params.slug;
  const [connected, setConnected] = useState(false);
  const [playlist, setPlaylist] = useState<MediaItem[]>([]);
  const [queue, setQueue] = useState<MediaItem[]>([]);
  const [current, setCurrent] = useState<MediaItem | null>(null);
  const [mediaVisible, setMediaVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [evt, setEvt] = useState<Evenement | null>(null);
  const [wsChannelSlug, setWsChannelSlug] = useState<string>(eventRef);

  const wsRef = useRef<WebSocket | null>(null);
  const backoffRef = useRef(1000);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const slideStartRef = useRef<number>(0);

  const slideMs = 5000;
  const playlistIdxRef = useRef<number>(0);
  const cascadePool = useMemo(
    () => playlist.filter((m) => m.type === "photo" && m.id !== current?.id).slice(0, 20),
    [playlist, current?.id]
  );

  function normalizeIncomingMedia(raw: any): MediaItem | null {
    if (!raw) return null;
    const id = Number(raw.id);
    const type = raw.type === "video" ? "video" : "photo";
    const url = String(raw.url || raw.fichier || "");
    if (!id || !url) return null;
    return {
      id,
      type,
      url,
      legende: String(raw.legende || ""),
      created_at: String(raw.created_at || new Date().toISOString()),
    };
  }

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
        const { data } = await api.get<{
          evenement: { titre: string; slug: string; public_code?: string; qrcode_url: string };
          medias: any[];
        }>(
          `/api/evenements/${eventRef}/photowall/medias/`,
        );
        const ev = data.evenement;
        setEvt({
          titre: ev.titre,
          slug: ev.slug,
          public_code: ev.public_code,
          qrcode_url: ev.qrcode_url,
        });
        setWsChannelSlug(ev.slug || eventRef);
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
        setEvt({ titre: eventRef, slug: eventRef, qrcode_url: "" });
        setWsChannelSlug(eventRef);
      }
    })();
  }, [eventRef]);

  const connectWs = useMemo(() => {
    return () => {
      const url = wsUrl(`/ws/photowall/${wsChannelSlug}/`);
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
            const incoming = normalizeIncomingMedia(data.media);
            if (!incoming) return;
            // La nouvelle photo/vidéo doit être visible immédiatement.
            setPlaylist((prev) => [incoming, ...prev.filter((m) => m.id !== incoming.id)]);
            setQueue((q) => [incoming, ...q.filter((m) => m.id !== incoming.id)]);
            setCurrent(incoming);
            setMediaVisible(true);
            slideStartRef.current = performance.now();
            setProgress(0);
          }
        } catch {
          // ignore
        }
      };
    };
  }, [wsChannelSlug]);

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
      setMediaVisible(false);
      window.setTimeout(() => {
        setMediaVisible(true);
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
      }, 700); // transition plus douce et plus naturelle
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
      <style jsx global>{`
        @keyframes photowall-cascade-fall {
          0% {
            transform: translate3d(0, -20vh, 0) scale(0.92) rotate(-3deg);
            opacity: 0;
          }
          10% {
            opacity: 0.85;
          }
          85% {
            opacity: 0.85;
          }
          100% {
            transform: translate3d(0, 115vh, 0) scale(1.02) rotate(3deg);
            opacity: 0;
          }
        }
      `}</style>
      {/* header overlay */}
      <div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4"
        style={{ background: "rgba(0,0,0,0.35)" }}
      >
        <div className="text-lg font-extrabold font-display" style={{ color: "var(--color-primary)" }}>
          <AppName />
        </div>
        <div className="text-sm md:text-base" style={{ color: "rgba(255,255,255,0.9)" }}>
          {evt?.titre ?? eventRef}
        </div>
      </div>

      {/* slide */}
      <div className="absolute inset-0 flex items-center justify-center px-2 md:px-6">
        {/* Cascades autour (en arrière-plan) */}
        {cascadePool.length > 0 && (
          <>
            <div className="pointer-events-none absolute left-8 md:left-12 top-0 bottom-0 z-[12] w-40 md:w-48 overflow-hidden">
              {cascadePool.map((m, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`cascade-left-${m.id}-${i}`}
                  src={m.url}
                  alt=""
                  className="absolute left-1 w-20 md:w-24 rounded-xl border border-white/20 object-cover shadow-xl"
                  style={{
                    top: "-18vh",
                    left: `${(i % 3) * 34}px`,
                    animationName: "photowall-cascade-fall",
                    animationDuration: `${11 + (i % 4)}s`,
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                    animationDelay: `${i * 0.85}s`,
                    zIndex: 5 + (i % 3),
                  }}
                />
              ))}
            </div>
            <div className="pointer-events-none absolute right-8 md:right-12 top-0 bottom-0 z-[12] w-40 md:w-48 overflow-hidden">
              {cascadePool.map((m, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`cascade-right-${m.id}-${i}`}
                  src={m.url}
                  alt=""
                  className="absolute right-1 w-20 md:w-24 rounded-xl border border-white/20 object-cover shadow-xl"
                  style={{
                    top: "-18vh",
                    right: `${(i % 3) * 34}px`,
                    animationName: "photowall-cascade-fall",
                    animationDuration: `${12 + (i % 3)}s`,
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                    animationDelay: `${i * 0.9 + 0.45}s`,
                    zIndex: 5 + (i % 3),
                  }}
                />
              ))}
            </div>
            <div className="pointer-events-none absolute left-24 right-24 top-0 z-[10] h-20 md:h-24 overflow-hidden">
              {cascadePool.slice(0, 10).map((m, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`cascade-top-${m.id}-${i}`}
                  src={m.url}
                  alt=""
                  className="absolute top-0 w-16 md:w-20 rounded-xl border border-white/20 object-cover shadow-lg"
                  style={{
                    left: `${(i * 11) % 90}%`,
                    animationName: "photowall-cascade-fall",
                    animationDuration: `${13 + (i % 4)}s`,
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                    animationDelay: `${i * 0.7}s`,
                  }}
                />
              ))}
            </div>
            <div className="pointer-events-none absolute left-24 right-24 bottom-0 z-[10] h-20 md:h-24 overflow-hidden">
              {cascadePool.slice(5, 15).map((m, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={`cascade-bottom-${m.id}-${i}`}
                  src={m.url}
                  alt=""
                  className="absolute bottom-0 w-16 md:w-20 rounded-xl border border-white/20 object-cover shadow-lg"
                  style={{
                    left: `${(i * 12 + 8) % 90}%`,
                    animationName: "photowall-cascade-fall",
                    animationDuration: `${12 + (i % 3)}s`,
                    animationTimingFunction: "linear",
                    animationIterationCount: "infinite",
                    animationDelay: `${i * 0.8 + 0.35}s`,
                  }}
                />
              ))}
            </div>
          </>
        )}

        {current ? (
          <div className="relative z-30 inline-flex items-center justify-center overflow-hidden rounded-2xl border border-white/20 shadow-[0_30px_120px_-35px_rgba(0,0,0,0.75)] bg-black">
            {current.type === "video" ? (
              <video
                key={current.id}
                src={current.url}
                className={`max-w-[88vw] max-h-[calc(100vh-9rem)] w-auto h-auto object-contain transition-opacity duration-700 ${mediaVisible ? "opacity-100" : "opacity-0"}`}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={current.id}
                src={current.url}
                alt=""
                className={`max-w-[88vw] max-h-[calc(100vh-9rem)] w-auto h-auto object-contain transition-opacity duration-700 ${mediaVisible ? "opacity-100" : "opacity-0"}`}
              />
            )}

            {/* bottom legend overlay */}
            <div className="absolute left-0 right-0 bottom-10 px-6 py-5 flex justify-center">
              {current.legende ? (
                <div className="relative inline-flex max-w-[92%] items-center justify-center animate-in fade-in zoom-in-95 slide-in-from-bottom-3 duration-700">
                  <span className="rounded-2xl border border-white/25 bg-black/45 px-4 py-2 text-sm md:text-base font-medium text-white/95 backdrop-blur-sm shadow-xl transition-transform duration-500 hover:scale-[1.02]">
                    {current.legende}
                  </span>
                  <span className="absolute -top-2 -left-2 h-2.5 w-2.5 rounded-full bg-yellow-300 animate-ping [animation-duration:1200ms]" />
                  <span className="absolute -top-1 -right-3 h-2 w-2 rounded-full bg-orange-400 animate-ping [animation-delay:150ms] [animation-duration:1350ms]" />
                  <span className="absolute -bottom-2 -left-3 h-2.5 w-2.5 rounded-full bg-pink-400 animate-ping [animation-delay:300ms] [animation-duration:1400ms]" />
                  <span className="absolute -bottom-1 -right-2 h-2 w-2 rounded-full bg-cyan-300 animate-ping [animation-delay:450ms] [animation-duration:1500ms]" />
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="relative z-30 text-center w-[min(88vw,1920px)] aspect-video max-h-[calc(100vh-9rem)] rounded-2xl border border-white/20 bg-black/80 flex flex-col items-center justify-center shadow-[0_30px_120px_-35px_rgba(0,0,0,0.75)]">
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
      <div className="absolute bottom-4 left-4 z-30">
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

