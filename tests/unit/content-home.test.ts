import { test } from "node:test";
import assert from "node:assert/strict";
import { homeFr } from "../../src/content/home.fr.ts";
import { homeEn } from "../../src/content/home.en.ts";
import { shape } from "../../src/lib/shape.ts";
import { findPlaceholders } from "../../src/lib/placeholder.ts";

const strings = (value: unknown): string[] => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object") return Object.values(value).flatMap(strings);
  return [];
};

test("homeFr has the contracted structure: 2 offers, 5 cases", () => {
  assert.equal(homeFr.services.items.length, 2);
  assert.equal(homeFr.work.cases.length, 5);
  assert.deepEqual(
    homeFr.work.cases.map((c) => c.slug),
    ["alcodefi", "creche-des-anges", "blaze-type", "shellmates", "boutique-sur-mesure"],
  );
});

test("homeFr shape is stable (keys and list lengths)", () => {
  const fingerprint = shape(homeFr) as Record<string, Record<string, unknown>>;
  assert.deepEqual(Object.keys(fingerprint), ["meta", "hero", "services", "work", "about", "cvteaser", "contact", "footer"]);
  assert.equal((fingerprint["work"]?.["cases"] as unknown[]).length, 5);
});

test("case stamps tell the truth: nothing is stamped as delivered", () => {
  for (const c of homeFr.work.cases) {
    assert.notEqual(c.status, "delivered", c.slug);
    assert.ok(!/livr[ée]/i.test(c.stampLabel), c.stampLabel);
  }
  const stamps = Object.fromEntries(homeFr.work.cases.map((c) => [c.slug, c.stampLabel]));
  // Sentence case in the data: CSS uppercases the stamp, assistive tech reads words, not letters.
  assert.deepEqual(stamps, {
    alcodefi: "En ligne",
    "creche-des-anges": "En cours",
    "blaze-type": "En ligne",
    shellmates: "En ligne",
    "boutique-sur-mesure": "Exploration",
  });
});

