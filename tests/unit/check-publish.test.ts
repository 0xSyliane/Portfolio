import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import {
  findConceptProblems,
  findEmailProblems,
  parseTags,
  runChecks,
} from "../../scripts/lib/publish-checks.mjs";
import { CV_SOURCES, computeCvSourceHash } from "../../scripts/lib/cv-source-hash.mjs";

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

const CONTACT = "hello@alcodefi.example";

type Files = Record<string, string>;
type Options = Parameters<typeof runChecks>[1];

/** Builds a throwaway project in the OS temp dir and returns its root. */
const project = (overrides: Files = {}, removals: string[] = []): string => {
  const root = mkdtempSync(join(tmpdir(), "portfolio-check-"));
  const files: Files = {
    "vercel.json": VERCEL,
    "src/content/site.ts": 'export const SITE_URL = "https://example.com";\n',
    "src/content/home.fr.ts": 'export const homeFr = { work: { cases: [{ slug: "demo", kind: "engineering" }] } };\n',
    "src/content/cv/facts.ts": 'export const cvFacts = { email: { local: "hello", domain: "alcodefi.example" } };\n',
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

/** Defaults: pdftotext available and every PDF reads as clean text; warnings are swallowed; no CI. */
const defaults: NonNullable<Options> = { pdftotext: true, pdfText: () => "Un CV propre", env: {}, warn: () => {} };

const run = async (overrides: Files = {}, removals: string[] = [], options: Options = {}): Promise<string[]> => {
  const root = project(overrides, removals);
  try {
    return await runChecks(root, { ...defaults, ...options });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
};

const mentions = (problems: string[], text: string): boolean => problems.some((p) => p.includes(text));
const withBody = (extra: string): string => CLEAN_HTML.replace("<body>", `<body>${extra}`);
const page = (html: string): Files => ({ "dist/fr/index.html": html });

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
    "dist/fr/todo/index.html": withBody("<span data-todo>x</span>"),
  });
  assert.ok(mentions(problems, "dist/fr/cv/index.html  contains a [[placeholder]]"));
  assert.ok(mentions(problems, "dist/sitemap.xml"));
  assert.ok(mentions(problems, "dist/robots.txt"));
  assert.ok(mentions(problems, "data-todo"));
});

test("placeholders are also found in js, css, svg and json outputs, without false positives on code", async () => {
  const problems = await run({
    "dist/_astro/a.js": 'const mail = "[[alias]]@x";',
    "dist/_astro/a.css": '.todo::before{content:"[["}.t{color:red}.todo::after{content:"]]"}',
    "dist/_astro/b.js": 'const grid=[[0,1],[2,3]];if(a.includes("[[")){}',
    "dist/icon.svg": '<svg xmlns="http://www.w3.org/2000/svg"><!-- [[logo]] --></svg>',
    "dist/data.json": '{"a":"[[x]]"}',
  });
  assert.ok(mentions(problems, "dist/_astro/a.js  contains a [[placeholder]]"));
  assert.ok(mentions(problems, "dist/icon.svg  contains a [[placeholder]]"));
  assert.ok(mentions(problems, "dist/data.json  contains a [[placeholder]]"));
  assert.ok(!mentions(problems, "dist/_astro/a.css"), "the print `[[` / `]]` pseudo-content is not a placeholder");
  assert.ok(!mentions(problems, "dist/_astro/b.js"), "nested arrays and a guard string are not placeholders");
});

test("fails on *.vercel.app URLs, in html and in bundled code", async () => {
  const problems = await run({
    ...page(CLEAN_HTML.replace("https://example.com", "https://x.vercel.app")),
    "dist/_astro/a.js": 'fetch("https://y.vercel.app/api")',
    "dist/_astro/a.css": "a{background:url(https://z.vercel.app/i.png)}",
  });
  assert.ok(mentions(problems, "x.vercel.app"));
  assert.ok(mentions(problems, "y.vercel.app"));
  assert.ok(mentions(problems, "z.vercel.app"));
});

