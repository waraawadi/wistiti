"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { DashboardPageHeader } from "@/components/dashboard-page-header";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { dashboardInput } from "@/lib/dashboard-ui";
import { applyCssVariables } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

type PatchConfigResponse = {
  app_name: string;
  color_primary: string;
  color_secondary: string;
  color_white: string;
  logo_url: string;
};

const labelClass = "text-[10px] font-bold uppercase tracking-wider text-muted-foreground block";

export default function AdminConfigPage() {
  const storeAppName = useAppStore((s) => s.appName);
  const storeColorPrimary = useAppStore((s) => s.colorPrimary);
  const storeColorSecondary = useAppStore((s) => s.colorSecondary);
  const storeColorWhite = useAppStore((s) => s.colorWhite);
  const storeLogoUrl = useAppStore((s) => s.logoUrl);
  const setTheme = useAppStore((s) => s.setTheme);

  const [appName, setAppName] = useState(storeAppName || "PhotoEvent");
  const [colorPrimary, setColorPrimary] = useState(storeColorPrimary || "#d2016f");
  const [colorSecondary, setColorSecondary] = useState(storeColorSecondary || "#4e07d9");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(storeLogoUrl || "");

  const livePreview = useMemo(() => {
    return {
      app_name: appName,
      color_primary: colorPrimary,
      color_secondary: colorSecondary,
      color_white: storeColorWhite || "#ffffff",
      logo_url: logoPreview,
    };
  }, [appName, colorPrimary, colorSecondary, logoPreview, storeColorWhite]);

  useEffect(() => {
    applyCssVariables({
      color_primary: livePreview.color_primary,
      color_secondary: livePreview.color_secondary,
      color_white: livePreview.color_white,
    });
    if (typeof document !== "undefined") document.title = livePreview.app_name;
  }, [livePreview]);

  const mutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.set("app_name", appName);
      fd.set("color_primary", colorPrimary);
      fd.set("color_secondary", colorSecondary);
      if (logoFile) fd.set("logo", logoFile);
      const { data } = await api.patch<PatchConfigResponse>("/api/config/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: (data) => {
      setTheme({
        appName: data.app_name,
        colorPrimary: data.color_primary,
        colorSecondary: data.color_secondary,
        colorWhite: data.color_white,
        logoUrl: data.logo_url ?? "",
      });
      applyCssVariables(data);
      if (typeof document !== "undefined") document.title = data.app_name;
    },
  });

  const gradient = `linear-gradient(135deg, ${colorPrimary}, ${colorSecondary})`;

  return (
    <div className="min-w-0 max-w-full space-y-6 sm:space-y-8 overflow-x-hidden">
      <DashboardPageHeader
        title="Thème & logo"
        description="Identité visuelle et branding de l’application (superuser uniquement)."
      />

      <div className="grid lg:grid-cols-2 gap-5 sm:gap-6 items-start">
        <div className="dashboard-panel p-5 sm:p-6 md:p-7 space-y-5">
          <div>
            <label className={labelClass}>Nom de l’application</label>
            <input
              className={cn(dashboardInput, "mt-2")}
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="PhotoEvent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Couleur principale</label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  value={colorPrimary}
                  onChange={(e) => setColorPrimary(e.target.value)}
                  className="h-11 w-14 p-1 rounded-xl border border-border/70 bg-background cursor-pointer"
                />
                <input
                  className={cn(dashboardInput, "flex-1 min-w-0")}
                  value={colorPrimary}
                  onChange={(e) => setColorPrimary(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Couleur secondaire</label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  value={colorSecondary}
                  onChange={(e) => setColorSecondary(e.target.value)}
                  className="h-11 w-14 p-1 rounded-xl border border-border/70 bg-background cursor-pointer"
                />
                <input
                  className={cn(dashboardInput, "flex-1 min-w-0")}
                  value={colorSecondary}
                  onChange={(e) => setColorSecondary(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>Logo (PNG / SVG)</label>
            <input
              type="file"
              accept="image/png,image/svg+xml"
              className="mt-2 block w-full text-sm text-muted-foreground file:mr-3 file:rounded-xl file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setLogoFile(f);
                if (f) setLogoPreview(URL.createObjectURL(f));
              }}
            />
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Le fichier est envoyé au serveur et enregistré dans la configuration.
            </p>
          </div>

          <div className="pt-1 flex flex-wrap items-center gap-3">
            <Button variant="gradient" className="rounded-xl min-h-11 px-6 shadow-glow" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? "Sauvegarde…" : "Sauvegarder"}
            </Button>
            {mutation.isError && <p className="text-sm text-destructive">Erreur : accès refusé ou données invalides.</p>}
            {mutation.isSuccess && <p className="text-sm text-muted-foreground">Enregistré.</p>}
          </div>
        </div>

        <div className="dashboard-panel overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-border/50 bg-muted/30">
            <h2 className="font-bold font-display text-base sm:text-lg">Prévisualisation</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Mise à jour en temps réel (sans sauvegarde)</p>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            <div className="rounded-xl overflow-hidden border border-border/60 shadow-sm" style={{ background: gradient, color: "#fff" }}>
              <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="" className="h-7 w-7 rounded-lg bg-white/20 object-contain shrink-0" />
                  ) : (
                    <div className="h-7 w-7 rounded-lg bg-white/20 shrink-0" />
                  )}
                  <span className="font-semibold truncate">{appName || "PhotoEvent"}</span>
                </div>
                <span className="text-xs opacity-80 shrink-0">Navbar</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                className="h-11 rounded-xl text-white font-semibold shadow-sm hover:opacity-95 transition-opacity"
                style={{ backgroundColor: colorPrimary }}
              >
                Bouton primaire
              </button>
              <button
                type="button"
                className="h-11 rounded-xl text-white font-semibold shadow-sm hover:opacity-95 transition-opacity"
                style={{ backgroundColor: colorSecondary }}
              >
                Bouton secondaire
              </button>
            </div>

            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="h-14" style={{ background: gradient }} />
              <div className="px-4 py-3 bg-background/80">
                <p className="text-sm text-muted-foreground">Bandeau gradient</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
