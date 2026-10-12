import type { CvCopy } from "../types.ts";

/**
 * FR CV wording. Same shape and list lengths as ./en.ts (parity test). Only facts the owner
 * stated: nothing is invented. French punctuation: U+00A0 before `: ; ? !`.
 */
export const cvFr: CvCopy = {
  meta: {
    title: "CV Syliane Saadbouzid — Développeur web et automatisation",
    description:
      "CV de Syliane Saadbouzid : développeur web à Alger, étudiant à l'USTHB. Projets, formation, compétences (TypeScript, Next.js, Python, PostgreSQL), PDF.",
  },
  headings: {
    profile: "Profil",
    projects: "Expérience et projets",
    education: "Formation",
    skills: "Compétences",
    languages: "Langues",
    links: "Liens",
  },
  place: "Alger",
  headline: "Développeur web full-stack, automatisation et IA",
  summary:
    "Développeur web full-stack basé à Alger, en télétravail. Je crée des sites, des applications web et des boutiques en ligne (TypeScript, Next.js, Python, PostgreSQL) et j'automatise les tâches répétitives avec n8n, Power Automate, Python et des modèles d'IA en local (Ollama, llama.cpp). Auto-entrepreneur ; étudiant en 3e année à l'USTHB, en stage chez Alcodefi. Ouvert aux missions freelance à distance.",
  downloadPdf: { label: "Télécharger le CV (PDF)", href: "/cv/syliane-saadbouzid-cv-fr.pdf" },
  entries: [
    {
      id: "alcodefi",
      role: "Stagiaire : développement web et gestion de données",
      location: "Alcodefi, établissement de formation professionnelle, Alger",
      bullets: [
        "Développement web, dont le site alcodefi.org (Next.js).",
        "Gestion de données : organisation des fichiers papier et numériques, vérification des erreurs lors du passage du papier au numérique, import des données dans Excel.",
      ],
    },
    {
      id: "boutique",
      role: "Boutique en ligne sur mesure",
      location: "Projet personnel",
      bullets: [
        "Base réutilisable : catalogue, commande avec paiement à la livraison, back-office, français et arabe avec lecture de droite à gauche, CSP stricte, tests, déploiement sur Vercel.",
      ],
    },
    {
      id: "creche",
      role: "Site de la Crèche des Anges",
      location: "Projet personnel, en cours",
      bullets: ["Site vitrine bilingue d'une crèche et école maternelle, en français et en arabe (de droite à gauche)."],
    },
    {
      id: "shellmates",
      role: "Site du club Shellmates",
      location: "Club de cybersécurité de l'USTHB",
      bullets: ["Projet d'équipe, comme membre du département développement du club (ancien membre)."],
    },
    {
      id: "blaze-type",
      role: "Blaze Type",
      location: "Projet en solo",
      bullets: ["Application de test de vitesse de frappe, avec vitesse (WPM) et précision en direct."],
    },
  ],
  education: [
    {
      id: "usthb",
      degree: "Études d'ingénieur, 3e année",
      note: "Alger",
    },
    {
      id: "excel",
      degree: "Formation suivie",
      note: "",
    },
  ],
  skillGroups: [
    { id: "web", label: "Web" },
    { id: "backend", label: "Back-end et données" },
    { id: "automation", label: "Automatisation et IA" },
    { id: "integrations", label: "Intégrations" },
    { id: "data", label: "Données" },
    { id: "tools", label: "Outils (Docker en usage occasionnel)" },
  ],
  languages: [
    { code: "fr", name: "Français" },
    { code: "en", name: "Anglais" },
    { code: "ar", name: "Arabe" },
  ],
  linkLabels: { github: "GitHub", linkedin: "LinkedIn", portfolio: "Portfolio" },
  present: "Présent",
};
