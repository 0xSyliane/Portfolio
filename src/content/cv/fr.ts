import type { CvCopy } from "../types.ts";

/** FR CV wording. OWNER: content. Same shape/lengths as ./en.ts (parity test). */
export const cvFr: CvCopy = {
  meta: {
    title: "[[titre CV FR]]",
    description: "[[description CV FR]]",
  },
  headings: {
    profile: "Profil",
    projects: "Projets et expériences",
    education: "Formation",
    skills: "Compétences",
    languages: "Langues",
    links: "Liens",
  },
  headline: "[[titre professionnel]]",
  summary: "[[résumé du profil]]",
  downloadPdf: { label: "Télécharger le CV (PDF)", href: "/cv/syliane-saadbouzid-cv-fr.pdf" },
  entries: [{ id: "entry-1", role: "[[rôle]]", location: "[[lieu]]", bullets: ["[[réalisation]]"] }],
  education: [{ id: "edu-1", degree: "[[diplôme]]", note: "[[précision]]" }],
  skillGroups: [{ id: "web", label: "Web" }],
  languages: [
    { code: "fr", name: "Français", levelLabel: "Langue maternelle" },
    { code: "en", name: "Anglais", levelLabel: "[[niveau]]" },
  ],
  linkLabels: { github: "GitHub", linkedin: "LinkedIn", portfolio: "Portfolio" },
  present: "Présent",
};
