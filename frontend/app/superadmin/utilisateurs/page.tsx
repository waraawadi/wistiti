"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { dashboardInput } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

type Plan = { id: number; nom: string };
type User = {
  id: number;
  email: string;
  nom: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  created_at: string;
  expires_at: string | null;
  plan_actif: Plan | null;
  plan_actif_id?: number | null;
};

const th = "text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4";
const td = "px-5 py-3 text-sm";
const labelClass = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground block";

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await api.get<User[]>("/api/admin/users/")).data,
  });
  const { data: plans } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => (await api.get<Plan[]>("/api/admin/plans/")).data,
  });

  const list = useMemo(() => users ?? [], [users]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<User | null>(null);
  const [planId, setPlanId] = useState<number | "">("");
  const [active, setActive] = useState(true);

  const byId = useMemo(() => new Map(list.map((u) => [u.id, u])), [list]);

  const save = useMutation({
    mutationFn: async () => {
      if (!current) throw new Error("no current");
      await api.patch(`/api/admin/users/${current.id}/`, {
        is_active: active,
        plan_actif_id: planId === "" ? null : planId,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-users"] });
      setOpen(false);
      setCurrent(null);
    },
  });

  function openEdit(id: number) {
    const u = byId.get(id) ?? null;
    if (!u) return;
    setCurrent(u);
    setActive(u.is_active);
    setPlanId(u.plan_actif?.id ?? "");
    setOpen(true);
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 sm:space-y-8 overflow-x-hidden">
      <DashboardPageHeader
        title="Utilisateurs"
        description="Activer ou désactiver les comptes et associer un plan d’abonnement."
      />

      <div className="dashboard-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/40">
                <th className={th}>Email</th>
                <th className={th}>Nom</th>
                <th className={th}>Plan</th>
                <th className={th}>Statut</th>
                <th className={cn(th, "text-right")}>Action</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-b border-border/40 last:border-0 hover:bg-muted/25 transition-colors">
                  <td className={cn(td, "font-medium")}>{u.email}</td>
                  <td className={td}>{u.nom || "—"}</td>
                  <td className={td}>{u.plan_actif?.nom ?? "—"}</td>
                  <td className={td}>{u.is_active ? "Actif" : "Désactivé"}</td>
                  <td className={cn(td, "text-right")}>
                    <Button variant="outline" size="sm" className="rounded-xl border-border/70" onClick={() => openEdit(u.id)}>
                      Gérer
                    </Button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className={cn(td, "py-10 text-center text-muted-foreground")}>
                    Aucun utilisateur.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setCurrent(null);
        }}
        title="Gérer l’utilisateur"
        footer={
          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" className="rounded-xl border-border/70" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button variant="gradient" className="rounded-xl min-h-10 px-5 shadow-glow" onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Sauvegarde…" : "Sauvegarder"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-border/60 bg-muted/25 p-4">
            <p className="text-sm font-semibold">{current?.email}</p>
            <p className="text-sm text-muted-foreground">{current?.nom || ""}</p>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-4 bg-background/50">
            <div>
              <p className="text-sm font-semibold">Compte actif</p>
              <p className="text-xs text-muted-foreground mt-0.5">Désactive l’accès si nécessaire.</p>
            </div>
            <button
              type="button"
              className={cn(dashboardInput, "w-auto shrink-0 px-4 cursor-pointer font-medium")}
              onClick={() => setActive((v) => !v)}
            >
              {active ? "Actif" : "Désactivé"}
            </button>
          </div>
          <div>
            <label className={labelClass}>Plan actif</label>
            <select
              className={cn(dashboardInput, "mt-2 cursor-pointer")}
              value={planId}
              onChange={(e) => setPlanId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">—</option>
              {(plans ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
