// @ts-check
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { listFiles } from "./files.mjs";

/**
 * Everything that changes the printed CV: the CV data and components, the whole shared design
 * layer (tokens, base, chrome, print CSS), the layout that loads it, the markup helpers the CV
 * uses, the site chrome wording, the print fonts and the generator itself. A path is a file or a
 * directory (walked recursively).
 */
export const CV_SOURCES = [
  "src/content/cv",
  "src/content/site.ts",
  "src/features/cv",
  "src/components",
  "src/styles",
  "src/layouts",
  "src/lib/rich.ts",
  "src/lib/placeholder.ts",
  "src/lib/i18n.ts",
  "src/lib/contact.ts",
  "public/fonts/print",
  "scripts/cv-pdf.mjs",
  "scripts/lib/pdf-author.mjs",
];

/**
 * sha256 over every CV source file (sorted, path + content). `scripts/cv-pdf.mjs` writes it to
 * `public/cv/.source-hash` once the PDFs validated; `check:publish` recomputes it and fails when
 * the PDFs are older than their sources. A source that does not exist simply is not part of the
 * hash (deleting one changes it); one that exists but cannot be read throws, because a hash that
 * silently skips a file would not be deterministic.
 * @param {string} root
 * @returns {string}
 */
export const computeCvSourceHash = (root) => {
  const hash = createHash("sha256");
  const files = CV_SOURCES.flatMap((p) => {
    const abs = join(root, p);
    return /\.\w+$/.test(p) ? [abs] : listFiles(abs);
  }).sort();
  for (const file of files) {
    if (!statSync(file, { throwIfNoEntry: false })) continue;
    hash.update(relative(root, file)).update("\0").update(readFileSync(file)).update("\0");
  }
  return hash.digest("hex");
};
