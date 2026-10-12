import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMailto, decodeMailPart, encodeMailPart, resolveMailto } from "../../src/lib/contact.ts";

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

test("encodeMailPart / decodeMailPart round-trip and hide the readable domain", () => {
  const encoded = encodeMailPart("alcodefi.example");
  assert.notEqual(encoded, "alcodefi.example");
  assert.ok(!encoded.includes("alcodefi") && !encoded.includes("example"));
  assert.equal(decodeMailPart(encoded), "alcodefi.example");
  assert.equal(decodeMailPart("%%% not base64 %%%"), undefined);
});

test("resolveMailto assembles from the DOM data (user + encoded host + subject)", () => {
  const host = encodeMailPart("example.com");
  assert.equal(
    resolveMailto({ user: "hello", host, subject: "Prise de contact" }),
    "mailto:hello@example.com?subject=Prise%20de%20contact",
  );
  assert.equal(resolveMailto({ user: "hello", host }), "mailto:hello@example.com");
});

test("resolveMailto refuses missing, undecodable or placeholder data", () => {
  assert.equal(resolveMailto({}), undefined);
  assert.equal(resolveMailto({ user: "hello" }), undefined);
  assert.equal(resolveMailto({ user: "hello", host: "%%%" }), undefined);
  assert.equal(resolveMailto({ user: "[[alias]]", host: encodeMailPart("example.com") }), undefined);
  assert.equal(resolveMailto({ user: "hello", host: encodeMailPart("[[domaine mail]]") }), undefined);
});
