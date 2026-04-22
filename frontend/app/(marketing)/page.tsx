"use client";

import Link from "next/link";
import { ArrowRight, Camera, ChevronRight, Sparkles } from "lucide-react";

import { AppName } from "@/components/app-name";
import { Button } from "@/components/ui/button";
import { MarketingShimmerTitle } from "@/components/marketing/marketing-shimmer-title";
import { MARKETING_FEATURES } from "@/lib/marketing-content";
import { MARKETING_USE_CASES } from "@/lib/marketing-use-cases";
import { cn } from "@/lib/utils";

const PILLARS = [
  {
    href: "/fonctionnalites",
    title: "Pourquoi ça marche",
    desc: "Mur live, QR, modération : les arguments qui font dire « oui » à vos clients et à vos invités.",
    accent: "from-primary/[0.14] to-transparent",
  },
  {
    href: "/comment-ca-marche",
    title: "3 étapes, c’est tout",
    desc: "Pas de formation, pas de tutoriel de 40 pages. L’organisateur lance, les invités envoient.",
    accent: "from-secondary/[0.14] to-transparent",
  },
  {
    href: "/pricing",
    title: "Tarifs sans surprise",
    desc: "Des formules alignées sur ce que vous créez vraiment : du volume photo et de la tranquillité.",
    accent: "from-primary/[0.1] via-secondary/[0.08] to-transparent",
  },
] as const;

