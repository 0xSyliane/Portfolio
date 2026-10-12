import { test } from "node:test";
import assert from "node:assert/strict";
import { caseStudyLd, knowsAboutFrom, personLd, serializeLd, stripPlaceholders } from "../../src/lib/jsonld.ts";
import type { CaseStudy } from "../../src/content/types.ts";
import { cvFacts } from "../../src/content/cv/facts.ts";
import { SITE_NAME_VARIANTS } from "../../src/content/site.ts";

test("stripPlaceholders drops any field containing [[", () => {
  assert.deepEqual(stripPlaceholders({ name: "A", url: "[[domaine]]/x", nested: { v: "[[x]]", k: "ok" } }), {
    name: "A",
    nested: { k: "ok" },
  });
});

test("stripPlaceholders filters arrays and drops emptied containers", () => {
  assert.deepEqual(stripPlaceholders({ sameAs: ["https://a.example", "[[linkedin]]"] }), {
    sameAs: ["https://a.example"],
  });
  assert.equal(stripPlaceholders({ sameAs: ["[[a]]"] }), undefined);
});

test("an object left with only @type is dropped, an @id reference survives", () => {
  assert.deepEqual(stripPlaceholders({ name: "A", address: { "@type": "PostalAddress", city: "[[x]]" } }), {
    name: "A",
  });
  assert.deepEqual(stripPlaceholders({ author: { "@id": "https://a.example/#p" } }), {
    author: { "@id": "https://a.example/#p" },
  });
});

test("stripPlaceholders does not mutate its input", () => {
  const input = { a: "[[x]]", b: "ok" };
  stripPlaceholders(input);
  assert.deepEqual(input, { a: "[[x]]", b: "ok" });
});

test("serializeLd never emits [[ nor a raw </script>", () => {
  const [json] = serializeLd([{ "@type": "Person", name: "A</script><b>", jobTitle: "[[poste]]" }]);
  assert.ok(json);
  assert.ok(!json.includes("[["));
  assert.ok(!json.includes("</script>"));
  assert.equal(JSON.parse(json)["@context"], "https://schema.org");
});

test("serializeLd skips nodes that are empty after cleaning", () => {
  assert.deepEqual(serializeLd([{ "@type": "Person", name: "[[nom]]" }]), []);
});

test("personLd with the placeholder domain emits no placeholder at all", () => {
  const out = serializeLd([personLd({ jobTitle: "[[poste]]", knowsAbout: ["[[a]]"] })]);
  for (const json of out) assert.ok(!json.includes("[["));
  assert.equal(JSON.parse(serializeLd([personLd({ jobTitle: "x" })])[0] ?? "{}")["name"], "Syliane Saadbouzid");
});

const base: CaseStudy = {
  slug: "demo",
  kind: "real",
  status: "delivered",
  stampLabel: "LIVRÉ",
  title: "Demo",
  summary: "Résumé",
  role: "Dev",
  stack: ["Astro"],
  links: {},
};

test("caseStudyLd skips concepts", () => {
  assert.equal(caseStudyLd({ ...base, kind: "concept" }), undefined);
  assert.equal(caseStudyLd({ ...base, links: { live: "https://a.example/" } })?.["@type"], "CreativeWork");
});

test("caseStudyLd needs a public URL and strips the inline markup of the summary", () => {
  assert.equal(caseStudyLd({ ...base, links: {} }), undefined, "a private work has no URL: no CreativeWork");
  const node = caseStudyLd({ ...base, summary: "**Gras** et [lien](https://a.example)", links: { live: "https://a.example/" } });
  assert.equal(node?.["description"], "Gras et lien");
  assert.equal(node?.["url"], "https://a.example/");
});

test("knowsAboutFrom keeps only skills stated in the CV facts, without parentheses or tools", () => {
  const topics = knowsAboutFrom(cvFacts);
  assert.ok(topics.includes("TypeScript") && topics.includes("Next.js") && topics.includes("Python"));
  assert.ok(topics.includes("Odoo"), "Odoo (Python/XML/QWeb) becomes Odoo");
  assert.ok(!topics.some((t) => t.includes("(")));
  assert.ok(!topics.includes("Docker") && !topics.includes("Git"), "tools group is excluded");
  const stated = new Set(cvFacts.skills.flatMap((g) => g.items.map((i) => i.replace(/\s*\(.*\)\s*$/, ""))));
  for (const topic of topics) assert.ok(stated.has(topic), `${topic} is not in the CV facts`);
});

test("the home Person carries city, topics and only name variants attested on the old site", () => {
  const person = JSON.parse(
    serializeLd([personLd({ jobTitle: "Dev", city: cvFacts.profile.city, knowsAbout: knowsAboutFrom(cvFacts) })])[0] ?? "{}",
  );
  assert.equal(person.address.addressLocality, "Alger");
  assert.deepEqual(person.alternateName, ["Syliane Sofiane Saad Bouzid", "Syliane Saad Bouzid"]);
  assert.deepEqual([...SITE_NAME_VARIANTS], person.alternateName);
  assert.ok(!person.alternateName.includes("Syliane Bouzid"), "never invent a form");
});
