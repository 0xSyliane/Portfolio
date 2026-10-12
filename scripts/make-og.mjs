// @ts-check
// Generates public/og-fr.png and public/og-en.png (1200x630) from an SVG.
// The SVG is rendered by Chromium (not librsvg) so the Bricolage / Plex webfonts load
// reliably from node_modules (embedded as data URLs); sharp then optimises the PNG.
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { cvEn } from "../src/content/cv/en.ts";
import { homeFr } from "../src/content/home.fr.ts";
import { PAPER, STAMP, S_PATH } from "./lib/brand-mark.mjs";

process.env.TMPDIR ??= "/dev/shm";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const executablePath =
  process.env.CHROMIUM_PATH ?? (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);

const INK = "#111b27";
const INK_2 = "#4a5666";
const HAIR = "#dcdfe5";

/** @param {string} rel path under node_modules */
const fontData = async (rel) => `data:font/woff2;base64,${(await readFile(join(root, "node_modules", rel))).toString("base64")}`;
const display = await fontData("@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2");
const mono = await fontData("@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2");

/** @param {string} s */
const escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const VARIANTS = [
  { file: "og-fr.png", eyebrow: homeFr.hero.eyebrow, role: homeFr.hero.role },
  { file: "og-en.png", eyebrow: "Algiers · remote · freelance", role: cvEn.headline },
];
const [first = "", ...rest] = homeFr.hero.name.split(" ");

const ruling = Array.from({ length: 15 }, (_, i) => `<rect x="0" y="${44 * (i + 1)}" width="1200" height="1" fill="${HAIR}"/>`).join("");

/** @param {{ eyebrow: string, role: string }} card */
const svg = ({ eyebrow, role }) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".3" stop-color="#fff"/><stop offset=".8" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<mask id="m"><rect width="1200" height="630" fill="url(#fade)"/></mask></defs>
<rect width="1200" height="630" fill="${PAPER}"/>
<g mask="url(#m)">${ruling}</g>
<rect x="64" y="64" width="${eyebrow.length * 12.2 + 28}" height="34" fill="${PAPER}" stroke="${INK_2}" stroke-width="1"/>
<text x="78" y="86" font-family="Plex" font-weight="500" font-size="15" letter-spacing="2.2" fill="${INK_2}">${escapeXml(eyebrow.toUpperCase())}</text>
<text x="60" y="262" font-family="Bricolage" font-weight="800" font-size="168" letter-spacing="-6" fill="${INK}">${escapeXml(first)}</text>
<text x="60" y="404" font-family="Bricolage" font-weight="800" font-size="168" letter-spacing="-6" fill="${INK}">${escapeXml(rest.join(" "))}</text>
<rect x="64" y="452" width="8" height="82" fill="${STAMP}"/>
<text x="96" y="512" font-family="Bricolage" font-weight="600" font-size="58" letter-spacing="-1.4" fill="${STAMP}">${escapeXml(role)}</text>
<g transform="translate(1030 190) rotate(-3)">
<rect x="-68" y="-68" width="136" height="136" fill="none" stroke="${STAMP}" stroke-width="5"/>
<rect x="-56" y="-56" width="112" height="112" fill="none" stroke="${STAMP}" stroke-width="2"/>
<g transform="translate(-64 -64) scale(4)"><path d="${S_PATH}" fill="none" stroke="${STAMP}" stroke-width="2.6" stroke-linecap="square" stroke-linejoin="round"/></g>
</g></svg>`;

/** @param {string} inner */
const page = (inner) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Bricolage;font-weight:200 800;src:url(${display}) format("woff2")}
@font-face{font-family:Plex;font-weight:500;src:url(${mono}) format("woff2")}
html,body{margin:0;background:${PAPER}}svg{display:block}</style></head><body>${inner}</body></html>`;

const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
try {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  const tab = await ctx.newPage();
  for (const variant of VARIANTS) {
    await tab.setContent(page(svg(variant)));
    await tab.evaluate(() => document.fonts.ready);
    const shot = await tab.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1200, height: 630 } });
    await sharp(shot).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(join(root, "public", variant.file));
    console.log(`wrote public/${variant.file}`);
  }
} finally {
  await browser.close();
}
