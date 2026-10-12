import type { EmailParts } from "../content/types.ts";

/**
 * Assembles a `mailto:` URL from parts. The address is never present in the
 * built HTML as a whole; `src/scripts/contact.ts` calls this on the client, on
 * the first pointer / focus / click intent (never on page load).
 * Returns undefined when parts are missing/invalid or still placeholders.
 */
export const buildMailto = (parts: Partial<EmailParts>): string | undefined => {
  const { local, domain, subject } = parts;
  if (!local || !domain) return undefined;
  if (local.includes("[[") || domain.includes("[[")) return undefined;
  if (!/^[a-z0-9._+-]+$/i.test(local) || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) return undefined;
  const query = subject && !subject.includes("[[") ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${local}@${domain}${query}`;
};

/**
 * Light obfuscation for the domain part kept in the HTML: reversed, then base64.
 * It is not encryption (the browser decodes it on intent); it only keeps scrapers that
 * look for `local@domain` or a readable domain next to the local part from harvesting it.
 * Isomorphic: `btoa`/`atob` exist in Node (build) and in browsers. ASCII input only.
 */
export const encodeMailPart = (value: string): string => btoa([...value].reverse().join(""));

/** Inverse of `encodeMailPart`; undefined for malformed input. */
export const decodeMailPart = (encoded: string): string | undefined => {
  try {
    return [...atob(encoded)].reverse().join("");
  } catch {
    return undefined;
  }
};

/** What the page script reads from the DOM (`data-mail-user`, `data-mail-host`, `data-mail-subject`). */
export interface MailDataset {
  readonly user?: string;
  /** Domain as written by `encodeMailPart`. */
  readonly host?: string;
  readonly subject?: string;
}

/** `mailto:` URL from DOM data (encoded host), or undefined when anything is missing or invalid. */
export const resolveMailto = ({ user, host, subject }: MailDataset): string | undefined => {
  const domain = host ? decodeMailPart(host) : undefined;
  return buildMailto({ local: user, domain, subject });
};
