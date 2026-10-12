// @ts-check
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { computeCvSourceHash } from "./cv-source-hash.mjs";
import { listFiles } from "./files.mjs";

/** Text outputs scanned for placeholders, hosts, e-mails and denylisted terms (js/css included). */
const TEXT_EXT = /\.(html|xml|txt|json|webmanifest|svg|css|js|mjs)$/;
const PLACEHOLDER = /\[\[[^\]]*\]\]/g;
/**
 * `[[` also occurs in bundled JS/CSS (nested arrays, a guard such as `includes("[[")`, a print
 * `content: "[["`): there only a real marker, `[[` + a letter + text + `]]` with no bracket inside, counts.
 */
const PLACEHOLDER_IN_CODE = /\[\[[A-Za-zÀ-ÿ][^[\]]{0,200}\]\]/;
/** Whole-line comments may document the `[[…]]` convention without failing the gate. */
const COMMENT_LINE = /^\s*(\/\/|\/\*|\*)/;

/** @param {string} file */
const read = (file) => readFileSync(file, "utf8");

/**
 * `*.vercel.app` hosts are preview deployments and must not ship, except the owner's own public
 * projects listed here (exact hostnames): the owner's own work, and the portfolio's own production domain
 * (decision 2026-10-12: it is hosted on syliane.vercel.app). Preview domains are never allowed.
 */
export const VERCEL_APP_ALLOWLIST = ["blaze-type.vercel.app", "syliane.vercel.app"];
const VERCEL_APP_HOST = /(?:[a-z0-9-]+\.)+vercel\.app(?![\w-]|\.[a-z0-9])/gi;

/**
 * `*.vercel.app` hostnames found in `text` that are not allowlisted.
 * @param {string} text
 */
export const disallowedVercelHosts = (text) => [
  ...new Set(
    [...text.matchAll(VERCEL_APP_HOST)]
      .map((m) => m[0].toLowerCase())
      .filter((host) => !VERCEL_APP_ALLOWLIST.includes(host)),
  ),
];

/* -------------------------------------------------------------------------- */
/* E-mail rules                                                               */
/* -------------------------------------------------------------------------- */

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
/** Personal mailbox providers: refused, except the one address the owner configured on purpose. */
const PERSONAL_PROVIDER =
  /@(?:[a-z0-9-]+\.)*(?:gmail|googlemail|outlook|hotmail|live|msn|yahoo|ymail|proton|protonmail|icloud|aol)\.[a-z.]+$|@pm\.me$/i;

/**
 * Problems for every e-mail found in `text`. `allowed` is the configured contact address (or
 * undefined when none is configured yet): an address other than it is a problem, and so is any
 * other address on a personal provider. The configured address is the owner's explicit choice,
 * even on a personal provider (decision 2026-10-12).
 * @param {string} text
 * @param {string | undefined} allowed
 * @returns {string[]}
 */
export const findEmailProblems = (text, allowed) =>
  [...new Set(text.match(EMAIL) ?? [])].flatMap((address) => {
    if (allowed && address.toLowerCase() === allowed.toLowerCase()) return [];
    if (PERSONAL_PROVIDER.test(address)) return [`personal e-mail address on a mail provider (${address}): only the configured contact address is allowed`];
    return [
      allowed
        ? `e-mail ${address} is not the configured contact address`
        : `e-mail ${address} found while no contact address is configured`,
    ];
  });

/**
 * The contact address configured in `src/content/cv/facts.ts` (`email.local` + `email.domain`),
 * or undefined while it is still a placeholder / missing.
 * @param {string} root
 * @returns {Promise<string | undefined>}
 */
const loadContactAddress = async (root) => {
  const file = join(root, "src/content/cv/facts.ts");
  if (!existsSync(file)) return undefined;
  try {
    const mod = await import(pathToFileURL(file).href);
    const { local, domain } = mod.cvFacts?.email ?? {};
    if (typeof local !== "string" || typeof domain !== "string") return undefined;
    if (local.includes("[[") || domain.includes("[[") || !local || !domain) return undefined;
    return `${local}@${domain}`;
  } catch {
    return undefined;
  }
};