export default function MarketingHomePage() {
  const previewFeatures = MARKETING_FEATURES.slice(0, 3);

  return (
    <>
      <section className="marketing-hero-mesh relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-[0.45]"
          aria-hidden
        />
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -right-20 top-24 h-[22rem] w-[22rem] rounded-full blur-[100px]"
            style={{ background: "color-mix(in srgb, var(--color-secondary) 32%, transparent)" }}
          />
          <div
            className="absolute -left-24 bottom-10 h-[18rem] w-[18rem] rounded-full blur-[90px]"
            style={{ background: "color-mix(in srgb, var(--color-primary) 28%, transparent)" }}
          />
        </div>

        <div className="container relative mx-auto max-w-6xl px-4 py-16 md:py-24 lg:py-28">
          <div className="max-w-3xl mx-auto text-center md:text-left md:mx-0 md:max-w-none md:grid md:grid-cols-2 md:gap-12 lg:gap-16 md:items-center">
            <div className="md:pr-4">
              <p
                className="marketing-glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide mb-7"
                style={{ color: "var(--color-primary)" }}
              >
                <Sparkles size={15} className="shrink-0" /> Avec <AppName className="font-bold" />
              </p>
              <h1 className="text-[2.35rem] sm:text-5xl md:text-5xl lg:text-[3.35rem] font-extrabold leading-[1.05] font-display tracking-[-0.03em] text-balance">
                Arrêtez de courir après les photos de votre{" "}
                <span className="marketing-shimmer-text">plus belle soirée</span>
              </h1>
              <p className="mt-7 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed text-pretty">
                Un QR code, un mur qui s’anime, un album qui se remplit tout seul. Concentrez-vous sur l’instant ; vos
                invités s’occupent du reste — depuis leur téléphone, sans appli.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row flex-wrap gap-3 justify-center md:justify-start">
                <Link href="/dashboard/evenements">
                  <Button variant="gradient" size="lg" className="w-full sm:w-auto gap-1 rounded-xl h-12 px-8 shadow-glow">
                    Lancer mon premier événement <ChevronRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/fonctionnalites">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl h-12 px-8 border-border/80 bg-background/50 backdrop-blur-sm">
                    Voir ce qui nous différencie
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-16 md:mt-0 flex justify-center md:justify-end perspective-[1000px]">
              <div className="relative w-full max-w-[20rem] marketing-float-slow">
                <div
                  className="absolute -inset-[2px] rounded-[2.25rem] opacity-90 blur-md"
                  style={{ background: "var(--gradient-main)" }}
                />
                <div className="relative rounded-[2.2rem] p-[1px] bg-gradient-to-br from-white/80 via-white/20 to-transparent shadow-2xl shadow-black/10">
                  <div className="rounded-[2.15rem] marketing-glass-subtle p-1">
                    <div className="rounded-[1.85rem] bg-gradient-to-br from-background via-background to-muted/30 p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
                            En direct
                          </p>
                          <p className="font-bold text-sm font-display mt-0.5">Vin d’honneur — album invités</p>
                        </div>
                        <div
                          className="rounded-xl px-2.5 py-1 text-[10px] font-bold text-white shadow-md"
                          style={{ background: "var(--color-secondary)" }}
                        >
                          +24 nouvelles
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2.5 mt-5">
                        {previewFeatures.map((f) => {
                          const Icon = f.icon;
                          return (
                            <div
                              key={f.title}
                              className="aspect-square rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center p-2 text-center shadow-sm"
                            >
                              <Icon className="text-primary mb-1" size={20} />
                              <span className="text-[9px] font-semibold leading-tight text-muted-foreground line-clamp-2 text-center">
                                {f.tag ?? f.title}
                              </span>
                            </div>
                          );
                        })}
                        {[1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className="aspect-square rounded-2xl bg-muted/70 flex items-center justify-center border border-border/30"
                          >
                            <Camera className="text-muted-foreground" size={18} />
                          </div>
                        ))}
                      </div>
                      <p className="mt-5 text-center text-[11px] text-muted-foreground leading-snug">
                        Comme vos invités le vivent sur mobile — fluide, rapide, sans compte.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto max-w-6xl px-4 pb-10 flex justify-center">
          <div className="marketing-gradient-bar" />
        </div>
      </section>

      <section className="relative py-20 md:py-28 border-t border-border/40 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-[0.2]" aria-hidden />
        <div
          className="pointer-events-none absolute top-0 right-0 w-[min(100%,42rem)] h-64 opacity-30"
          style={{
            background: "radial-gradient(ellipse at 100% 0%, color-mix(in srgb, var(--color-primary) 20%, transparent), transparent 70%)",
          }}
        />
        <div className="container relative mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl lg:text-[2.65rem] font-extrabold font-display tracking-tight text-balance leading-tight">
              Tout ce qu’il faut pour vendre — et livrer — une{" "}
              <span className="gradient-text">expérience photo mémorable</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed text-pretty md:text-lg">
              Parce qu’un mariage sans clichés des invités, c’est une page blanche dans l’histoire. On vous donne les
              bons arguments et le bon outil, du premier pitch au dernier téléchargement.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3 lg:gap-6">
            {PILLARS.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className={cn(
                  "marketing-card marketing-card-lift group relative overflow-hidden p-7 lg:p-8",
                  "hover:border-primary/25",
                )}
              >
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                    p.accent,
                  )}
                />
                <div className="relative">
                  <h3 className="text-lg lg:text-xl font-bold font-display flex items-center gap-2 tracking-tight">
                    {p.title}
                    <ArrowRight className="size-4 opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" />
                  </h3>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-20 md:py-28 border-t border-border/40 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-[0.18]" aria-hidden />
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-[min(100%,36rem)] h-48 opacity-25"
          style={{
            background:
              "radial-gradient(ellipse at 0% 100%, color-mix(in srgb, var(--color-secondary) 22%, transparent), transparent 70%)",
          }}
        />
        <div className="container relative mx-auto max-w-6xl px-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl lg:text-[2.65rem] font-extrabold font-display tracking-tight text-balance leading-tight">
              La collecte photo, pensée pour{" "}
              <span className="gradient-text">chaque occasion</span>
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed text-pretty md:text-lg">
              Du mariage intimiste au salon professionnel : un QR, un album, un mur en direct — la mécanique reste la
              même, seul le contexte change.
            </p>
            <Link href="/cas-usage" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
              Voir tous les cas d&apos;usage <ChevronRight className="size-4" />
            </Link>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MARKETING_USE_CASES.map((c) => {
              const Icon = c.icon;
              return (
                <Link
                  key={c.slug}
                  href={`/cas-usage/${c.slug}`}
                  className={cn(
                    "marketing-card marketing-card-lift group relative overflow-hidden p-6 lg:p-7",
                    "hover:border-primary/25 flex flex-col",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl",
                      "bg-gradient-to-br from-primary/15 to-secondary/10 border border-primary/10",
                    )}
                  >
                    <Icon className="text-primary" size={20} />
                  </div>
                  <h3 className="mt-4 text-base lg:text-lg font-bold font-display tracking-tight flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="min-w-0">
                      <MarketingShimmerTitle title={c.title} />
                    </span>
                    <ChevronRight className="size-4 opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5 shrink-0" />
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{c.teaser}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="relative py-20 md:py-24 text-center px-4 overflow-hidden"
        style={{
          background:
            "linear-gradient(145deg, color-mix(in srgb, var(--color-primary) 82%, #000) 0%, color-mix(in srgb, var(--color-secondary) 78%, #1a0a2e) 100%)",
          color: "var(--color-white)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 55%), radial-gradient(circle at 80% 80%, white 0%, transparent 45%)",
          }}
        />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-[0.25em] opacity-90">
            Prochain événement dans les starting-blocks ?
          </p>
          <h2 className="mt-5 text-2xl md:text-3xl lg:text-4xl font-extrabold font-display leading-snug text-balance tracking-tight">
            Ouvrez l’album aujourd’hui : demain, le QR fait le boulot à votre place.
          </h2>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="rounded-xl h-12 px-8 font-semibold shadow-xl border-0"
                style={{ background: "var(--color-white)", color: "var(--color-primary)" }}
              >
                Je crée mon compte
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl h-12 px-8 bg-white/10 border-white/35 text-white hover:bg-white/15 hover:text-white backdrop-blur-sm"
              >
                Comparer les formules
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
