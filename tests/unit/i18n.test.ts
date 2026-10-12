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

test("page set: home, legal and CV exist in FR and EN", () => {
  for (const page of ["home", "legal", "cv"] as const) assert.deepEqual(localesOf(page), ["fr", "en"], page);
  assert.equal(pathFor("home", "en"), "/en/");
  assert.equal(pathFor("legal", "en"), "/en/legal-notice/");
});

test("every page has reciprocal alternates and a language switch", () => {
  for (const page of ["home", "legal", "cv"] as const) {
    assert.equal(alternatesFor(page).length, 3, page);
    assert.equal(switchTarget(page, "fr")?.locale, "en");
    assert.equal(switchTarget(page, "en")?.locale, "fr");
  }
});

test("hreflang set lists every real locale path once, plus an x-default pointing to FR", () => {
  const set = alternatesFor("cv");
  assert.deepEqual(
    set.map((a) => a.hreflang),
    ["fr", "en", "x-default"],
  );
  assert.deepEqual(
    set.filter((a) => a.hreflang !== "x-default").map((a) => [a.hreflang, a.path]),
    localesOf("cv").map((locale) => [locale, PAGES.cv[locale]]),
  );
  assert.equal(set.find((a) => a.hreflang === "x-default")?.path, pathFor("cv", "en"), "x-default is the English page");
});

test("the language switch is reciprocal: following it twice comes back to the start", () => {
  for (const locale of localesOf("cv")) {
    const there = switchTarget("cv", locale);
    assert.ok(there, `${locale} has a switch`);
    assert.notEqual(there.locale, locale);
    assert.deepEqual(switchTarget("cv", there.locale), { locale, path: pathFor("cv", locale) });
  }
  assert.deepEqual(switchTarget("cv", "fr"), { locale: "en", path: "/en/cv/" });
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

test("buildHead: self-referencing absolute canonical, alternates on every page", () => {
  const cv = buildHead({ page: "cv", locale: "en", title: "CV", description: "d" }, "https://x.example");
  assert.equal(cv.canonical, "https://x.example/en/cv/");
  assert.equal(cv.alternates.length, 3);
  assert.equal(cv.ogLocale, "en_GB");
  assert.deepEqual(cv.ogAlternateLocales, ["fr_FR"]);
  const home = buildHead({ page: "home", locale: "fr", title: "T", description: "d" }, "https://x.example");
  assert.equal(home.canonical, "https://x.example/fr/");
  assert.equal(home.alternates.length, 3);
  const homeEn = buildHead({ page: "home", locale: "en", title: "T", description: "d" }, "https://x.example");
  assert.equal(homeEn.canonical, "https://x.example/en/");
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
  assert.equal(isIsoDate("2025-02-30"), false, "no 30 February");
  assert.equal(isIsoDate("2025-02-29"), false, "2025 is not a leap year");
  assert.equal(isIsoDate("2024-02-29"), true, "2024 is");
  assert.equal(isIsoDate("1900-02-29"), false, "centuries are not leap unless divisible by 400");
  assert.equal(isIsoDate("2000-02-29"), true);
  assert.equal(isIsoDate("2025-04-31"), false);
  assert.equal(isIsoDate("2025-04-30"), true);
  assert.equal(isIsoDate("2025-00"), false);
  assert.equal(isIsoDate("2025-12-00"), false);
  assert.equal(isIsoDate("sept 2025"), false);
});