/* -------------------------------------------------------------------------- */
/* Source content                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Placeholders (`[[…]]`) left in source content.
 * @param {string} root
 */
export const checkContentPlaceholders = (root) =>
  listFiles(join(root, "src/content"))
    .filter((file) => !file.endsWith("/types.ts")) // type definitions mention the marker syntax
    .flatMap((file) =>
      read(file)
        .split("\n")
        .flatMap((line, i) =>
          COMMENT_LINE.test(line)
            ? []
            : [...line.matchAll(PLACEHOLDER)].map((m) => `${relative(root, file)}:${i + 1}  placeholder ${m[0]}`),
        ),
    );

/**
 * Concept case studies must be explicitly marked anonymised by a human.
 * @param {ReadonlyArray<{ slug?: string, kind?: string, anonymised?: boolean } | undefined>} cases
 */
export const findConceptProblems = (cases) =>
  cases
    .filter((c) => c?.kind === "concept" && c.anonymised !== true)
    .map((c) => `concept "${c?.slug}"  anonymised is not true (review captures, then set it)`);

/** @param {string} root */
const checkConcepts = async (root) => {
  const file = join(root, "src/content/home.fr.ts");
  if (!existsSync(file)) return ["src/content/home.fr.ts  missing: no case study to review"];
  try {
    const mod = await import(pathToFileURL(file).href);
    const cases = Object.values(mod).flatMap((home) => /** @type {any} */ (home)?.work?.cases ?? []);
    // A gate that has nothing to inspect proves nothing: an empty list is a failure, not a pass.
    if (cases.length === 0) return ["src/content/home.fr.ts  no case study found: the concept review checked nothing"];
    return findConceptProblems(cases);
  } catch (error) {
    return [`src/content/home.fr.ts  could not be loaded to check concepts: ${/** @type {Error} */ (error).message}`];
  }
};

/**
 * vercel.json: no leftover global noindex (only PDFs may carry X-Robots-Tag).
 * @param {string} root
 */
export const checkVercelRobots = (root) => {
  const file = join(root, "vercel.json");
  if (!existsSync(file)) return ["vercel.json  missing"];
  const config = JSON.parse(read(file));
  return (config.headers ?? [])
    .filter((/** @type {any} */ rule) => (rule.headers ?? []).some((/** @type {any} */ h) => h.key.toLowerCase() === "x-robots-tag"))
    .filter((/** @type {any} */ rule) => !/^\/cv\/.*\.pdf$/.test(rule.source.replace(/\\/g, "")))
    .map((/** @type {any} */ rule) => `vercel.json  X-Robots-Tag on "${rule.source}" (noindex is only allowed on /cv/*.pdf)`);
};

/* -------------------------------------------------------------------------- */
/* Built output                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Every start tag in `html` with its parsed attributes. Quoted values may contain `>`;
 * names are lower-cased; a valueless attribute has the value "".
 * @param {string} html
 * @returns {{ name: string, attrs: Map<string, string>, source: string }[]}
 */
