"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote, Folder, Package, Users } from "lucide-react";

import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { api } from "@/lib/api";

export default function SuperAdminHome() {
  const { data: users } = useQuery({
    queryKey: ["admin-users-count"],
    queryFn: async () => (await api.get<any[]>("/api/admin/users/")).data,
  });
  const { data: events } = useQuery({
    queryKey: ["admin-events-count"],
    queryFn: async () => (await api.get<any[]>("/api/admin/evenements/")).data,
  });
  const { data: plans } = useQuery({
    queryKey: ["admin-plans-count"],
    queryFn: async () => (await api.get<any[]>("/api/admin/plans/")).data,
  });
  const { data: pays } = useQuery({
    queryKey: ["admin-pays-count"],
    queryFn: async () => (await api.get<any[]>("/api/admin/paiements/")).data,
  });

  const cards = [
    { label: "Utilisateurs", value: users?.length ?? "—", sub: "Comptes enregistrés", icon: Users },
    { label: "Événements", value: events?.length ?? "—", sub: "Sur toute la plateforme", icon: Folder },
    { label: "Plans", value: plans?.length ?? "—", sub: "Forfaits disponibles", icon: Package },
    { label: "Paiements", value: pays?.length ?? "—", sub: "Transactions enregistrées", icon: Banknote },
  ];

  return (
    <div className="min-w-0 max-w-full space-y-6 sm:space-y-8 overflow-x-hidden">
      <DashboardPageHeader
        title="Vue d’ensemble"
        description="Pilotez utilisateurs, événements, plans et paiements depuis la console système."
      />

      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {cards.map((c) => (
          <div key={c.label} className="dashboard-stat-card p-4 sm:p-5 md:p-6 relative overflow-hidden min-w-0">
            <div className="absolute top-0 left-0 right-0 h-1 gradient-bg opacity-90" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground leading-tight">
                  {c.label}
                </p>
                <p className="text-xl sm:text-2xl md:text-3xl font-extrabold mt-1 sm:mt-1.5 font-display tabular-nums tracking-tight">
                  {c.value}
                </p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">{c.sub}</p>
              </div>
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/10 border border-primary/10 flex items-center justify-center shrink-0">
                <c.icon className="text-primary shrink-0" size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
