# Portfolio (Syliane Saadbouzid) — project notes

Static Astro 7 site, no UI framework, no analytics, no cookie. FR + EN: home (`/fr/`, `/en/`), CV, legal notice (`/fr/mentions-legales/`, `/en/legal-notice/`).
Copy: `src/content/home.{fr,en}.ts` (same shape, a test enforces parity); fixed UI labels per locale in `src/features/home/labels.ts` (chosen from `Astro.url.pathname`).
Portfolio/CV first (decision 2026-10-12): home order = Travaux, À propos, CV, Offres (2 rows, NO prices/terms, only « Me contacter »), Contact. No method/pricing/availability copy.
Branch `redesign`. Design/decision docs live outside the repo: `../webteam-projects/portfolio/`
(`decision-log.md`, `20-security-threatmodel.md`, `30-design/copy.md`).

## Stack
Astro 7, TypeScript strict, plain CSS (tokens in `src/styles/tokens.css`), Fontsource fonts (self-hosted),
`node --test` (unit), Playwright + axe (e2e, system Chromium), sharp (images/OG).

## Commands (always `TMPDIR=/dev/shm`, Chromium crashes when /tmp is full)
- `npm run dev` / `build` / `preview -- --host 127.0.0.1 --ignore-lock` (port 4322)
- `npm run check` (astro check) · `npm test` · `npm run test:e2e` (builds + previews itself)
- `npm run check:publish` (after `build`; FAILS until every `[[…]]` is filled, expected today)
- `npm run cv:pdf` regenerates both CV PDFs · `npm run shots` / `og` / `scripts/make-favicon.mjs` for assets
- Print fonts: `/dev/shm/ftvenv/bin/python scripts/make-print-fonts.py` (venv with fonttools+brotli, never global)

## Architecture and content ownership
- All copy is typed data in `src/content/` (`home.fr.ts`, `cv/{facts,fr,en}.ts`, `site.ts`); contracts in `src/content/types.ts`.
  Features in `src/features/{home,cv}`, shell in `src/layouts`, `src/components`, `src/styles`. Page registry/hreflang: `src/lib/i18n.ts`.
- Unknown fact = `[[like this]]` (rendered as a yellow `.todo` marker). Never invent data. `SITE_URL` is `[[domaine]]` until the domain exists.
- `check:publish` (`scripts/lib/publish-checks.mjs`, attribute-parsed, scans html/js/css/svg/json + PDF text) is the release gate:
  placeholders, `data-todo`, `*.vercel.app` (only the allowlisted `blaze-type.vercel.app`), inline script/style/handlers, leftover noindex,
  any e-mail/mailto in dist, e-mails in PDFs (only the address of `cv/facts.ts` is allowed; the owner chose a Gmail address on purpose, any other personal-provider address is refused),
  unreviewed concepts (fails if there is no case), stale CV PDFs, denylist (also `_astro/` and PDF text). A missing
  `scripts/.denylist.local` warns, and FAILS when `CI` or `PUBLISH=1` is set. No `pdftotext` + PDFs present = failure.
- E-mail is never in the HTML as a whole: `EmailLink.astro` renders a `<span>` (local part + encoded domain in a separate hidden node);
  `src/scripts/contact.ts` swaps in a link and builds the `mailto:` only on pointer/focus/click. While the parts are `[[…]]`, only the
  marker is rendered. The PDF address is injected by `scripts/cv-pdf.mjs` from the facts. No phone, no street address.

## CV / PDF workflow
Edit `src/content/cv/*`, `print.css` or any shared style/layout, then `npm run cv:pdf`: builds into a temp dir, prints `/fr/cv/` and `/en/cv/`
with print media, validates both, and only then renames them into `public/cv/` and writes `.source-hash` (hash of cv content, features,
styles, layout, components, print fonts, the generator; a failing run leaves `public/cv` untouched). Must be 1 page each,
no Type 3 font (`pdffonts`), words separated in `pdftotext -raw`. Print uses static `Bricolage Print` instances (variable fonts and
negative letter-spacing both break text extraction). Commit the PDFs.

