import { DEFAULT_LOCALE } from "../content/site.ts";
import type { Locale } from "../content/types.ts";

export type { Locale } from "../content/types.ts";

export const LOCALES: readonly Locale[] = ["fr", "en"];

/** BCP-47 / Open Graph locale codes. */
export const OG_LOCALE: Readonly<Record<Locale, string>> = { fr: "fr_FR", en: "en_GB" };

export type PageId = "home" | "cv" | "legal";

/**
 * Page registry: the ONLY place that says which pages exist in which locale.
 * hreflang alternates, the language switch and the sitemap all derive from it.
 * A page with a single locale has no alternate (and no hreflang tags).
 * Paths are root-relative, lowercase, with a trailing slash.
 */
export const PAGES: Readonly<Record<PageId, Readonly<Partial<Record<Locale, string>>>>> = {
  home: { fr: "/fr/" },
  cv: { fr: "/fr/cv/", en: "/en/cv/" },
  legal: { fr: "/fr/mentions-legales/" },
};

/** Path of `page` in `locale`, or undefined if that translation does not exist. */
export const pathFor = (page: PageId, locale: Locale): string | undefined => PAGES[page][locale];

/** Locales in which `page` exists. */
export const localesOf = (page: PageId): Locale[] =>
  LOCALES.filter((locale) => PAGES[page][locale] !== undefined);

export interface Alternate {
  /** `fr`, `en` or `x-default`. */
  readonly hreflang: string;
  /** Root-relative path. */
  readonly path: string;
}

/**
 * hreflang set for a page: self + every other locale + x-default (→ default
 * locale). Empty when the page exists in one locale only.
 */
export const alternatesFor = (page: PageId): Alternate[] => {
  const locales = localesOf(page);
  if (locales.length < 2) return [];
  const entries: Alternate[] = locales.map((locale) => ({
    hreflang: locale,
    path: PAGES[page][locale] as string,
  }));
  const fallback = PAGES[page][DEFAULT_LOCALE];
  return fallback ? [...entries, { hreflang: "x-default", path: fallback }] : entries;
};

/** Where the FR/EN switch should point from `page`/`locale`; undefined = hide the switch. */
export const switchTarget = (
  page: PageId,
  locale: Locale,
): { locale: Locale; path: string } | undefined => {
  const other = LOCALES.find((l) => l !== locale && PAGES[page][l] !== undefined);
  return other ? { locale: other, path: PAGES[page][other] as string } : undefined;
};

const MONTHS: Readonly<Record<Locale, readonly string[]>> = {
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

/**
 * Formats `YYYY`, `YYYY-MM` or `YYYY-MM-DD` for display ("sept. 2025").
 * Anything else (placeholders included) is returned unchanged.
 */
export const formatIsoDate = (iso: string, locale: Locale): string => {
  const match = /^(\d{4})(?:-(\d{2}))?(?:-\d{2})?$/.exec(iso);
  if (!match) return iso;
  const [, year, month] = match;
  if (!month) return year as string;
  const label = MONTHS[locale][Number(month) - 1];
  return label ? `${label} ${year}` : (year as string);
};

/** True for `YYYY`, `YYYY-MM`, `YYYY-MM-DD` with a valid month/day range. */
export const isIsoDate = (value: string): boolean => {
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value);
  if (!match) return false;
  const month = match[2] ? Number(match[2]) : 1;
  const day = match[3] ? Number(match[3]) : 1;
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
};
