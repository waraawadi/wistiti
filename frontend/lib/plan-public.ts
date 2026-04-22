/** Plan tel que renvoyé par GET /api/paiements/plans/ */
export type PublicPlan = {
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

export function formatPlanFeaturesForMarketing(p: PublicPlan): string[] {
  const events =
    p.nb_evenements_max === -1
      ? "Événements illimités"
      : `Jusqu’à ${p.nb_evenements_max} événement${p.nb_evenements_max > 1 ? "s" : ""}`;
  const photos =
    p.nb_uploads_max === -1
      ? "Photos illimitées"
      : `Jusqu’à ${p.nb_uploads_max.toLocaleString("fr-FR")} photos`;
  const albumsMax = p.nb_albums_max ?? 2;
  const albums =
    albumsMax === -1
      ? "Albums illimités par événement"
      : `${albumsMax} album${albumsMax > 1 ? "s" : ""} par événement`;

  return [
    `${p.duree_jours} jour${p.duree_jours > 1 ? "s" : ""} inclus`,
    events,
    albums,
    photos,
    p.hq_enabled ? "Mur photo & affichage haute qualité" : "Mur photo & diffusion en direct",
    p.moderation_avancee
      ? "Modération avancée (file d’attente, contrôle fin)"
      : p.moderation_enabled
        ? "Vous validez chaque photo avant publication"
        : "Photos publiées sans relecture",
    p.support_prioritaire ? "Support prioritaire (réponse rapide)" : "Support e-mail",
    "QR codes & lien invité en un clic",
    "Export ZIP de l’album",
  ];
}

/** Plan payant le plus complet (prix le plus élevé) — badge « Idéal pour vous ». */
export function recommendedPlanId(plans: PublicPlan[]): number | null {
  if (plans.length < 2) return null;
  const paid = plans.filter((p) => p.prix_xof > 0);
  if (paid.length === 0) return null;
  const maxPrice = Math.max(...paid.map((p) => p.prix_xof));
  const top = paid.filter((p) => p.prix_xof === maxPrice);
  return top[top.length - 1]?.id ?? null;
}

export function limitLabel(n: number): string {
  if (n === -1) return "Illimité";
  return String(n);
}