test("live links are https; the unpublished crèche site and the exploration case have no public link", () => {
  for (const c of homeFr.work.cases) {
    for (const url of Object.values(c.links)) assert.match(url, /^https:\/\//);
  }
  const bySlug = Object.fromEntries(homeFr.work.cases.map((c) => [c.slug, c]));
  assert.deepEqual(bySlug["creche-des-anges"]?.links, {}, "a noindex draft is not linked");
  assert.equal(bySlug["creche-des-anges"]?.status, "wip");
  assert.deepEqual(bySlug["boutique-sur-mesure"]?.links, {});
  assert.equal(bySlug["alcodefi"]?.links.live, "https://www.alcodefi.org/");
});

test("no case is a concept that would need an anonymisation review", () => {
  assert.ok(homeFr.work.cases.every((c) => c.kind !== "concept"));
});

test("French typography: U+00A0 before : ; ? ! and after «, never a plain space", () => {
  for (const text of strings(homeFr)) {
    assert.doesNotMatch(text, / [:;?!»]/, text);
    assert.doesNotMatch(text, /« /, text);
  }
});

test("the e-mail address never appears in the home copy", () => {
  for (const text of strings(homeFr)) assert.doesNotMatch(text, /[\w.+-]+@[\w-]+\.[a-z]{2,}/i, text);
  assert.doesNotMatch(JSON.stringify(homeFr.contact.linkedin), /mailto:/);
});

test("the home copy has no placeholder left, and states no price, delay or guarantee", () => {
  assert.deepEqual(findPlaceholders(homeFr), []);
  for (const text of strings(homeFr.services)) assert.doesNotMatch(text, /\d\s?(?:DA|DZD|€|\$|EUR)|prix|tarif|devis|gratuit/i, text);
});

test("the offers section only asks to get in touch", () => {
  assert.equal(homeFr.services.cta, "Me contacter");
  assert.deepEqual(Object.keys(homeFr.services.items[0]).sort(), ["ref", "summary", "title"]);
});

test("status sentences live in statusNote, never appended to the case summary", () => {
  const notes = Object.fromEntries(homeFr.work.cases.map((c) => [c.slug, c.statusNote]));
  assert.deepEqual(notes, {
    alcodefi: "Réalisé pendant mon stage.",
    "creche-des-anges": "Pas encore publié.",
    "blaze-type": "Pas de commande client.",
    shellmates: "Réalisé en équipe, pas seul.",
    "boutique-sur-mesure": "Code privé, présentation sur demande.",
  });
  for (const c of homeFr.work.cases) {
    assert.doesNotMatch(c.summary, /En ligne\.|Pas de commande|pas seul|Code privé/, c.slug);
    assert.ok(c.summary.endsWith("."), c.slug);
  }
});

test("hero eyebrow, work cta and cv teaser come from the copy deck", () => {
  assert.equal(homeFr.hero.eyebrow, "Alger · USTHB, 3e année · auto-entrepreneur");
  assert.equal(homeFr.hero.availability, undefined, "no availability line until the owner decides");
  assert.equal(homeFr.work.cta, "Me contacter");
  assert.deepEqual(homeFr.cvteaser, {
    text: "Projets, formation et compétences sur une page.",
    viewLabel: "Voir le CV",
    downloadLabel: "Télécharger le CV (PDF)",
  });
  assert.equal(homeFr.cvteaser.downloadLabel, homeFr.hero.ctaSecondary.label);
});

test("live links have distinct, descriptive labels", () => {
  const labels = homeFr.work.cases.filter((c) => c.links.live).map((c) => c.liveLabel);
  assert.deepEqual(labels, ["Voir le site Alcodefi", "Voir Blaze Type en ligne", "Voir le site Shellmates"]);
  assert.equal(new Set(labels).size, labels.length);
});

test("À propos states the status and links GitHub", () => {
  const [first, second, tools, links] = homeFr.about.paragraphs;
  assert.match(first ?? "", /auto-entrepreneur/);
  assert.match(second ?? "", /3e année à l'USTHB.*Alcodefi/);
  for (const tool of ["Power Automate", "n8n", "Ollama", "llama.cpp", "Hermes", "OpenClaw", "Bash", "Claude Code"]) {
    assert.ok((tools ?? "").includes(tool), tool);
  }
  assert.match(links ?? "", /\[GitHub\]\(https:\/\/github\.com\/0xSyliane\)/);
});

test("the contact section offers LinkedIn and GitHub as working channels", () => {
  assert.equal(homeFr.contact.github?.href, "https://github.com/0xSyliane");
  assert.match(homeFr.contact.linkedin.href, /^https:\/\/www\.linkedin\.com\/in\//);
  assert.doesNotMatch(homeFr.contact.emailNoScript, /JavaScript requis/);
});

test("the English home mirrors the French one: same shape, same cases, same links, no French left in labels", () => {
  assert.deepEqual(shape(homeEn), shape(homeFr));
  assert.deepEqual(
    homeEn.work.cases.map((c) => [c.slug, c.status, c.links]),
    homeFr.work.cases.map((c) => [c.slug, c.status, c.links]),
  );
  assert.equal(homeEn.hero.ctaSecondary.href, "/cv/syliane-saadbouzid-cv-en.pdf");
  assert.deepEqual(homeEn.contact.email.local, homeFr.contact.email.local);
  assert.deepEqual(findPlaceholders(homeEn), []);
  assert.notEqual(homeEn.hero.lede, homeFr.hero.lede);
  assert.equal(homeEn.work.cases.find((c) => c.slug === "creche-des-anges")?.stampLabel, "In progress");
});

test("the English home states no price, delay or guarantee either", () => {
  for (const text of strings(homeEn.services)) assert.doesNotMatch(text, /\d\s?(?:DA|DZD|€|\$|EUR)|price|quote|free\b/i, text);
  assert.equal(homeEn.services.cta, "Get in touch");
});
