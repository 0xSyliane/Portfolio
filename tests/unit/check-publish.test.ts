import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { findConceptProblems, runChecks } from "../../scripts/lib/publish-checks.mjs";
import { computeCvSourceHash } from "../../scripts/lib/cv-source-hash.mjs";

const CLEAN_HTML = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Syl</title>
<meta name="robots" content="index, follow"><link rel="stylesheet" href="/_astro/a.css">
<script type="application/ld+json">{"@type":"Person"}</script></head>
<body><a href="https://example.com" target="_blank" rel="noopener noreferrer">x</a>
<script type="module" src="/_astro/a.js"></script></body></html>`;

const VERCEL = JSON.stringify({
  headers: [
    { source: "/(.*)", headers: [{ key: "X-Content-Type-Options", value: "nosniff" }] },
    { source: "/cv/(.*)\\.pdf", headers: [{ key: "X-Robots-Tag", value: "noindex" }] },
  ],
});

type Files = Record<string, string>;

/** Builds a throwaway project in the OS temp dir and returns its root. */
const project = (overrides: Files = {}, removals: string[] = []): string => {
  const root = mkdtempSync(join(tmpdir(), "portfolio-check-"));
  const files: Files = {
    "vercel.json": VERCEL,
    "src/content/site.ts": 'export const SITE_URL = "https://example.com";\n',
    "dist/fr/index.html": CLEAN_HTML,
    ...overrides,
  };
  for (const name of removals) delete files[name];
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, name)), { recursive: true });
    writeFileSync(join(root, name), content);
  }
  return root;
};

const run = async (overrides: Files = {}, removals: string[] = []): Promise<string[]> => {
  const root = project(overrides, removals);
  try {
    return await runChecks(root, { pdftotext: false });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const mentions = (problems: string[], text: string): boolean => problems.some((p) => p.includes(text));

test("a clean project passes", async () => {
  assert.deepEqual(await run(), []);
});

test("fails on [[placeholders]] in src/content but not in whole-line comments", async () => {
  const bad = await run({ "src/content/home.fr.ts": 'export const x = "[[titre]]";\n' });
  assert.ok(mentions(bad, "home.fr.ts:1"));
  const ok = await run({ "src/content/note.ts": "// Use [[like this]] for unknown facts\nexport const y = 1;\n" });
  assert.deepEqual(ok, []);
});

test("fails on [[ and data-todo in built HTML, XML and txt", async () => {
  const problems = await run({
    "dist/fr/cv/index.html": CLEAN_HTML.replace("<title>Syl", "<title>[[titre]]"),
    "dist/sitemap.xml": "<urlset><loc>[[domaine]]/fr/</loc></urlset>",
    "dist/robots.txt": "Sitemap: [[domaine]]/sitemap.xml",
    "dist/fr/todo/index.html": CLEAN_HTML.replace("<body>", '<body><span data-todo>x</span>'),
  });
  assert.ok(mentions(problems, "dist/fr/cv/index.html  contains a [[placeholder]]"));
  assert.ok(mentions(problems, "dist/sitemap.xml"));
  assert.ok(mentions(problems, "dist/robots.txt"));
  assert.ok(mentions(problems, "data-todo"));
});

test("fails on *.vercel.app URLs", async () => {
  const problems = await run({ "dist/fr/index.html": CLEAN_HTML.replace("https://example.com", "https://x.vercel.app") });
  assert.ok(mentions(problems, "vercel.app"));
});

test("fails on style attributes and <style> blocks", async () => {
  const attr = await run({ "dist/fr/index.html": CLEAN_HTML.replace("<body>", '<body style="color:red">') });
  assert.ok(mentions(attr, 'style=""'));
  const block = await run({ "dist/fr/index.html": CLEAN_HTML.replace("</head>", "<style>a{}</style></head>") });
  assert.ok(mentions(block, "<style>"));
});

test("fails on an inline script but accepts src scripts and JSON-LD", async () => {
  const bad = await run({ "dist/fr/index.html": CLEAN_HTML.replace("</body>", "<script>alert(1)</script></body>") });
  assert.ok(mentions(bad, "inline <script>"));
});

test("fails on a global noindex header and on a noindex meta outside 404", async () => {
  const header = await run({
    "vercel.json": JSON.stringify({
      headers: [{ source: "/(.*)", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }],
    }),
  });
  assert.ok(mentions(header, "X-Robots-Tag"));
  const meta = await run({ "dist/fr/index.html": CLEAN_HTML.replace("index, follow", "noindex, nofollow") });
  assert.ok(mentions(meta, "noindex robots meta"));
  const ok404 = await run({ "dist/404.html": CLEAN_HTML.replace("index, follow", "noindex, follow") });
  assert.deepEqual(ok404, []);
});

test("fails on a plain e-mail, a mailto, an unsafe _blank and an http link", async () => {
  const email = await run({ "dist/fr/index.html": CLEAN_HTML.replace("<body>", "<body>write me@example.org") });
  assert.ok(mentions(email, "plain e-mail"));
  const mailto = await run({ "dist/fr/index.html": CLEAN_HTML.replace('href="https://example.com"', 'href="mailto:a"') });
  assert.ok(mentions(mailto, "mailto"));
  const blank = await run({ "dist/fr/index.html": CLEAN_HTML.replace(' rel="noopener noreferrer"', "") });
  assert.ok(mentions(blank, "noopener"));
  const http = await run({ "dist/fr/index.html": CLEAN_HTML.replace("https://example.com", "http://example.com") });
  assert.ok(mentions(http, "non-https"));
});

test("concepts must have anonymised === true", () => {
  const problems = findConceptProblems([
    { slug: "a", kind: "concept", anonymised: true },
    { slug: "b", kind: "concept" },
    { slug: "c", kind: "concept", anonymised: false },
    { slug: "d", kind: "real" },
  ]);
  assert.equal(problems.length, 2);
  assert.ok(problems[0]?.includes('"b"'));
});

test("runChecks loads home.fr.ts and flags an unreviewed concept", async () => {
  const problems = await run({
    "src/content/home.fr.ts": 'export const homeFr = { work: { cases: [{ slug: "boutique", kind: "concept" }] } };\n',
  });
  assert.ok(mentions(problems, 'concept "boutique"'));
});

test("fails when dist/ is missing", async () => {
  const root = project({}, ["dist/fr/index.html"]);
  try {
    assert.ok(mentions(await runChecks(root, { pdftotext: false }), "dist/  missing"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("fails when a linked PDF is missing from dist", async () => {
  const problems = await run({ "dist/fr/cv/index.html": CLEAN_HTML.replace("<body>", '<body><a href="/cv/a.pdf">pdf</a>') });
  assert.ok(mentions(problems, "/cv/a.pdf which does not exist"));
});

test("detects a stale CV PDF hash and accepts a fresh one", async () => {
  const pdf = { "public/cv/a.pdf": "%PDF-1.4", "src/content/cv/fr.ts": "export const a = 1;\n" };
  const stale = await run({ ...pdf, "public/cv/.source-hash": "deadbeef" });
  assert.ok(mentions(stale, "stale"));
  const missing = await run(pdf);
  assert.ok(mentions(missing, ".source-hash  missing"));

  const root = project({ ...pdf });
  try {
    writeFileSync(join(root, "public/cv/.source-hash"), `${computeCvSourceHash(root)}\n`);
    assert.deepEqual(await runChecks(root, { pdftotext: false }), []);
    writeFileSync(join(root, "src/content/cv/fr.ts"), "export const a = 2;\n");
    assert.ok(mentions(await runChecks(root, { pdftotext: false }), "stale"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("denylist terms are grepped in dist, case-insensitively; no list = no check", async () => {
  const problems = await run({
    "scripts/.denylist.local": "# merchants\nAcme Baby\n",
    "dist/fr/index.html": CLEAN_HTML.replace("<body>", "<body>Site for acme baby"),
  });
  assert.ok(mentions(problems, 'denylisted term "acme baby"'));
  assert.deepEqual(await run({ "dist/fr/index.html": CLEAN_HTML.replace("<body>", "<body>Acme Baby") }), []);
});

test("fails when the og:image file is missing from dist, passes when present", async () => {
  const withOg = CLEAN_HTML.replace("</head>", '<meta property="og:image" content="https://example.com/og-fr.png"></head>');
  assert.ok(mentions(await run({ "dist/fr/index.html": withOg }), "og:image /og-fr.png"));
  assert.deepEqual(await run({ "dist/fr/index.html": withOg, "dist/og-fr.png": "png" }), []);
});