test("allows the allowlisted blaze-type.vercel.app but rejects any other *.vercel.app host", async () => {
  const blaze = CLEAN_HTML.replace("https://example.com", "https://blaze-type.vercel.app/");
  assert.ok(!mentions(await run(page(blaze)), "vercel.app"));
  for (const host of ["portfolio-preview.vercel.app", "x.blaze-type.vercel.app", "evil-blaze-type.vercel.app", "evil-syliane.vercel.app"]) {
    const problems = await run(page(blaze.replace("blaze-type.vercel.app", host)));
    assert.ok(mentions(problems, host), host);
  }
});

test("SITE_URL placeholder [[domaine]] is a placeholder failure, not a vercel.app one", async () => {
  const problems = await run({ "src/content/site.ts": 'export const SITE_URL = "[[domaine]]";\n' });
  assert.ok(mentions(problems, "[[domaine]]"));
  assert.ok(!mentions(problems, "vercel.app"));
});

test("fails on style attributes and <style> blocks", async () => {
  const attr = await run(page(CLEAN_HTML.replace("<body>", '<body style="color:red">')));
  assert.ok(mentions(attr, 'style=""'));
  const single = await run(page(withBody("<p STYLE='color:red'>x</p>")));
  assert.ok(mentions(single, 'style=""'), "single quotes and upper case are parsed");
  const block = await run(page(CLEAN_HTML.replace("</head>", "<style>a{}</style></head>")));
  assert.ok(mentions(block, "<style>"));
});

test("inline scripts: JSON-LD and src scripts pass, every other inline script fails", async () => {
  assert.deepEqual(await run(), [], "the clean page has JSON-LD and a module script");
  const single = await run(page(CLEAN_HTML.replace("application/ld+json", "application/LD+JSON")));
  assert.deepEqual(single, [], "the JSON-LD type is matched case-insensitively");
  const bad = await run(page(CLEAN_HTML.replace("</body>", "<script>alert(1)</script></body>")));
  assert.ok(mentions(bad, "inline <script>"));
  const typed = await run(page(CLEAN_HTML.replace("</body>", '<script type="module">alert(1)</script></body>')));
  assert.ok(mentions(typed, "inline <script>"));
});

test("a data-src attribute does not make an inline script look external", async () => {
  const sneaky = await run(page(CLEAN_HTML.replace("</body>", '<script data-src="x">alert(1)</script></body>')));
  assert.ok(mentions(sneaky, "inline <script>"));
  const typeInData = await run(page(CLEAN_HTML.replace("</body>", '<script data-type="application/ld+json">alert(1)</script></body>')));
  assert.ok(mentions(typeInData, "inline <script>"));
});

test("fails on inline event handlers and javascript: URLs, whatever the quoting or spacing", async () => {
  const handler = await run(page(withBody('<button onclick="x()">b</button>')));
  assert.ok(mentions(handler, "inline event handler (onclick=)"));
  const unquoted = await run(page(withBody("<img src=/a.png onerror=alert(1)>")));
  assert.ok(mentions(unquoted, "onerror="));
  const href = await run(page(withBody('<a href="java\tscript:alert(1)">x</a>')));
  assert.ok(mentions(href, "javascript: URL"));
  const upper = await run(page(withBody("<a href='JAVASCRIPT:alert(1)'>x</a>")));
  assert.ok(mentions(upper, "javascript: URL"));
});

test("fails on external scripts, stylesheets and images (CSP is 'self')", async () => {
  const script = await run(page(CLEAN_HTML.replace('src="/_astro/a.js"', 'src="https://cdn.example/x.js"')));
  assert.ok(mentions(script, "external script"));
  const css = await run(page(CLEAN_HTML.replace('href="/_astro/a.css"', 'href="//cdn.example/x.css"')));
  assert.ok(mentions(css, "external stylesheet"));
  const img = await run(page(withBody('<img src="https://cdn.example/a.png" alt="">')));
  assert.ok(mentions(img, "external img"));
  assert.deepEqual(await run(page(CLEAN_HTML.replace("</head>", '<link rel="canonical" href="https://example.com/fr/"></head>'))), [], "canonical may be absolute");
});

test("fails on a global noindex header", async () => {
  const header = await run({
    "vercel.json": JSON.stringify({
      headers: [{ source: "/(.*)", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }],
    }),
  });
  assert.ok(mentions(header, "X-Robots-Tag"));
});

