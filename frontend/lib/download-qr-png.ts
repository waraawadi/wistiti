import { api } from "@/lib/api";

import { downloadBlob } from "./download-blob";

/**
 * GET PNG (endpoint public) via le client API pour éviter l’ouverture d’un nouvel onglet
 * (les balises <a href> vers l’API peuvent naviguer selon le navigateur / CORS).
 */
export async function downloadQrPngFromPath(apiPathOrUrl: string, filename: string) {
  const path =
    apiPathOrUrl.startsWith("http://") || apiPathOrUrl.startsWith("https://")
      ? new URL(apiPathOrUrl).pathname + (new URL(apiPathOrUrl).search || "")
      : apiPathOrUrl;
  const { data } = await api.get(path, { responseType: "blob" });
  downloadBlob(data as Blob, filename);
}
