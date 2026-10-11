import type { APIRoute } from "astro";
import { PAGES, alternatesFor, localesOf, type PageId } from "../lib/i18n.ts";
import { lastmodFor } from "../lib/lastmod.ts";
import { absoluteUrl } from "../lib/seo.ts";

/** Source files whose last change dates a page (drives <lastmod>). */
const SOURCES: Readonly<Record<PageId, readonly string[]>> = {
  home: ["src/content/home.fr.ts", "src/features/home", "src/pages/fr/index.astro"],
  cv: ["src/content/cv", "src/features/cv", "src/pages/fr/cv", "src/pages/en/cv"],
  legal: ["src/pages/fr/mentions-legales"],
};

const xmlEscape = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const pageIds = Object.keys(PAGES) as PageId[];

/**
 * Own sitemap (no integration): indexable pages only, real lastmod, hreflang
 * alternates (xhtml:link) only for pages that exist in several locales.
 */
export const GET: APIRoute = () => {
  const entries = pageIds.flatMap((page) => {
    const lastmod = lastmodFor(SOURCES[page]);
    const alternates = alternatesFor(page);
    return localesOf(page).map((locale) => {
      const path = PAGES[page][locale] as string;
      const links = alternates
        .map(
          (a) =>
            `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${xmlEscape(absoluteUrl(a.path))}"/>`,
        )
        .join("\n");
      return `  <url>\n    <loc>${xmlEscape(absoluteUrl(path))}</loc>\n    <lastmod>${lastmod}</lastmod>${links ? `\n${links}` : ""}\n  </url>`;
    });
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
};
