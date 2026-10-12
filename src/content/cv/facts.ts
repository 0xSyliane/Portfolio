import type { CvFacts } from "../types.ts";

/**
 * Language-independent CV facts (dates, orgs, URLs, stack), transcribed from the approved copy.
 * Single source for the /cv pages, print.css and the PDF. ISO dates only (`YYYY`, `YYYY-MM`).
 * `[[…]]` = unknown: the owner fills it in. City only: no phone, street address,
 * birth date or photo on the public CV (threat model H5).
 *
 * An entry with no `end` is ongoing ("Present"), except while `start` is still a
 * placeholder: the page then prints the placeholder alone.
 */
export const cvFacts: CvFacts = {
  profile: { name: "Syliane Saadbouzid", city: "Alger", country: "Algérie" },
  entries: [
    {
      id: "alcodefi-web",
      kind: "work",
      org: "Alcodefi",
      stack: ["Next.js"],
      url: "https://www.alcodefi.org/",
    },
    {
      id: "boutique",
      kind: "project",
      org: "Syliane Saadbouzid",
      stack: ["Next.js", "TypeScript", "PostgreSQL", "Vitest"],
    },
    {
      id: "creche",
      kind: "project",
      org: "Syliane Saadbouzid",
      stack: ["Astro", "TypeScript", "Vercel"],
    },
    {
      id: "shellmates",
      kind: "community",
      org: "Shellmates, USTHB",
      start: "2024",
      end: "2025",
      stack: ["Next.js", "TypeScript", "Tailwind CSS"],
      url: "https://www.shellmates.club/",
    },
    {
      id: "blaze-type",
      kind: "project",
      org: "Syliane Saadbouzid",
      stack: ["JavaScript", "CSS", "Vercel"],
      url: "https://blaze-type.vercel.app/",
    },
    {
      id: "alcodefi-data",
      kind: "work",
      org: "Alcodefi",
      start: "2022",
      end: "2022",
      stack: ["Excel"],
    },
  ],
  education: [
    { id: "usthb", institution: "USTHB", start: "2024" },
    { id: "excel", institution: "Alcodefi", start: "2022", end: "2022" },
  ],
  skills: [
    { id: "web", items: ["TypeScript", "React", "Next.js", "Astro", "Tailwind CSS", "Node.js"] },
    { id: "backend", items: ["Python", "PostgreSQL", "Odoo (Python/XML/QWeb)"] },
    { id: "automation", items: ["Power Automate", "n8n", "Ollama", "llama.cpp", "Hermes", "OpenClaw", "Claude Code"] },
    { id: "integrations", items: ["Microsoft 365 / Graph API"] },
    { id: "data", items: ["Excel"] },
    { id: "tools", items: ["Git", "Linux", "Bash", "Docker"] },
  ],
  languages: [
    { code: "fr" },
    { code: "en" },
    { code: "ar" },
  ],
  links: [
    { id: "portfolio", url: "https://syliane.vercel.app/" },
    { id: "github", url: "https://github.com/0xSyliane" },
    { id: "linkedin", url: "https://www.linkedin.com/in/syliane-saadbouzid-a9278a395/" },
  ],
  email: { local: "sylianesaadbouzide", domain: "gmail.com" },
};
