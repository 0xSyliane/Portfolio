import type { Home } from "./types.ts";

/**
 * FR home copy. OWNER: content (Dev B writes the words, Dev C renders them).
 * Everything below is a typed placeholder: replace each `[[…]]` with a real,
 * verified fact. Do not invent figures, clients or testimonials.
 */
export const homeFr: Home = {
  meta: {
    title: "[[titre SEO 50–60 car.]]",
    description: "[[description 140–155 car.]]",
  },
  hero: {
    name: "Syliane Saadbouzid",
    role: "[[positionnement]]",
    lede: "[[accroche]]",
    ctaPrimary: { label: "Voir mon CV", href: "/fr/cv/" },
    ctaSecondary: { label: "Me contacter", href: "#contact" },
  },
  services: {
    heading: "[[titre prestations]]",
    intro: "[[intro prestations]]",
    items: [
      {
        ref: "S-01",
        title: "[[prestation 1]]",
        summary: "[[résumé 1]]",
        deliverable: "[[livrable 1]]",
        price: "[[prix]]",
      },
      {
        ref: "S-02",
        title: "[[prestation 2]]",
        summary: "[[résumé 2]]",
        deliverable: "[[livrable 2]]",
        price: "[[prix]]",
      },
    ],
  },
  work: {
    heading: "Travaux",
    intro: "[[intro travaux]]",
    cases: [
      {
        slug: "[[slug-cas-1]]",
        kind: "real",
        status: "wip",
        stampLabel: "[[tampon]]",
        title: "[[titre cas 1]]",
        summary: "[[résumé cas 1]]",
        role: "[[rôle]]",
        stack: ["[[stack]]"],
        links: {},
      },
    ],
    conceptsNote: "[[note explorations]]",
  },
  method: {
    heading: "Méthode",
    intro: "[[intro méthode]]",
    steps: [
      { ref: "01", title: "[[étape 1]]", summary: "[[détail 1]]" },
      { ref: "02", title: "[[étape 2]]", summary: "[[détail 2]]" },
      { ref: "03", title: "[[étape 3]]", summary: "[[détail 3]]" },
      { ref: "04", title: "[[étape 4]]", summary: "[[détail 4]]" },
    ],
  },
  about: {
    heading: "À propos",
    pull: "[[phrase d'accroche]]",
    paragraphs: ["[[paragraphe à propos]]"],
  },
  contact: {
    heading: "Contact",
    intro: "[[intro contact]]",
    emailLabel: "Écrire un e-mail",
    emailNoScript: "E-mail (JavaScript requis) — ou LinkedIn ci-dessous",
    email: { local: "[[alias]]", domain: "[[domaine mail]]", subject: "Prise de contact" },
    linkedin: { label: "LinkedIn", href: "[[url LinkedIn]]" },
  },
  footer: {
    line: "[[ligne de pied de page]]",
  },
};
