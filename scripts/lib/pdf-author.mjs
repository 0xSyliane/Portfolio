// @ts-check

/**
 * Sets /Author in the PDF Info dictionary with an incremental update (Chromium already writes
 * /Title from <title>). Works on classic xref tables; anything else is returned untouched, and
 * `verify()` in scripts/cv-pdf.mjs then fails on the missing Author.
 * @param {Buffer} buffer
 * @param {string} author
 * @returns {Buffer}
 */
export const setPdfAuthor = (buffer, author) => {
  const text = buffer.toString("latin1");
  const startxref = /startxref\s+(\d+)\s+%%EOF\s*$/.exec(text);
  if (!startxref) return buffer;
  const prev = Number(startxref[1]);
  const trailerAt = text.lastIndexOf("trailer");
  if (trailerAt < 0) return buffer;
  const trailer = text.slice(trailerAt, text.indexOf("startxref", trailerAt));
  const size = Number(/\/Size\s+(\d+)/.exec(trailer)?.[1]);
  const rootRef = /\/Root\s+(\d+\s+\d+\s+R)/.exec(trailer)?.[1];
  const info = /\/Info\s+(\d+)\s+(\d+)\s+R/.exec(trailer);
  if (!size || !rootRef || !info) return buffer;

  const infoObj = Number(info[1]);
  const infoGen = Number(info[2]);
  const oldBody = new RegExp(`(?:^|\\s)${infoObj}\\s+${infoGen}\\s+obj\\s*<<([\\s\\S]*?)>>\\s*endobj`).exec(text);
  if (!oldBody) return buffer;
  const entries = (oldBody[1] ?? "").replace(/\/Author\s*\([^)]*\)/, "").replace(/\/Author\s*<[^>]*>/, "");
  const body = `${infoObj} ${infoGen} obj\n<<${entries.trimEnd()}\n/Author (${author.replace(/[\\()]/g, "\\$&")})\n>>\nendobj\n`;

  const offset = buffer.length + 1;
  const xrefAt = offset + Buffer.byteLength(body, "latin1");
  /** @param {number} n */
  const pad = (n) => String(n).padStart(10, "0");
  const update =
    `\n${body}xref\n${infoObj} 1\n${pad(offset)} ${String(infoGen).padStart(5, "0")} n \n` +
    `trailer\n<< /Size ${size} /Root ${rootRef} /Info ${infoObj} ${infoGen} R /Prev ${prev} >>\n` +
    `startxref\n${xrefAt}\n%%EOF\n`;
  return Buffer.concat([buffer, Buffer.from(update, "latin1")]);
};
