"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MARKETING_STEPS } from "@/lib/marketing-content";

export default function CommentCaMarchePage() {
  return (
    <>
      <section className="marketing-hero-mesh relative border-b border-border/40 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-[0.4]" aria-hidden />
        <div className="container relative mx-auto max-w-6xl px-4 py-16 md:py-24 lg:py-28">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-secondary">Simplicité</p>
          <h1 className="mt-5 text-[2.1rem] sm:text-4xl md:text-5xl lg:text-[3.1rem] font-extrabold font-display max-w-4xl leading-[1.08] tracking-tight text-balance">
            Du brief à l’album plein :{" "}
            <span className="gradient-text">sans friction, zéro file d’attente technique</span>
          </h1>
          <p className="mt-7 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed text-pretty">
            Vous pilotez, vos invités cliquent. Pas de hotline « comment j’envoie ma photo ? » : le parcours est pensé
            pour celui qui n’a pas envie de lire une notice.
          </p>
        </div>
      </section>

      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-[0.12]" aria-hidden />
        <div className="container mx-auto max-w-6xl px-4">
          <div className="relative max-w-4xl mx-auto">
            <div
              className="hidden md:block absolute left-[1.875rem] top-24 bottom-24 w-[3px] rounded-full opacity-40"
              style={{
                background: `linear-gradient(180deg, var(--color-primary), var(--color-secondary), color-mix(in srgb, var(--color-secondary) 40%, transparent))`,
                boxShadow: "0 0 20px color-mix(in srgb, var(--color-primary) 35%, transparent)",
              }}
            />

            <ol className="space-y-10 md:space-y-14">
              {MARKETING_STEPS.map((step, idx) => (
                <li key={step.num} className="relative flex flex-col md:flex-row gap-6 md:gap-12 md:items-stretch">
                  <div className="flex md:flex-col items-center gap-4 md:w-[4.5rem] shrink-0 md:items-start">
                    <div
                      className="relative flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-2xl text-xl font-extrabold text-white font-display shrink-0 shadow-lg ring-4 ring-background"
                      style={{
                        background:
                          idx === 0
                            ? "var(--color-primary)"
                            : idx === 1
                              ? "var(--gradient-main)"
                              : "var(--color-secondary)",
                        boxShadow: `0 12px 28px -8px color-mix(in srgb, var(--color-primary) 45%, transparent)`,
                      }}
                    >
                      {step.num}
                    </div>
                    {idx < MARKETING_STEPS.length - 1 && (
                      <div
                        className="md:hidden flex-1 h-1 rounded-full min-w-[2rem]"
                        style={{
                          background: "linear-gradient(90deg, var(--color-primary), var(--color-secondary))",
                          opacity: 0.45,
                        }}
                      />
                    )}
                  </div>
                  <div className="marketing-glass-subtle flex-1 rounded-3xl p-6 md:p-9 lg:p-10 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.15)] transition-transform duration-300 hover:-translate-y-1 border-border/60">
                    <h2 className="text-xl md:text-2xl font-bold font-display tracking-tight">{step.title}</h2>
                    <p className="mt-4 text-muted-foreground leading-relaxed md:text-[1.05rem] text-pretty">
                      {step.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-16 md:mt-20 flex flex-col sm:flex-row flex-wrap gap-4 justify-center">
            <Link href="/fonctionnalites">
              <Button variant="outline" size="lg" className="rounded-xl h-12 px-8 border-border/80 bg-background/70 backdrop-blur-sm">
                Les arguments produit
              </Button>
            </Link>
            <Link href="/dashboard/evenements">
              <Button variant="gradient" size="lg" className="rounded-xl h-12 px-8 shadow-glow gap-1">
                Je passe à l’action <ChevronRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
