import type { Home } from "./types.ts";

/**
 * FR home copy. Portfolio first: work, about, CV; the offers are one short section near the bottom
 * (no prices, it only asks to get in touch).
 * `[[…]]` = unknown fact: never invent, the owner fills it in (check:publish fails until then).
 * French punctuation: U+00A0 before `: ; ? !` and inside « ».
 */
export const homeFr: Home = {
  meta: {
    title: "Syliane Saadbouzid — Développeur web, portfolio et CV",
    description:
      "Portfolio et CV de Syliane Saadbouzid : développeur web à Alger, étudiant en 3e année à l'USTHB. Projets en ligne, formation et compétences (TypeScript, Next.js, Python).",
  },
  hero: {
    eyebrow: "Alger · USTHB, 3e année · auto-entrepreneur",
    name: "Syliane Saadbouzid",
    role: "Développeur web full-stack et automatisation",
    lede: "Étudiant en 3e année à l'USTHB et stagiaire chez Alcodefi, je construis des sites, des applications web et des automatisations. Voici ce que j'ai réalisé.",
    // The address is never in the HTML: the primary CTA jumps to the obfuscated e-mail link.
    ctaPrimary: { label: "Écrire un message", href: "#contact" },
    ctaSecondary: { label: "Télécharger le CV (PDF)", href: "/cv/syliane-saadbouzid-cv-fr.pdf" },
  },
  services: {
    heading: "Travailler ensemble",
    intro: "Je prends aussi des missions en freelance.",
    items: [
      {
        ref: "S-01",
        title: "Sites et boutiques en ligne",
        summary: "Du site vitrine à la boutique sur mesure.",
      },
      {
        ref: "S-02",
        title: "Automatisation",
        summary: "Power Automate, n8n, Python, IA en local : moins de tâches répétitives.",
      },
    ],
    cta: "Me contacter",
  },
  work: {
    heading: "Travaux",
    intro: "",
    cases: [
      {
        slug: "alcodefi",
        kind: "real",
        status: "verified-live",
        stampLabel: "En ligne",
        title: "Site Alcodefi",
        liveLabel: "Voir le site Alcodefi",
        shotAlt:
          "Page d'accueil du site Alcodefi, version ordinateur : bandeau de contact, menu, slogan « Notre défi, votre réussite. », recherche de formations et début de la liste des prochaines sessions.",
        summary:
          "Site d'un établissement de formation professionnelle agréé à Alger : catalogue, planning des sessions et contact.",
        statusNote: "Réalisé pendant mon stage.",
        role: "Développement web, pendant mon stage chez Alcodefi.",
        stack: ["Next.js", "React", "Vercel"],
        links: { live: "https://www.alcodefi.org/" },
      },
      {
        slug: "creche-des-anges",
        kind: "real",
        status: "wip",
        stampLabel: "En cours",
        title: "Crèche des Anges",
        summary:
          "Site vitrine bilingue, en français et en arabe (lecture de droite à gauche), d'une crèche et école maternelle d'Alger.",
        statusNote: "Pas encore publié.",
        role: "Conception et développement.",
        stack: ["Astro", "TypeScript", "Vercel"],
        links: {},
      },
      {
        slug: "blaze-type",
        kind: "engineering",
        status: "verified-live",
        stampLabel: "En ligne",
        title: "Blaze Type",
        liveLabel: "Voir Blaze Type en ligne",
        shotAlt:
          "Blaze Type en cours de test : un texte à recopier dont les lettres justes sont en vert et une faute en rouge, avec la vitesse (WPM), la précision et le chronomètre affichés en haut.",
        summary: "Application web de test de vitesse de frappe.",
        statusNote: "Pas de commande client.",
        role: "Conception et développement, en solo.",
        stack: ["JavaScript", "CSS", "Vercel"],
        links: { live: "https://blaze-type.vercel.app/" },
      },
      {
        slug: "shellmates",
        kind: "real",
        status: "verified-live",
        stampLabel: "En ligne",
        title: "Site du club Shellmates",
        liveLabel: "Voir le site Shellmates",
        shotAlt:
          "Page d'accueil du site du club Shellmates, version ordinateur : titre « This is Shellmates Club », présentation du club et bouton « Join Us! » sur fond sombre à motifs de circuits.",
        summary: "Site du club de cybersécurité de l'USTHB.",
        statusNote: "Réalisé en équipe, pas seul.",
        role: "Ancien membre du département développement du club.",
        stack: ["Next.js", "TypeScript", "Tailwind CSS"],
        links: { live: "https://www.shellmates.club/" },
      },
      {
        slug: "boutique-sur-mesure",
        kind: "engineering",
        status: "exploration",
        stampLabel: "Exploration",
        title: "Boutique en ligne sur mesure",
        summary:
          "Base réutilisable de boutique\u00a0: catalogue, commande, paiement à la livraison, back-office, français et arabe (RTL).",
        statusNote: "Code privé, présentation sur demande.",
        role: "Conception et développement.",
        stack: ["Next.js", "TypeScript", "PostgreSQL", "Vitest", "CSP stricte", "Vercel"],
        links: {},
      },
    ],
    conceptsNote: "Base technique, non commandée par un client.",
    cta: "Me contacter",
  },
  about: {
    heading: "À propos",
    pull: "Je préfère montrer ce qui est livré\u00a0: les liens de la section Travaux mènent à des sites que vous pouvez ouvrir.",
    paragraphs: [
      "Je suis développeur web à Alger et auto-entrepreneur : je crée des sites, des applications web et des automatisations (e-mails, documents, API).",
      "Étudiant en 3e année à l'USTHB, je suis en stage chez Alcodefi, en développement web et en gestion de données : gestion des fichiers papier et numériques, vérification des erreurs lors du passage du papier au numérique, import de données dans Excel, organisation des dossiers.",
      "Je crée des automatisations avec Power Automate, n8n et Python, en y intégrant de l'IA (Ollama, llama.cpp). Je sais utiliser Hermes et OpenClaw, et je maîtrise Bash et Claude Code. Côté web, mes outils principaux sont TypeScript, Next.js, Python et PostgreSQL. J'ai fait partie du département développement du club Shellmates.",
      "Mon code est sur [GitHub](https://github.com/0xSyliane) et mon parcours sur [LinkedIn](https://www.linkedin.com/in/syliane-saadbouzid-a9278a395/).",
    ],
  },
  cvteaser: {
    text: "Projets, formation et compétences sur une page.",
    viewLabel: "Voir le CV",
    downloadLabel: "Télécharger le CV (PDF)",
  },
  contact: {
    heading: "Contact",
    intro:
      "Une question, une proposition, un stage ou une mission ? Écrivez-moi quelques lignes : un e-mail suffit, il n'y a pas de formulaire.",
    // The address must never be in the HTML, so the label stays generic.
    emailLabel: "Écrire un e-mail",
    // Shown only while JS has not run.
    emailNoScript: "Adresse e-mail : activez JavaScript pour l'afficher, ou écrivez-moi sur LinkedIn ou GitHub.",
    email: { local: "sylianesaadbouzide", domain: "gmail.com", subject: "Prise de contact" },
    linkedin: {
      label: "Me contacter sur LinkedIn",
      href: "https://www.linkedin.com/in/syliane-saadbouzid-a9278a395/",
    },
    github: { label: "Voir mon GitHub", href: "https://github.com/0xSyliane" },
  },
  footer: {},
};
