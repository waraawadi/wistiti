"use client";

import { useQuery } from "@tanstack/react-query";

import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Evenement = {
  id: number;
  titre: string;
  slug: string;
  date: string;
  actif: boolean;
  moderation_active: boolean;
  user_email: string;
};

const th = "text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4";
const td = "px-5 py-3 text-sm";

export default function AdminEvenementsPage() {
  const { data } = useQuery({
    queryKey: ["admin-evenements"],
    queryFn: async () => (await api.get<Evenement[]>("/api/admin/evenements/")).data,
  });

  const list = data ?? [];

  return (
    <div className="min-w-0 max-w-full space-y-6 sm:space-y-8 overflow-x-hidden">
      <DashboardPageHeader title="Événements" description="Vue globale de tous les événements et de leurs organisateurs." />

      <div className="dashboard-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/40">
                <th className={th}>Événement</th>
                <th className={th}>Organisateur</th>
                <th className={th}>Date</th>
                <th className={th}>Statut</th>
                <th className={th}>Modération</th>
              </tr>
            </thead>
            <tbody>
              {list.map((ev) => (
                <tr key={ev.id} className="border-b border-border/40 last:border-0 hover:bg-muted/25 transition-colors">
                  <td className={cn(td, "font-medium")}>
                    {ev.titre}
                    <div className="text-xs text-muted-foreground font-normal">{ev.slug}</div>
                  </td>
                  <td className={td}>{ev.user_email}</td>
                  <td className={cn(td, "text-muted-foreground tabular-nums")}>{new Date(ev.date).toLocaleString("fr-FR")}</td>
                  <td className={td}>{ev.actif ? "Actif" : "Inactif"}</td>
                  <td className={td}>{ev.moderation_active ? "On" : "Off"}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className={cn(td, "py-10 text-center text-muted-foreground")}>
                    Aucun événement.
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
