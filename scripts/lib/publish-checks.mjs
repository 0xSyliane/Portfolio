import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { computeCvSourceHash } from "./cv-source-hash.mjs";
import { listFiles } from "./files.mjs";

const TEXT_EXT = /\.(html|xml|txt|json|webmanifest|svg|css|js)$/;
const MARKUP_EXT = /\.(html|xml|txt)$/;
const PLACEHOLDER = /\[\[[^\]]*\]\]/g;
/** Whole-line comments may document the `[[…]]` convention without failing the gate. */
const COMMENT_LINE = /^\s*(\/\/|\/\*|\*)/;

const read = (file) => readFileSync(file, "utf8");

/** Placeholders (`[[…]]`) left in source content. */
export const checkContentPlaceholders = (root) =>
  listFiles(join(root, "src/content"))
    .filter((file) => !file.endsWith("/types.ts")) // type definitions mention the marker syntax
    .flatMap((file) =>
    read(file)
      .split("\n")
      .flatMap((line, i) =>
        COMMENT_LINE.test(line)
          ? []
          : [...line.matchAll(PLACEHOLDER)].map(
          (m) => `${relative(root, file)}:${i + 1}  placeholder ${m[0]}`,
        ),
      ),
  );

/** Concept case studies must be explicitly marked anonymised by a human. */
export const findConceptProblems = (cases) =>
  cases
    .filter((c) => c?.kind === "concept" && c.anonymised !== true)
    .map((c) => `concept "${c.slug}"  anonymised is not true (review captures, then set it)`);

const checkConcepts = async (root) => {
  const file = join(root, "src/content/home.fr.ts");
  if (!existsSync(file)) return [];
  try {
    const mod = await import(pathToFileURL(file).href);
    const cases = Object.values(mod).flatMap((home) => home?.work?.cases ?? []);
    return findConceptProblems(cases);
  } catch (error) {
    return [`src/content/home.fr.ts  could not be loaded to check concepts: ${error.message}`];
  }
};

/** vercel.json: no leftover global noindex (only PDFs may carry X-Robots-Tag). */
export const checkVercelRobots = (root) => {
  const file = join(root, "vercel.json");
  if (!existsSync(file)) return ["vercel.json  missing"];
  const config = JSON.parse(read(file));
  return (config.headers ?? [])
    .filter((rule) => (rule.headers ?? []).some((h) => h.key.toLowerCase() === "x-robots-tag"))
    .filter((rule) => !/^\/cv\/.*\.pdf$/.test(rule.source.replace(/\\/g, "")))
    .map((rule) => `vercel.json  X-Robots-Tag on "${rule.source}" (noindex is only allowed on /cv/*.pdf)`);
};

