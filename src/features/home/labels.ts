/**
 * Fixed UI wording of the home (column headers, link labels, captions), FR and EN.
 * Editorial copy lives in src/content/home.{fr,en}.ts; only labels that have no
 * field in the `Home` contract live here. French punctuation uses U+00A0.
 */
export interface HomeLabels {
  readonly number: string;
  /** Section marker (cases use N°, sections use §). */
  readonly section: string;
  readonly work: {
    readonly role: string;
    readonly stack: string;
    /** Fallback when a case has no `liveLabel`. */
    readonly live: string;
    readonly code: string;
    readonly bom: string;
    readonly captured: string;
    /** Fallback alt of the desktop capture when a case has no `shotAlt`. */
    readonly desktopAlt: string;
  };
  /** Fixed target of the CV teaser (wording comes from `home.cvteaser`). */
  readonly cv: { readonly tag: string; readonly viewHref: string };
  readonly contact: { readonly next: string };
  readonly external: string;
  /** Screen-reader prefix of a status stamp, read before the stamp text. */
  readonly status: string;
}

export const HOME_LABELS_FR: HomeLabels = {
  number: "N°",
  section: "§",
  work: {
    role: "Rôle",
    stack: "Stack",
    live: "Voir le site en ligne",
    code: "Lire le code",
    bom: "Composition",
    captured: "capturé le",
    desktopAlt: "Capture d’écran du site, version ordinateur",
  },
  cv: { tag: "CV", viewHref: "/fr/cv/" },
  contact: { next: "Suite" },
  external: "(nouvel onglet)",
  status: "Statut\u00a0: ",
};

export const HOME_LABELS_EN: HomeLabels = {
  number: "No.",
  section: "§",
  work: {
    role: "Role",
    stack: "Stack",
    live: "View the live site",
    code: "Read the code",
    bom: "Composition",
    captured: "captured on",
    desktopAlt: "Desktop screenshot of the site",
  },
  cv: { tag: "CV", viewHref: "/en/cv/" },
  contact: { next: "Next" },
  external: "(opens in a new tab)",
  status: "Status: ",
};

/** Kept for FR-only call sites and tests. */
export const HOME_LABELS = HOME_LABELS_FR;

/** Labels for the page being rendered: `/en/…` is English, everything else French. */
export const labelsFor = (pathname: string): HomeLabels => (pathname.startsWith("/en/") ? HOME_LABELS_EN : HOME_LABELS_FR);

/** Locale of the page being rendered, from its path. */
export const localeFor = (pathname: string): "fr" | "en" => (pathname.startsWith("/en/") ? "en" : "fr");
