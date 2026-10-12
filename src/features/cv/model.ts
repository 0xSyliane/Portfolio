import { formatIsoDate, type Locale } from "../../lib/i18n.ts";
import { isPlaceholder } from "../../lib/placeholder.ts";
import type { CefrOrPlaceholder, CvCopy, CvFacts } from "../../content/types.ts";

/** Joined, display-ready CV data. Pure: no Astro, no DOM (unit-tested). */
export interface CvEntryView {
  readonly id: string;
  readonly title: string;
  readonly location: string;
  /** "sept. 2025 – Présent"; empty while the start date is unknown. */
  readonly period: string;
  readonly bullets: readonly string[];
  readonly stack: readonly string[];
  readonly url?: string;
  /** URL without scheme and trailing slash, for display. */
  readonly urlLabel?: string;
}

export interface CvEducationView {
  readonly id: string;
  readonly institution: string;
  readonly degree: string;
  readonly note: string;
  readonly period: string;
}

export interface CvSkillGroupView {
  readonly id: string;
  readonly label: string;
  readonly items: readonly string[];
}

export interface CvLanguageView {
  readonly code: string;
  readonly name: string;
  readonly levelLabel?: string;
  /** CEFR badge text; undefined while the level is a placeholder or "native". */
  readonly cefr?: string;
}

export interface CvLinkView {
  readonly id: string;
  readonly label: string;
  readonly url: string;
  readonly urlLabel: string;
}

export interface CvView {
  readonly name: string;
  readonly headline: string;
  readonly summary: string;
  readonly place: string;
  readonly entries: readonly CvEntryView[];
  readonly education: readonly CvEducationView[];
  readonly skills: readonly CvSkillGroupView[];
  readonly languages: readonly CvLanguageView[];
  readonly links: readonly CvLinkView[];
}

export const displayUrl = (url: string): string => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

/**
 * "start – end" for display. An entry with no `end` is ongoing, except while
 * `start` is still a placeholder: then the placeholder is printed alone (we do
 * not claim "Present" for an unknown period).
 */
export const formatPeriod = (start: string | undefined, end: string | undefined, locale: Locale, present: string): string => {
  if (start === undefined) return "";
  const from = formatIsoDate(start, locale);
  if (isPlaceholder(start)) return from;
  if (end === start) return from;
  return `${from} – ${end === undefined ? present : formatIsoDate(end, locale)}`;
};

const cefrBadge = (level: CefrOrPlaceholder | undefined): string | undefined =>
  level === undefined || isPlaceholder(level) || level === "native" ? undefined : level;

/** Finds the copy item for a fact id; a missing id is a content bug and fails the build. */
const join = <T extends { readonly id: string }>(items: readonly T[], id: string, what: string): T => {
  const found = items.find((item) => item.id === id);
  if (!found) throw new Error(`CV: no ${what} copy for id "${id}"`);
  return found;
};

/** Joins language-independent facts with one locale's wording, by id / code. */
export const buildCvView = (facts: CvFacts, copy: CvCopy, locale: Locale): CvView => ({
  name: facts.profile.name,
  headline: copy.headline,
  summary: copy.summary,
  place: copy.place,
  entries: facts.entries.map((entry) => {
    const text = join(copy.entries, entry.id, "entry");
    return {
      id: entry.id,
      title: text.role,
      location: text.location,
      period: formatPeriod(entry.start, entry.end, locale, copy.present),
      bullets: text.bullets,
      stack: entry.stack,
      url: entry.url,
      urlLabel: entry.url ? displayUrl(entry.url) : undefined,
    };
  }),
  education: facts.education.map((edu) => {
    const text = join(copy.education, edu.id, "education");
    return {
      id: edu.id,
      institution: edu.institution,
      degree: text.degree,
      note: text.note,
      period: formatPeriod(edu.start, edu.end, locale, copy.present),
    };
  }),
  skills: facts.skills.map((group) => ({
    id: group.id,
    label: join(copy.skillGroups, group.id, "skill group").label,
    items: group.items,
  })),
  languages: facts.languages.map((language) => {
    const text = copy.languages.find((l) => l.code === language.code);
    if (!text) throw new Error(`CV: no language copy for code "${language.code}"`);
    return {
      code: language.code,
      name: text.name,
      levelLabel: text.levelLabel,
      cefr: cefrBadge(language.level),
    };
  }),
  links: facts.links.map((link) => ({
    id: link.id,
    label: copy.linkLabels[link.id],
    url: link.url,
    urlLabel: displayUrl(link.url),
  })),
});
