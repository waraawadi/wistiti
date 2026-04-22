"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { dashboardInput } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

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

type BillingPrices = {
  topup_price_per_photo_xof: number;
  guest_download_price_per_photo_xof: number;
};

const th = "text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4";
const td = "px-5 py-3 text-sm";
const labelClass = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground block";

function ToggleRow({
  title,
  hint,
  on,
  onToggle,
}: {
  title: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 p-4 bg-muted/20">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
      </div>
      <button type="button" className={cn(dashboardInput, "w-auto shrink-0 px-4 cursor-pointer font-medium")} onClick={onToggle}>
        {on ? "On" : "Off"}
      </button>
    </div>
  );
}

export default function AdminPlansPage() {
  const qc = useQueryClient();
  const { data: billingPrices } = useQuery({
    queryKey: ["admin-billing-prices"],
    queryFn: async () => (await api.get<BillingPrices>("/api/admin/billing-prices/")).data,
  });
  const { data } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => (await api.get<Plan[]>("/api/admin/plans/")).data,
  });
  const list = useMemo(() => data ?? [], [data]);
  const byId = useMemo(() => new Map(list.map((p) => [p.id, p])), [list]);
  const [isBillingEdit, setIsBillingEdit] = useState(false);
  const [topupPrice, setTopupPrice] = useState(25);
  const [guestDownloadPrice, setGuestDownloadPrice] = useState(25);

  useEffect(() => {
    if (!billingPrices || isBillingEdit) return;
    setTopupPrice(billingPrices.topup_price_per_photo_xof);
    setGuestDownloadPrice(billingPrices.guest_download_price_per_photo_xof);
  }, [billingPrices, isBillingEdit]);

  const [open, setOpen] = useState(false);
  const [isCreate, setIsCreate] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  const [nom, setNom] = useState("");
  const [prix, setPrix] = useState(0);
  const [uploadsMax, setUploadsMax] = useState(50);
  const [eventsMax, setEventsMax] = useState(1);
  const [albumsMax, setAlbumsMax] = useState(2);
  const [duree, setDuree] = useState(30);
  const [hq, setHq] = useState(true);
  const [mod, setMod] = useState(true);
  const [modAdv, setModAdv] = useState(false);
  const [support, setSupport] = useState(false);

  function openCreate() {
    setIsCreate(true);
    setCurrentId(null);
    setNom("");
    setPrix(0);
    setUploadsMax(50);
    setEventsMax(1);
    setAlbumsMax(2);
    setDuree(30);
    setHq(true);
    setMod(true);
    setModAdv(false);
    setSupport(false);
    setOpen(true);
  }

  function openEdit(id: number) {
    const p = byId.get(id);
    if (!p) return;
    setIsCreate(false);
    setCurrentId(id);
    setNom(p.nom);
    setPrix(p.prix_xof);
    setUploadsMax(p.nb_uploads_max);
    setEventsMax(p.nb_evenements_max);
    setAlbumsMax(p.nb_albums_max ?? 2);
    setDuree(p.duree_jours);
    setHq(p.hq_enabled);
    setMod(p.moderation_enabled);
    setModAdv(p.moderation_avancee);
    setSupport(p.support_prioritaire);
    setOpen(true);
  }

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        nom,
        prix_xof: prix,
        nb_uploads_max: uploadsMax,
        nb_evenements_max: eventsMax,
        nb_albums_max: albumsMax,
        duree_jours: duree,
        hq_enabled: hq,
        moderation_enabled: mod,
        moderation_avancee: modAdv,
        support_prioritaire: support,
      };
      if (isCreate) {
        await api.post("/api/admin/plans/", payload);
      } else if (currentId) {
        await api.patch(`/api/admin/plans/${currentId}/`, payload);
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-plans"] });
      setOpen(false);
    },
  });

  const del = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/admin/plans/${id}/`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-plans"] });
    },
  });

  const saveBillingPrices = useMutation({
    mutationFn: async () => {
      await api.patch("/api/admin/billing-prices/", {
        topup_price_per_photo_xof: topupPrice,
        guest_download_price_per_photo_xof: guestDownloadPrice,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-billing-prices"] });
      setIsBillingEdit(false);
    },
  });

  return (
    <div className="min-w-0 max-w-full space-y-6 sm:space-y-8 overflow-x-hidden">
      <DashboardPageHeader
        title="Plans"
        description="Créez et ajustez les forfaits d’abonnement (quotas, durée, options)."
        actions={
          <Button variant="gradient" className="rounded-xl min-h-11 px-6 shadow-glow" onClick={openCreate}>
            Créer un plan
          </Button>
        }
      />

      <div className="dashboard-panel p-5 sm:p-6 md:p-7 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-bold font-display text-base sm:text-lg">Tarifs globaux (hors abonnements)</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
              Ces montants servent aux achats à la photo : recharge abonné et téléchargement invité.
            </p>
          </div>
          {!isBillingEdit ? (
            <Button variant="outline" className="rounded-xl border-border/70" onClick={() => setIsBillingEdit(true)}>
              Modifier
            </Button>
          ) : (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                variant="outline"
                className="rounded-xl border-border/70"
                onClick={() => {
                  setIsBillingEdit(false);
                  if (billingPrices) {
                    setTopupPrice(billingPrices.topup_price_per_photo_xof);
                    setGuestDownloadPrice(billingPrices.guest_download_price_per_photo_xof);
                  }
                }}
                disabled={saveBillingPrices.isPending}
              >
                Annuler
              </Button>
              <Button
                variant="gradient"
                className="rounded-xl shadow-glow"
                onClick={() => saveBillingPrices.mutate()}
                disabled={saveBillingPrices.isPending}
              >
                {saveBillingPrices.isPending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          )}
        </div>

        {!isBillingEdit ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Recharge abonné</p>
              <p className="mt-2 text-lg font-semibold tabular-nums">
                {billingPrices?.topup_price_per_photo_xof ?? topupPrice} XOF
                <span className="ml-1 text-sm font-normal text-muted-foreground">/ photo</span>
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Téléchargement invité</p>
              <p className="mt-2 text-lg font-semibold tabular-nums">
                {billingPrices?.guest_download_price_per_photo_xof ?? guestDownloadPrice} XOF
                <span className="ml-1 text-sm font-normal text-muted-foreground">/ photo</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Recharge abonné (XOF / photo)</label>
              <input
                type="number"
                min={1}
                className={cn(dashboardInput, "mt-2")}
                value={topupPrice}
                onChange={(e) => setTopupPrice(Number(e.target.value))}
              />
            </div>
            <div>
              <label className={labelClass}>Téléchargement invité (XOF / photo)</label>
              <input
                type="number"
                min={1}
                className={cn(dashboardInput, "mt-2")}
                value={guestDownloadPrice}
                onChange={(e) => setGuestDownloadPrice(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {saveBillingPrices.isError && (
          <p className="text-sm text-destructive">Impossible d’enregistrer ces tarifs.</p>
        )}
      </div>

      <div className="dashboard-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/40">
                <th className={th}>Nom</th>
                <th className={th}>Prix</th>
                <th className={th}>Événements</th>
                <th className={th}>Albums / évén.</th>
                <th className={th}>Uploads</th>
                <th className={th}>Durée</th>
                <th className={cn(th, "text-right")}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-border/40 last:border-0 hover:bg-muted/25 transition-colors">
                  <td className={cn(td, "font-medium")}>{p.nom}</td>
                  <td className={cn(td, "tabular-nums")}>{p.prix_xof} XOF</td>
                  <td className={td}>{p.nb_evenements_max === -1 ? "∞" : p.nb_evenements_max}</td>
                  <td className={td}>{p.nb_albums_max === -1 ? "∞" : p.nb_albums_max}</td>
                  <td className={td}>{p.nb_uploads_max === -1 ? "∞" : p.nb_uploads_max}</td>
                  <td className={td}>{p.duree_jours} j</td>
                  <td className={cn(td, "text-right")}>
                    <div className="inline-flex flex-wrap items-center justify-end gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl border-border/70" onClick={() => openEdit(p.id)}>
                        Modifier
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-xl text-destructive hover:text-destructive" onClick={() => del.mutate(p.id)} disabled={del.isPending}>
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={7} className={cn(td, "py-10 text-center text-muted-foreground")}>
                    Aucun plan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={isCreate ? "Créer un plan" : "Modifier le plan"}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[min(70vh,32rem)] overflow-y-auto pr-1">
          <div className="sm:col-span-2">
            <label className={labelClass}>Nom</label>
            <input className={cn(dashboardInput, "mt-2")} value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Prix (XOF)</label>
            <input type="number" className={cn(dashboardInput, "mt-2")} value={prix} onChange={(e) => setPrix(Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Uploads max (-1 = ∞)</label>
            <input type="number" className={cn(dashboardInput, "mt-2")} value={uploadsMax} onChange={(e) => setUploadsMax(Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Événements max (-1 = ∞)</label>
            <input type="number" className={cn(dashboardInput, "mt-2")} value={eventsMax} onChange={(e) => setEventsMax(Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Albums max / événement (-1 = ∞)</label>
            <p className="text-xs text-muted-foreground mt-1 leading-snug">Inclut l’album public (ex. 2 = 1 public + 1 privé).</p>
            <input type="number" className={cn(dashboardInput, "mt-2")} value={albumsMax} onChange={(e) => setAlbumsMax(Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>Durée (jours)</label>
            <input type="number" className={cn(dashboardInput, "mt-2")} value={duree} onChange={(e) => setDuree(Number(e.target.value))} />
          </div>
          <div className="sm:col-span-2 space-y-3 pt-1">
            <ToggleRow title="HQ" hint="Haute qualité" on={hq} onToggle={() => setHq((v) => !v)} />
            <ToggleRow title="Modération" hint="Fonction modération de base" on={mod} onToggle={() => setMod((v) => !v)} />
            <ToggleRow title="Modération avancée" hint="Fonctions avancées" on={modAdv} onToggle={() => setModAdv((v) => !v)} />
            <ToggleRow title="Support prioritaire" hint="SLA / réponse rapide" on={support} onToggle={() => setSupport((v) => !v)} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
