import type { CvFacts } from "../types.ts";

/**
 * Language-independent CV facts (dates, orgs, URLs, stack). OWNER: content.
 * Single source for the /cv pages, print.css and the PDF. ISO dates only.
 * City only: no phone, street address or birth date (H5).
 */
export const cvFacts: CvFacts = {
  profile: { name: "Syliane Saadbouzid", city: "Alger", country: "Algérie" },
  entries: [
    {
      id: "entry-1",
      kind: "project",
      org: "[[organisation]]",
      start: "[[date début]]",
      stack: ["[[stack]]"],
    },
  ],
  education: [{ id: "edu-1", institution: "[[établissement]]", start: "[[date début]]" }],
  skills: [{ id: "web", items: ["[[compétence]]"] }],
  languages: [
    { code: "fr", level: "[[niveau FR]]" },
    { code: "en", level: "[[niveau EN]]" },
  ],
  links: [
    { id: "github", url: "https://github.com/0xSyliane" },
    { id: "linkedin", url: "[[url LinkedIn]]" },
  ],
  email: { local: "[[alias]]", domain: "[[domaine mail]]" },
};