export const parseTags = (html) =>
  [...html.matchAll(/<([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g)].map((m) => {
    /** @type {Map<string, string>} */
    const attrs = new Map();
    for (const a of (m[2] ?? "").matchAll(/([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g)) {
      const name = (a[1] ?? "").toLowerCase();
      if (!attrs.has(name)) attrs.set(name, a[2] ?? a[3] ?? a[4] ?? "");
    }
    return { name: (m[1] ?? "").toLowerCase(), attrs, source: m[0] };
  });

/** Strips whitespace/control characters browsers ignore inside a URL scheme (`java\tscript:`). */
const urlScheme = (/** @type {string} */ value) => value.replace(/[\u0000-\u0020]/g, "").toLowerCase();

const ROBOT_NAMES = /^(robots|googlebot|googlebot-news|bingbot|slurp)$/i;
const SUBRESOURCE = new Set(["script", "link", "img", "source", "iframe", "video", "audio", "embed", "object"]);

/**
 * Problems in one built HTML document.
 * @param {string} text
 * @param {string} name display name of the file
 * @param {string} root
 * @param {boolean} isNotFoundPage
 * @param {{ markupOnly?: boolean }} [mode] `markupOnly` (SVG images): only scripts, event handlers and
 *   javascript: URLs matter; inline styles are harmless in an image.
 */
const checkHtml = (text, name, root, isNotFoundPage, { markupOnly = false } = {}) => {
  /** @type {string[]} */
  const problems = [];
  const add = (/** @type {string} */ msg) => problems.push(`${name}  ${msg}`);

  for (const tag of parseTags(text)) {
    const { attrs } = tag;
    if (!markupOnly && attrs.has("style")) add('has a style="" attribute (CSP forbids inline styles)');
    for (const attr of attrs.keys()) {
      if (/^on[a-z]/.test(attr)) add(`has an inline event handler (${attr}=) (CSP forbids it)`);
    }
    for (const attr of ["href", "src", "action", "formaction", "xlink:href"]) {
      const value = attrs.get(attr);
      if (value !== undefined && urlScheme(value).startsWith("javascript:")) add(`has a javascript: URL in ${attr}`);
      if (value !== undefined && attr === "href" && /^http:\/\//i.test(value.trim())) add("has a non-https link");
      if (value !== undefined && attr === "href" && /^mailto:/i.test(value.trim())) add("contains a plain mailto: (must be assembled by JS)");
    }
    if (SUBRESOURCE.has(tag.name)) {
      const target = attrs.get("src") ?? (tag.name === "link" ? attrs.get("href") : undefined);
      if (target !== undefined && /^(?:https?:)?\/\//i.test(target.trim()) && tag.name !== "link") {
        add(`loads an external ${tag.name} (${target.slice(0, 60)}): CSP is 'self' only`);
      }
      if (tag.name === "link" && target !== undefined && /^(?:https?:)?\/\//i.test(target.trim()) && /stylesheet|preload|modulepreload/i.test(attrs.get("rel") ?? "")) {
        add(`loads an external ${attrs.get("rel")} (${target.slice(0, 60)}): CSP is 'self' only`);
      }
    }
    if (!markupOnly && tag.name === "style") add("has an inline <style> (use CSS files)");
    if (tag.name === "script" && !attrs.has("src")) {
      const type = (attrs.get("type") ?? "").trim().toLowerCase();
      if (type !== "application/ld+json") add("has an inline <script> without src (CSP is script-src 'self')");
    }
    if (tag.name === "meta" && ROBOT_NAMES.test(attrs.get("name") ?? "") && /noindex|\bnone\b/i.test(attrs.get("content") ?? "")) {
      if (!isNotFoundPage) add("has a noindex robots meta (only 404 may)");
    }
    if (tag.name === "meta" && (attrs.get("property") ?? "").toLowerCase() === "og:image") {
      const content = attrs.get("content") ?? "";
      const path = content.replace(/^(https?:\/\/[^/]+|\[\[[^\]]*\]\])/, "");
      if (!existsSync(join(root, "dist", path))) add(`og:image ${path} does not exist in dist`);
    }
    if (tag.name === "a" && (attrs.get("target") ?? "").toLowerCase() === "_blank") {
      const rel = (attrs.get("rel") ?? "").toLowerCase().split(/\s+/);
      if (!rel.includes("noopener")) add(`target="_blank" without noopener: ${tag.source.slice(0, 80)}`);
    }
  }
  if (/mailto:/i.test(text) && !problems.some((p) => p.includes("mailto"))) add("contains a plain mailto: (must be assembled by JS)");
  return problems;
};

/**
 * Problems in one built text file (any extension in TEXT_EXT).
 * @param {string} root
 * @param {string} file
 * @param {string | undefined} contactAddress
 */
const checkDistFile = (root, file, contactAddress) => {
  const name = relative(root, file);
  const text = read(file);
  /** @type {string[]} */
  const problems = [];
  const add = (/** @type {string} */ msg) => problems.push(`${name}  ${msg}`);
  const isCode = /\.(js|mjs|css)$/.test(file);

  if (isCode ? PLACEHOLDER_IN_CODE.test(text) : text.includes("[[")) add("contains a [[placeholder]]");
  if (/data-todo/.test(text)) add("contains a data-todo marker");
  for (const host of disallowedVercelHosts(text)) add(`points to a *.vercel.app URL (${host}; set the final domain)`);

  if (file.endsWith(".html")) {
    problems.push(...checkHtml(text, name, root, /(^|\/)404\.html$/.test(name)));
  } else {
    if (/\.svg$/.test(file)) problems.push(...checkHtml(text, name, root, false, { markupOnly: true }));
    if (/\.(js|mjs)$/.test(file) && /<meta[^>]+name\s*=\s*["']?robots["']?[^>]*noindex/i.test(text)) {
      add("builds a noindex robots meta (only 404 may)");
    }
    if (/\.css$/.test(file) && /@import|url\(\s*["']?(?:https?:)?\/\//i.test(text)) add("loads an external stylesheet/asset (CSP is 'self' only)");
  }

  // No address may sit in the built output at all (it is assembled client-side); the message says
  // whether it is a personal mailbox, a stranger, or the configured alias.
  for (const address of new Set(text.match(EMAIL) ?? [])) {
    const isConfigured = contactAddress !== undefined && address.toLowerCase() === contactAddress.toLowerCase();
    const detail = isConfigured
      ? ""
      : PERSONAL_PROVIDER.test(address)
        ? " on a personal mail provider: only the configured contact address is allowed"
        : contactAddress
          ? ", which is not the configured contact address"
          : "";
    add(`contains a plain e-mail address (${address})${detail}`);
  }
  return problems;
};

/**
 * Lower-cased text with tags removed and entities decoded, so a denylisted name split by markup
 * (`Acme<b>Baby</b>`) or written as `Acm&#101;` is still found.
 * @param {string} text
 */
const normalizeMarkup = (text) =>
  text
    .replace(/<[^>]*>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .toLowerCase();

/**
 * @param {string} root
 * @param {{ file: string, text: string }[]} docs files to scan (text outputs and PDF text)
 * @param {{ env: Record<string, string | undefined>, warn: (message: string) => void }} io
 */
const checkDenylist = (root, docs, io) => {
  const list = join(root, "scripts/.denylist.local");
  if (!existsSync(list)) {
    const enforced = Boolean(io.env["CI"]) || io.env["PUBLISH"] === "1";
    const message =
      "scripts/.denylist.local  missing: the merchant denylist was NOT checked (copy scripts/.denylist.local.example and list the names)";
    io.warn(`WARNING ${message}`);
    return enforced ? [`${message}; mandatory when CI or PUBLISH=1`] : [];
  }
  const terms = read(list)
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => l.toLowerCase());
  return docs.flatMap(({ file, text }) => {
    const lower = text.toLowerCase();
    const normalized = normalizeMarkup(text);
    return terms
      .filter((t) => lower.includes(t) || normalized.includes(t))
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

/** @param {string} value */
const safeDecode = (value) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/** @param {string} pdf */
const defaultPdfText = (pdf) => execFileSync("pdftotext", [pdf, "-"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

/**
 * PDF checks: placeholders and e-mails in the text layer (only the configured alias may appear),
 * `mailto:` link annotations, and the freshness stamp of `public/cv`.
 * @param {string} root
 * @param {string[]} pdfs
 * @param {{ pdftotext: boolean, pdfText: (pdf: string) => string, contactAddress: string | undefined }} ctx
 * @returns {{ problems: string[], texts: { file: string, text: string }[] }}
 */
const checkPdfs = (root, pdfs, ctx) => {
  /** @type {string[]} */
  const problems = [];
  /** @type {{ file: string, text: string }[]} */
  const texts = [];
  if (pdfs.length > 0 && !ctx.pdftotext) {
    problems.push("pdftotext  not installed: the PDF text (placeholders, e-mails, denylist) cannot be verified (install poppler-utils)");
  } else {
    for (const pdf of pdfs) {
      const name = relative(root, pdf);
      const text = ctx.pdfText(pdf);
      texts.push({ file: pdf, text });
      if (text.includes("[[")) problems.push(`${name}  PDF text contains a [[placeholder]]`);
      for (const problem of findEmailProblems(text, ctx.contactAddress)) problems.push(`${name}  PDF text: ${problem}`);
      // Link annotations are not part of the text layer.
      const raw = readFileSync(pdf).toString("latin1");
      for (const m of raw.matchAll(/mailto:([^\s)>"'\\]+)/gi)) {
        const target = safeDecode((m[1] ?? "").split("?")[0] ?? "");
        for (const problem of findEmailProblems(target, ctx.contactAddress)) problems.push(`${name}  PDF mailto link: ${problem}`);
      }
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
  return { problems, texts };
};

/**
 * Every `/cv/*.pdf` linked from a page must exist in dist.
 * @param {string} root
 * @param {string[]} htmlFiles
 * @param {string[]} distFiles
 */
const checkPdfLinks = (root, htmlFiles, distFiles) => {
  const present = new Set(distFiles.map((f) => `/${relative(join(root, "dist"), f)}`));
  /** @type {string[]} */
  const problems = [];
  for (const file of htmlFiles) {
    for (const m of read(file).matchAll(/href="(\/[^"]+\.pdf)"/g)) {
      if (!present.has(m[1] ?? "")) problems.push(`${relative(root, file)}  links to ${m[1]} which does not exist`);
    }
  }
  return problems;
};

/**
 * Runs every pre-publication check against `root` (a project directory).
 * Returns a list of human-readable problems; empty = ready to publish.
 * @param {string} root
 * @param {{
 *   pdftotext?: boolean,
 *   pdfText?: (pdf: string) => string,
 *   env?: Record<string, string | undefined>,
 *   warn?: (message: string) => void,
 * }} [options] `pdftotext`: is the tool available (default: probe it); `pdfText`: text extractor
 *   (default: pdftotext); `env`: where CI / PUBLISH come from; `warn`: warning sink (default console.warn).
 */
export const runChecks = async (root, options = {}) => {
  const pdftotext = options.pdftotext ?? hasPdftotext();
  const io = { env: options.env ?? process.env, warn: options.warn ?? console.warn };
  const contactAddress = await loadContactAddress(root);
  const problems = [...checkContentPlaceholders(root), ...checkVercelRobots(root), ...(await checkConcepts(root))];

  const dist = join(root, "dist");
  if (!existsSync(dist)) {
    problems.push("dist/  missing: run `npm run build` first");
    return problems;
  }
  const distFiles = listFiles(dist);
  const textFiles = distFiles.filter((f) => TEXT_EXT.test(f));
  for (const file of textFiles) problems.push(...checkDistFile(root, file, contactAddress));

  const sourcePdfs = listFiles(join(root, "public/cv")).filter((f) => f.endsWith(".pdf"));
  // dist/cv/* is a copy of public/cv/*: only check the copy when it differs from its source.
  const copiedPdfs = distFiles
    .filter((f) => f.endsWith(".pdf"))
    .filter((f) => {
      const source = sourcePdfs.find((s) => s.endsWith(`/${relative(dist, f)}`.replace(/^\/?/, "/")));
      return !source || !readFileSync(source).equals(readFileSync(f));
    });
  const pdfs = [...sourcePdfs, ...copiedPdfs];
  const pdfResult = checkPdfs(root, pdfs, {
    pdftotext,
    pdfText: options.pdfText ?? defaultPdfText,
    contactAddress,
  });
  problems.push(
    ...pdfResult.problems,
    ...checkDenylist(root, [...textFiles.map((file) => ({ file, text: read(file) })), ...pdfResult.texts], io),
    ...checkPdfLinks(root, distFiles.filter((f) => f.endsWith(".html")), distFiles),
  );
  return problems;
};