## Security
Headers in `vercel.json`: strict CSP (`script-src 'self'`, `style-src 'self'`, no inline anything), HSTS, nosniff, DENY framing, COOP/CORP.
`X-Robots-Tag: noindex` only on `/cv/*.pdf`. Merchant denylist: copy `scripts/.denylist.local.example` to `scripts/.denylist.local`
(gitignored); its terms must never appear in `dist/`. Never put secrets in files.

## Deploy rules
- Nothing is pushed, published or deployed without the owner's explicit go; no domain attached without it.
- LIVE since 2026-10-12 on https://syliane.vercel.app (Vercel project `syliane`, team `0xsylianes-projects`, replaced the old portfolio). Deployed as a
  STATIC upload of `dist/` (+ `vercel.json` without `"framework"`), from a scratch folder with `.vercel/project.json`; the Vercel CLI was installed outside
  the repo (`npm i vercel` in a scratch dir, auth in `~/.local/share/com.vercel.cli/auth.json`). Redeploy = `npm run build`, `PUBLISH=1 npm run check:publish`, copy dist, `vercel deploy --prod`.
- TRAP: the Vercel project is Git-linked to `0xSyliane/Portfolio` (production branch `main`, framework preset empty). A push/merge to `main` redeploys whatever is on `main`
  (the OLD site today). Before merging `redesign` into `main`, set the project preset to Astro (or keep deploying statically), and make the repo private / re-author first.
- Old site is still in the Vercel deployment history (rollback possible from the dashboard).
- Vercel Hobby is non-commercial: a Pro plan (or another host) is needed before real commercial use.
- Unknown CV facts are simply omitted (project periods, USTHB entry year, CEFR levels): `start`/`level` are optional in `CvFacts`. Add them to `cv/facts.ts`, then `npm run cv:pdf` and redeploy.

## Pitfalls
- Do NOT copy the global `noindex` from the creche project; only 404 and the PDFs may be noindex.
- No inline `<script>`/`<style>`/`style=""` (CSP): features import CSS files, scripts are bundled modules.
- `astro preview` in the foreground needs `--ignore-lock`; run ONE build at a time (concurrent builds corrupt `dist/` / `.astro`).
- Kill servers by port (`kill $(lsof -ti:4322)`), never `pkill -f`.
- French typography: U+00A0 before `: ; ? !` and inside « » (a unit test enforces it).
- Mobile header is static (two rows: brand, then links + language switch), sticky from 48rem; keep nav targets >= 44 px. DOM order = visual order.
- Node >= 22.18 (native TypeScript imports in scripts and tests). `scripts/*.mjs` are type-checked (`checkJs`) by `npm run check`.
- Blaze Type capture: its WPM/accuracy are white-on-white in its light theme, so `scripts/capture-screens.mjs` shoots it in dark, 16:9.
- Print CSS fills ~90 % of the A4 page: when the owner fills the `[[…]]` facts the CV may overflow; `cv:pdf` then fails (2 pages) and the sizes must be trimmed.

## Content decisions (2026-10-12)
- Cases: Alcodefi (alcodefi.org, Next.js, live), Crèche des Anges (`wip`, NO link and NO capture: the site is a noindex draft with « à confirmer » text and the crèche's phone number),
  Blaze Type, Shellmates, boutique. Link the crèche only once its site is published. The first case (lead) must not have a phone capture (layout overflows); `capture-screens.mjs` shoots alcodefi at 1280x720.
- Experience: internship at Alcodefi (web dev + data management: paper/digital files, error checks, Excel import, folders). Skills: Power Automate, n8n, Python, Ollama, llama.cpp, Hermes, OpenClaw, Bash, Claude Code, Excel.
- Skills sit in the CV SIDE column (so the A4 PDF fits one page); an empty date column collapses (`:has(> .cv-entry__period:empty)`).
- The CV links to the portfolio (https://syliane.vercel.app/). Unknown project dates / USTHB entry year / CEFR levels are omitted, not placeholders.
