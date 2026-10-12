// @ts-check
// Generates the favicon set into public/: favicon.svg (stamp "S"), favicon-32.png,
// apple-touch-icon.png (180), icon-512.png (maskable: S inside the 80 % safe zone).
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { stampSvg } from "./lib/brand-mark.mjs";

const pub = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

/**
 * @param {string} svg
 * @param {number} size
 * @param {string} file
 */
const png = (svg, size, file) =>
  sharp(Buffer.from(svg), { density: 384 }).resize(size, size).png({ compressionLevel: 9, palette: true }).toFile(join(pub, file));

await writeFile(join(pub, "favicon.svg"), `${stampSvg({ size: 32 })}\n`);
await png(stampSvg({ size: 32 }), 32, "favicon-32.png");
await png(stampSvg({ size: 180 }), 180, "apple-touch-icon.png");
await png(stampSvg({ size: 512, inset: 3.2 }), 512, "icon-512.png");
console.log("favicon set written to public/");
