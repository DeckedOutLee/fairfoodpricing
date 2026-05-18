# Worklog

Reverse-chronological. One entry per shipped change.

---

## 18 May 2026 — V1 to the world

The campaign is publicly live as **V1**. Everything below this line is the V1 build.

- Site live at https://www.fairfoodpricing.co.uk/.
- GitHub repo public at github.com/DeckedOutLee/fairfoodpricing (MIT code, CC BY 4.0 content).
- Auto-deploys from `main` to Vercel.
- Lighthouse 100/100/100/100 on mobile and desktop.
- Six security headers live (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- 44 unit tests + 38 Playwright/axe tests passing.

Beyond this point, anything that breaks the live site is a regression, not a work-in-progress.

---

## 18 May 2026 — Wordmark + OG image: Montserrat

Placeholder `Wordmark.astro` and the social-share `og-image.svg` were still set in Source Serif 4 — a leftover from before the site-wide Montserrat swap on 17 May. Both now render in Montserrat 700 with `-0.018em` tracking, matching the heading style declared in `src/styles/global.css`.

- Widened the inline-variant viewBox from 260×36 to 300×40 (Montserrat 700 is wider than Source Serif 600 at the same point size).
- Moved the amber accent rule to the **top** of the stacked variant — reads more like a campaign headline mark than a body underline.

Commit: `4abac0a`.

---

## 18 May 2026 — Docs: brief, design language, worklog

Added three reference documents in `docs/`:

- `BRIEF.md` — what the campaign is, what the site does, what it doesn't do (no signup, no analytics, no cookies), the Bill in one paragraph, who runs it, shipped vs deferred scope.
- `DESIGN.md` — voice, Montserrat typography spec, full colour token table, layout containers, component catalogue, anti-patterns, accessibility commitments verified at launch.
- `WORKLOG.md` (this file) — reverse-chronological session history with commit SHAs, decisions table, deferred items.

Outside `src/` and `public/` so they don't deploy to the site itself, but they're public on the GitHub repo for any future collaborator, journalist, or MP staffer.

Commit: `05f1324`.

---

## 18 May 2026 — Security headers; campaign shipped

- Added `vercel.json` with the full set of standard security headers:
  - **Content-Security-Policy** scoped to the exact upstream origins the site calls (`postcodes.io`, `members-api.parliament.uk`) and to self-hosted assets only.
  - **X-Frame-Options: DENY** plus `frame-ancestors 'none'` in CSP (belt-and-braces against clickjacking).
  - **X-Content-Type-Options: nosniff.**
  - **Referrer-Policy: strict-origin-when-cross-origin.**
  - **Permissions-Policy** disabling camera, microphone, geolocation, payment, USB, sensors, and the Topics/FLoC interest cohort.
  - Explicit **HSTS** matching Vercel's default, with `includeSubDomains; preload`.
- Verified live in production within ~60s of push.
- Closes the only material finding from `/preflight2`.

Commit: `3737e4a`.

---

## 17 May 2026 — Live on fairfoodpricing.co.uk

- Created public GitHub repo `github.com/DeckedOutLee/fairfoodpricing` (MIT code, CC BY 4.0 content).
- Pushed all four local commits to remote. The `.github/workflows/ci.yml` file was stripped from history via `git filter-branch` to get past the missing `workflow` OAuth scope on the active GitHub account — the file is restored locally untracked, ready to be added via the GitHub UI or after `gh auth refresh -s workflow`.
- Created Vercel project `fairfoodpricing`, auto-imported from the GitHub repo, Astro preset auto-detected.
- Added custom domains `fairfoodpricing.co.uk` and `www.fairfoodpricing.co.uk` to the Vercel project; apex 307-redirects to www.
- Updated GoDaddy DNS: A record `@` → `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com`.
- HTTPS auto-issued. Edge serving from London (lhr1).

Deployment only — no code commits.

---

## 17 May 2026 — Letter generator: four delivery options

Apple Mail (and a few other clients) truncate long `mailto:` bodies, which left some users with an incomplete letter being sent. The previous fallback (a print-to-PDF window) required navigating the browser print dialog and only handled the PDF case.

Replaced the two-button row with a 2×2 action grid:

- **Send by email** — unchanged, primary button (`mailto:`).
- **Copy the full text** — `navigator.clipboard.writeText`, with an `execCommand('copy')` fallback for non-secure / older browsers. Shows "Copied to clipboard" for 2.5s on success.
- **Download as Word** — uses the `docx` package to generate a real `.docx` client-side, formatted in Montserrat 11pt, ~1.4 line height, 25/22mm margins, with title and creator metadata.
- **Download as PDF** — uses `jsPDF` for direct A4 PDF generation (no print dialog), Helvetica 11pt, same margins, footer line.

The `mailto:` truncation warning now points users at Copy / Word / PDF instead of just "Print or save as PDF".

Bundle size: `/send-a-letter` island grew from ~20 kB to ~280 kB gzipped (docx + jspdf). Acceptable: only loaded on this single high-conversion page, cached per visit.

Commit: `7d5c0cd` locally → `8ecd113` on remote (history rewrite to strip workflow file).

---

## 17 May 2026 — MP Contact schema fix

End-to-end bug since the initial Phase 1 commit. The UK Parliament Members API `Contact` endpoint returns explicit `null` (not omitted) for empty fields like `typeDescription`, `notes`, `fax`. The zod schema declared `typeDescription: z.string().optional()`, which accepts `undefined` but rejects `null`. `safeParse` failed → caught in try/catch → email silently became `null` → the MP card rendered fine but the "Send by email" button on `/send-a-letter` stayed disabled.

- Fix: made `typeDescription` and `typeId` `.nullable().optional()`.
- Rewrote the unit-test fixture in `tests/mpLookup.test.ts` to mirror a real API response with the full set of fields and their actual null values, so schema regressions cannot recur without a failing test.

**Lesson logged:** mock responses should match production responses verbatim. The original fixture only included the keys the test read, so missing fields became `undefined` (which `.optional()` accepts). Production data has explicit `null`s that `.optional()` rejects.

Commit: `0eb4011` locally → `97da89a` on remote.

---

## 17 May 2026 — Montserrat, tighter spacing, plain-English voice

**Typography:**

- Switched all headings + body to Montserrat (variable).
- Removed unused `@fontsource-variable/inter` and `@fontsource-variable/source-serif-4` packages.
- PDF generator updated to embed Montserrat via Chrome headless at build time.
- Word downloads regenerated via a custom pandoc `reference.docx` whose `styles.xml` maps every font slot to Montserrat.

**Layout:**

- Tighter section padding throughout: PageHeader `py-5/md:py-8`, body sections `py-6/md:py-8`, action band `py-10/md:py-12`.
- Widened default containers; switched prose pages to a `container-wide` outer wrapper with `<article class="max-w-4xl">` so body text sits left-aligned with the page header.

**Voice:**

- Humaniser pass on public-facing pages (front page, `/the-problem`, `/find-your-mp`, `/send-a-letter`, Hero aside): plainer language, fewer em dashes, jargon trimmed.
- Kept `/the-bill` as-is (parliament audience, technical terms appropriate).
- Front-page action-band rewritten to drop "statutory floor", "market-responsive pricing" and similar terms.
- Publisher changed from "Lee Clouseau" to "Lee".
- Only public email on the site is `hello@fairfoodpricing.co.uk` (source letter template updated to match).

**Privacy + about overhaul:**

- Deleted the `EmailSignup` component and all references — no list to opt into, so no GDPR-style consent flow needed.
- Rewrote `/about` in first person: "Who am I", "Why I built this", "What you can do". Explicit "not a company, not a charity, not a CIC, no funding from anyone".
- Rewrote `/privacy` in plain-English first person with a prominent green Callout at the top: no cookies, no trackers, no signup, no identity, postcode third-party only, letter built in your browser.

Commit: `a66d9fc` locally → `4792c3d` on remote.

---

## 17 May 2026 — Initial Phase 1 build

End-to-end build from a single brief. Astro 5 + Tailwind 4 + TypeScript + React 19 (for two islands only).

- 12 page routes (front, the-problem, what-stores-are-doing, the-evidence, the-bill, find-your-mp, send-a-letter, downloads, resources, about, privacy, 404).
- MP lookup via postcodes.io + UK Parliament Members API with zod-validated responses.
- Letter generator with email and PDF delivery (Copy and Word came later).
- Statistics + references + resources content collections (JSON-typed).
- Self-hosted Source Serif 4 + Inter fonts (later swapped to Montserrat).
- Auto-generated SVG wordmark + favicon + OG image.
- 44 Vitest unit tests; 38 Playwright E2E tests (incl. axe-core, no-JS path, mobile viewport).
- Pandoc + Chrome-headless PDF pipeline for four source documents.
- Imprint: Lee Clouseau / hello@fairfoodpricing.co.uk (later simplified to "Lee").
- Email signup form with GDPR consent (later removed).

Commit: `c6ba20c` locally → `1c60786` on remote.

---

## Decisions made

| Decision                                      | Reason                                                                                  | When                         |
| --------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------- |
| Astro 5, not Next.js                          | Static-first content site with two interactive islands; Astro ships zero JS by default. | Initial brief                |
| Tailwind 4 (CSS-first config)                 | No JS runtime, design tokens in CSS, easy to enforce via `@theme`.                      | Initial brief                |
| Cloudflare Pages → Vercel                     | Both worked; Vercel plugin is loaded in the session.                                    | 17 May, before deploy        |
| Montserrat over Source Serif 4 + Inter        | Single typeface, cleaner, easier brand recognition.                                     | 17 May, design pass 1        |
| Drop email signup entirely                    | One voter, not an organisation. No list to manage. No GDPR consent burden.              | 17 May, design pass 2        |
| First-person voice on `/about` and `/privacy` | Reflects that this is one person, not a campaign org.                                   | 17 May, design pass 2        |
| Keep evidence-page filter as inline script    | React island would add ~50 kB for zero UX gain.                                         | 18 May, `/preflight2` review |
| Defer dark mode                               | Light theme is the locked design.                                                       | 18 May, `/preflight2` review |
| Defer Astro 6 upgrade (npm audit advisories)  | Unused features (`define:vars`, server islands) — zero production exposure.             | 18 May, `/preflight2` review |

---

## Deferred / known gaps

- **CI workflow** (`.github/workflows/ci.yml`) exists locally but isn't on the remote. Needs `gh auth refresh -s workflow` on the active GitHub account, or paste via the GitHub Actions UI. Vercel handles its own build, so site deploys are unaffected.
- **Permanent logo.** Placeholder Montserrat wordmark in place — separate brief written for designers.
- **Dark-mode contrast polish.**
- **npm audit advisories.** `astro` ≤ 6.1.9 (XSS via unused `define:vars` and unused server-island replay), `happy-dom` ≤ 20.8.8 (Vitest dev dependency, never shipped), `yaml` chain in dev-only IDE tooling. Zero production exposure today; revisit at next dependency upgrade.
