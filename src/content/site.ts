import type { Chrome, Locale } from "./types.ts";

/**
 * Canonical origin, no trailing slash. Replace the placeholder with the final
 * https origin once the domain is bought. While it is a `[[…]]` placeholder the
 * build still works (canonical becomes a placeholder string) and
 * `npm run check:publish` fails on it, which is intended.
 */
export const SITE_URL = "[[domaine]]";

/** Display brand = personal name (decision: no company brand in V1). */
export const SITE_NAME = "Syliane Saadbouzid";

/** Default locale (served at /fr/). `/` redirects here (see vercel.json). */
export const DEFAULT_LOCALE: Locale = "fr";

/** `<meta name="theme-color">` — must equal `--paper` (light). */
export const THEME_COLOR = "#f7f6f1";

/** Public profile URLs used in JSON-LD `sameAs` (real profiles only). */
export const PROFILE_URLS = {
  github: "https://github.com/0xSyliane",
  linkedin: "[[url LinkedIn]]",
} as const;

/** Site chrome wording (header, footer, skip link). Owned by platform. */
export const CHROME: Readonly<Record<Locale, Chrome>> = {
  fr: {
    skipLink: "Aller au contenu",
    brandAriaLabel: "Syliane Saadbouzid, accueil",
    navLabel: "Navigation principale",
    nav: [
      { label: "Travaux", href: "/fr/#travaux" },
      { label: "Méthode", href: "/fr/#methode" },
      { label: "À propos", href: "/fr/#a-propos" },
      { label: "CV", href: "/fr/cv/" },
      { label: "Contact", href: "/fr/#contact" },
    ],
    switchLabel: "English",
    footer: {
      legal: { label: "Mentions légales", href: "/fr/mentions-legales/" },
      rights: "© Syliane Saadbouzid",
    },
  },
  en: {
    skipLink: "Skip to content",
    brandAriaLabel: "Syliane Saadbouzid, home",
    navLabel: "Main navigation",
    // The EN site only has the CV in V1: other entries point to the FR home.
    nav: [
      { label: "Work", href: "/fr/#travaux" },
      { label: "Method", href: "/fr/#methode" },
      { label: "About", href: "/fr/#a-propos" },
      { label: "CV", href: "/en/cv/" },
      { label: "Contact", href: "/fr/#contact" },
    ],
    switchLabel: "Français",
    footer: {
      legal: { label: "Legal notice (FR)", href: "/fr/mentions-legales/" },
      rights: "© Syliane Saadbouzid",
    },
  },
};
