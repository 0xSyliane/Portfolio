/**
 * FROZEN CONTRACTS (V1). Owner: platform (Dev A). Do not edit without telling A.
 *
 * Content modules (`home.fr.ts`, `cv/*.ts`) are typed against this file; the
 * pages/features read only these shapes. Rules for every string:
 *  - Anything not yet known is written `[[like this]]` (see `isPlaceholder()`).
 *    `npm run check:publish` fails while any `[[` remains in src/content or dist.
 *  - Inline markup allowed in prose strings: `*em*`, `**strong**`, `[label](https://…)`
 *    (rendered by `rich()` from src/lib/rich.ts, never by raw innerHTML).
 *  - French punctuation uses U+00A0 before `: ; ? !` and inside « ».
 */

/** Supported locales. V1 ships FR everywhere and EN for the CV only. */
export type Locale = "fr" | "en";

/** `YYYY`, `YYYY-MM`, `YYYY-MM-DD`, or a `[[placeholder]]`. */
export type IsoDate = string;

/** A navigation / call-to-action link. `href` is root-relative or https. */
export interface Link {
  readonly label: string;
  readonly href: string;
  /** Accessible name when the visible label is not enough. */
  readonly ariaLabel?: string;
}

/** An image served from `src/assets` (resolved by the feature that renders it). */
export interface ImageRef {
  /** Path relative to `src/assets/`, e.g. `work/blaze-type/desktop.png`. */
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
}

/* -------------------------------------------------------------------------- */
/* Measures                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A measured value set. Values come from a measurement run, never typed by hand.
 * Stale (> 90 days) measures must be shown as « à re-mesurer ».
 */
export interface Measure {
  /** e.g. "Lighthouse". */
  readonly tool: string;
  readonly version: string;
  /** URL that was measured (https, public). */
  readonly url: string;
  /** ISO date of the run. */
  readonly date: IsoDate;
  /** e.g. "mobile, Moto G Power, 4G slow". */
  readonly device: string;
  /** metric name → value, e.g. { performance: 99, lcpMs: 1100 }. */
  readonly values: Readonly<Record<string, number>>;
}

/* -------------------------------------------------------------------------- */
/* Case studies (live on the home page; there are no case-study pages in V1)   */
/* -------------------------------------------------------------------------- */

/** real = shipped for/with someone; engineering = own tooling; concept = exploration. */
export type CaseKind = "real" | "engineering" | "concept";

/** Honest status. "verified-live" only when the live URL was checked. */
export type CaseStatus = "delivered" | "wip" | "exploration" | "verified-live";

