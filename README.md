# Portfolio — Syliane Saadbouzid

Static Astro 7 site (no UI framework, no integration, no analytics, no cookie). Pages (V1):
`/fr/` (home), `/fr/cv/`, `/en/cv/`, `/fr/mentions-legales/`, `/404`. `/` redirects (308) to `/fr/` in `vercel.json`.

## Run

```bash
npm ci
npm run dev            # http://localhost:4322
npm run build          # static output in dist/
npm run preview        # serve dist/
```

## Check

| Command | What it does |
|---|---|
| `npm run check` | `astro check` (TypeScript strict + Astro) |
| `npm test` | unit tests (`node --test`, TypeScript natively) |
| `npm run test:e2e` | Playwright smoke + axe (system Chromium, `CHROMIUM_PATH` to override, `TMPDIR=/dev/shm`) |
| `npm run check:publish` | pre-publication gate, run after `npm run build` |

`check:publish` is expected to FAIL until all `[[placeholders]]` are replaced. It also fails on
`*.vercel.app` URLs, inline `<script>`/`<style>`/`style=""`/`on*=` handlers, leftover noindex, any e-mail address in the output
(and in the PDFs: only the alias configured in `src/content/cv/facts.ts`, never a personal gmail/outlook/hotmail/yahoo/proton address),
unreviewed concept case studies (`anonymised !== true`), stale CV PDFs and denylisted names (html, `_astro/` assets and PDF text).

Merchant denylist: copy `scripts/.denylist.local.example` to `scripts/.denylist.local` (gitignored) and
list names/handles that must never appear in `dist/`. Without the file the gate prints a WARNING, and fails when
`CI` or `PUBLISH=1` is set (always run the release check with `PUBLISH=1 npm run check:publish`).

## Conventions

- Unknown fact = `[[like this]]` in `src/content/**`; never invent data.
- Contracts: `src/content/types.ts`. Page registry (paths, hreflang, language switch): `src/lib/i18n.ts`.
- Canonical origin: `SITE_URL` in `src/content/site.ts` (placeholder until the domain exists).
- Strict CSP (`script-src 'self'`, `style-src 'self'`): no inline script, no `<style>`, no `style=""`.
- E-mail is never in the HTML as a whole: `EmailLink.astro` + `src/scripts/contact.ts` build the `mailto:` only on pointer/focus/click.
- Node >= 22.18. CV PDFs: generated locally from `/fr/cv/` and `/en/cv/` (print media) into `public/cv/` with
  `public/cv/.source-hash` = `computeCvSourceHash()` (`scripts/lib/cv-source-hash.mjs`); committed.

## Deploy (Vercel, static)

Framework preset Astro, `npm run build`, output `dist/`. Headers and redirect come from `vercel.json`.
Set `SITE_URL` first. Do not deploy or attach a domain without the owner's go.
