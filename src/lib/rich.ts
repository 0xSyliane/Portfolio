const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escapes the five HTML-significant characters. */
export const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);

/**
 * Allowed link targets: https URL, root-relative path (never protocol-relative `//host` nor
 * `/\host`), or in-page anchor. `*` is excluded so emphasis can never be injected into a URL.
 */
const SAFE_URL = /^(https:\/\/[^\s"'<>*]+|\/(?![/\\])[^\s"'<>*]*|#[\w-]+)$/;

/** `[label](url)`; the URL may contain one level of balanced parentheses. */
const LINK = /\[([^\]\n]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g;

/**
 * Renders the content strings' tiny inline markup to safe HTML.
 *
 * Supported: `**strong**`, `*em*`, `[label](url)` (https, `/path`, `#anchor`
 * only; external links get `target="_blank" rel="noopener noreferrer"`),
 * `\n` → `<br>`, `[[placeholder]]` → visible `.todo` marker.
 *
 * The input is HTML-escaped FIRST, so no input can produce a tag, attribute or
 * `javascript:` URL. Emphasis is applied before links and URLs cannot contain `*`,
 * so emphasis can never end up inside an `href`. Output is meant for `set:html` only.
 *
 * `todoLabel` is the screen-reader suffix of a marker (« à confirmer » / « to confirm »);
 * it is skipped when the marker text already says it.
 */
export const rich = (value: string, todoLabel = "à confirmer"): string =>
  escapeHtml(value)
    .replace(/\[\[(.+?)\]\]/g, (_, inner: string) => {
      const said = inner.toLowerCase().includes(todoLabel.toLowerCase());
      const suffix = said ? "" : `<span class="sr-only"> (${escapeHtml(todoLabel)})</span>`;
      return `<span class="todo" data-todo>${inner}${suffix}</span>`;
    })
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(LINK, (_match, label: string, url: string) => {
      if (!SAFE_URL.test(url)) return label;
      return url.startsWith("https://")
        ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : `<a href="${url}">${label}</a>`;
    })
    .replace(/\n/g, "<br>");

/** Plain text version (meta tags, aria labels, JSON-LD): markup stripped, markers kept. */
export const plain = (value: string): string =>
  value
    .replace(LINK, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\n/g, " ");
