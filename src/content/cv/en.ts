import type { CvCopy } from "../types.ts";

/** EN CV wording. OWNER: content. Same shape/lengths as ./fr.ts (parity test). */
export const cvEn: CvCopy = {
  meta: {
    title: "[[CV title EN]]",
    description: "[[CV description EN]]",
  },
  headings: {
    profile: "Profile",
    projects: "Projects and experience",
    education: "Education",
    skills: "Skills",
    languages: "Languages",
    links: "Links",
  },
  headline: "[[job title]]",
  summary: "[[profile summary]]",
  downloadPdf: { label: "Download the CV (PDF)", href: "/cv/syliane-saadbouzid-cv-en.pdf" },
  entries: [{ id: "entry-1", role: "[[role]]", location: "[[place]]", bullets: ["[[achievement]]"] }],
  education: [{ id: "edu-1", degree: "[[degree]]", note: "[[note]]" }],
  skillGroups: [{ id: "web", label: "Web" }],
  languages: [
    { code: "fr", name: "French", levelLabel: "Native" },
    { code: "en", name: "English", levelLabel: "[[level]]" },
  ],
  linkLabels: { github: "GitHub", linkedin: "LinkedIn", portfolio: "Portfolio" },
  present: "Present",
};
