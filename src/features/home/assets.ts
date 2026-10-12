import type { ImageMetadata } from "astro";
import { formatIsoDate } from "../../lib/i18n.ts";
import captures from "../../assets/work/captures.json";

const images = import.meta.glob<{ default: ImageMetadata }>("/src/assets/**/*.{png,jpg,jpeg,webp,avif}", {
  eager: true,
});

/** Resolves `src/assets/<relative>` to Astro image metadata, or undefined if absent. */
export const findAsset = (relative: string): ImageMetadata | undefined =>
  images[`/src/assets/${relative}`]?.default;

export type ShotKind = "desktop" | "phone";

/** Capture of a case study (convention: `work/<slug>/{desktop,phone}.png`). */
export const findShot = (slug: string, kind: ShotKind): ImageMetadata | undefined =>
  findAsset(`work/${slug}/${kind}.png`);

/** "11 oct. 2026" from the capture manifest written by scripts/capture-screens.mjs. */
export const captureDate = (slug: string, locale: "fr" | "en" = "fr"): string | undefined => {
  const iso = (captures as Record<string, { capturedAt?: string } | undefined>)[slug]?.capturedAt;
  if (!iso) return undefined;
  const day = Number(iso.slice(8, 10));
  const rest = formatIsoDate(iso, locale);
  return day ? (locale === "en" ? `${rest.split(" ")[0]} ${day}, ${iso.slice(0, 4)}` : `${day} ${rest}`) : rest;
};

/** Hostname for captions ("blaze-type.vercel.app"), or undefined for a non-URL. */
export const hostOf = (url?: string): string | undefined => {
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
};
