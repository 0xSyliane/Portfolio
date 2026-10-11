import { isPlaceholder } from "./placeholder.ts";

export { isPlaceholder, hasPlaceholder } from "./placeholder.ts";

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

/** Allowed link targets: https URL, root-relative path, or in-page anchor. */
const SAFE_URL = /^(https:\/\/[^\s"'<>]+|\/[^\s"'<>]*|#[\w-]+)$/;

/**
 * Renders the content strings' tiny inline markup to safe HTML.
 *
 * Supported: `**strong**`, `*em*`, `[label](url)` (https, `/path`, `#anchor`
 * only; external links get `target="_blank" rel="noopener noreferrer"`),
 * `\n` → `<br>`, `[[placeholder]]` → visible `.todo` marker.
 *
 * The input is HTML-escaped FIRST, so no input can produce a tag, attribute or
 * `javascript:` URL. Output is meant for `set:html` only.
 */
export const rich = (value: string, todoLabel = "à confirmer"): string =>
  escapeHtml(value)
    .replace(
      /\[\[(.+?)\]\]/g,
      (_, inner: string) =>
        `<span class="todo" data-todo>${inner}<span class="sr-only"> (${escapeHtml(todoLabel)})</span></span>`,
    )
    .replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (_match, label: string, url: string) => {
      if (!SAFE_URL.test(url)) return label;
      const external = url.startsWith("https://");
      return external
        ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`
        : `<a href="${url}">${label}</a>`;
    })
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");

/** Plain text version (meta tags, aria labels, JSON-LD): markup stripped, markers kept. */
export const plain = (value: string): string =>
  value
    .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/\n/g, " ");

/** Alias kept for readability at call sites that check before rendering. */
export const hasTodo = isPlaceholder;
