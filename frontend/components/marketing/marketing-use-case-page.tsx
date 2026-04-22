import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

import { AppName } from "@/components/app-name";
import { MarketingShimmerTitle } from "@/components/marketing/marketing-shimmer-title";
import { Button } from "@/components/ui/button";
import type { MarketingUseCase } from "@/lib/marketing-use-cases";
import { cn } from "@/lib/utils";

export function MarketingUseCasePage({ content }: { content: MarketingUseCase }) {
  const Icon = content.icon;

  return (
    <>
      <section className="marketing-hero-mesh relative border-b border-border/40 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-[0.4]" aria-hidden />
        <div className="container relative mx-auto max-w-6xl px-4 py-16 md:py-24 lg:py-28">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Cas d&apos;usage</p>
          <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,480px)] lg:items-start">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-6">
                <div
                  className={cn(
                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
                    "bg-gradient-to-br from-primary/15 to-secondary/10 border border-primary/10",
                  )}
                >
                  <Icon className="text-primary" size={28} aria-hidden />
                </div>
                <div className="min-w-0">
                  <h1 className="text-[2.1rem] sm:text-4xl md:text-5xl lg:text-[3.1rem] font-extrabold font-display max-w-4xl leading-[1.08] tracking-tight text-balance">
                    <MarketingShimmerTitle title={content.title} />
                  </h1>
                  <p className="mt-5 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed text-pretty font-medium">
                    {content.heroLead}
                  </p>
                  <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed text-pretty">
                    {content.intro}
                  </p>
                </div>
              </div>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link href="/dashboard/evenements">
                  <Button variant="gradient" size="lg" className="rounded-xl h-12 px-7 shadow-glow gap-1">
                    Créer un événement <ChevronRight className="ml-0.5 size-4" />
                  </Button>
                </Link>
                <Link href="/cas-usage">
                  <Button variant="outline" size="lg" className="rounded-xl h-12 px-7 bg-background/60 backdrop-blur-sm border-border/80">
                    Tous les cas d&apos;usage
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:pt-2">
              <div className="marketing-glass-subtle rounded-3xl border border-border/70 p-3 shadow-[0_20px_60px_-34px_rgba(0,0,0,0.35)]">
                {content.heroMedia?.type === "video" ? (
                  <video
                    className="w-full rounded-2xl border border-border/60 bg-black/5"
                    controls
                    playsInline
                    poster={content.heroMedia.poster}
                  >
                    <source src={content.heroMedia.src} />
                    Votre navigateur ne supporte pas la vidéo.
                  </video>
                ) : content.heroMedia?.type === "image" ? (
                  <Image
                    src={content.heroMedia.src}
                    alt={content.heroMedia.alt ?? `Visuel du cas d'usage ${content.title}`}
                    width={960}
                    height={540}
                    className="h-auto w-full rounded-2xl border border-border/60 object-cover"
                    priority
                  />
                ) : (
                  <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-background/80 px-6 text-center text-sm text-muted-foreground">
                    Ajoutez une image ou une vidéo pour ce cas d&apos;usage.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-[0.12]" aria-hidden />
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="marketing-glass-subtle rounded-3xl p-7 md:p-9 border-border/60">
              <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight">Pourquoi <AppName className="font-bold" /> ici ?</h2>
              <ul className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
                {content.highlights.map((line) => (
                  <li key={line} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="marketing-card marketing-card-lift rounded-3xl p-7 md:p-9 border-border/60">
              <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight">Côté invités & participants</h2>
              <p className="mt-6 text-muted-foreground leading-relaxed md:text-[1.05rem] text-pretty">{content.guestAngle}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/comment-ca-marche">
                  <Button variant="outline" className="rounded-xl border-border/80">
                    Comment ça marche
                  </Button>
                </Link>
                <Link href="/fonctionnalites">
                  <Button variant="ghost" className="rounded-xl text-primary">
                    Fonctionnalités
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/40 bg-gradient-to-b from-muted/30 to-muted/50 py-16 md:py-22 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-[0.15]" aria-hidden />
        <div className="container relative mx-auto max-w-6xl px-4 text-center">
          <div className="marketing-glass-subtle mx-auto max-w-2xl rounded-3xl p-10 md:p-12">
            <h2 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight">
              Prêt pour votre prochain événement&nbsp;?
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed md:text-lg text-pretty">
              Choisissez la formule qui correspond à votre volume de photos et au nombre d&apos;albums dont vous avez besoin.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link href="/register">
                <Button variant="gradient" className="rounded-xl h-12 px-8 shadow-glow">
                  Créer un compte
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" className="rounded-xl h-12 px-8 border-border/80 bg-background/70">
                  Voir les tarifs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
