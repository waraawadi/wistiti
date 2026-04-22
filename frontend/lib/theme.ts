import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";

/** Réponse publique backend */
export type PublicConfig = {
  app_name: string;
  color_primary: string;
  color_secondary: string;
  color_white: string;
  logo_url: string;
  topup_price_per_photo_xof: number;
  guest_download_price_per_photo_xof: number;
};

export function applyCssVariables(c: Pick<PublicConfig, "color_primary" | "color_secondary" | "color_white">) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  // Spécification projet : variables CSS en HEX.
  root.style.setProperty("--color-primary", c.color_primary);
  root.style.setProperty("--color-secondary", c.color_secondary);
  root.style.setProperty("--color-white", c.color_white);
  root.style.setProperty("--gradient-main", `linear-gradient(135deg, ${c.color_primary}, ${c.color_secondary})`);
}

/** Charge la config publique, met à jour le store Zustand et les custom properties CSS. */
export async function initTheme(): Promise<PublicConfig> {
  const { data } = await api.get<PublicConfig>("/api/config/");
  useAppStore.getState().setTheme({
    appName: data.app_name,
    colorPrimary: data.color_primary,
    colorSecondary: data.color_secondary,
    colorWhite: data.color_white,
    logoUrl: data.logo_url ?? "",
  });
  applyCssVariables(data);
  if (typeof document !== "undefined") {
    document.title = data.app_name;
  }
  return data;
}
