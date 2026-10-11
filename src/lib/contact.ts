import type { EmailParts } from "../content/types.ts";

/**
 * Assembles a `mailto:` URL from parts. The address is never present in the
 * built HTML as a whole; `src/scripts/contact.ts` calls this on the client.
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
