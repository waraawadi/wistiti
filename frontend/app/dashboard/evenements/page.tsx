"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Images, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Dialog } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { dashboardInput, dashboardTextarea, dashboardTitleInput } from "@/lib/dashboard-ui";

type Evenement = {
  id: number;
  titre: string;
  slug: string;
  date: string;
  expires_at: string | null;
  actif: boolean;
  description?: string;
};

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 16);
}

export default function EvenementsListPage() {
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [current, setCurrent] = useState<Evenement | null>(null);

  const [titre, setTitre] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["evenements"],
    queryFn: async () => (await api.get<Evenement[]>("/api/evenements/")).data,
  });

  const events = useMemo(() => data ?? [], [data]);
  const eventsBySlug = useMemo(() => new Map(events.map((e) => [e.slug, e])), [events]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate) {
        throw new Error("MISSING_DATES");
      }
      if (new Date(endDate) <= new Date(startDate)) {
        throw new Error("INVALID_RANGE");
      }
      const { data: created } = await api.post<{ slug: string }>("/api/evenements/", {
        titre,
        date: startDate,
        expires_at: endDate,
        description,
      });
      return created;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["evenements"] });
      await qc.invalidateQueries({ queryKey: ["evenements-dashboard-stats"] });
      await qc.invalidateQueries({ queryKey: ["paiements-usage"] });
      setCreateOpen(false);
      setTitre("");
      setStartDate("");
      setEndDate("");
      setDescription("");
      setFormError(null);
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "MISSING_DATES") {
        setFormError("Veuillez renseigner la date/heure de début et de fin.");
        return;
      }
      if (error instanceof Error && error.message === "INVALID_RANGE") {
        setFormError("La date/heure de fin doit être après la date/heure de début.");
        return;
      }
      setFormError("Impossible de créer l’événement.");
    },
  });

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!current) throw new Error("no current");
      if (!startDate || !endDate) {
        throw new Error("MISSING_DATES");
      }
      if (new Date(endDate) <= new Date(startDate)) {
        throw new Error("INVALID_RANGE");
      }
      await api.put(`/api/evenements/${current.slug}/`, {
        titre,
        date: startDate,
        expires_at: endDate,
        description,
        actif: current.actif,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["evenements"] });
      await qc.invalidateQueries({ queryKey: ["evenements-dashboard-stats"] });
      await qc.invalidateQueries({ queryKey: ["paiements-usage"] });
      setEditOpen(false);
      setCurrent(null);
      setFormError(null);
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "MISSING_DATES") {
        setFormError("Veuillez renseigner la date/heure de début et de fin.");
        return;
      }
      if (error instanceof Error && error.message === "INVALID_RANGE") {
        setFormError("La date/heure de fin doit être après la date/heure de début.");
        return;
      }
      setFormError("Impossible de modifier l’événement.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!current) throw new Error("no current");
      await api.delete(`/api/evenements/${current.slug}/`);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["evenements"] });
      await qc.invalidateQueries({ queryKey: ["evenements-dashboard-stats"] });
      await qc.invalidateQueries({ queryKey: ["paiements-usage"] });
      setDeleteOpen(false);
      setCurrent(null);
    },
  });

  function openCreate() {
    setFormError(null);
    setTitre("");
    setStartDate("");
    setEndDate("");
    setDescription("");
    setCreateOpen(true);
  }

  function openEdit(slug: string) {
    const ev = eventsBySlug.get(slug) ?? null;
    if (!ev) return;
    setCurrent(ev);
    setFormError(null);
    setTitre(ev.titre ?? "");
    setStartDate(toDateTimeLocalValue(ev.date));
    setEndDate(toDateTimeLocalValue(ev.expires_at));
    setDescription((ev as any).description ?? "");
    setEditOpen(true);
  }

  function openDelete(slug: string) {
    const ev = eventsBySlug.get(slug) ?? null;
    if (!ev) return;
    setCurrent(ev);
    setDeleteOpen(true);
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Mes événements"
        description="Créez, modifiez et gérez vos événements."
        actions={
          <Button size="sm" variant="gradient" className="rounded-xl shadow-glow" onClick={openCreate}>
            <Plus size={16} className="mr-1" /> Créer un événement
          </Button>
        }
      />

      <div className="dashboard-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50 bg-muted/40">
                <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4">Événement</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4">Période</th>
                <th className="text-left text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4">Statut</th>
                <th className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.slug} className="border-b border-border/40 last:border-0 hover:bg-muted/25 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-semibold">{ev.titre}</td>
                  <td className="px-5 py-3.5 text-sm text-muted-foreground">
                    {new Date(ev.date).toLocaleString("fr-FR")}
                    {ev.expires_at ? ` → ${new Date(ev.expires_at).toLocaleString("fr-FR")}` : ""}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        ev.actif ? "bg-primary/12 text-primary ring-1 ring-primary/20" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {ev.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(ev.slug)}
                        className="h-8 rounded-xl border-[color-mix(in_srgb,var(--color-primary)_38%,transparent)] bg-background/90 px-3 text-xs font-semibold text-[var(--color-primary)] shadow-sm backdrop-blur-sm transition-all hover:border-[color-mix(in_srgb,var(--color-primary)_55%,transparent)] hover:bg-[var(--color-primary-light)] hover:shadow-md"
                      >
                        <Pencil className="size-3.5" aria-hidden />
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openDelete(ev.slug)}
                        className="h-8 rounded-xl px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                        Supprimer
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-xl border border-[color-mix(in_srgb,var(--color-secondary)_32%,transparent)] bg-[color-mix(in_srgb,var(--color-secondary)_10%,transparent)] px-3 text-xs font-semibold text-[var(--color-secondary)] shadow-sm transition-all hover:border-[color-mix(in_srgb,var(--color-secondary)_45%,transparent)] hover:!bg-[color-mix(in_srgb,var(--color-secondary)_18%,transparent)] hover:shadow-md hover:!text-[var(--color-secondary)]"
                      >
                        <Link href={`/dashboard/evenements/${ev.slug}/partage`}>
                          <Share2 className="size-3.5" aria-hidden />
                          QR &amp; Partage
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_9%,transparent)] px-3 text-xs font-semibold text-[var(--color-primary)] shadow-sm transition-all hover:border-[color-mix(in_srgb,var(--color-primary)_48%,transparent)] hover:!bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] hover:shadow-md hover:!text-[var(--color-primary)]"
                      >
                        <Link href={`/dashboard/evenements/${ev.slug}/medias`}>
                          <Images className="size-3.5" aria-hidden />
                          Médias
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr>
                  <td className="px-5 py-10 text-sm text-muted-foreground text-center" colSpan={4}>
                    Aucun événement pour l’instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Créer un événement"
        footer={
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Création…" : "Créer"}
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Titre</label>
            <input
              className={`${dashboardTitleInput} mt-2`}
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date et heure de début</label>
            <DateTimePicker
              className="mt-2"
              value={startDate}
              onChange={setStartDate}
              placeholder="Sélectionner le début"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date et heure de fin</label>
            <DateTimePicker
              className="mt-2"
              value={endDate}
              onChange={setEndDate}
              placeholder="Sélectionner la fin"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea
              className={`${dashboardTextarea} mt-2`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </div>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setCurrent(null);
        }}
        title="Modifier l’événement"
        footer={
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => editMutation.mutate()} disabled={editMutation.isPending}>
              {editMutation.isPending ? "Sauvegarde…" : "Sauvegarder"}
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Titre</label>
            <input
              className={`${dashboardTitleInput} mt-2`}
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date et heure de début</label>
            <DateTimePicker
              className="mt-2"
              value={startDate}
              onChange={setStartDate}
              placeholder="Sélectionner le début"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date et heure de fin</label>
            <DateTimePicker
              className="mt-2"
              value={endDate}
              onChange={setEndDate}
              placeholder="Sélectionner la fin"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Description</label>
            <textarea
              className={`${dashboardTextarea} mt-2`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </div>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => {
          setDeleteOpen(o);
          if (!o) setCurrent(null);
        }}
        title="Supprimer l’événement"
        footer={
          <div className="flex gap-3">
            <Button
              className="flex-1"
              variant="primary"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Suppression…" : "Supprimer"}
            </Button>
            <Button className="flex-1" variant="outline" onClick={() => setDeleteOpen(false)}>
              Annuler
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Voulez-vous vraiment supprimer <span className="font-medium text-foreground">{current?.titre ?? "cet événement"}</span> ?
          Cette action est irréversible.
        </p>
      </Dialog>
    </div>
  );
}

