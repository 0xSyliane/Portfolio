import { test } from "node:test";
import assert from "node:assert/strict";
import { setPdfAuthor } from "../../scripts/lib/pdf-author.mjs";

/** A minimal classic-xref PDF whose Info dictionary is object 3 (offsets are not read by setPdfAuthor). */
const pdf = (info = "/Title (CV) /Producer (Skia/PDF)"): Buffer =>
  Buffer.from(
    [
      "%PDF-1.4",
      "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
      "2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj",
      `3 0 obj\n<< ${info} >>\nendobj`,
      "xref\n0 4\n0000000000 65535 f \n",
      "trailer\n<< /Size 4 /Root 1 0 R /Info 3 0 R >>",
      "startxref\n123\n%%EOF\n",
    ].join("\n"),
    "latin1",
  );

test("setPdfAuthor appends an incremental update that sets /Author and keeps the original bytes", () => {
  const input = pdf();
  const output = setPdfAuthor(input, "Syliane Saadbouzid");
  assert.ok(output.subarray(0, input.length).equals(input), "original bytes are untouched");
  const appended = output.subarray(input.length).toString("latin1");
  assert.match(appended, /\/Author \(Syliane Saadbouzid\)/);
  assert.match(appended, /\/Title \(CV\)/, "existing Info entries survive");
  assert.match(appended, /\/Prev 123/, "chains to the previous xref");
  assert.match(appended, /\/Info 3 0 R/);
  assert.match(appended, /startxref\n\d+\n%%EOF\n$/);
});

test("setPdfAuthor replaces an existing /Author instead of duplicating it", () => {
  const input = pdf("/Title (CV) /Author (Someone Else)");
  const appended = setPdfAuthor(input, "Syliane Saadbouzid").subarray(input.length).toString("latin1");
  assert.equal([...appended.matchAll(/\/Author/g)].length, 1);
  assert.ok(!appended.includes("Someone Else"));
  assert.ok(appended.includes("/Author (Syliane Saadbouzid)"));
});

test("setPdfAuthor escapes parentheses and backslashes in the author", () => {
  const appended = setPdfAuthor(pdf(), "A (B) \\ C").toString("latin1");
  assert.ok(appended.includes("/Author (A \\(B\\) \\\\ C)"));
});

test("setPdfAuthor returns anything it cannot patch untouched (no classic trailer)", () => {
  const noTrailer = Buffer.from("%PDF-1.5\nnot a classic xref file\n", "latin1");
  assert.equal(setPdfAuthor(noTrailer, "X"), noTrailer);
  const noInfo = Buffer.from(
    "%PDF-1.4\ntrailer\n<< /Size 1 /Root 1 0 R >>\nstartxref\n9\n%%EOF\n",
    "latin1",
  );
  assert.equal(setPdfAuthor(noInfo, "X"), noInfo);
});
