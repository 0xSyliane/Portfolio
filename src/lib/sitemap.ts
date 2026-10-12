import { PAGES, alternatesFor, localesOf, type PageId } from "./i18n.ts";
import { absoluteUrl } from "./seo.ts";

const xmlEscape = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const pageIds = Object.keys(PAGES) as PageId[];

/**
 * sitemap.xml body: indexable pages only (never PDFs), one `<url>` per page and locale,
 * hreflang alternates (`xhtml:link`) only for pages that exist in several locales, and a
 * `<lastmod>` only when `lastmodOf` knows a real date.
 */
export const buildSitemap = (
  lastmodOf: (page: PageId) => string | undefined,
  origin?: string,
): string => {
  const entries = pageIds.flatMap((page) => {
    const lastmod = lastmodOf(page);
    const alternates = alternatesFor(page);
    return localesOf(page).map((locale) => {
      const path = PAGES[page][locale] as string;
      const links = alternates
        .map(
          (a) =>
            `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${xmlEscape(absoluteUrl(a.path, origin))}"/>`,
        )
        .join("\n");
      const stamp = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
      return `  <url>\n    <loc>${xmlEscape(absoluteUrl(path, origin))}</loc>${stamp}${links ? `\n${links}` : ""}\n  </url>`;
    });
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;
};
