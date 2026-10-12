import { PROFILE_URLS, SITE_NAME, SITE_NAME_VARIANTS } from "../content/site.ts";
import type { CaseStudy, CvFacts } from "../content/types.ts";
import { plain } from "./rich.ts";
import { absoluteUrl } from "./seo.ts";

export type JsonLd = Record<string, unknown>;

const isPlain = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Recursively drops every string containing `[[` (a placeholder), then drops
 * arrays/objects left empty, so unfinished facts never reach structured data.
 * Returns `undefined` when nothing survives. Immutable: the input is untouched.
 */
export const stripPlaceholders = (value: unknown): unknown => {
  if (typeof value === "string") return value.includes("[[") ? undefined : value;
  if (Array.isArray(value)) {
    const items = value.map(stripPlaceholders).filter((v) => v !== undefined);
    return items.length > 0 ? items : undefined;
  }
  if (isPlain(value)) {
    const entries = Object.entries(value)
      .map(([k, v]) => [k, stripPlaceholders(v)] as const)
      .filter(([, v]) => v !== undefined);
    // An object left with only `@type`/`@context` carries no information.
    const meaningful = entries.filter(([k]) => k !== "@type" && k !== "@context");
    return meaningful.length > 0 ? Object.fromEntries(entries) : undefined;
  }
  return value;
};

/** Clean a JSON-LD node; returns undefined if nothing is left. */
const cleanLd = (node: JsonLd): JsonLd | undefined => {
  const cleaned = stripPlaceholders(node);
  return isPlain(cleaned) ? cleaned : undefined;
};

/**
 * Serialises nodes for a `<script type="application/ld+json">` body.
 * Placeholders are stripped and `<` is escaped so `</script>` cannot appear.
 * The `@context` is added here.
 */
export const serializeLd = (nodes: readonly JsonLd[]): string[] =>
  nodes
    .map(cleanLd)
    .filter((n): n is JsonLd => n !== undefined)
    .map((n) => JSON.stringify({ "@context": "https://schema.org", ...n }).replace(/</g, "\\u003c"));

export const personId = (): string => `${absoluteUrl("/en/")}#person`;

/**
 * `knowsAbout` topics, taken ONLY from skills already stated in the CV facts (never invented):
 * every skill item except the generic tools group, without its parenthetical detail
 * ("Odoo (Python/XML/QWeb)" becomes "Odoo").
 */
export const knowsAboutFrom = (facts: Pick<CvFacts, "skills">): string[] => [
  ...new Set(
    facts.skills
      .filter((group) => group.id !== "tools")
      .flatMap((group) => group.items)
      .map((item) => item.replace(/\s*\(.*\)\s*$/, "").trim()),
  ),
];

/** `Person` node. Optional fields with placeholders are dropped by `cleanLd`. */
export const personLd = (input: {
  jobTitle: string;
  image?: string;
  knowsAbout?: readonly string[];
  city?: string;
}): JsonLd => ({
  "@type": "Person",
  "@id": personId(),
  name: SITE_NAME,
  alternateName: SITE_NAME_VARIANTS,
  jobTitle: input.jobTitle,
  url: absoluteUrl("/en/"),
  image: input.image,
  knowsAbout: input.knowsAbout,
  address: input.city
    ? { "@type": "PostalAddress", addressLocality: input.city, addressCountry: "DZ" }
    : undefined,
  sameAs: [PROFILE_URLS.github, PROFILE_URLS.linkedin],
});

export const webSiteLd = (inLanguage: string): JsonLd => ({
  "@type": "WebSite",
  "@id": `${absoluteUrl("/en/")}#website`,
  name: SITE_NAME,
  url: absoluteUrl("/en/"),
  inLanguage,
  publisher: { "@id": personId() },
});

/**
 * `CreativeWork` for a case study (author = the Person). Concepts and works without a public
 * URL (the private shop base) are not emitted: a CreativeWork nobody can open adds nothing.
 */
export const caseStudyLd = (c: CaseStudy): JsonLd | undefined =>
  c.kind === "concept" || !c.links.live
    ? undefined
    : {
        "@type": "CreativeWork",
        name: c.title,
        description: plain(c.summary),
        author: { "@id": personId() },
        url: c.links.live,
        codeRepository: c.links.code,
        keywords: c.stack.join(", "),
      };
