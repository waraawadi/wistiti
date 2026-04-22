"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { FedaCheckoutEmbed } from "@/components/fedapay/feda-checkout-embed";
import type { FedapayClientTransaction } from "@/components/fedapay/feda-checkout-embed";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { dashboardInput } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";
import type { PublicConfig } from "@/lib/theme";

type Plan = {
  id: number;
  nom: string;
  prix_xof: number;
  nb_uploads_max: number;
  nb_evenements_max: number;
  nb_albums_max: number;
  duree_jours: number;
  hq_enabled: boolean;
  moderation_enabled: boolean;
  moderation_avancee: boolean;
  support_prioritaire: boolean;
};

type FedapayCustomer = {
  email: string;
  firstname: string;
  lastname: string;
};

type InitierPaiementResponse = {
  payment_url: string | null;
  paiement_id: number;
  transaction_id: string;
  checkout_mode?: "redirect" | "checkout_js";
  customer?: FedapayCustomer;
};

/** Numéro de test documenté par FedaPay pour le sandbox (Mobile Money ; pays / opérateur selon le flux). */
const FEDAPAY_SANDBOX_TEST_MSISDN = "64000001";

function formatXof(amount: number) {
  const s = String(amount ?? 0);
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function featuresFor(p: Plan) {
  const events = p.nb_evenements_max === -1 ? "Événements illimités" : `${p.nb_evenements_max} événement(s) max`;
  const photos = p.nb_uploads_max === -1 ? "Photos illimitées" : `${p.nb_uploads_max} photo(s) max`;
  const albumsMax = p.nb_albums_max ?? 2;
  const albums =
    albumsMax === -1
      ? "Albums illimités par événement (1 public + privés)"
      : `${albumsMax} album(s) par événement max (dont 1 public)`;
  return [
    `${p.duree_jours} jours`,
    events,
    albums,
    photos,
    p.hq_enabled ? "Qualité HQ" : "Qualité standard",
    p.moderation_avancee ? "Modération avancée" : p.moderation_enabled ? "Modération incluse" : "Modération non incluse",
    p.support_prioritaire ? "Support prioritaire" : "Support standard",
    "QR Code",
    "Album en ligne",
    "Photo Wall",
    "Téléchargement ZIP",
  ];
}

export default function DashboardAbonnementsPage() {
  const qc = useQueryClient();
  /** Évite plusieurs boucles synchroniser/ déclenchées par FedaPay (onComplete peut fire plusieurs fois). */
  const syncRunForTxRef = useRef<string | null>(null);
  /**
   * Après un paiement réussi, FedaPay ferme le widget : un 2e appel onComplete avec
   * DIALOG_DISMISSED peut suivre CHECKOUT_COMPLETED — ne pas afficher « fermé sans payer ».
   */
  const fedapayCheckoutSuccessRef = useRef(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [checkoutHint, setCheckoutHint] = useState<string | null>(null);
  const [fedapayDebug, setFedapayDebug] = useState<{
    transaction_id: string;
    fedapay_raw: unknown;
    fedapay_transaction: unknown;
  } | null>(null);
  const fedapaySandboxMode = (process.env.NEXT_PUBLIC_FEDAPAY_ENV || "sandbox").toLowerCase() !== "live";
  const [fedapaySession, setFedapaySession] = useState<{
    transactionId: string;
    customer: FedapayCustomer;
  } | null>(null);

  useEffect(() => {
    fedapayCheckoutSuccessRef.current = false;
  }, [fedapaySession?.transactionId]);

  const { data: usage } = useQuery({
    queryKey: ["paiements-usage"],
    queryFn: async () =>
      (
        await api.get<{
          plan: string;
          uploads_used: number;
          uploads_max: number;
          evenements_used: number;
          evenements_max: number;
          albums_per_event_max: number;
          upload_credits: number;
          expires_at: string | null;
        }>("/api/paiements/usage/")
      ).data,
  });

  const { data: cfg } = useQuery({
    queryKey: ["public-config"],
    queryFn: async () => (await api.get<PublicConfig>("/api/config/")).data,
  });

  const { data: plans } = useQuery({
    queryKey: ["paiements-plans"],
    queryFn: async () => (await api.get<Plan[]>("/api/paiements/plans/")).data,
  });

  const sorted = useMemo(() => (plans ?? []).slice().sort((a, b) => a.prix_xof - b.prix_xof), [plans]);
  const currentPlanName = usage?.plan ?? "Gratuit";

  const onFedapayEmbedError = useCallback((message: string) => {
    setPaymentError(message);
  }, []);

  /** Après Checkout.js : FedaPay met parfois 1–2 s à marquer « approved » — on interroge l’API jusqu’à activation. */
  const pollSyncAfterPayment = useCallback(
    async (transactionId: string) => {
      if (syncRunForTxRef.current === transactionId) return;
      syncRunForTxRef.current = transactionId;
      setPaymentError(null);
      setFedapayDebug(null);
      // Échecs sans accès payant ; declined / canceled ne sont pas « finaux » pour une nouvelle tentative (doc FedaPay).
      const retryable = new Set(["canceled", "cancelled", "declined"]);
      const terminalFinal = new Set(["refunded", "expired"]);
      try {
        for (let attempt = 0; attempt < 12; attempt++) {
          try {
            const { data } = await api.post<{
              activated: boolean;
              statut: string | null;
              plan: string;
              expires_at: string | null;
              upload_credits?: number;
              credits_added?: number;
              fedapay_raw?: unknown;
              fedapay_transaction?: unknown;
            }>("/api/paiements/synchroniser/", {
              transaction_id: transactionId,
              include_fedapay: fedapaySandboxMode,
            });
            if (fedapaySandboxMode && (data.fedapay_raw || data.fedapay_transaction)) {
              setFedapayDebug({
                transaction_id: transactionId,
                fedapay_raw: data.fedapay_raw,
                fedapay_transaction: data.fedapay_transaction,
              });
            }
            if (data.activated || (data.credits_added != null && data.credits_added > 0)) {
              await qc.invalidateQueries({ queryKey: ["paiements-usage"] });
              setCheckoutOpen(false);
              setFedapaySession(null);
              setCheckoutPlan(null);
              if (data.credits_added != null && data.credits_added > 0) {
                setTopupOpen(false);
                setTopupSession(null);
              }
              return;
            }
            const s = (data.statut ?? "").toLowerCase();
            if (s && retryable.has(s)) {
              setPaymentError(
                `Paiement non abouti (statut : ${data.statut}). Tu peux réessayer — FedaPay autorise une nouvelle tentative dans ce cas.`,
              );
              return;
            }
            if (s && terminalFinal.has(s)) {
              setPaymentError(`Paiement terminé sans accès payant (statut : ${data.statut}).`);
              return;
            }
          } catch {
            /* retry */
          }
          await new Promise((r) => setTimeout(r, 1100 + attempt * 250));
        }
        await qc.invalidateQueries({ queryKey: ["paiements-usage"] });
        setPaymentError(
          "FedaPay met parfois quelques secondes à confirmer. Vérifie ton plan à l’écran ou clique sur Actualiser mon plan.",
        );
      } finally {
        if (syncRunForTxRef.current === transactionId) {
          syncRunForTxRef.current = null;
        }
      }
    },
    [qc, fedapaySandboxMode],
  );

  const handleFedapayCheckoutCompleted = useCallback(
    (txId: string, _fedapayTx: FedapayClientTransaction) => {
      fedapayCheckoutSuccessRef.current = true;
      setCheckoutHint(null);
      void pollSyncAfterPayment(txId);
    },
    [pollSyncAfterPayment],
  );

  const handleFedapayCheckoutDismissed = useCallback(() => {
    if (fedapayCheckoutSuccessRef.current) {
      return;
    }
    setPaymentError(null);
    setCheckoutHint(
      "Tu as fermé le formulaire FedaPay sans finaliser le paiement. Tu peux rouvrir le paiement quand tu veux.",
    );
  }, []);

  const initPayment = useMutation({
    mutationFn: async (planId: number) => {
      const { data } = await api.post<InitierPaiementResponse>("/api/paiements/initier/", {
        plan_id: planId,
        checkout_mode: "checkout_js",
      });
      return data;
    },
    onSuccess: (data) => {
      if (data.checkout_mode === "checkout_js" && data.transaction_id && data.customer) {
        setFedapaySession({ transactionId: data.transaction_id, customer: data.customer });
        setPaymentError(null);
        setCheckoutHint(null);
        return;
      }
      const url = data.payment_url?.trim();
      if (url) {
        window.location.assign(url);
        return;
      }
      setFedapaySession(null);
      setPaymentError("Réponse de paiement inattendue. Réessaie ou contacte le support.");
    },
    onError: () => {
      setFedapaySession(null);
      setPaymentError("Impossible d’initier le paiement FedaPay. Vérifie la clé API / l’environnement sandbox.");
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ["paiements-usage"] });
    },
  });

  const [topupOpen, setTopupOpen] = useState(false);
  const [topupQty, setTopupQty] = useState(10);
  const [topupError, setTopupError] = useState<string | null>(null);
  const [topupHint, setTopupHint] = useState<string | null>(null);
  const topupCheckoutSuccessRef = useRef(false);
  const [topupSession, setTopupSession] = useState<{
    transactionId: string;
    customer: FedapayCustomer;
    quantity: number;
    amount: number;
  } | null>(null);

  useEffect(() => {
    topupCheckoutSuccessRef.current = false;
  }, [topupSession?.transactionId]);

  const initTopup = useMutation({
    mutationFn: async (quantity: number) => {
      const { data } = await api.post<{
        payment_url: string | null;
        transaction_id: string;
        checkout_mode: "checkout_js" | "redirect";
        customer?: FedapayCustomer;
        quantity: number;
        price_per_photo_xof: number;
      }>("/api/paiements/recharge-photos/initier/", { quantity, checkout_mode: "checkout_js" });
      return data;
    },
    onSuccess: (data) => {
      if (data.checkout_mode === "checkout_js" && data.transaction_id && data.customer) {
        const price = data.price_per_photo_xof ?? (cfg?.topup_price_per_photo_xof ?? 25);
        setTopupSession({
          transactionId: data.transaction_id,
          customer: data.customer,
          quantity: data.quantity,
          amount: data.quantity * price,
        });
        setTopupError(null);
        setTopupHint(null);
        return;
      }
      setTopupError("Réponse recharge inattendue.");
    },
    onError: () => {
      setTopupError("Impossible d’initier la recharge. Vérifie la config / clé FedaPay.");
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ["paiements-usage"] });
    },
  });

  function openCheckout(p: Plan) {
    setCheckoutPlan(p);
    setFedapaySession(null);
    setPaymentError(null);
    setCheckoutHint(null);
    setFedapayDebug(null);
    setCheckoutOpen(true);
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Abonnements"
        description="Choisis un plan sans quitter le dashboard — même style que la page publique des tarifs."
      />

      <div className="dashboard-panel p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Plan actuel</p>
            <p className="text-xl font-bold font-display tracking-tight">{currentPlanName}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            Expiration :{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {usage?.expires_at ? new Date(usage.expires_at).toLocaleDateString("fr-FR") : "—"}
            </span>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex flex-wrap justify-between text-sm mb-2 gap-2">
            <span className="text-muted-foreground">Événements</span>
            <span className="font-medium tabular-nums">
              {usage?.evenements_used == null || usage?.evenements_max == null
                ? "—"
                : usage.evenements_max === -1
                  ? `${usage.evenements_used} / ∞`
                  : `${usage.evenements_used} / ${usage.evenements_max}`}
            </span>
          </div>
          <div className="flex flex-wrap justify-between text-sm mb-2 gap-2">
            <span className="text-muted-foreground">Albums / événement</span>
            <span className="font-medium">
              {usage?.albums_per_event_max == null
                ? "—"
                : usage.albums_per_event_max === -1
                  ? "Illimité (dont 1 public)"
                  : `Plafond ${usage.albums_per_event_max} (dont 1 public)`}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Uploads</span>
            <span className="font-medium tabular-nums">
              {usage?.uploads_used == null || usage?.uploads_max == null
                ? "—"
                : usage.uploads_max === -1
                  ? `${usage.uploads_used} / ∞`
                  : `${usage.uploads_used} / ${usage.uploads_max}`}
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden bg-muted/80 ring-1 ring-border/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 shadow-[0_0_12px_-2px_var(--color-primary)] transition-[width] duration-500"
              style={{
                width:
                  usage?.uploads_used != null && usage?.uploads_max != null && usage.uploads_max > 0 && usage.uploads_max !== -1
                    ? `${Math.min(100, Math.round((usage.uploads_used / usage.uploads_max) * 100))}%`
                    : usage?.uploads_max === -1
                      ? "100%"
                      : "0%",
              }}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">
              Crédits photos (recharge) :{" "}
              <span className="font-semibold text-foreground tabular-nums">{usage?.upload_credits ?? 0}</span>
            </span>
            <Button variant="outline" size="sm" className="rounded-xl border-border/70" onClick={() => setTopupOpen(true)}>
              Acheter des photos
            </Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-7 lg:gap-8 items-stretch">
        {sorted.map((p) => {
          const popular = p.nom.toLowerCase() === "pro";
          return (
            <div
              key={p.id}
              className={cn(
                "marketing-card marketing-card-lift relative flex flex-col p-7 lg:p-8",
                popular && "ring-2 ring-primary/55 shadow-glow z-[1] md:scale-[1.02]",
              )}
            >
              {popular && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full whitespace-nowrap shadow-lg"
                  style={{ background: "var(--color-primary)", color: "var(--color-white)" }}
                >
                  Populaire
                </div>
              )}
              <h2 className={cn("text-xl lg:text-2xl font-bold font-display tracking-tight", popular && "mt-1")}>
                {p.nom}
              </h2>
              <div className="mt-5">
                <span className="text-3xl lg:text-4xl font-extrabold font-display tabular-nums tracking-tight">
                  {formatXof(p.prix_xof)}
                </span>
                <span className="text-muted-foreground ml-1.5 text-sm font-medium">F CFA</span>
              </div>

              <ul className="mt-7 space-y-2.5 flex-1">
                {featuresFor(p).map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm leading-snug">
                    <Check size={17} className="text-primary shrink-0 mt-0.5" strokeWidth={2.5} /> {f}
                  </li>
                ))}
                {p.nom.toLowerCase() === "gratuit" && (
                  <>
                    {["Support prioritaire", "Branding personnalisé"].map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground leading-snug">
                        <X size={17} className="shrink-0 mt-0.5" strokeWidth={2.5} /> {f}
                      </li>
                    ))}
                  </>
                )}
              </ul>

              <Button
                variant={popular ? "gradient" : "outline"}
                className={cn("w-full mt-8 rounded-xl h-11 font-semibold", popular && "shadow-glow")}
                onClick={() => openCheckout(p)}
              >
                Choisir ce plan
              </Button>
            </div>
          );
        })}
      </div>

      <Dialog
        open={checkoutOpen}
        onOpenChange={(v) => {
          setCheckoutOpen(v);
          if (!v) {
            setCheckoutPlan(null);
            setFedapaySession(null);
            setPaymentError(null);
            setCheckoutHint(null);
            setFedapayDebug(null);
          }
        }}
        title={checkoutPlan ? `Paiement — ${checkoutPlan.nom}` : "Paiement"}
        size="xl"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="text-sm text-muted-foreground">
              Paiement via <span className="font-medium text-foreground">FedaPay</span> (Checkout.js)
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {fedapaySession && (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-border/70"
                  onClick={() => {
                    syncRunForTxRef.current = null;
                    void pollSyncAfterPayment(fedapaySession.transactionId);
                  }}
                >
                  Actualiser mon plan
                </Button>
              )}
              <Button
                variant="gradient"
                className="rounded-xl shadow-glow"
                onClick={() => {
                  if (!checkoutPlan) return;
                  initPayment.mutate(checkoutPlan.id);
                }}
                disabled={!checkoutPlan || initPayment.isPending}
              >
                {fedapaySession
                  ? initPayment.isPending
                    ? "Préparation…"
                    : "Regénérer le formulaire"
                  : initPayment.isPending
                    ? "Préparation…"
                    : "Payer maintenant"}
              </Button>
            </div>
          </div>
        }
      >
        {!checkoutPlan ? (
          <p className="text-sm text-muted-foreground">Sélectionne un plan.</p>
        ) : (
          <div className="space-y-4">
            <div className="dashboard-panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="text-lg font-bold font-display">{checkoutPlan.nom}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Prix</p>
                  <p className="text-lg font-bold font-display">{formatXof(checkoutPlan.prix_xof)} F CFA</p>
                </div>
              </div>
            </div>

            {!fedapaySession ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Clique sur <span className="font-medium text-foreground">Payer maintenant</span> : le formulaire FedaPay
                  s’affiche ci‑dessous dans cette fenêtre (Checkout.js). Autorise le domaine de ton site dans le tableau
                  FedaPay → Applications si besoin.
                </p>
                {paymentError && <p className="text-sm text-destructive">{paymentError}</p>}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Règle le paiement ci‑dessous. Dès que FedaPay confirme, ton plan est mis à jour automatiquement (pas
                  besoin de bouton manuel dans le cas normal).
                </p>
                {fedapaySandboxMode && (
                  <p className="text-xs text-muted-foreground rounded-[var(--radius-card)] border bg-muted/30 px-3 py-2 leading-relaxed">
                    <span className="font-medium text-foreground">Sandbox FedaPay —</span> pour un paiement mobile de test,
                    le formulaire demande souvent un numéro : tu peux utiliser celui de la doc,{" "}
                    <span className="font-mono text-foreground">{FEDAPAY_SANDBOX_TEST_MSISDN}</span>, selon le pays /
                    l’opérateur proposé.
                  </p>
                )}
                {checkoutHint && <p className="text-sm text-amber-700 dark:text-amber-400">{checkoutHint}</p>}
                {paymentError && <p className="text-sm text-destructive">{paymentError}</p>}
                {fedapaySandboxMode && fedapayDebug && (
                  <details className="rounded-[var(--radius-card)] border bg-muted/20 p-3 text-xs">
                    <summary className="cursor-pointer font-medium text-foreground">
                      Debug FedaPay (sandbox) — réponse GET /transactions/{fedapayDebug.transaction_id}
                    </summary>
                    <div className="mt-3 space-y-3">
                      <div>
                        <div className="text-muted-foreground mb-1">Réponse brute (fedapay_raw)</div>
                        <pre className="overflow-auto rounded-md bg-background border p-2">
                          {JSON.stringify(fedapayDebug.fedapay_raw, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">Objet normalisé (fedapay_transaction)</div>
                        <pre className="overflow-auto rounded-md bg-background border p-2">
                          {JSON.stringify(fedapayDebug.fedapay_transaction, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </details>
                )}
                <FedaCheckoutEmbed
                  key={fedapaySession.transactionId}
                  transactionId={fedapaySession.transactionId}
                  customer={fedapaySession.customer}
                  planNom={checkoutPlan.nom}
                  amount={checkoutPlan.prix_xof}
                  onCheckoutCompleted={handleFedapayCheckoutCompleted}
                  onCheckoutDismissed={handleFedapayCheckoutDismissed}
                  onError={onFedapayEmbedError}
                />
              </div>
            )}
          </div>
        )}
      </Dialog>

      <Dialog
        open={topupOpen}
        onOpenChange={(v) => {
          setTopupOpen(v);
          if (!v) {
            setTopupError(null);
            setTopupHint(null);
            setTopupSession(null);
          }
        }}
        title="Recharge photos"
        size="lg"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="text-sm text-muted-foreground">
              Prix:{" "}
              <span className="font-medium text-foreground">
                {cfg?.topup_price_per_photo_xof ?? 25} XOF / photo
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="gradient"
                className="rounded-xl shadow-glow"
                onClick={() => {
                  const q = Math.max(1, Math.min(5000, Number(topupQty || 0)));
                  setTopupQty(q);
                  initTopup.mutate(q);
                }}
                disabled={initTopup.isPending}
              >
                {initTopup.isPending ? "Préparation…" : topupSession ? "Regénérer" : "Payer"}
              </Button>
              <Button variant="outline" className="rounded-xl border-border/70" onClick={() => setTopupOpen(false)}>
                Fermer
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nombre de photos</label>
              <input
                type="number"
                className={cn(dashboardInput, "mt-2")}
                value={topupQty}
                min={1}
                max={5000}
                onChange={(e) => setTopupQty(Number(e.target.value))}
              />
            </div>
            <div className="rounded-2xl border border-border/50 bg-muted/25 p-5 ring-1 ring-border/20">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-extrabold font-display">
                {formatXof((cfg?.topup_price_per_photo_xof ?? 25) * (topupQty || 0))} XOF
              </p>
            </div>
          </div>

          {topupError && <p className="text-sm text-destructive">{topupError}</p>}
          {topupHint && <p className="text-sm text-amber-700 dark:text-amber-400">{topupHint}</p>}

          {topupSession ? (
            <FedaCheckoutEmbed
              key={topupSession.transactionId}
              transactionId={topupSession.transactionId}
              customer={topupSession.customer}
              planNom={`Recharge ${topupSession.quantity} photos`}
              amount={topupSession.amount}
              onCheckoutCompleted={(txId) => {
                topupCheckoutSuccessRef.current = true;
                setTopupHint(null);
                // Synchroniser ajoute des crédits via le backend.
                void pollSyncAfterPayment(txId).then(async () => {
                  await qc.invalidateQueries({ queryKey: ["paiements-usage"] });
                });
              }}
              onCheckoutDismissed={() => {
                if (topupCheckoutSuccessRef.current) {
                  return;
                }
                setTopupError(null);
                setTopupHint(
                  "Tu as fermé le formulaire FedaPay sans finaliser la recharge. Tu peux relancer le paiement quand tu veux.",
                );
              }}
              onError={(m) => setTopupError(m)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Si tu as atteint le quota de ton plan, tu peux acheter des crédits photos pour continuer à uploader.
            </p>
          )}
        </div>
      </Dialog>
    </div>
  );
}
