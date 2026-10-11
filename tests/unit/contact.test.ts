import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMailto } from "../../src/lib/contact.ts";

test("buildMailto assembles address and encoded subject", () => {
  assert.equal(
    buildMailto({ local: "hello", domain: "example.com", subject: "Prise de contact" }),
    "mailto:hello@example.com?subject=Prise%20de%20contact",
  );
  assert.equal(buildMailto({ local: "hello", domain: "example.com" }), "mailto:hello@example.com");
});

test("buildMailto refuses placeholders and malformed parts", () => {
  assert.equal(buildMailto({ local: "[[alias]]", domain: "example.com" }), undefined);
  assert.equal(buildMailto({ local: "a", domain: "[[domaine]]" }), undefined);
  assert.equal(buildMailto({ local: "a b", domain: "example.com" }), undefined);
  assert.equal(buildMailto({ local: "a", domain: "example.com\r\nBcc: x@y.z" }), undefined);
  assert.equal(buildMailto({}), undefined);
  assert.equal(
    buildMailto({ local: "a", domain: "example.com", subject: "[[objet]]" }),
    "mailto:a@example.com",
  );
});