test("noindex robots meta is found whatever the attribute order, quoting or bot name; only 404 may carry it", async () => {
  const variants = [
    '<meta name="robots" content="noindex, nofollow">',
    '<meta content="noindex" name="robots">',
    "<meta name='robots' content='noindex'>",
    '<meta NAME="Googlebot" CONTENT="NOINDEX">',
    '<meta name="robots" content="none">',
  ];
  for (const meta of variants) {
    const problems = await run(page(CLEAN_HTML.replace("</head>", `${meta}</head>`)));
    assert.ok(mentions(problems, "noindex robots meta"), meta);
  }
  assert.deepEqual(await run({ "dist/404.html": CLEAN_HTML.replace("index, follow", "noindex, follow") }), []);
  assert.deepEqual(await run(page(CLEAN_HTML.replace("</head>", '<meta name="viewport" content="noindex-is-a-word">'))), []);
});

test("fails on a mailto, an unsafe _blank and an http link", async () => {
  const mailto = await run(page(CLEAN_HTML.replace('href="https://example.com"', 'href="mailto:a"')));
  assert.ok(mentions(mailto, "mailto"));
  const blank = await run(page(CLEAN_HTML.replace(' rel="noopener noreferrer"', "")));
  assert.ok(mentions(blank, "noopener"));
  const relOnly = await run(page(CLEAN_HTML.replace('rel="noopener noreferrer"', 'rel="nofollow"')));
  assert.ok(mentions(relOnly, "noopener"));
  const http = await run(page(CLEAN_HTML.replace("https://example.com", "http://example.com")));
  assert.ok(mentions(http, "non-https"));
});

test("e-mail addresses in the output: any address fails, a personal provider says so", async () => {
  const stranger = await run(page(withBody("write me@example.org")));
  assert.ok(mentions(stranger, "plain e-mail address (me@example.org), which is not the configured contact address"));
  for (const address of ["a@gmail.com", "a@outlook.fr", "a@hotmail.com", "a@yahoo.fr", "a@proton.me", "a@protonmail.com"]) {
    const problems = await run(page(withBody(address)));
    assert.ok(mentions(problems, `${address}) on a personal mail provider`), address);
  }
  const configured = await run(page(withBody(CONTACT)));
  assert.ok(mentions(configured, `plain e-mail address (${CONTACT})`), "even the alias must be assembled by JS");
  assert.ok(!mentions(configured, "not the configured"));
  const inScript = await run({ "dist/_astro/a.js": 'const a="x@gmail.com"' });
  assert.ok(mentions(inScript, "dist/_astro/a.js  contains a plain e-mail address (x@gmail.com) on a personal"));
});

test("findEmailProblems: only the configured address is allowed, never a personal provider", () => {
  assert.deepEqual(findEmailProblems("write hello@alcodefi.example now", CONTACT), []);
  assert.deepEqual(findEmailProblems("Hello@AlcoDefi.Example", CONTACT), [], "case-insensitive");
  assert.equal(findEmailProblems("a@b.example", CONTACT).length, 1);
  assert.deepEqual(findEmailProblems("a@gmail.com", "a@gmail.com"), [], "a personal mailbox is allowed when the owner configured it");
  assert.equal(findEmailProblems("b@gmail.com", "a@gmail.com").length, 1, "any other personal mailbox is refused");
  assert.equal(findEmailProblems("hello@alcodefi.example", undefined).length, 1, "no configured address: any address fails");
  assert.deepEqual(findEmailProblems("[[alias]]@[[domaine mail]]", undefined), []);
  assert.deepEqual(findEmailProblems("no address here", CONTACT), []);
});

