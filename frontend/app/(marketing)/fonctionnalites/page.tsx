"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MARKETING_FEATURES } from "@/lib/marketing-content";
import { cn } from "@/lib/utils";

export default function FonctionnalitesPage() {
  return (
    <>
      <section className="marketing-hero-mesh relative border-b border-border/40 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-[0.4]" aria-hidden />
        <div className="container relative mx-auto max-w-6xl px-4 py-16 md:py-24 lg:py-28">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Argumentaire</p>
          <h1 className="mt-5 text-[2.1rem] sm:text-4xl md:text-5xl lg:text-[3.1rem] font-extrabold font-display max-w-4xl leading-[1.08] tracking-tight text-balance">
            Le pack complet pour faire dire{" "}
            <span className="marketing-shimmer-text">« j’aurais dû y penser »</span>
          </h1>
          <p className="mt-7 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed text-pretty">
            Chaque brique ci‑dessous répond à une peur d’organisateur : la dispersion des fichiers, la charge mentale, le
            flop du partage. Transformez-les en promesses clients.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/dashboard/evenements">
              <Button variant="gradient" size="lg" className="rounded-xl h-12 px-7 shadow-glow gap-1">
                Tester sur un vrai événement <ChevronRight className="ml-0.5 size-4" />
              </Button>
            </Link>
            <Link href="/comment-ca-marche">
              <Button variant="outline" size="lg" className="rounded-xl h-12 px-7 bg-background/60 backdrop-blur-sm border-border/80">
                Le parcours en 3 étapes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="relative py-16 md:py-24 overflow-hidden">
        <div
          className="pointer-events-none absolute left-1/2 top-20 h-64 w-[min(90vw,48rem)] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--color-secondary)" }}
        />
        <div className="container relative mx-auto max-w-6xl px-4">
          <div className="grid gap-5 md:grid-cols-2 md:gap-6">
            {MARKETING_FEATURES.map((f, i) => {
              const Icon = f.icon;
              const tone = i % 3 === 0 ? "primary" : i % 3 === 1 ? "secondary" : "primary";
              return (
                <article
                  key={f.title}
                  className={cn(
                    "marketing-card marketing-card-lift group relative overflow-hidden p-7 md:p-8 lg:p-9",
                    i === 0 && "md:col-span-2 lg:min-h-[17rem] lg:flex lg:flex-col lg:justify-center",
                  )}
                >
                  <div
                    className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-[0.15] blur-3xl transition-opacity duration-500 group-hover:opacity-30"
                    style={{
                      background: tone === "primary" ? "var(--color-primary)" : "var(--color-secondary)",
                    }}
                  />
                  {f.tag && (
                    <span
                      className="relative inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em]"
                      style={{
                        background: "color-mix(in srgb, var(--color-secondary) 16%, transparent)",
                        color: "var(--color-secondary)",
                      }}
                    >
                      {f.tag}
                    </span>
                  )}
                  <div
                    className={cn(
                      "relative mt-5 flex h-14 w-14 items-center justify-center rounded-2xl",
                      "bg-gradient-to-br from-primary/15 to-secondary/10 border border-primary/10",
                    )}
                  >
                    <Icon className="text-primary" size={26} />
                  </div>
                  <h2 className="relative mt-5 text-xl md:text-2xl font-bold font-display tracking-tight">{f.title}</h2>
                  <p className="relative mt-3 text-sm md:text-base text-muted-foreground leading-relaxed max-w-prose">
                    {f.desc}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-border/40 bg-gradient-to-b from-muted/30 to-muted/50 py-16 md:py-22 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-[0.15]" aria-hidden />
        <div className="container relative mx-auto max-w-6xl px-4 text-center">
          <div className="marketing-glass-subtle mx-auto max-w-2xl rounded-3xl p-10 md:p-12">
            <h2 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight">Besoin de chiffrer vite ?</h2>
            <p className="mt-4 text-muted-foreground leading-relaxed md:text-lg text-pretty">
              Les quotas photos, albums et options sont posés dans chaque formule. Comparez en un coup d’œil, choisissez
              ce qui colle à votre prochain contrat.
            </p>
            <Link href="/pricing" className="mt-8 inline-block">
              <Button variant="gradient" className="rounded-xl h-12 px-8 shadow-glow">
                Voir les tarifs en ligne
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
