import type { APIRoute } from "astro";
import type { PageId } from "../lib/i18n.ts";
import { lastmodFor } from "../lib/lastmod.ts";
import { buildSitemap } from "../lib/sitemap.ts";

/** Source files whose last change dates a page (drives <lastmod>). */
const SOURCES: Readonly<Record<PageId, readonly string[]>> = {
  home: ["src/content/home.fr.ts", "src/content/home.en.ts", "src/features/home", "src/pages/fr/index.astro", "src/pages/en/index.astro"],
  cv: ["src/content/cv", "src/features/cv", "src/pages/fr/cv", "src/pages/en/cv"],
  legal: ["src/pages/fr/mentions-legales", "src/pages/en/legal-notice"],
};

/** Own sitemap (no integration), see `buildSitemap`. */
export const GET: APIRoute = () =>
  new Response(buildSitemap((page) => lastmodFor(SOURCES[page])), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
