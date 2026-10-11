import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

type Header = { key: string; value: string };
type Rule = { source: string; headers: Header[] };
const config = JSON.parse(readFileSync(new URL("../../vercel.json", import.meta.url), "utf8")) as {
  headers: Rule[];
  redirects: { source: string; destination: string; statusCode: number }[];
  trailingSlash: boolean;
};

const global = config.headers.find((r) => r.source === "/(.*)");
const value = (key: string): string | undefined =>
  global?.headers.find((h) => h.key.toLowerCase() === key.toLowerCase())?.value;

test("root redirects to /fr/ with a 308, no locale sniffing", () => {
  assert.deepEqual(config.redirects, [{ source: "/", destination: "/fr/", statusCode: 308 }]);
  assert.equal(config.trailingSlash, true);
});

test("CSP starts from default-src 'none' and has no unsafe-* nor hash/nonce", () => {
  const csp = value("Content-Security-Policy");
  assert.ok(csp, "CSP present");
  assert.match(csp, /^default-src 'none';/);
  assert.ok(!/unsafe-/.test(csp), "no unsafe-*");
  assert.match(csp, /script-src 'self';/);
  assert.ok(!/sha256-|nonce-/.test(csp), "no script hash: V1 has no inline script");
  assert.match(csp, /style-src 'self';/);
  for (const directive of ["frame-ancestors 'none'", "base-uri 'none'", "object-src 'none'", "upgrade-insecure-requests"]) {
    assert.ok(csp.includes(directive), directive);
  }
  assert.ok(!/https?:\/\//.test(csp), "no external origin");
});

test("security headers from the threat model are set", () => {
  assert.equal(value("Strict-Transport-Security"), "max-age=63072000; includeSubDomains");
  assert.equal(value("X-Content-Type-Options"), "nosniff");
  assert.equal(value("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.equal(value("X-Frame-Options"), "DENY");
  assert.equal(value("Cross-Origin-Opener-Policy"), "same-origin");
  assert.equal(value("Cross-Origin-Resource-Policy"), "same-origin");
  const permissions = value("Permissions-Policy") ?? "";
  for (const p of ["camera=()", "microphone=()", "geolocation=()", "payment=()", "usb=()", "browsing-topics=()"]) {
    assert.ok(permissions.includes(p), p);
  }
});

test("X-Robots-Tag: noindex only on CV PDFs, never global", () => {
  const withRobots = config.headers.filter((r) => r.headers.some((h) => h.key.toLowerCase() === "x-robots-tag"));
  assert.equal(withRobots.length, 1);
  assert.equal(withRobots[0]?.source, "/cv/(.*)\\.pdf");
  assert.equal(withRobots[0]?.headers.find((h) => h.key === "X-Robots-Tag")?.value, "noindex");
  assert.equal(value("X-Robots-Tag"), undefined);
});

test("hashed assets are immutable", () => {
  const rule = config.headers.find((r) => r.source === "/_astro/(.*)");
  assert.match(rule?.headers[0]?.value ?? "", /immutable/);
});
