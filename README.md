# Fair Food Pricing — campaign website

The public-facing site for the UK Fair Food Pricing campaign: stop AI-driven personalised and dynamic pricing of essential food, require shrinkflation disclosure, and close the UK reference-price gap left by Brexit.

The site lets a UK voter find their MP via postcode, generate a personalised letter, and send it by email or post. It also publishes the evidence briefing, the indicative draft Bill and a one-page cross-party summary in Word and PDF.

**Production**: https://fairfoodpricing.co.uk _(deploy pending)_

---

## Tech stack

- **Astro 5** (App Router-style file routing, static output)
- **Tailwind CSS 4** via `@tailwindcss/vite` (CSS-first config in `src/styles/global.css`)
- **TypeScript** strict
- **React 19** for two interactive islands only — MP finder and letter generator
- **Vitest** for unit tests, **Playwright + axe-core** for E2E and accessibility
- **Pandoc + Chrome headless** for Word→PDF generation of source documents
- **No third-party trackers, no Google Fonts at runtime, no analytics** — see `src/pages/privacy.astro`

## Local development

```bash
npm install
npm run prepare-downloads    # copies Word source docs + generates PDFs (requires pandoc + Chrome)
npm run dev                  # http://localhost:4321
```

## Common scripts

| Command                     | What it does                                                     |
| --------------------------- | ---------------------------------------------------------------- |
| `npm run dev`               | Local dev server on :4321                                        |
| `npm run build`             | Static production build to `dist/`                               |
| `npm run preview`           | Serve the production build locally                               |
| `npm test`                  | Vitest unit tests (`tests/*.test.ts`)                            |
| `npm run test:e2e`          | Playwright E2E + axe-core accessibility scan                     |
| `npm run lint`              | ESLint over the whole tree                                       |
| `npm run format`            | Prettier write                                                   |
| `npm run check`             | `astro check` typecheck                                          |
| `npm run prepare-downloads` | Rebuild Word + PDF downloads from the canonical source documents |

## How to update the statistics

Statistics on the front page and `/the-evidence` are content-collection entries.

```text
src/content/statistics/<slug>.json   ← one JSON file per statistic
```

The schema is defined in `src/content.config.ts`. Each stat has a `figure`, `label`, `context`, `tags`, primary `source`, and an `isHarm` flag (controls colour treatment — bad numbers go warning-red, deployment numbers stay neutral). Set `featured: true` and an `order` to surface on the front page.

## How to update the letter template

Two places, in lock-step:

1. **Canonical prose** — `../Dynamic Food Pricing/03_Letter_to_MP.md`. The Word and PDF versions on the downloads page are generated from this.
2. **Live generator** — `src/lib/letterTemplate.ts`. The interactive letter generator on `/send-a-letter` builds its prose from this module. Changes to the prose require updating both files.

The unit tests in `tests/letterTemplate.test.ts` lock in the structural contract (date format, salutation handling, personal-note insertion point).

## How to update the MP lookup data sources

`src/lib/mpLookup.ts` calls two public services:

- `api.postcodes.io` — free postcode → constituency lookup (no API key).
- `members-api.parliament.uk` — official UK Parliament Members API (no key).

Schemas are validated with `zod`. If either upstream changes, update the schemas in `mpLookup.ts` and the corresponding tests in `tests/mpLookup.test.ts`.

## How to deploy

The site is statically generated and works on any static host:

- **Cloudflare Pages** (recommended)
  - Build command: `npm run build`
  - Output directory: `dist`
  - Node version: 22

GitHub Actions runs lint, typecheck, unit tests and Playwright E2E on every push (`.github/workflows/ci.yml`).

## Repo structure

```
.
├── public/                  # Static assets (favicon, OG image, downloads)
├── src/
│   ├── components/          # Astro + React components
│   ├── content/             # Content collections (JSON entries)
│   ├── layouts/             # Base layout
│   ├── lib/                 # MP lookup, letter template, formatters
│   ├── pages/               # File-based routes
│   └── styles/              # Global Tailwind + design tokens
├── scripts/                 # Build-time scripts (download prep)
├── tests/                   # Vitest unit tests
└── tests/e2e/               # Playwright E2E + axe-core
```

## Licence

- Prose, statistics, briefing and letter content: **Creative Commons CC BY 4.0** — reuse with attribution.
- Codebase: **MIT**.

Photographs (if added) carry their photographer’s licence.

## Contributing

Pull requests welcome. CI must be green and the accessibility budget held (zero serious/critical axe violations, Lighthouse mobile ≥ 95 on all four pillars on the four key pages).

## Contact

- General: hello@fairfoodpricing.co.uk
- Published independently by Lee Clouseau. Not affiliated with any political party.

See `src/pages/privacy.astro` for the full data flow and the imprint.
