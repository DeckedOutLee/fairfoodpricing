# Design language

The visual system is built to look like a campaign that already has the evidence on its side and doesn't need to shout.

**Reference points:** gov.uk, the Joseph Rowntree Foundation, the Institute for Government, the Food Foundation.
**Anti-references:** charity ads, tech startup landing pages, activist agit-prop.

## Voice

Plain. Evidenced. Calm.

- First person ("I", "my") on `/about` and `/privacy`.
- Second person ("you", "your MP") on calls to action.
- Third person elsewhere ("Trussell reports that…").
- Never write "we believe" — write "the evidence shows" or "the Bank of England reports that".
- Always cite a primary source for any statistic.
- Active sentences. UK English. Dates in `D MMMM YYYY` format (e.g. "17 May 2026"). Numbers always with context: "6.3 million UK adults" not "6.3 million people".

The same voice should read fine to a UK voter who has never heard of the Bill, an MP's caseworker triaging mail, a Guardian or Telegraph journalist looking for a hook, and a faith leader considering endorsement.

## Typography

**Montserrat (variable)** is the only typeface on the site, self-hosted via `@fontsource-variable/montserrat`. No Google Fonts at runtime.

| Use                               | Weight         | Tracking |
| --------------------------------- | -------------- | -------- |
| Headings (h1–h6)                  | 700            | -0.018em |
| Body paragraphs                   | 400            | normal   |
| CTA / button labels               | 600            | normal   |
| Eyebrow tags (uppercase mono)     | 600            | 0.18em   |
| Tabular figures, postcodes, codes | JetBrains Mono | normal   |

System fallback stack: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
Mono fallback: `ui-monospace, SFMono-Regular, Menlo, monospace`.

Type scale uses CSS `clamp()` for fluid sizing — declared in `src/styles/global.css` as `--text-display`, `--text-h1`, `--text-h2`, `--text-h3`, `--text-stat`.

## Colour

| Token                    | Light value | Use                                                   |
| ------------------------ | ----------- | ----------------------------------------------------- |
| `--color-ink`            | `#0F172A`   | Body text, headings, dark band background             |
| `--color-paper`          | `#FAFAF7`   | Default page background                               |
| `--color-paper-elevated` | `#FFFFFF`   | Cards, modal-like surfaces                            |
| `--color-rule`           | `#E5E7EB`   | Dividers, card borders                                |
| `--color-primary`        | `#1E40AF`   | Links, primary CTAs, focus rings                      |
| `--color-primary-hover`  | `#1D3A9C`   | Hover state on primary                                |
| `--color-accent`         | `#B45309`   | Eyebrow tags, accent text on paper                    |
| `--color-accent-on-dark` | `#F59E0B`   | Accent text against `--color-ink` background (≥4.5:1) |
| `--color-warning`        | `#991B1B`   | Harm-statistic figures only — use sparingly           |
| `--color-success`        | `#166534`   | Positive callouts (e.g. privacy banner)               |
| `--color-muted`          | `#64748B`   | Secondary text, captions, citations                   |
| `--color-muted-strong`   | `#475569`   | Strong secondary, dl `<dt>` tags                      |
| `--color-ink-inverse`    | `#FAFAF7`   | Text on ink background                                |

Light is the only locked theme. Dark-mode tokens exist in the CSS but are not yet polished.

## Layout

Three container widths defined as design tokens:

- `container-wide` — 80rem (1280px). Default for utility pages, grids, the front page.
- `container-readable` — 72rem (1152px). Inside the wider container for moderately constrained content.
- `container-prose` — 56rem (896px). For long-form prose pages.

Prose-heavy pages (`/the-problem`, `/about`, `/privacy`) use a `container-wide` outer wrapper with an inner `<article class="max-w-4xl">` so body text sits **left-aligned with the page header** — not centred. Page heading and article body share the same left edge.

Section padding is compact:

- PageHeader: `py-5 md:py-8`
- Body sections: `py-6 md:py-8`
- Front-page action band: `py-10 md:py-12`
- Footer: `mt-8` after main

## Components

All in `src/components/`. Each component:

- Uses semantic HTML first (`<button>`, `<a>`, `<nav>`, `<article>`, `<aside>`, `<figure>`).
- Is keyboard-navigable, with a visible 2px focus ring (`:focus-visible`).
- Passes contrast (4.5:1 for text, 3:1 for non-text UI) in light mode.
- Respects `prefers-reduced-motion`.
- Adds `aria-` attributes only when semantic HTML cannot express the relationship.

Catalogue:

- `Base.astro` — layout: head meta, skip-link, header, main, footer.
- `Header.astro` — sticky on scroll, wordmark + nav + primary CTA + mobile burger.
- `Footer.astro` — wordmark, strapline, imprint, site nav, licence note.
- `Hero.astro` — two-column on desktop, stacked on mobile.
- `PageHeader.astro` — eyebrow + title + intro.
- `StatCard.astro` — figure (`warning` red if `isHarm: true`) + label + context + source link.
- `CTAButton.astro` — `<a>` (never a `<button>`) with primary/secondary/ghost/inverse variants.
- `Disclosure.astro` — semantic `<details><summary>` accordion with a rotating chevron.
- `Quote.astro` — `<figure><blockquote>` with optional attribution and source.
- `Callout.astro` — info/warning/success tones; used for the green "no data" banner on /privacy.
- `Wordmark.astro` — placeholder SVG wordmark.
- `MPFinder.tsx` — React island for postcode → MP lookup.
- `LetterGenerator.tsx` — React island for the letter form, preview, and four delivery options.

The `EmailSignup` component was deleted on 17 May 2026 when the campaign decided not to collect emails.

## Iconography

Inline SVG only, no icon library. Each icon either has `aria-hidden="true"` (decorative) or an `aria-label` / `<title>` (carries meaning alone). Minimum touch target 44×44 CSS pixels.

## Anti-patterns

- **No hero illustrations** of sad children at empty fridges. Patronising and counter-productive.
- **No AI-generated photography** or anything that reads visually as "AI" — the campaign restrains AI, it does not celebrate it.
- **No animated counters** that spin up numbers. The numbers are bad enough without spectacle.
- **No autoplay video.** Ever.
- **No cookie banner** — because there are no cookies.
- **No sticky CTAs** that block content on mobile.
- **No newsletter modal** that interrupts reading.
- **No emoji in headings or body copy.** ASCII bullets and dividers only.
- **No em dashes** when a comma or period works.
- **No "Click here"** — buttons are verb + object ("Write to your MP", "Download the briefing").

## Accessibility commitments

WCAG 2.2 AA. Verified at launch by:

- `axe-core` Playwright scan across all 11 public pages, zero serious/critical violations.
- Lighthouse accessibility 100 on mobile + desktop on the live domain.

Specific commitments:

- Skip-link as first focusable element, jumps to `#main`.
- `<html lang="en-GB">`.
- Single `<h1>` per page; heading hierarchy never skips.
- Every form input has a real `<label>` (not placeholder-as-label).
- Live regions on the MP lookup result for screen-reader announcement.
- Touch targets ≥ 44×44 CSS px.
- Usable at 200% zoom; 400% zoom with horizontal scroll only where unavoidable.
- Respects `prefers-reduced-motion`.

If you encounter a barrier: hello@fairfoodpricing.co.uk.
