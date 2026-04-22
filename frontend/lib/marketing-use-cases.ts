import type { LucideIcon } from "lucide-react";
import { Briefcase, Building2, Cake, Heart, Mic2, PartyPopper } from "lucide-react";

export type MarketingUseCase = {
  heroMedia?: {
    type: "image" | "video";
    src: string;
    alt?: string;
    poster?: string;
  };
  slug: string;
  navLabel: string;
  title: string;
  heroLead: string;
  icon: LucideIcon;
  /** Courte phrase sous le titre (landing / cartes) */
  teaser: string;
  /** Paragraphe d’introduction sur la page dédiée */
  intro: string;
  /** Points forts type « pourquoi PhotoEvent ici » */
  highlights: string[];
  /** Angle « ce que vos invités / participants vivent » */
  guestAngle: string;
};

export const MARKETING_USE_CASES: MarketingUseCase[] = [
  {
    slug: "mariages",
    navLabel: "Mariages",
    title: "Mariages",
    heroLead: "Chaque angle, chaque émotion : l’album que votre photographe ne peut pas tout seul remplir.",
    icon: Heart,
    teaser: "Clichés des invités, vin d’honneur, mur en direct : le livre d’or photo dont on parle encore des années après.",
    intro:
      "Votre photographe capture le fil rouge ; vos proches capturent l’instant vécu depuis leur table. Réunissez tout dans un album unique, accessible par QR ou lien — sans appli, sans compte.",
    highlights: [
      "QR sur menus, plan de table ou panneau « scannez-moi » : les photos arrivent tout au long du week-end.",
      "Mur photo en direct pendant la soirée : l’effet waouh qui déclenche encore plus de prises de vue.",
      "Modération optionnelle pour garder une galerie alignée avec l’ambiance que vous voulez montrer.",
      "Export groupé pour retrouver facilement les fichiers après le « oui ».",
    ],
    guestAngle:
      "Les invités ouvrent le lien, glissent leurs photos et revoient le mur : zéro friction, même pour ceux qui « ne sont pas bons en tech ».",
  },
  {
    slug: "anniversaires",
    navLabel: "Anniversaires",
    title: "Anniversaires",
    heroLead: "Souvenirs de famille et copains réunis : un album qui grandit avec la fête.",
    icon: Cake,
    teaser: "Des photos prises par ceux qui sont dans le cercle — simple pour les petits comme pour les grands.",
    intro:
      "Anniversaires d’enfants, milestones, fêtes surprise : tout le monde veut immortaliser le moment. Donnez un seul endroit pour envoyer les clichés, au lieu d’éclater le tout entre groupes et messages privés.",
    highlights: [
      "Pas d’appli à installer : un lien ou un scan suffit.",
      "Idéal quand plusieurs générations sont autour du gâteau.",
      "Vous gardez une trace unique à partager ou à archiver.",
      "Le mur photo peut animer la salle si vous projetez pendant la soirée.",
    ],
    guestAngle:
      "Les parents et amis envoient depuis leur canapé ou sur place ; personne ne se bat pour « passer la photo sur WhatsApp ».",
  },
  {
    slug: "soirees-fetes",
    navLabel: "Soirées & fêtes",
    title: "Soirées & fêtes",
    heroLead: "Soirées, galas, lancements : quand l’énergie monte, l’album suit en temps réel.",
    icon: PartyPopper,
    teaser: "Une expérience collective — QR à l’entrée, ambiance sur écran, volume de clichés multiplié.",
    intro:
      "Soirée DJ, housewarming, réveillon : ce qui compte, c’est le feeling. Un QR bien visible et un mur qui défile créent l’effet « on participe tous au même souvenir ».",
    highlights: [
      "Diffusion du QR par affiche, bracelet, écran d’accueil ou annonce micro.",
      "Mur live pour renforcer l’immersion pendant le pic de la soirée.",
      "Collecte simple pour les personnes qui ne veulent pas quitter la piste.",
      "Après coup : tout centralisé pour relayer sur les réseaux ou archiver.",
    ],
    guestAngle:
      "Scan rapide, envoi en deux gestes : compatible avec une foule qui bouge et un volume de monde.",
  },
  {
    slug: "conferences",
    navLabel: "Conférences",
    title: "Conférences & événements publics",
    heroMedia: {
      type: "image",
      src: "/images/use-cases/conferences-hero-reference.png",
      alt: "Exemple de mur photo en direct pour une conférence",
    },
    heroLead: "Engagez votre audience : la photo devient un canal d’interaction, pas un gadget.",
    icon: Mic2,
    teaser: "QR sur badge ou slide de fin : les participants alimentent l’album officiel de l’événement.",
    intro:
      "Salons, conférences, journées portes ouvertes : vous voulez de l’UGC authentique et modérable. PhotoEvent centralise les envois et vous laisse activer la validation si le public est large.",
    highlights: [
      "QR sur supports imprimés, kiosque ou dernière slide.",
      "Modération recommandée pour les gros publics.",
      "Mur photo en salle annexe ou networking pour créer du buzz.",
      "Un seul lien à communiquer dans le replay ou le compte-rendu.",
    ],
    guestAngle:
      "Les participants contribuent sans créer de compte : idéal pour un public one-shot et international.",
  },
  {
    slug: "entreprise",
    navLabel: "Entreprise",
    title: "Entreprise & team building",
    heroLead: "Séminaires, afterworks, kick-offs : capitalisez sur ce que vos équipes ont filmé.",
    icon: Building2,
    teaser: "Renforcez l’appartenance avec un album vivant — interne, sobre, sous votre contrôle.",
    intro:
      "Team building, soirée de fin d’année, lancement produit : les meilleures photos sont souvent prises par les équipes. Offrez-leur un canal simple et gardez la maîtrise de la diffusion.",
    highlights: [
      "Parfait pour compléter le travail du photographe officiel.",
      "Liens et QR adaptés aux espaces pro (accueil, salle, chat interne).",
      "Modération et téléchargement pour alimenter la com interne ou les archives.",
      "Zéro friction pour les collaborateurs déjà saturés d’outils.",
    ],
    guestAngle:
      "Envoi depuis le téléphone pro ou perso, en quelques secondes entre deux conversations.",
  },
  {
    slug: "professionnels",
    navLabel: "Organisateurs",
    title: "Professionnels de l’événementiel",
    heroLead: "Wedding planners, agences, lieux : un service blanc à proposer à chaque client.",
    icon: Briefcase,
    teaser: "Même outil pour tous vos dossiers : vous dupliquez l’expérience « album invités » événement après événement.",
    intro:
      "Vous livrez déjà la mise en scène ; ajoutez la couche « collecte photo invités » sans reconstruire un process à chaque fois. Une expérience cohérente avec votre image, des briefs clients plus courts.",
    highlights: [
      "Argumentaire simple à inclure dans vos propositions.",
      "QR et mur photo comme options premium ou incluses.",
      "Tarification alignée sur le volume d’événements que vous enchaînez.",
      "Vos clients repartent avec un livrable tangible en plus des photos pro.",
    ],
    guestAngle:
      "Vos clients finaux envoient à leurs invités un parcours déjà rodé — vous gardez la main sur la création d’événement.",
  },
];

export const MARKETING_USE_CASE_SLUGS = MARKETING_USE_CASES.map((c) => c.slug);

export const MARKETING_USE_CASES_BY_SLUG = Object.fromEntries(
  MARKETING_USE_CASES.map((c) => [c.slug, c]),
) as Record<string, MarketingUseCase>;
