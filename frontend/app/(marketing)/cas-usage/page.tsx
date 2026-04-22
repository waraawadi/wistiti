import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { MarketingShimmerTitle } from "@/components/marketing/marketing-shimmer-title";
import { Button } from "@/components/ui/button";
import { MARKETING_USE_CASES } from "@/lib/marketing-use-cases";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Cas d’usage — pour chaque type d’événement",
  description:
    "Mariages, anniversaires, soirées, conférences, entreprise ou agences : découvrez comment centraliser les photos de vos invités avec un QR et un album partagé.",
};

export default function CasUsageIndexPage() {
  return (
    <>
      <section className="marketing-hero-mesh relative border-b border-border/40 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-[0.4]" aria-hidden />
        <div className="container relative mx-auto max-w-6xl px-4 py-16 md:py-24 lg:py-28">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-secondary">Cas d&apos;usage</p>
          <h1 className="mt-5 text-[2.1rem] sm:text-4xl md:text-5xl lg:text-[3.1rem] font-extrabold font-display max-w-4xl leading-[1.08] tracking-tight text-balance">
            Un même outil,{" "}
            <span className="marketing-shimmer-text">des contextes très différents</span>
          </h1>
          <p className="mt-7 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed text-pretty">
            Inspirez-vous des scénarios les plus fréquents : QR, album invités, mur en direct et modération s&apos;adaptent
            à votre public et à votre niveau d&apos;exposition.
          </p>
          <div className="mt-10">
            <Link href="/dashboard/evenements">
              <Button variant="gradient" size="lg" className="rounded-xl h-12 px-7 shadow-glow gap-1">
                Lancer un événement <ArrowRight className="ml-0.5 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-[0.12]" aria-hidden />
        <div className="container mx-auto max-w-6xl px-4">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {MARKETING_USE_CASES.map((c, i) => {
              const Icon = c.icon;
              const tone = i % 3 === 0 ? "primary" : i % 3 === 1 ? "secondary" : "primary";
              return (
                <Link
                  key={c.slug}
                  href={`/cas-usage/${c.slug}`}
                  className={cn(
                    "marketing-card marketing-card-lift group relative overflow-hidden p-7 md:p-8",
                    "hover:border-primary/25 flex flex-col",
                  )}
                >
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-[0.12] blur-3xl transition-opacity duration-500 group-hover:opacity-25"
                    style={{
                      background: tone === "primary" ? "var(--color-primary)" : "var(--color-secondary)",
                    }}
                  />
                  <div
                    className={cn(
                      "relative flex h-12 w-12 items-center justify-center rounded-2xl",
                      "bg-gradient-to-br from-primary/15 to-secondary/10 border border-primary/10",
                    )}
                  >
                    <Icon className="text-primary" size={22} />
                  </div>
                  <h2 className="relative mt-5 text-lg md:text-xl font-bold font-display tracking-tight flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="min-w-0">
                      <MarketingShimmerTitle title={c.title} />
                    </span>
                    <ArrowRight className="size-4 opacity-40 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1 shrink-0" />
                  </h2>
                  <p className="relative mt-3 text-sm text-muted-foreground leading-relaxed flex-1">{c.teaser}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
