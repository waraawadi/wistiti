"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";

type PaiementRow = {
  id: number;
  statut: string;
  expires_at: string | null;
  created_at: string;
  plan: { id: number; nom: string; prix_xof: number };
};

function PaiementSuccesContent() {
  const token = useAppStore((s) => s.token);
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const callbackTxId = searchParams.get("id");
  const callbackStatus = searchParams.get("status");
  const syncOnceRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token || !callbackTxId) return;
    if (syncOnceRef.current === callbackTxId) return;
    syncOnceRef.current = callbackTxId;
    void (async () => {
      try {
        await api.post("/api/paiements/synchroniser/", { transaction_id: callbackTxId });
        await qc.invalidateQueries({ queryKey: ["paiements-historique"] });
        await qc.invalidateQueries({ queryKey: ["paiements-usage"] });
      } catch {
        syncOnceRef.current = null;
      }
    })();
  }, [token, callbackTxId, qc]);

  const { data } = useQuery({
    queryKey: ["paiements-historique"],
    enabled: Boolean(token),
    queryFn: async () => (await api.get<PaiementRow[]>("/api/paiements/historique/")).data,
  });

  const lastApproved = (data ?? []).find((p) => p.statut === "approved") ?? null;

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-card rounded-[var(--radius-card)] border p-8 text-center">
        <CheckCircle2
          className="mx-auto"
          size={56}
          style={{ color: "var(--color-primary)", animation: "pulse 1.8s ease-in-out infinite" }}
        />
        <h1 className="mt-4 text-2xl font-extrabold font-display">Paiement confirmé</h1>
        <p className="mt-2 text-muted-foreground">
          Merci. Ton plan est activé dès que FedaPay confirme la collecte (webhook ou vérification API). Si le récap
          ci‑dessous n’est pas à jour, rafraîchis la page dans quelques secondes.
        </p>

        {(callbackTxId || callbackStatus) && (
          <p className="mt-4 text-left text-xs text-muted-foreground leading-relaxed rounded-[var(--radius-card)] border bg-muted/40 p-3">
            FedaPay peut ajouter <span className="font-mono text-foreground">id</span> et{" "}
            <span className="font-mono text-foreground">status</span> dans l’URL de retour — ce sont des indications
            pour l’utilisateur&nbsp;; <em>ne pas s&apos;en fier pour la sécurité</em> (voir doc FedaPay). Ici, une
            synchronisation API est lancée automatiquement si tu es connecté
            {callbackStatus ? ` (indication URL : ${callbackStatus}).` : "."}
          </p>
        )}

        {token ? (
          <div className="mt-6 bg-muted rounded-[var(--radius-card)] p-4 text-left">
            <p className="text-sm text-muted-foreground">Dernier paiement approuvé (historique)</p>
            <p className="text-lg font-bold font-display">{lastApproved?.plan.nom ?? "—"}</p>
            <p className="text-sm text-muted-foreground mt-2">Expiration</p>
            <p className="text-sm">
              {lastApproved?.expires_at ? new Date(lastApproved.expires_at).toLocaleDateString("fr-FR") : "—"}
            </p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            Connecte-toi pour voir le récapitulatif et déclencher la synchro automatique après retour FedaPay.
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button variant="secondary">Retour au dashboard</Button>
          </Link>
          <Link href="/dashboard/abonnements">
            <Button variant="outline">Voir les plans</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaiementSuccesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
          <p className="text-muted-foreground text-sm">Chargement…</p>
        </div>
      }
    >
      <PaiementSuccesContent />
    </Suspense>
  );
}
