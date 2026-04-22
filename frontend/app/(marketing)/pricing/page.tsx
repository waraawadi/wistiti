"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  formatPlanFeaturesForMarketing,
  limitLabel,
  recommendedPlanId,
  type PublicPlan,
} from "@/lib/plan-public";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

function formatXof(amount: number) {
  return String(amount ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export default function PricingPage() {
  const token = useAppStore((s) => s.token);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const {
    data: plans = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["public-plans"],
    queryFn: async () => {
      const { data } = await api.get<PublicPlan[]>("/api/paiements/plans/");
      return data;
    },
  });

  const topPick = useMemo(() => recommendedPlanId(plans), [plans]);

  async function choosePlan(planId: number) {
    if (!token) {
      window.location.href = "/login";
      return;
    }
    setLoadingId(planId);
    try {
      const { data } = await api.post<{ payment_url: string | null }>("/api/paiements/initier/", { plan_id: planId });
      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        window.location.href = "/paiement/erreur";
      }
    } catch {
      window.location.href = "/paiement/erreur";
    } finally {
      setLoadingId(null);
    }
  }

  const comparisonRows = useMemo(
    () => [
      {
        label: "Durée",
        cell: (p: PublicPlan) => `${p.duree_jours} jour${p.duree_jours > 1 ? "s" : ""}`,
      },
      { label: "Événements (max)", cell: (p: PublicPlan) => limitLabel(p.nb_evenements_max) },
      { label: "Photos (max)", cell: (p: PublicPlan) => limitLabel(p.nb_uploads_max) },
      { label: "Albums / événement", cell: (p: PublicPlan) => limitLabel(p.nb_albums_max) },
      {
        label: "Mur photo",
        cell: (p: PublicPlan) => (p.hq_enabled ? "Haute qualité" : "Standard"),
      },
      {
        label: "Modération",
        cell: (p: PublicPlan) =>
          p.moderation_avancee ? "Avancée" : p.moderation_enabled ? "Validation incluse" : "Sans validation",
      },
      {
        label: "Support",
        cell: (p: PublicPlan) => (p.support_prioritaire ? "Prioritaire" : "Standard"),
      },
    ],
    [],
  );

  const gridClass =
    plans.length <= 1
      ? "grid-cols-1 max-w-md mx-auto"
      : plans.length === 2
        ? "md:grid-cols-2 max-w-4xl mx-auto"
        : "md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto";

  return (
    <>
      <section className="relative border-b border-border/40 overflow-hidden">
        <div className="gradient-bg relative py-16 md:py-24 px-4 text-center" style={{ color: "var(--color-white)" }}>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 20%, rgba(255,255,255,0.2) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(255,255,255,0.12) 0%, transparent 40%)",
            }}
          />
          <div className="container relative mx-auto max-w-6xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] opacity-90">Investissement</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-display mt-4 tracking-tight text-balance max-w-3xl mx-auto leading-tight">
              La formule qui colle à votre ambition
            </h1>
            <p
              style={{ color: "color-mix(in srgb, var(--color-white) 88%, transparent)" }}
              className="mt-5 max-w-xl mx-auto leading-relaxed md:text-lg text-pretty"
            >
              Grattez le gratuit pour tester, montez en gamme quand vos événements explosent. Paiement sécurisé, vous
              restez maître du budget.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <Link
                href="/fonctionnalites"
                className="rounded-xl px-5 py-2.5 text-sm font-medium border border-white/40 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
              >
                Pourquoi nous choisir
              </Link>
              <Link
                href="/comment-ca-marche"
                className="rounded-xl px-5 py-2.5 text-sm font-medium border border-white/40 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all"
              >
                Comment ça marche
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-14 md:py-20 bg-gradient-to-b from-muted/40 via-muted/25 to-background overflow-hidden">
        <div className="pointer-events-none absolute inset-0 marketing-dot-grid opacity-[0.18]" aria-hidden />
        <div className="container relative mx-auto max-w-6xl px-4">
          {isLoading && (
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[28rem] rounded-3xl bg-gradient-to-b from-muted/80 to-muted/40 animate-pulse border border-border/30"
                />
              ))}
            </div>
          )}
          {isError && (
            <div className="max-w-md mx-auto text-center py-12 space-y-4">
              <p className="text-sm text-destructive">Impossible de charger les tarifs pour le moment.</p>
              <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
                Réessayer
              </Button>
            </div>
          )}
          {!isLoading && !isError && plans.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Aucune offre n’est disponible pour l’instant.</p>
          )}

          {!isLoading && !isError && plans.length > 0 && (
            <>
              <div className={cn("mt-2 grid gap-7 lg:gap-8 items-stretch", gridClass)}>
                {plans.map((plan) => {
                  const highlighted = topPick !== null && plan.id === topPick;
                  const bullets = formatPlanFeaturesForMarketing(plan);
                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        "marketing-card relative flex flex-col p-7 lg:p-8",
                        highlighted && "ring-2 ring-primary/60 shadow-glow scale-[1.02] lg:scale-105 z-10",
                      )}
                    >
                      {highlighted && (
                        <div
                          className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg"
                          style={{ background: "var(--color-primary)", color: "var(--color-white)" }}
                        >
                          Le plus demandé
                        </div>
                      )}
                      <h2 className="text-xl lg:text-2xl font-bold font-display tracking-tight">{plan.nom}</h2>
                      <div className="mt-5">
                        <span className="text-4xl font-extrabold font-display tracking-tight tabular-nums">
                          {formatXof(plan.prix_xof)}
                        </span>
                        <span className="text-muted-foreground ml-1.5 text-sm font-medium">F CFA</span>
                        {plan.prix_xof > 0 && (
                          <span className="block text-xs text-muted-foreground mt-2">Selon la durée du forfait</span>
                        )}
                      </div>
                      <ul className="mt-7 space-y-2.5 flex-1">
                        {bullets.map((line) => (
                          <li key={line} className="flex items-start gap-2.5 text-sm leading-snug">
                            <Check size={17} className="text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        variant={highlighted ? "primary" : "outline"}
                        className={cn("w-full mt-8 rounded-xl h-11 font-semibold", highlighted && "shadow-glow")}
                        onClick={() => choosePlan(plan.id)}
                        disabled={loadingId === plan.id}
                      >
                        {loadingId === plan.id
                          ? "Redirection…"
                          : plan.prix_xof === 0
                            ? "Commencer gratuitement"
                            : "Choisir cette offre"}
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className="mt-16 marketing-glass-subtle rounded-3xl overflow-hidden border-border/60 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.12)]">
                <div className="px-6 py-5 md:px-8 md:py-6 border-b border-border/50 bg-gradient-to-r from-muted/30 to-transparent">
                  <h3 className="text-lg md:text-xl font-bold font-display tracking-tight">Tableau comparatif</h3>
                  <p className="text-sm text-muted-foreground mt-1">Détail des limites par offre.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px]">
                    <thead>
                      <tr className="border-b border-border/50 bg-muted/35">
                        <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4">
                          Critère
                        </th>
                        {plans.map((p) => (
                          <th
                            key={p.id}
                            className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4"
                          >
                            {p.nom}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row) => (
                        <tr
                          key={row.label}
                          className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-5 py-3.5 text-sm font-medium">{row.label}</td>
                          {plans.map((p) => (
                            <td key={p.id} className="px-5 py-3.5 text-sm text-muted-foreground">
                              {row.cell(p)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
