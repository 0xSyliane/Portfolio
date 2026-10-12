import { test } from "node:test";
import assert from "node:assert/strict";
import { cvEn } from "../../src/content/cv/en.ts";
import { cvFacts } from "../../src/content/cv/facts.ts";
import { cvFr } from "../../src/content/cv/fr.ts";
import { buildCvView, displayUrl, formatPeriod } from "../../src/features/cv/model.ts";
import type { CvFacts } from "../../src/content/types.ts";

test("formatPeriod: ongoing entry ends with the localized 'present'", () => {
  assert.equal(formatPeriod("2025-09", undefined, "fr", "Présent"), "sept. 2025 – Présent");
  assert.equal(formatPeriod("2024", "2025-03", "en", "Present"), "2024 – Mar 2025");
});

test("formatPeriod: an unknown start prints nothing (never 'Present')", () => {
  assert.equal(formatPeriod(undefined, undefined, "fr", "Présent"), "");
  assert.equal(formatPeriod("[[période]]", undefined, "fr", "Présent"), "[[période]]");
});

test("displayUrl drops the scheme and trailing slash", () => {
  assert.equal(displayUrl("https://www.shellmates.club/"), "www.shellmates.club");
});

test("buildCvView joins facts and copy by id, in both locales", () => {
  for (const [copy, locale] of [
    [cvFr, "fr"],
    [cvEn, "en"],
  ] as const) {
    const view = buildCvView(cvFacts, copy, locale);
    assert.equal(view.entries.length, cvFacts.entries.length);
    assert.equal(view.entries[0]?.title, copy.entries[0]?.role);
    assert.deepEqual(view.entries[1]?.stack, cvFacts.entries[1]?.stack);
    assert.equal(view.skills[3]?.label, copy.skillGroups[3]?.label);
    assert.equal(view.languages.length, 3);
    assert.equal(view.links.length, cvFacts.links.length);
    assert.equal(view.place, copy.place, "the city is printed in the page language");
  }
  assert.equal(buildCvView(cvFacts, cvEn, "en").place, "Algiers");
});

test("buildCvView fails loudly when an id has no copy", () => {
  const broken: CvFacts = {
    ...cvFacts,
    entries: [...cvFacts.entries, { id: "ghost", kind: "project", org: "x", start: "2025", stack: [] }],
  };
  assert.throws(() => buildCvView(broken, cvFr, "fr"), /ghost/);
});

test("CEFR badge only shows for a confirmed level", () => {
  const facts: CvFacts = {
    ...cvFacts,
    languages: [
      { code: "fr", level: "native" },
      { code: "en", level: "C1" },
      { code: "ar", level: "[[niveau CEFR]]" },
    ],
  };
  const view = buildCvView(facts, cvFr, "fr");
  assert.deepEqual(
    view.languages.map((l) => l.cefr),
    [undefined, "C1", undefined],
  );
});
