import type { Chrome, Locale } from "./types.ts";

/**
 * Canonical origin, no trailing slash. Hosted on syliane.vercel.app (decision 2026-10-12);
 * change it here, and in the check:publish allowlist, if a custom domain is attached later.
 */
export const SITE_URL = "https://syliane.vercel.app";

/** Display brand = personal name (decision: no company brand in V1). */
export const SITE_NAME = "Syliane Saadbouzid";

/**
 * Other forms of the name attested on the owner's previous site (git history), for JSON-LD
 * `alternateName`. Do not add a form that was never published (no "Syliane Bouzid").
 */
export const SITE_NAME_VARIANTS = ["Syliane Sofiane Saad Bouzid", "Syliane Saad Bouzid"] as const;

/** Default locale (served at /en/, decision 2026-10-12). `/` redirects here (see vercel.json); x-default points here. */
export const DEFAULT_LOCALE: Locale = "en";

/** `<meta name="theme-color">` — must equal `--paper` (light). */
export const THEME_COLOR = "#f7f6f1";

/** Public profile URLs used in JSON-LD `sameAs` (real profiles only). */
export const PROFILE_URLS = {
  github: "https://github.com/0xSyliane",
  linkedin: "https://www.linkedin.com/in/syliane-saadbouzid-a9278a395/",
} as const;

/** Site chrome wording (header, footer, skip link). Owned by platform. */
export const CHROME: Readonly<Record<Locale, Chrome>> = {
  fr: {
    skipLink: "Aller au contenu",
    brandAriaLabel: "Syliane Saadbouzid, accueil",
    navLabel: "Navigation principale",
    nav: [
      { label: "Travaux", href: "/fr/#travaux" },
      { label: "À propos", href: "/fr/#a-propos" },
      { label: "CV", href: "/fr/cv/" },
      { label: "Contact", href: "/fr/#contact" },
    ],
    switchLabel: "English",
    switchShort: "EN",
    todoLabel: "à confirmer",
    footer: {
      legal: { label: "Mentions légales", href: "/fr/mentions-legales/" },
      rights: "© Syliane Saadbouzid",
    },
  },
  en: {
    skipLink: "Skip to content",
    brandAriaLabel: "Syliane Saadbouzid, home",
    navLabel: "Main navigation",
    nav: [
      { label: "Work", href: "/en/#travaux" },
      { label: "About", href: "/en/#a-propos" },
      { label: "CV", href: "/en/cv/" },
      { label: "Contact", href: "/en/#contact" },
    ],
    switchLabel: "Français",
    switchShort: "FR",
    todoLabel: "to confirm",
    frenchOnly: "in French",
    footer: {
      legal: { label: "Legal notice", href: "/en/legal-notice/" },
      rights: "© Syliane Saadbouzid",
    },
  },
};