const checkDistFile = (root, file) => {
  const name = relative(root, file);
  const text = read(file);
  const problems = [];
  const add = (msg) => problems.push(`${name}  ${msg}`);

  if (text.includes("[[")) add("contains a [[placeholder]]");
  if (/data-todo/.test(text)) add("contains a data-todo marker");
  if (/\.vercel\.app/.test(text)) add("points to a *.vercel.app URL (set the final domain)");

  if (file.endsWith(".html")) {
    if (/\sstyle\s*=/.test(text)) add('has a style="" attribute (CSP forbids inline styles)');
    if (/<style[\s>]/i.test(text)) add("has an inline <style> (use CSS files)");
    for (const m of text.matchAll(/<script\b([^>]*)>/gi)) {
      const attrs = m[1];
      if (/\bsrc\s*=/.test(attrs)) continue;
      if (/type\s*=\s*["']application\/ld\+json["']/i.test(attrs)) continue;
      add("has an inline <script> without src (CSP is script-src 'self')");
    }
    if (/<meta[^>]+name="robots"[^>]+noindex/i.test(text) && !/(^|\/)404\.html$/.test(name)) {
      add("has a noindex robots meta (only 404 may)");
    }
    for (const m of text.matchAll(/<a\b[^>]*>/gi)) {
      if (/target\s*=\s*["']_blank["']/i.test(m[0]) && !/noopener/.test(m[0])) {
        add(`target="_blank" without noopener: ${m[0].slice(0, 80)}`);
      }
    }
    for (const m of text.matchAll(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/g)) {
      const path = m[1].replace(/^(https?:\/\/[^/]+|\[\[[^\]]*\]\])/, "");
      if (!existsSync(join(root, "dist", path))) add(`og:image ${path} does not exist in dist`);
    }
    if (/\bhref\s*=\s*["']http:\/\//i.test(text)) add("has a non-https link");
    if (/mailto:/i.test(text)) add("contains a plain mailto: (must be assembled by JS)");
  }
  if (MARKUP_EXT.test(file)) {
    const email = text.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/);
    if (email) add(`contains a plain e-mail address (${email[0]})`);
  }
  return problems;
};

const checkDenylist = (root, files) => {
  const list = join(root, "scripts/.denylist.local");
  if (!existsSync(list)) return [];
  const terms = read(list)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.toLowerCase());
  return files.flatMap((file) => {
    const text = read(file).toLowerCase();
    return terms
      .filter((t) => text.includes(t))
      .map((t) => `${relative(root, file)}  contains denylisted term "${t}"`);
  });
};

const hasPdftotext = () => {
  try {
    execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};

const checkPdfs = (root, distFiles, { pdftotext }) => {
  const pdfs = [...distFiles, ...listFiles(join(root, "public/cv"))].filter((f) => f.endsWith(".pdf"));
  const problems = [];
  if (pdftotext) {
    for (const pdf of new Set(pdfs)) {
      const text = execFileSync("pdftotext", [pdf, "-"], { encoding: "utf8" });
      if (text.includes("[[")) problems.push(`${relative(root, pdf)}  PDF text contains a [[placeholder]]`);
    }
  }
  const sources = listFiles(join(root, "public/cv")).filter((f) => f.endsWith(".pdf"));
  if (sources.length > 0) {
    const stampFile = join(root, "public/cv/.source-hash");
    const current = computeCvSourceHash(root);
    if (!existsSync(stampFile)) problems.push("public/cv/.source-hash  missing (regenerate the CV PDFs)");
    else if (read(stampFile).trim() !== current) {
      problems.push("public/cv  CV PDFs are stale: CV sources changed since they were generated");
    }
  }
  return problems;
};

/** Every `/cv/*.pdf` linked from a page must exist in dist. */
const checkPdfLinks = (root, htmlFiles, distFiles) => {
  const present = new Set(distFiles.map((f) => `/${relative(join(root, "dist"), f)}`));
  const problems = [];
  for (const file of htmlFiles) {
    for (const m of read(file).matchAll(/href="(\/[^"]+\.pdf)"/g)) {
      if (!present.has(m[1])) problems.push(`${relative(root, file)}  links to ${m[1]} which does not exist`);
    }
  }
  return problems;
};

/**
 * Runs every pre-publication check against `root` (a project directory).
 * Returns a list of human-readable problems; empty = ready to publish.
 */
export const runChecks = async (root, options = {}) => {
  const pdftotext = options.pdftotext ?? hasPdftotext();
  const problems = [...checkContentPlaceholders(root), ...checkVercelRobots(root), ...(await checkConcepts(root))];

  const dist = join(root, "dist");
  if (!existsSync(dist)) {
    problems.push("dist/  missing: run `npm run build` first");
    return problems;
  }
  const distFiles = listFiles(dist);
  const textFiles = distFiles.filter((f) => TEXT_EXT.test(f) && !/\/_astro\//.test(f));
  for (const file of textFiles.filter((f) => /\.(html|xml|txt|webmanifest)$/.test(f))) {
    problems.push(...checkDistFile(root, file));
  }
  problems.push(
    ...checkDenylist(root, textFiles),
    ...checkPdfs(root, distFiles, { pdftotext }),
    ...checkPdfLinks(root, distFiles.filter((f) => f.endsWith(".html")), distFiles),
  );
  return problems;
};