test("parseTags reads quoted, single-quoted and bare attributes, and '>' inside a value", () => {
  const [tag] = parseTags(`<A HREF='x' data-a="1>2" hidden target=_blank>`);
  assert.equal(tag?.name, "a");
  assert.equal(tag?.attrs.get("href"), "x");
  assert.equal(tag?.attrs.get("data-a"), "1>2");
  assert.equal(tag?.attrs.get("hidden"), "");
  assert.equal(tag?.attrs.get("target"), "_blank");
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

test("the concept review fails when it has nothing to inspect (no file, or no case)", async () => {
  assert.ok(mentions(await run({}, ["src/content/home.fr.ts"]), "no case study to review"));
  const empty = await run({ "src/content/home.fr.ts": "export const homeFr = { work: { cases: [] } };\n" });
  assert.ok(mentions(empty, "no case study found"));
});

test("fails when dist/ is missing", async () => {
  const root = project({}, ["dist/fr/index.html"]);
  try {
    assert.ok(mentions(await runChecks(root, defaults), "dist/  missing"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("fails when a linked PDF is missing from dist", async () => {
  const problems = await run({ "dist/fr/cv/index.html": withBody('<a href="/cv/a.pdf">pdf</a>') });
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
    assert.deepEqual(await runChecks(root, defaults), []);
    writeFileSync(join(root, "src/content/cv/fr.ts"), "export const a = 2;\n");
    assert.ok(mentions(await runChecks(root, defaults), "stale"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the CV stamp covers the shared design layer, the layout, the markup helpers and the generator", () => {
  for (const expected of ["src/styles", "src/layouts", "src/lib/rich.ts", "src/components", "scripts/cv-pdf.mjs", "src/content/site.ts"]) {
    assert.ok(CV_SOURCES.includes(expected), expected);
  }
  const files: Files = {
    "src/styles/tokens.css": ":root{--a:1}",
    "src/layouts/BaseLayout.astro": "<html></html>",
    "src/lib/rich.ts": "export const a = 1;",
    "src/content/site.ts": "export const b = 1;",
  };
  const root = project(files);
  try {
    const before = computeCvSourceHash(root);
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(root, name), `${content}\n/* changed */`);
      const after = computeCvSourceHash(root);
      assert.notEqual(after, before, `${name} must change the hash`);
      writeFileSync(join(root, name), content);
      assert.equal(computeCvSourceHash(root), before, "restoring the file restores the hash");
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the CV stamp throws on a source it cannot read instead of silently skipping it", () => {
  // A directory where a file is expected: it exists, so it is hashed, but it cannot be read.
  const root = project();
  try {
    mkdirSync(join(root, "src/lib/rich.ts"), { recursive: true });
    assert.throws(() => computeCvSourceHash(root), /EISDIR/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("PDF text: placeholders and strangers fail, only the configured alias passes", async () => {
  const pdfs = { "public/cv/cv.pdf": "%PDF-1.4" };
  const stamp = async (options: Options): Promise<string[]> => {
    const root = project(pdfs);
    try {
      writeFileSync(join(root, "public/cv/.source-hash"), `${computeCvSourceHash(root)}\n`);
      return await runChecks(root, { ...defaults, ...options });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  };
  assert.deepEqual(await stamp({ pdfText: () => `Contact ${CONTACT}` }), []);
  assert.ok(mentions(await stamp({ pdfText: () => "Contact [[alias]]@[[domaine mail]]" }), "PDF text contains a [[placeholder]]"));
  assert.ok(mentions(await stamp({ pdfText: () => "Contact me@elsewhere.example" }), "PDF text: e-mail me@elsewhere.example is not the configured contact address"));
  assert.ok(mentions(await stamp({ pdfText: () => "Contact moi@gmail.com" }), "personal e-mail address on a mail provider"));
});

test("a mailto link annotation inside a PDF is checked like its text", async () => {
  const withLink = (target: string): Files => ({ "public/cv/cv.pdf": `%PDF-1.4\n/A << /S /URI /URI (mailto:${target}) >>` });
  const stamp = async (files: Files): Promise<string[]> => {
    const root = project(files);
    try {
      writeFileSync(join(root, "public/cv/.source-hash"), `${computeCvSourceHash(root)}\n`);
      return await runChecks(root, defaults);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  };
  assert.deepEqual(await stamp(withLink(`${CONTACT}?subject=Hi`)), []);
  assert.ok(mentions(await stamp(withLink("a%40gmail.com")), "PDF mailto link"));
  assert.ok(mentions(await stamp(withLink("stranger@example.org")), "PDF mailto link"));
});

test("PDFs present but pdftotext absent is a failure, not a silent skip", async () => {
  const problems = await run({ "public/cv/cv.pdf": "%PDF-1.4" }, [], { pdftotext: false });
  assert.ok(mentions(problems, "pdftotext  not installed"));
  assert.deepEqual(await run({}, [], { pdftotext: false }), [], "no PDF, no need for pdftotext");
});

test("a copy of a PDF in dist is checked only when it differs from public/cv", async () => {
  const seen: string[] = [];
  const root = project({ "public/cv/cv.pdf": "%PDF-1.4 same", "dist/cv/cv.pdf": "%PDF-1.4 same" });
  try {
    writeFileSync(join(root, "public/cv/.source-hash"), `${computeCvSourceHash(root)}\n`);
    await runChecks(root, { ...defaults, pdfText: (pdf) => (seen.push(pdf), "ok") });
    assert.equal(seen.length, 1);
    writeFileSync(join(root, "dist/cv/cv.pdf"), "%PDF-1.4 different");
    seen.length = 0;
    await runChecks(root, { ...defaults, pdfText: (pdf) => (seen.push(pdf), "ok") });
    assert.equal(seen.length, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("denylist terms are grepped case-insensitively in html AND in _astro assets", async () => {
  const list = { "scripts/.denylist.local": "# merchants\nAcme Baby\n" };
  const html = await run({ ...list, ...page(withBody("Site for acme baby")) });
  assert.ok(mentions(html, 'denylisted term "acme baby"'));
  const asset = await run({ ...list, "dist/_astro/a.js": 'const n="ACME BABY";' });
  assert.ok(mentions(asset, "dist/_astro/a.js  contains denylisted term"));
  assert.deepEqual(await run({ ...list, ...page(withBody("Acme Boy")) }), []);
});

test("denylist terms are found split by tags or written with entities", async () => {
  const list = { "scripts/.denylist.local": "acme baby\n" };
  assert.ok(mentions(await run({ ...list, ...page(withBody("<b>Acme</b> <i>Baby</i>")) }), "acme baby"));
  assert.ok(mentions(await run({ ...list, ...page(withBody("Acm&#101;&nbsp;Baby")) }), "acme baby"));
});

test("denylist terms are grepped in PDF text too", async () => {
  const files = { "scripts/.denylist.local": "acme baby\n", "public/cv/cv.pdf": "%PDF-1.4" };
  const root = project(files);
  try {
    writeFileSync(join(root, "public/cv/.source-hash"), `${computeCvSourceHash(root)}\n`);
    const problems = await runChecks(root, { ...defaults, pdfText: () => "Projet Acme Baby" });
    assert.ok(mentions(problems, "public/cv/cv.pdf  contains denylisted term"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a missing denylist warns loudly; it fails the gate when CI or PUBLISH=1", async () => {
  const warnings: string[] = [];
  const warn = (message: string): number => warnings.push(message);
  assert.deepEqual(await run({}, [], { warn }), [], "local run: warning only");
  assert.equal(warnings.length, 1);
  assert.match(warnings[0] ?? "", /WARNING .*denylist\.local.*NOT checked/);

  for (const env of [{ CI: "true" }, { PUBLISH: "1" }]) {
    const problems = await run({}, [], { env });
    assert.ok(mentions(problems, "scripts/.denylist.local  missing"), JSON.stringify(env));
    assert.ok(mentions(problems, "mandatory when CI or PUBLISH=1"));
  }
  assert.deepEqual(await run({}, [], { env: { PUBLISH: "0" } }), []);
  assert.deepEqual(await run({ "scripts/.denylist.local": "# nothing yet\n" }, [], { env: { CI: "true" } }), [], "an existing list satisfies CI");
});

test("fails when the og:image file is missing from dist, passes when present", async () => {
  const withOg = CLEAN_HTML.replace("</head>", '<meta property="og:image" content="https://example.com/og-fr.png"></head>');
  assert.ok(mentions(await run(page(withOg)), "og:image /og-fr.png"));
  assert.deepEqual(await run({ ...page(withOg), "dist/og-fr.png": "png" }), []);
});
