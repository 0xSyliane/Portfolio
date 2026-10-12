import { test } from "node:test";
import assert from "node:assert/strict";
import { cvEn } from "../../src/content/cv/en.ts";
import { cvFacts } from "../../src/content/cv/facts.ts";
import { cvFr } from "../../src/content/cv/fr.ts";
import { shape } from "../../src/lib/shape.ts";
import { isIsoDate } from "../../src/lib/i18n.ts";
import { isPlaceholder } from "../../src/lib/placeholder.ts";

const keysDeep = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(keysDeep);
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => [k, ...keysDeep(v)]);
  }
  return [];
};

const stringsDeep = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsDeep);
  if (value && typeof value === "object") return Object.values(value).flatMap(stringsDeep);
  return [];
};

test("FR and EN CV copy have identical keys and list lengths", () => {
  assert.deepEqual(shape(cvFr), shape(cvEn));
});

test("copy list lengths match the facts they join to, in both locales", () => {
  for (const copy of [cvFr, cvEn]) {
    assert.equal(copy.entries.length, cvFacts.entries.length);
    assert.equal(copy.education.length, cvFacts.education.length);
    assert.equal(copy.skillGroups.length, cvFacts.skills.length);
    assert.equal(copy.languages.length, cvFacts.languages.length);
    assert.deepEqual(Object.keys(copy.linkLabels).sort(), ["github", "linkedin", "portfolio"]);
    for (const link of cvFacts.links) assert.ok(copy.linkLabels[link.id], link.id);
  }
});

test("ids and language codes resolve one-to-one, in the same order", () => {
  for (const copy of [cvFr, cvEn]) {
    assert.deepEqual(copy.entries.map((e) => e.id), cvFacts.entries.map((e) => e.id));
    assert.deepEqual(copy.education.map((e) => e.id), cvFacts.education.map((e) => e.id));
    assert.deepEqual(copy.skillGroups.map((g) => g.id), cvFacts.skills.map((g) => g.id));
    assert.deepEqual(copy.languages.map((l) => l.code), cvFacts.languages.map((l) => l.code));
  }
  assert.equal(new Set(cvFacts.entries.map((e) => e.id)).size, cvFacts.entries.length);
});

test("public CV privacy: no phone, address, birth date or photo field anywhere (H5)", () => {
  const forbidden = /phone|tel$|mobile|whatsapp|street|address|adresse|birth|naissance|born|photo|image|avatar|portrait/i;
  for (const data of [cvFacts, cvFr, cvEn]) {
    for (const key of keysDeep(data)) assert.doesNotMatch(key, forbidden, key);
  }
  assert.equal(cvFacts.profile.city, "Alger");
});

test("public CV privacy: no phone-like number and no plain e-mail address in any string", () => {
  for (const data of [cvFacts, cvFr, cvEn]) {
    for (const text of stringsDeep(data)) {
      assert.doesNotMatch(text, /\+?\d[\d .-]{8,}\d/, text);
      assert.doesNotMatch(text, /[\w.+-]+@[\w-]+\.[a-z]{2,}/i, text);
    }
  }
});

test("links are https and the e-mail is only kept as local/domain parts", () => {
  for (const link of cvFacts.links) assert.match(link.url, /^https:\/\//);
  for (const entry of cvFacts.entries) if (entry.url) assert.match(entry.url, /^https:\/\//);
  assert.deepEqual(Object.keys(cvFacts.email).sort(), ["domain", "local"]);
});

test("dates are ISO or a placeholder; an unknown start is never paired with an invented end", () => {
  for (const item of [...cvFacts.entries, ...cvFacts.education]) {
    for (const date of [item.start, item.end]) {
      if (date !== undefined) assert.ok(isIsoDate(date) || isPlaceholder(date), date);
    }
  }
});

test("French CV typography: U+00A0 before : ; ? !", () => {
  for (const text of stringsDeep(cvFr)) assert.doesNotMatch(text, / [:;?!»]/, text);
});

test("PDF links point to the generated files", () => {
  assert.equal(cvFr.downloadPdf.href, "/cv/syliane-saadbouzid-cv-fr.pdf");
  assert.equal(cvEn.downloadPdf.href, "/cv/syliane-saadbouzid-cv-en.pdf");
});

test("CV titles and descriptions follow the SEO brief (name first, 40-60 chars title, FR 140-155 description)", () => {
  assert.equal(cvFr.meta.title, "CV Syliane Saadbouzid — Développeur web et automatisation");
  assert.equal(cvEn.meta.title, "Syliane Saadbouzid CV — Web developer and automation");
  for (const copy of [cvFr, cvEn]) {
    assert.ok(copy.meta.title.length >= 40 && copy.meta.title.length <= 60, copy.meta.title);
    assert.ok(copy.meta.title.includes("Syliane Saadbouzid"), "brand inside: not duplicated by pageTitle");
    assert.match(copy.meta.description, /USTHB/);
  }
  assert.ok(cvFr.meta.description.length >= 140 && cvFr.meta.description.length <= 155, String(cvFr.meta.description.length));
  assert.ok(cvEn.meta.description.length >= 120 && cvEn.meta.description.length <= 155, String(cvEn.meta.description.length));
});
