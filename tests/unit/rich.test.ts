import { test } from "node:test";
import assert from "node:assert/strict";
import { escapeHtml, plain, rich } from "../../src/lib/rich.ts";
import { hasPlaceholder, isPlaceholder, findPlaceholders } from "../../src/lib/placeholder.ts";

test("rich escapes HTML before applying markup", () => {
  assert.equal(rich('<img src=x onerror="alert(1)">'), "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  assert.equal(escapeHtml(`&<>"'`), "&amp;&lt;&gt;&quot;&#39;");
});

test("rich renders strong, emphasis and line breaks", () => {
  assert.equal(rich("**Gras** et *italique*.\nFin"), "<strong>Gras</strong> et <em>italique</em>.<br>Fin");
});

test("rich renders safe links only (https, root-relative, anchors)", () => {
  assert.equal(
    rich("[GitHub](https://github.com/x)"),
    '<a href="https://github.com/x" target="_blank" rel="noopener noreferrer">GitHub</a>',
  );
  assert.equal(rich("[CV](/fr/cv/)"), '<a href="/fr/cv/">CV</a>');
  assert.equal(rich("[haut](#contact)"), '<a href="#contact">haut</a>');
});

test("rich refuses javascript:, data:, http: and attribute-breaking URLs", () => {
  assert.equal(rich("[x](javascript:alert(1))"), "x");
  assert.equal(rich("[x](data:text/html;base64,AAAA)"), "x");
  assert.equal(rich("[x](http://insecure.example)"), "x");
  assert.ok(!rich('[x](https://a.example/"onmouseover="alert(1))').includes('"onmouseover'));
  assert.ok(!rich("[<b>x</b>](https://a.example)").includes("<b>"));
});

test("rich refuses protocol-relative and backslash targets, and a URL cannot carry emphasis", () => {
  assert.equal(rich("[x](//evil.example/a)"), "x");
  assert.equal(rich("[x](/\\evil.example)"), "x");
  assert.equal(rich("[x](/ok/path)"), '<a href="/ok/path">x</a>');
  const out = rich("[x](https://a.example/*b*) et *vrai*");
  assert.ok(!/href="[^"]*<em>/.test(out), out);
  assert.ok(out.endsWith("<em>vrai</em>"), out);
});

test("rich keeps a URL with balanced parentheses in one piece", () => {
  assert.equal(
    rich("[w](https://fr.wikipedia.org/wiki/A_(b))"),
    '<a href="https://fr.wikipedia.org/wiki/A_(b)" target="_blank" rel="noopener noreferrer">w</a>',
  );
});

test("a marker that already says it is unconfirmed gets no duplicate screen-reader suffix", () => {
  assert.equal(
    rich("[[à confirmer : disponibilité]]", "à confirmer"),
    '<span class="todo" data-todo>à confirmer : disponibilité</span>',
  );
  assert.ok(rich("[[to confirm: year]]", "to confirm").includes("(to confirm)") === false);
  assert.ok(rich("[[année]]", "à confirmer").includes('(à confirmer)'));
});

test("rich renders [[placeholders]] as a visible marker", () => {
  assert.equal(
    rich("Ouvert [[7h30]]", "à confirmer"),
    'Ouvert <span class="todo" data-todo>7h30<span class="sr-only"> (à confirmer)</span></span>',
  );
});

test("plain strips markup", () => {
  assert.equal(plain("**A** *b* [lien](https://x.example)\nfin"), "A b lien fin");
  assert.equal(plain("[w](https://fr.wikipedia.org/wiki/A_(b))"), "w");
});

test("isPlaceholder / hasPlaceholder / findPlaceholders", () => {
  assert.equal(isPlaceholder("Depuis [[année]]"), true);
  assert.equal(isPlaceholder("Depuis 2020"), false);
  assert.equal(isPlaceholder(42), false);
  const value = { a: ["ok", { b: "[[x]]" }], c: "fine" };
  assert.equal(hasPlaceholder(value), true);
  assert.equal(hasPlaceholder({ a: "fine" }), false);
  assert.deepEqual(findPlaceholders(value), ["$.a[1].b  [[x]]"]);
});
