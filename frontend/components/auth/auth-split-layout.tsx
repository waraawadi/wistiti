"use client";

import Link from "next/link";
import { Camera } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";

const FLOATING_FRAMES = [
  { top: "8%", left: "8%", rotate: -7, delay: "0s", size: "w-28 h-36" },
  { top: "22%", left: "58%", rotate: 5, delay: "0.8s", size: "w-24 h-32" },
  { top: "52%", left: "12%", rotate: -4, delay: "1.6s", size: "w-32 h-28" },
  { top: "48%", left: "62%", rotate: 6, delay: "0.4s", size: "w-28 h-36" },
  { top: "72%", left: "38%", rotate: -3, delay: "1.2s", size: "w-30 h-30" },
] as const;

type AuthSplitLayoutProps = {
  title: string;
  subtitle: string;
  quote: React.ReactNode;
  quoteAuthor: string;
  /** Formulaire (champs + boutons + liens internes au formulaire) */
  children: React.ReactNode;
};

export function AuthSplitLayout({ title, subtitle, quote, quoteAuthor, children }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      {/* Bandeau mobile */}
      <div className="relative lg:hidden gradient-bg px-5 py-10 text-center overflow-hidden shrink-0">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25) 0%, transparent 45%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.12) 0%, transparent 40%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-25" aria-hidden />
        <div className="relative flex flex-col items-center gap-2">
          <BrandMark linkHref="/" className="justify-center" variant="light" />
          <p className="text-sm text-white/90 font-medium max-w-xs">Albums photo événements — zéro friction</p>
        </div>
      </div>

      {/* Panneau desktop */}
      <aside className="hidden lg:flex lg:w-[min(48%,520px)] xl:w-[44%] gradient-bg relative flex-col justify-between p-10 xl:p-14 overflow-hidden text-white shrink-0">
        <div className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-[0.2]" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full blur-[100px] opacity-50"
          style={{ background: "color-mix(in srgb, var(--color-secondary) 45%, transparent)" }}
        />
        <div
          className="pointer-events-none absolute -left-16 bottom-1/4 h-64 w-64 rounded-full blur-[90px] opacity-45"
          style={{ background: "color-mix(in srgb, var(--color-primary) 40%, transparent)" }}
        />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {FLOATING_FRAMES.map((pos, i) => (
            <div
              key={i}
              className={`absolute ${pos.size} rounded-2xl border border-white/25 bg-white/10 backdrop-blur-md flex items-center justify-center marketing-float-slow shadow-lg`}
              style={{
                top: pos.top,
                left: pos.left,
                transform: `rotate(${pos.rotate}deg)`,
                animationDelay: pos.delay,
              }}
            >
              <Camera className="text-white/50" size={26} strokeWidth={1.5} />
            </div>
          ))}
        </div>

        <div className="relative z-10 space-y-3">
          <BrandMark linkHref="/" variant="light" size="lg" />
          <p className="text-white/85 text-base leading-relaxed max-w-sm">
            Mur photo, QR invités, modération : tout pour que vos événements laissent une trace.
          </p>
        </div>

        <div className="relative z-10 mt-auto pt-12">
          <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-6 shadow-xl max-w-md">
            <blockquote className="text-white/95 text-[1.05rem] leading-relaxed font-medium tracking-tight">
              {quote}
            </blockquote>
            <p className="text-white/65 mt-4 text-sm font-medium">— {quoteAuthor}</p>
          </div>
        </div>
      </aside>

      {/* Formulaire */}
      <main className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 lg:p-12 relative min-h-[60vh] lg:min-h-screen">
        <div className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-[0.14]" aria-hidden />
        <div className="relative w-full max-w-[440px]">
          <div className="marketing-glass-subtle rounded-[1.75rem] sm:rounded-[2rem] p-8 sm:p-10 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.2)] border-border/60">
            <h1 className="text-2xl sm:text-[1.75rem] font-extrabold font-display tracking-tight text-balance">
              {title}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base leading-relaxed">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
          <p className="text-center mt-8">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              ← Retour au site
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

/** Champ formulaire auth — hauteur confort, focus visible */
export function authInputClass() {
  return "w-full h-11 pl-10 pr-3 rounded-xl border border-border/70 bg-background/90 backdrop-blur-sm text-sm transition-all placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/35";
}
