import { test } from "node:test";
import assert from "node:assert/strict";
import { shape } from "../../src/lib/shape.ts";
import { cvEn } from "../../src/content/cv/en.ts";
import { cvFr } from "../../src/content/cv/fr.ts";
import { cvFacts } from "../../src/content/cv/facts.ts";
import { isIsoDate } from "../../src/lib/i18n.ts";

test("shape() fingerprints keys, list lengths and primitive types", () => {
  assert.deepEqual(shape({ a: "x", b: [1, 2], c: { d: true } }), {
    a: "string",
    b: ["number", "number"],
    c: { d: "boolean" },
  });
});

test("shape() detects a different list length or a missing key", () => {
  assert.notDeepEqual(shape({ list: ["a"] }), shape({ list: ["a", "b"] }));
  assert.notDeepEqual(shape({ a: "x" }), shape({ a: "x", b: "y" }));
});

test("FR and EN CV copy have the same shape", () => {
  assert.deepEqual(shape(cvEn), shape(cvFr));
});

test("CV copy ids join with the facts, in the same order, in both locales", () => {
  for (const copy of [cvFr, cvEn]) {
    assert.deepEqual(
      copy.entries.map((e) => e.id),
      cvFacts.entries.map((e) => e.id),
    );
    assert.deepEqual(
      copy.education.map((e) => e.id),
      cvFacts.education.map((e) => e.id),
    );
    assert.deepEqual(
      copy.skillGroups.map((g) => g.id),
      cvFacts.skills.map((g) => g.id),
    );
    assert.deepEqual(
      copy.languages.map((l) => l.code),
      cvFacts.languages.map((l) => l.code),
    );
  }
});

test("CV facts dates are ISO or a placeholder", () => {
  const dates = [
    ...cvFacts.entries.flatMap((e) => [e.start, e.end]),
    ...cvFacts.education.flatMap((e) => [e.start, e.end]),
  ].filter((d): d is string => d !== undefined);
  for (const d of dates) assert.ok(isIsoDate(d) || d.includes("[["), d);
});

test("CV facts expose no phone, street address or birth date (H5)", () => {
  const json = JSON.stringify(cvFacts).toLowerCase();
  for (const key of ["phone", "tel", "street", "birth", "naissance", "adresse"]) {
    assert.ok(!json.includes(`"${key}`), key);
  }
});
