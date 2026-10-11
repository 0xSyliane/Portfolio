import { SITE_NAME, SITE_URL } from "../content/site.ts";
import { alternatesFor, OG_LOCALE, localesOf, type Locale, type PageId, PAGES } from "./i18n.ts";

/**
 * Absolute URL for a root-relative path. Plain string concatenation on
 * purpose: `new URL()` would throw while SITE_URL is still a `[[domaine]]`
 * placeholder, and the placeholder must stay visible so check:publish fails.
 */
export const absoluteUrl = (path: string, origin: string = SITE_URL): string =>
  `${origin.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

/** `Title | Syliane Saadbouzid` (brand last). Not duplicated if already present. */
export const pageTitle = (title: string, brand: string = SITE_NAME): string =>
  title.includes(brand) ? title : `${title} | ${brand}`;

export interface HeadInput {
  readonly page: PageId;
  readonly locale: Locale;
  readonly title: string;
  readonly description: string;
  readonly noindex?: boolean;
  /** Root-relative OG image; defaults to the shared card for the locale. */
  readonly ogImage?: string;
}

export interface HeadData {
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly robots: string;
  readonly alternates: readonly { hreflang: string; href: string }[];
  readonly ogLocale: string;
  readonly ogAlternateLocales: readonly string[];
  readonly ogImage: string;
}

/** Everything `<head>` needs, derived from the page registry. */
export const buildHead = (input: HeadInput, origin: string = SITE_URL): HeadData => {
  const self = PAGES[input.page][input.locale];
  if (!self) throw new Error(`Page "${input.page}" has no "${input.locale}" version`);
  const alternates = alternatesFor(input.page).map((a) => ({
    hreflang: a.hreflang,
    href: absoluteUrl(a.path, origin),
  }));
  return {
    title: pageTitle(input.title),
    description: input.description,
    canonical: absoluteUrl(self, origin),
    robots: input.noindex ? "noindex, follow" : "index, follow",
    alternates,
    ogLocale: OG_LOCALE[input.locale],
    ogAlternateLocales: localesOf(input.page)
      .filter((l) => l !== input.locale)
      .map((l) => OG_LOCALE[l]),
    ogImage: absoluteUrl(input.ogImage ?? `/og-${input.locale}.png`, origin),
  };
};
