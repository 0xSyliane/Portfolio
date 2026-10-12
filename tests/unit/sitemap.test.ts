import { test } from "node:test";
import assert from "node:assert/strict";
import { PAGES } from "../../src/lib/i18n.ts";
import { buildSitemap } from "../../src/lib/sitemap.ts";

const ORIGIN = "https://x.example";

test("one <url> per page and locale, absolute, trailing slash, no PDF", () => {
  const xml = buildSitemap(() => "2026-01-02", ORIGIN);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expected = Object.values(PAGES).flatMap((byLocale) => Object.values(byLocale).map((path) => `${ORIGIN}${path}`));
  assert.deepEqual(locs, expected);
  assert.equal(locs.length, 6);
  for (const loc of locs) assert.ok(loc?.endsWith("/"), loc);
  assert.ok(!xml.includes(".pdf"));
});

test("every page lists hreflang alternates (self + other + x-default), both locales listing the same set", () => {
  const xml = buildSitemap(() => undefined, ORIGIN);
  const blocks = xml.split("<url>").slice(1);
  const withLinks = blocks.filter((b) => b.includes("xhtml:link"));
  assert.equal(withLinks.length, 6);
  const sets = withLinks.map((b) => [...b.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => `${m[1]}=${m[2]}`));
  assert.deepEqual(sets[0], sets[1]);
  assert.deepEqual(sets[0], [`fr=${ORIGIN}/fr/`, `en=${ORIGIN}/en/`, `x-default=${ORIGIN}/en/`]);
  assert.deepEqual(sets[2], [`fr=${ORIGIN}/fr/cv/`, `en=${ORIGIN}/en/cv/`, `x-default=${ORIGIN}/en/cv/`]);
});

test("<lastmod> is written from the given date and omitted when unknown", () => {
  assert.equal([...buildSitemap((page) => (page === "home" ? "2026-01-02" : undefined), ORIGIN).matchAll(/<lastmod>/g)].length, 2);
  assert.ok(!buildSitemap(() => undefined, ORIGIN).includes("<lastmod>"));
});

test("a placeholder origin stays visible (the publish gate must see it)", () => {
  assert.ok(buildSitemap(() => undefined, "[[domaine]]").includes("<loc>[[domaine]]/fr/</loc>"));
});

test("special characters are escaped in locations", () => {
  assert.ok(buildSitemap(() => undefined, "https://x.example/?a=1&b=2").includes("a=1&amp;b=2"));
});
