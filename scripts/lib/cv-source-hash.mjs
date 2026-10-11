import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { listFiles } from "./files.mjs";

/** Directories/files whose content determines the CV PDF (web data + print layout). */
export const CV_SOURCES = ["src/content/cv", "src/features/cv", "src/styles/print.css"];

/**
 * sha256 over every CV source file (sorted, path + content). The PDF
 * generator (Dev B) writes this to `public/cv/.source-hash`; `check:publish`
 * recomputes it and fails when the PDFs are older than their sources.
 */
export const computeCvSourceHash = (root) => {
  const hash = createHash("sha256");
  const files = CV_SOURCES.flatMap((p) => {
    const abs = join(root, p);
    return p.endsWith(".css") ? [abs] : listFiles(abs);
  }).sort();
  for (const file of files) {
    let content;
    try {
      content = readFileSync(file);
    } catch {
      continue;
    }
    hash.update(relative(root, file)).update("\0").update(content).update("\0");
  }
  return hash.digest("hex");
};
