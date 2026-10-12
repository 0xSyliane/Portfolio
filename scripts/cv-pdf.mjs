#!/usr/bin/env node
// @ts-check
// Generates the CV PDFs (decision D-04): builds the site into a TEMP outDir (never `dist/`),
// serves it, prints /fr/cv/ and /en/cv/ with the system Chromium, then verifies each PDF
// (exactly 1 page, text in reading order, only the configured e-mail alias). Nothing in
// `public/cv` is touched until BOTH PDFs validated: the files are written next to their target,
// checked, then renamed, and `public/cv/.source-hash` is stamped last. `[[…]]` placeholders are
// reported, not fatal: `npm run check:publish` blocks them until the owner fills the facts.
//
//   npm run cv:pdf        (TMPDIR defaults to /dev/shm)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { cvFacts } from "../src/content/cv/facts.ts";
import { PAGES } from "../src/lib/i18n.ts";
import { computeCvSourceHash } from "./lib/cv-source-hash.mjs";
import { setPdfAuthor } from "./lib/pdf-author.mjs";
import { findEmailProblems } from "./lib/publish-checks.mjs";

export { setPdfAuthor };

const root = fileURLToPath(new URL("..", import.meta.url));
const tmpdir = process.env["TMPDIR"] ?? "/dev/shm";
process.env["TMPDIR"] = tmpdir;

const outDir = join(root, "public/cv");
const AUTHOR = cvFacts.profile.name;

/** One PDF per CV locale registered in the page registry (src/lib/i18n.ts). */
const LOCALES = /** @type {const} */ (["fr", "en"]).map((code) => ({
  code,
  path: /** @type {string} */ (PAGES.cv[code]),
  module: `src/content/cv/${code}.ts`,
  exportName: code === "fr" ? "cvFr" : "cvEn",
}));

const MIME = /** @type {Record<string, string>} */ ({
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
});

const executablePath =
  process.env["CHROMIUM_PATH"] ?? (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);

/** @param {string} message */
const log = (message) => console.log(`cv:pdf  ${message}`);

/** @param {string} buildDir */
const build = (buildDir) => {
  rmSync(buildDir, { recursive: true, force: true });
  log(`building the site into ${buildDir}`);
  execFileSync(join(root, "node_modules/.bin/astro"), ["build", "--outDir", buildDir], {
    cwd: root,
    env: { ...process.env, TMPDIR: tmpdir },
    stdio: "inherit",
  });
};

/**
 * Minimal static server for the built site (127.0.0.1, random port, no path traversal).
 * @param {string} buildDir
 * @returns {Promise<{ server: import("node:http").Server, port: number }>}
 */
const serve = (buildDir) =>
  new Promise((resolvePromise, reject) => {
    const base = resolve(buildDir);
    const server = createServer((req, res) => {
      let pathname;
      try {
        pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
      } catch {
        res.writeHead(400).end("bad request");
        return;
      }
      const relative = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
      const file = normalize(join(base, relative));
      const isFile = file.startsWith(base + sep) && existsSync(file) && statSync(file).isFile();
      if (!isFile) {
        res.writeHead(404).end("not found");
        return;
      }
      res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
      res.end(readFileSync(file));
    });
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") reject(new Error("static server has no port"));
      else resolvePromise({ server, port: address.port });
    });
  });

/**
 * The contact address as it must be printed: the parts of `cvFacts.email`, or the visible
 * `[[…]]` placeholders while the owner has not set them (the publish gate blocks those).
 */
const printedAddress = `${cvFacts.email.local}@${cvFacts.email.domain}`;
const configuredAddress = printedAddress.includes("[[") ? undefined : printedAddress;

/**
 * @param {string} file
 * @param {string} mode
 */
const pdftext = (file, mode) => execFileSync("pdftotext", [mode, file, "-"], { encoding: "utf8" });

/**
 * Verifies one PDF: 1 page, heading order = DOM order (raw content-stream order), no leaks,
 * and no e-mail other than the configured alias.
 * @param {string} file
 * @param {import("../src/content/types.ts").CvCopy} copy
 */
