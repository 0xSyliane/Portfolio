/**
 * Keeps hyphenated compounds ("e-mails") in one piece on one line. Works on ALREADY rendered HTML
 * (apply it after `rich()`), touches text nodes only and wraps instead of inserting U+2011, which
 * would break find-in-page and screen-reader spelling.
 */
export const solid = (html: string): string =>
  html
    .split(/(<[^>]*>)/)
    .map((part, index) =>
      index % 2 === 1 ? part : part.replace(/\p{L}+-\p{L}+/gu, (word) => `<span class="nb">${word}</span>`),
    )
    .join("");
