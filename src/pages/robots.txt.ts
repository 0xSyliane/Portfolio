import type { APIRoute } from "astro";
import { absoluteUrl } from "../lib/seo.ts";

/** Everything is crawlable; PDFs are kept out of the index via X-Robots-Tag (vercel.json). */
export const GET: APIRoute = () =>
  new Response(`User-agent: *\nAllow: /\n\nSitemap: ${absoluteUrl("/sitemap.xml")}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
