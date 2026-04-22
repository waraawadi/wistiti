"use client";

import { useEffect, useMemo, useState } from "react";
import { FedaCheckoutContainer } from "fedapay-reactjs";

const FEDAPAY_SCRIPT = "https://cdn.fedapay.com/checkout.js?v=1.1.7";

type FedapayGlobal = {
  init: (opts: Record<string, unknown>) => void;
  CHECKOUT_COMPLETED: number;
  DIALOG_DISMISSED: number;
};

export type FedapayClientTransaction = Record<string, unknown>;

export type FedapayCheckoutCustomer = {
  email: string;
  firstname: string;
  lastname: string;
};

function loadFedapayCheckoutScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("ssr"));
  if ((window as unknown as { FedaPay?: FedapayGlobal }).FedaPay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = FEDAPAY_SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("fedapay-script"));
    document.head.appendChild(s);
  });
}

function fedapayClientTxId(tx: FedapayClientTransaction, fallback: string): string {
  const idRaw = tx.id ?? tx.transaction_id;
  if (idRaw != null && idRaw !== "") return String(idRaw);
  return fallback;
}

function parseOnCompleteArgs(first: unknown, second?: unknown): { reason: number; transaction: unknown } {
  if (first !== null && typeof first === "object" && "reason" in first) {
    const r = first as { reason: number; transaction?: unknown };
    return { reason: r.reason, transaction: r.transaction };
  }
  return { reason: first as number, transaction: second };
}

export type FedaCheckoutEmbedProps = {
  transactionId: string;
  customer: FedapayCheckoutCustomer;
  planNom: string;
  amount: number;
  onCheckoutCompleted: (transactionId: string, fedapayTransaction: FedapayClientTransaction) => void;
  onCheckoutDismissed: () => void;
  onError: (message: string) => void;
};

/**
 * Formulaire embarqué via la lib officielle {@link https://www.npmjs.com/package/fedapay-reactjs fedapay-reactjs}
 * (elle appelle toujours checkout.js ; charge le script puis rend {@link FedaCheckoutContainer}).
 */
export function FedaCheckoutEmbed({
  transactionId,
  customer,
  planNom,
  amount,
  onCheckoutCompleted,
  onCheckoutDismissed,
  onError,
}: FedaCheckoutEmbedProps) {
  const [scriptReady, setScriptReady] = useState(false);
  const pk = process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY?.trim() ?? "";

  useEffect(() => {
    let cancelled = false;
    void loadFedapayCheckoutScript()
      .then(() => {
        if (!cancelled) setScriptReady(true);
      })
      .catch(() => {
        if (!cancelled) queueMicrotask(() => onError("Impossible de charger le script FedaPay (réseau ou blocage)."));
      });
    return () => {
      cancelled = true;
    };
  }, [onError]);

  const options = useMemo(() => {
    const envRaw = (process.env.NEXT_PUBLIC_FEDAPAY_ENV || "sandbox").toLowerCase();
    const environment: "live" | "sandbox" = envRaw === "live" ? "live" : "sandbox";

    return {
      public_key: pk,
      environment,
      transaction: {
        id: Number(transactionId),
        amount,
        description: `Abonnement ${planNom}`,
      },
      currency: { iso: "XOF" },
      customer: {
        email: customer.email,
        firstname: customer.firstname,
        lastname: customer.lastname,
      },
      locale: "fr" as const,
      onComplete: (first: unknown, second?: unknown) => {
        const FedaPay = (window as unknown as { FedaPay: FedapayGlobal }).FedaPay;
        if (!FedaPay) {
          queueMicrotask(() => onError("FedaPay (checkout.js) indisponible après chargement."));
          return;
        }
        const { reason, transaction } = parseOnCompleteArgs(first, second);
        queueMicrotask(() => {
          if (reason === FedaPay.DIALOG_DISMISSED) {
            onCheckoutDismissed();
            return;
          }
          if (reason !== FedaPay.CHECKOUT_COMPLETED) {
            onCheckoutDismissed();
            return;
          }
          const tx =
            transaction && typeof transaction === "object"
              ? (transaction as FedapayClientTransaction)
              : ({} as FedapayClientTransaction);
          const id = fedapayClientTxId(tx, transactionId);
          onCheckoutCompleted(id, tx);
        });
      },
    };
  }, [
    amount,
    customer.email,
    customer.firstname,
    customer.lastname,
    onCheckoutCompleted,
    onCheckoutDismissed,
    onError,
    planNom,
    pk,
    transactionId,
  ]);

  if (!scriptReady) {
    return (
      <div className="w-full min-h-[min(78vh,820px)] rounded-[var(--radius-card)] border bg-muted/20 flex items-center justify-center text-sm text-muted-foreground">
        Chargement du paiement FedaPay…
      </div>
    );
  }

  if (!pk) {
    return (
      <p className="text-sm text-destructive">
        Variable NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY manquante (.env frontend, clé pk_sandbox_…).
      </p>
    );
  }

  return (
    <div className="w-full min-h-[min(78vh,820px)] rounded-[var(--radius-card)] border bg-background overflow-visible shadow-inner [&>*]:!max-w-none [&>*]:w-full [&_iframe]:block [&_iframe]:w-full [&_iframe]:min-h-[min(72vh,760px)] [&_iframe]:max-w-none [&_iframe]:border-0">
      <FedaCheckoutContainer options={options} />
    </div>
  );
}
