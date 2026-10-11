import { test } from "node:test";
import assert from "node:assert/strict";
import { caseStudyLd, cleanLd, personLd, serializeLd, stripPlaceholders } from "../../src/lib/jsonld.ts";
import type { CaseStudy } from "../../src/content/types.ts";

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
  assert.equal(cleanLd(personLd({ jobTitle: "x" }))?.["name"], "Syliane Saadbouzid");
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
  assert.equal(caseStudyLd(base)?.["@type"], "CreativeWork");
});