const verify = (file, copy) => {
  /** @type {string[]} */
  const problems = [];
  const info = execFileSync("pdfinfo", [file], { encoding: "utf8" });
  const pages = Number(/^Pages:\s+(\d+)/m.exec(info)?.[1]);
  if (pages !== 1) problems.push(`has ${pages} page(s), expected exactly 1`);
  if (!new RegExp(`^Author:\\s+${AUTHOR}`, "m").test(info)) problems.push("PDF Author is not set");
  if (!/^Title:\s+\S/m.test(info)) problems.push("PDF Title is empty");

  const raw = pdftext(file, "-raw");
  const headings = [
    copy.headings.profile,
    copy.headings.projects,
    copy.headings.education,
    copy.headings.skills,
    copy.headings.languages,
    copy.headings.links,
  ];
  const rawLower = raw.toLowerCase();
  let last = -1;
  for (const heading of headings) {
    const at = rawLower.indexOf(`\n${heading.toLowerCase()}\n`, last + 1);
    if (at < 0) problems.push(`heading "${heading}" not found after the previous one (text not linear)`);
    else last = at;
  }
  // ATS readability: Type 3 fonts (Chromium's embedding of variable fonts) lose word spacing.
  const fonts = execFileSync("pdffonts", [file], { encoding: "utf8" });
  if (/\bType 3\b/.test(fonts)) problems.push("a font is embedded as Type 3 (text extraction loses spaces)");
  const glued = raw.split(/\s+/).find((w) => w.length > 30 && !/^(https?:\/\/|www\.)/.test(w) && !/^[\w.+-]+@/.test(w));
  if (glued) problems.push(`words run together in the text layer: "${glued.slice(0, 40)}…"`);
  if (/\b(?:\+?\d[\d .-]{8,}\d)\b/.test(raw)) problems.push("text contains a phone-like number");
  for (const problem of findEmailProblems(raw, configuredAddress)) problems.push(problem);
  return { problems, pages, placeholders: raw.match(/\[\[[^\]]*\]\]/g) ?? [] };
};

const main = async () => {
  // The stamp describes the sources the PDFs are printed from: read them BEFORE building.
  const sourceHash = computeCvSourceHash(root);
  const buildDir = join(root, `node_modules/.cache/cv-pdf-build-${process.pid}`);
  /** @type {import("node:http").Server | undefined} */
  let server;
  /** @type {import("@playwright/test").Browser | undefined} */
  let browser;
  /** @type {{ tmp: string, final: string }[]} */
  const written = [];
  /** @type {string[]} */
  const failures = [];

  try {
    build(buildDir);
    const started = await serve(buildDir);
    server = started.server;
    browser = await chromium.launch({
      executablePath,
      args: ["--no-sandbox"],
      env: { ...process.env, TMPDIR: tmpdir },
    });
    mkdirSync(outDir, { recursive: true });

    for (const locale of LOCALES) {
      const page = await browser.newPage();
      try {
        // Print media BEFORE loading: the static print fonts (print.css) only load under @media print.
        await page.emulateMedia({ media: "print" });
        const response = await page.goto(`http://127.0.0.1:${started.port}${locale.path}`, { waitUntil: "networkidle" });
        if (!response?.ok()) throw new Error(`${locale.path} answered HTTP ${response?.status() ?? "none"}`);
        await page.evaluate(() => document.fonts.ready);
        // The address is never in the HTML: print it from the CV facts (the placeholder text while unset).
        await page.evaluate((text) => {
          for (const node of document.querySelectorAll(".cv-mail")) node.textContent = text;
        }, printedAddress);
        const raw = await page.pdf({
          format: "A4",
          printBackground: true,
          preferCSSPageSize: true,
          tagged: true,
          outline: false,
        });
        const final = join(outDir, `syliane-saadbouzid-cv-${locale.code}.pdf`);
        const tmp = `${final}.tmp`;
        written.push({ tmp, final });
        writeFileSync(tmp, setPdfAuthor(raw, AUTHOR));

        const mod = await import(pathToFileURL(join(root, locale.module)).href);
        const result = verify(tmp, mod[locale.exportName]);
        log(`${locale.code}: ${result.pages} page(s), ${result.placeholders.length} placeholder(s) in text`);
        for (const problem of result.problems) failures.push(`${locale.code}: ${problem}`);
      } finally {
        await page.close();
      }
    }

    if (failures.length === 0) {
      for (const { tmp, final } of written) renameSync(tmp, final);
      writeFileSync(join(outDir, ".source-hash"), `${sourceHash}\n`);
      log("wrote public/cv/*.pdf and public/cv/.source-hash");
    }
  } finally {
    // Each cleanup runs even if the previous one throws.
    for (const { tmp } of written) rmSync(tmp, { force: true });
    try {
      await browser?.close();
    } finally {
      try {
        server?.close();
      } finally {
        rmSync(buildDir, { recursive: true, force: true });
      }
    }
  }

  if (failures.length > 0) {
    console.error(`\ncv:pdf  FAILED (public/cv left untouched):\n${failures.map((f) => `  • ${f}`).join("\n")}`);
    process.exit(1);
  }
  log("ok: both PDFs are exactly 1 page with linear text");
};

if (resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url)) {
  await main();
}