export interface CaseStudy {
  /** kebab-case, unique, used as DOM id suffix and asset folder. */
  readonly slug: string;
  readonly kind: CaseKind;
  readonly status: CaseStatus;
  /** Text printed on the stamp, e.g. "LIVRÉ · [[mois]]" or "EXPLORATION". */
  readonly stampLabel: string;
  readonly title: string;
  readonly summary: string;
  /** What the author did, e.g. "Conception et développement". */
  readonly role: string;
  readonly stack: readonly string[];
  readonly links: {
    /** Public production URL only. Never a preview/`*.vercel.app` URL. */
    readonly live?: string;
    /** Public repository URL. */
    readonly code?: string;
  };
  /** Optional capture (desktop). */
  readonly shot?: ImageRef;
  /**
   * Concepts only: set to `true` by a human after checking that no merchant
   * name, logo, handle, photo or URL remains. `check:publish` fails otherwise.
   */
  readonly anonymised?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Home                                                                       */
/* -------------------------------------------------------------------------- */

export interface Service {
  /** Short ledger reference, e.g. "S-01". */
  readonly ref: string;
  readonly title: string;
  readonly summary: string;
  /** What the client gets. */
  readonly deliverable: string;
  /** Price as text. Keep `[[prix]]` until an accountant confirms. */
  readonly price: string;
}

export interface MethodStep {
  readonly ref: string;
  readonly title: string;
  readonly summary: string;
}

/**
 * Obfuscated e-mail: the address never appears in the HTML. It is assembled
 * on the client by `src/scripts/contact.ts` from these parts.
 */
export interface EmailParts {
  /** Local part, e.g. "contact". */
  readonly local: string;
  /** Domain, e.g. "example.com". */
  readonly domain: string;
  readonly subject: string;
}

export interface Home {
  readonly meta: {
    /** 50–60 chars, brand last. */
    readonly title: string;
    /** 140–155 chars. */
    readonly description: string;
  };
  readonly hero: {
    /** Display name: "Syliane Saadbouzid". Becomes the h1 start. */
    readonly name: string;
    /** Positioning line, e.g. "Développeur web et automatisation". */
    readonly role: string;
    readonly lede: string;
    readonly ctaPrimary: Link;
    readonly ctaSecondary: Link;
  };
  /** Exactly two offers in V1. */
  readonly services: {
    readonly heading: string;
    readonly intro: string;
    readonly items: readonly [Service, Service];
  };
  readonly work: {
    readonly heading: string;
    readonly intro: string;
    readonly cases: readonly CaseStudy[];
    /** One-line honesty note about concepts / exploration. */
    readonly conceptsNote: string;
  };
  readonly method: {
    readonly heading: string;
    readonly intro: string;
    readonly steps: readonly MethodStep[];
  };
  readonly about: {
    readonly heading: string;
    /** Pull line (left column on desktop). */
    readonly pull: string;
    readonly paragraphs: readonly string[];
    readonly photo?: ImageRef;
  };
  readonly contact: {
    readonly heading: string;
    readonly intro: string;
    readonly emailLabel: string;
    /** Shown inside the link before JS assembles the address. */
    readonly emailNoScript: string;
    readonly email: EmailParts;
    readonly linkedin: Link;
    readonly github?: Link;
  };
  readonly footer: {
    readonly line: string;
    /** Optional measured-quality line (renders only if present and fresh). */
    readonly measure?: Measure;
  };
}

/* -------------------------------------------------------------------------- */
/* CV                                                                         */
/* -------------------------------------------------------------------------- */

export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native";

/** A level, or a `[[placeholder]]` while it is unconfirmed. */
export type CefrOrPlaceholder = CefrLevel | `[[${string}]]`;

export type CvEntryKind = "project" | "work" | "community";

/** Language-independent facts (dates, orgs, URLs, stack). Single source for web + PDF. */
export interface CvFacts {
  readonly profile: {
    readonly name: string;
    /** City only. No street address, phone or birth date (H5). */
    readonly city: string;
    readonly country: string;
  };
  readonly entries: readonly {
    /** Joins with `CvCopy.entries[].id`. */
    readonly id: string;
    readonly kind: CvEntryKind;
    readonly org: string;
    readonly start: IsoDate;
    /** Omit when ongoing. */
    readonly end?: IsoDate;
    readonly stack: readonly string[];
    readonly url?: string;
  }[];
  readonly education: readonly {
    readonly id: string;
    readonly institution: string;
    readonly start: IsoDate;
    readonly end?: IsoDate;
  }[];
  readonly skills: readonly {
    /** Joins with `CvCopy.skillGroups[].id`. */
    readonly id: string;
    readonly items: readonly string[];
  }[];
  readonly languages: readonly {
    readonly code: Locale | "ar";
    readonly level: CefrOrPlaceholder;
  }[];
  /** https only. */
  readonly links: readonly {
    readonly id: "github" | "linkedin" | "portfolio";
    readonly url: string;
  }[];
  /** Obfuscated like the home contact. */
  readonly email: Pick<EmailParts, "local" | "domain">;
}

/** Locale-specific wording. Same shape and same list lengths in FR and EN (`shape()` parity test). */
export interface CvCopy {
  readonly meta: {
    readonly title: string;
    readonly description: string;
  };
  readonly headings: {
    readonly profile: string;
    readonly projects: string;
    readonly education: string;
    readonly skills: string;
    readonly languages: string;
    readonly links: string;
  };
  readonly headline: string;
  readonly summary: string;
  readonly downloadPdf: Link;
  readonly entries: readonly {
    readonly id: string;
    readonly role: string;
    readonly location: string;
    readonly bullets: readonly string[];
  }[];
  readonly education: readonly {
    readonly id: string;
    readonly degree: string;
    readonly note: string;
  }[];
  readonly skillGroups: readonly {
    readonly id: string;
    readonly label: string;
  }[];
  readonly languages: readonly {
    readonly code: Locale | "ar";
    readonly name: string;
    /** Human label of the level, e.g. "Langue maternelle" / "Courant (C1)". */
    readonly levelLabel: string;
  }[];
  readonly linkLabels: Readonly<Record<"github" | "linkedin" | "portfolio", string>>;
  /** "Présent" / "Present". */
  readonly present: string;
}

/* -------------------------------------------------------------------------- */
/* Site chrome (owned by platform)                                            */
/* -------------------------------------------------------------------------- */

export interface Chrome {
  readonly skipLink: string;
  readonly brandAriaLabel: string;
  readonly navLabel: string;
  readonly nav: readonly Link[];
  readonly switchLabel: string;
  readonly footer: {
    readonly legal: Link;
    readonly rights: string;
  };
}
