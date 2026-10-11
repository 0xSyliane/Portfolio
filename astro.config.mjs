// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  // Absolute URLs for canonical/sitemap come from src/content/site.ts (SITE_URL),
  // not from here; this value only silences Astro's dev/preview warnings.
  site: process.env.PUBLIC_SITE_URL || "http://localhost:4322",
  trailingSlash: "always",
  build: {
    // Keep every stylesheet external so the CSP can forbid inline styles.
    inlineStylesheets: "never",
  },
  vite: {
    // Keep every asset (fonts, scripts) external: no data: URIs, no inline scripts.
    build: { assetsInlineLimit: 0 },
  },
  image: {
    responsiveStyles: false,
  },
});
