"use client";

import { useQuery } from "@tanstack/react-query";

import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Paiement = {
  id: number;
  created_at: string;
  user_email: string;
  plan_nom: string;
  montant: number;
  devise: string;
  statut: string;
  fedapay_transaction_id: string;
  expires_at: string | null;
};

const th = "text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4";
const td = "px-5 py-3 text-sm";

export default function AdminPaiementsPage() {
  const { data } = useQuery({
    queryKey: ["admin-paiements"],
    queryFn: async () => (await api.get<Paiement[]>("/api/admin/paiements/")).data,
  });

  const list = data ?? [];

  return (
    <div className="min-w-0 max-w-full space-y-6 sm:space-y-8 overflow-x-hidden">
      <DashboardPageHeader title="Paiements" description="Historique global des transactions et abonnements." />

      <div className="dashboard-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/40">
                <th className={th}>Date</th>
                <th className={th}>Utilisateur</th>
                <th className={th}>Plan</th>
                <th className={th}>Montant</th>
                <th className={th}>Statut</th>
                <th className={th}>Transaction</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-border/40 last:border-0 hover:bg-muted/25 transition-colors">
                  <td className={cn(td, "text-muted-foreground tabular-nums")}>{new Date(p.created_at).toLocaleString("fr-FR")}</td>
                  <td className={td}>{p.user_email}</td>
                  <td className={td}>{p.plan_nom}</td>
                  <td className={cn(td, "tabular-nums")}>
                    {p.montant} {p.devise}
                  </td>
                  <td className={td}>{p.statut}</td>
                  <td className={cn(td, "text-muted-foreground font-mono text-xs")}>{p.fedapay_transaction_id || "—"}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className={cn(td, "py-10 text-center text-muted-foreground")}>
                    Aucun paiement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
