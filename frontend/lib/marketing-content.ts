import type { LucideIcon } from "lucide-react";
import { Camera, Download, Image as ImageIcon, Monitor, QrCode, Shield } from "lucide-react";

export type MarketingFeature = {
  icon: LucideIcon;
  title: string;
  desc: string;
  tag?: string;
};

export const MARKETING_FEATURES: MarketingFeature[] = [
  {
    icon: ImageIcon,
    title: "Un album qui fait « waouh »",
    desc: "Une galerie soignée, accessible par lien ou QR : vos invités voient tout de suite où déposer leurs clichés.",
    tag: "Image de marque",
  },
  {
    icon: QrCode,
    title: "QR prêt à imprimer",
    desc: "Affiches, menus, écrans géants : un scan à peine fait, c’est déjà dans l’album. Zéro explication compliquée.",
    tag: "Viral",
  },
  {
    icon: Monitor,
    title: "Mur photo en direct",
    desc: "Projeter les souvenirs sur grand écran pendant la soirée : l’émotion monte, les téléphones sortent encore plus.",
    tag: "Live",
  },
  {
    icon: Camera,
    title: "Zéro app à télécharger",
    desc: "Le navigateur suffit. Grand-père comme petit-neveu : tout le monde participe en deux gestes.",
    tag: "Inclusion",
  },
  {
    icon: Download,
    title: "Récupérez tout, proprement",
    desc: "Archive ZIP, partage payant au besoin : vous gardez la maîtrise sur qui repart avec quoi.",
    tag: "Contrôle",
  },
  {
    icon: Shield,
    title: "Vous gardez la main",
    desc: "Avec ou sans validation photo, vous choisissez le niveau de modération selon l’ambiance de votre événement.",
    tag: "Sérénité",
  },
];

export const MARKETING_STEPS = [
  {
    num: 1,
    title: "Créez l’événement en un éclair",
    desc: "Nom, date, consignes : c’est ouvert. Vous obtenez instantanément le QR et les liens à partager.",
  },
  {
    num: 2,
    title: "Diffusez le QR comme un pro",
    desc: "Story Instagram, panneau à l’entrée, toast du discours : plus le QR circule, plus l’album grossit tout seul.",
  },
  {
    num: 3,
    title: "Revivez, projetez, archivez",
    desc: "Le mur photo anime la salle, la modération vous rassure, le téléchargement clos la boucle pour vous et vos clients.",
  },
];
