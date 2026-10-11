import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LOCALES,
  PAGES,
  alternatesFor,
  formatIsoDate,
  isIsoDate,
  localesOf,
  pathFor,
  switchTarget,
  type PageId,
} from "../../src/lib/i18n.ts";
import { absoluteUrl, buildHead, pageTitle } from "../../src/lib/seo.ts";

const pageIds = Object.keys(PAGES) as PageId[];

test("V1 page set: home, legal FR only; CV in FR and EN", () => {
  assert.deepEqual(localesOf("home"), ["fr"]);
  assert.deepEqual(localesOf("legal"), ["fr"]);
  assert.deepEqual(localesOf("cv"), ["fr", "en"]);
});

test("single-locale pages have no alternates and no language switch", () => {
  for (const page of ["home", "legal"] as const) {
    assert.deepEqual(alternatesFor(page), []);
    assert.equal(switchTarget(page, "fr"), undefined);
  }
});

test("hreflang is reciprocal: every alternate lists the same set, x-default is FR", () => {
  const set = alternatesFor("cv");
  assert.deepEqual(
    set.map((a) => a.hreflang),
    ["fr", "en", "x-default"],
  );
  assert.equal(set.find((a) => a.hreflang === "x-default")?.path, pathFor("cv", "fr"));
  for (const locale of localesOf("cv")) {
    const self = pathFor("cv", locale);
    assert.ok(set.some((a) => a.path === self), `${locale} lists itself`);
  }
});

test("the language switch is reciprocal", () => {
  const toEn = switchTarget("cv", "fr");
  const toFr = switchTarget("cv", "en");
  assert.deepEqual(toEn, { locale: "en", path: "/en/cv/" });
  assert.deepEqual(toFr, { locale: "fr", path: "/fr/cv/" });
});

test("every path is lowercase, locale-prefixed and ends with a slash", () => {
  for (const id of pageIds) {
    for (const locale of LOCALES) {
      const path = pathFor(id, locale);
      if (!path) continue;
      assert.match(path, new RegExp(`^/${locale}/([a-z0-9-]+/)*$`), path);
    }
  }
});

test("buildHead: self-referencing absolute canonical, alternates only for the CV", () => {
  const cv = buildHead({ page: "cv", locale: "en", title: "CV", description: "d" }, "https://x.example");
  assert.equal(cv.canonical, "https://x.example/en/cv/");
  assert.equal(cv.alternates.length, 3);
  assert.equal(cv.ogLocale, "en_GB");
  assert.deepEqual(cv.ogAlternateLocales, ["fr_FR"]);
  const home = buildHead({ page: "home", locale: "fr", title: "T", description: "d" }, "https://x.example");
  assert.equal(home.canonical, "https://x.example/fr/");
  assert.equal(home.alternates.length, 0);
  assert.throws(() => buildHead({ page: "home", locale: "en", title: "T", description: "d" }));
});

test("absoluteUrl keeps a [[placeholder]] origin visible instead of throwing", () => {
  assert.equal(absoluteUrl("/fr/", "[[domaine]]"), "[[domaine]]/fr/");
  assert.equal(absoluteUrl("fr/", "https://x.example/"), "https://x.example/fr/");
});

test("pageTitle puts the brand last, once", () => {
  assert.equal(pageTitle("CV", "Syl"), "CV | Syl");
  assert.equal(pageTitle("Syl, dev web", "Syl"), "Syl, dev web");
});

test("date helpers", () => {
  assert.equal(formatIsoDate("2025-09", "fr"), "sept. 2025");
  assert.equal(formatIsoDate("2025-09-14", "en"), "Sep 2025");
  assert.equal(formatIsoDate("2025", "fr"), "2025");
  assert.equal(formatIsoDate("[[date]]", "fr"), "[[date]]");
  assert.equal(isIsoDate("2025-13"), false);
  assert.equal(isIsoDate("2025-02-30"), true);
  assert.equal(isIsoDate("sept 2025"), false);
});
