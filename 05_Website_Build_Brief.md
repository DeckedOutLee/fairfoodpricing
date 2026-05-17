# Fair Food Pricing — Campaign Website Build Brief

**A Claude Code instruction set to build a fast, accessible, modern campaign website for the Fair Food Pricing UK initiative.**

_17 May 2026_

---

## 0. How to use this brief

Hand this entire document to Claude Code (`claude` CLI in an empty directory) and start with:

> "Read the brief in `05_Website_Build_Brief.md`. Confirm you understand the project, then ask me about any of the four open decisions in Section 1.5 before scaffolding the repo. After my answers, build Phase 1 (Sections 5.1–5.4) end-to-end with passing tests and a working dev server. Stop after Phase 1 and show me a preview before moving on."

The brief is structured so each section can be lifted into a separate Claude Code task if you want to ship in increments rather than all at once.

The four source documents that already exist (Evidence Briefing, Draft Bill, Letter to MP template, Cross-Party One-Pager) are sitting in `/Users/lee/Library/CloudStorage/Dropbox/_Active Projects/Dynamic Food Pricing/Dynamic Food Pricing/`. The website's downloads section will surface these — Claude Code should symlink or copy them into the repo's `public/downloads/` directory at build time.

---

## 1. Project overview

### 1.1 Purpose

A public-facing campaign website that:

1. Tells UK voters, in plain language, what AI-driven dynamic and personalised food pricing is, and why it matters.
2. Backs the case with hard statistics from primary sources (ONS, Food Foundation, Trussell, Bank of England, CMA).
3. Lets a visitor find their MP in under 30 seconds, generate a personalised letter, and send it physically or electronically.
4. Provides downloadable info packs (the existing evidence briefing, draft Bill, one-pager, letter template).
5. Links to existing food-poverty support resources for visitors who themselves need help right now.
6. Is fast, accessible (WCAG 2.2 AA), and trustworthy-looking — this is a policy site, not a startup landing page.

### 1.2 Success criteria

- **Performance**: Lighthouse Performance, Accessibility, Best Practices and SEO all ≥ 95 on mobile.
- **Accessibility**: WCAG 2.2 AA. Axe-core scan returns zero errors.
- **Loads under 1 second** on a simulated mid-tier mobile device on 4G (LCP < 2.5s, INP < 200ms, CLS < 0.1).
- **No JS required for the front page** to render and be readable — JS only enhances (MP lookup, letter generator).
- **Works without JavaScript** for all core content (downloads, references, MP letter template as a static page).
- **Privacy-respecting**: no third-party trackers, no cookies on first visit, no analytics that needs consent.

### 1.3 Audiences

- **Primary**: UK voters concerned about food prices and AI / surveillance. They will skim, share, and convert to action ("send a letter").
- **Secondary**: MPs and their caseworkers, journalists, policy researchers, NGOs, faith groups, university and college students.
- **Tertiary**: International readers (EU, US, Australia) interested in the UK comparison.

### 1.4 Non-goals

- Not a SaaS product. No accounts, no logins.
- Not a blog. A small "Updates" page is fine but no comments.
- Not a fundraising site (initially). Phase 2 may add a donation link if a registered campaign entity exists.
- Not a community forum. Out of scope.

### 1.5 Open decisions (ask the user before scaffolding)

These four decisions affect repo naming, copy and legal text. Claude Code must ask the user about each one before writing any files:

1. **Domain name.** Suggested: `fairfoodpricing.uk` (£8/year via 123-reg or Cloudflare Registrar). Alternatives: `essentialfoodprice.uk`, `nodynamicfood.uk`. The brand name on the site should match the domain.
2. **Who is publishing this?** Options: (a) Lee personally, with name and email; (b) an unincorporated campaign collective with a registered office; (c) a CIC or charity (slower to set up). This affects the privacy policy, the imprint, and the registrant for any email-list provider.
3. **Logo.** Either: (a) a wordmark only — Claude Code can produce one in SVG; (b) provide a logo file. Default to a clean wordmark.
4. **Email collection from day one?** Default: no. Adding email collection means GDPR-compliant consent flows, a privacy policy with a controller name, and an ESP (e.g. Buttondown, Substack, ConvertKit). If unsure, **launch without**, add it later.

---

## 2. Tech stack

### 2.1 Framework — Astro 5 + Tailwind 4 + TypeScript

**Why Astro**: ships zero JS by default, perfect for a content-heavy campaign site. Islands architecture for the MP lookup and letter generator. Trivially deployable to Cloudflare Pages or Netlify. MDX support for rich content pages.

**Why Tailwind 4**: utility-first, well-supported, no runtime CSS-in-JS overhead, easy to enforce design tokens.

**Why TypeScript**: catches bugs in the MP lookup flow, type-safe API responses, signals seriousness.

### 2.2 Specific packages

```
astro@^5.0
@astrojs/tailwind@^6.0
@astrojs/mdx@^5.0
@astrojs/sitemap@^4.0
@astrojs/check@^0.10
typescript@^5.6
tailwindcss@^4.0
@tailwindcss/typography
zod (for typed env vars and API responses)
react@^19.0 (for the two islands only — MP lookup, letter generator)
@astrojs/react@^4.0
```

Do **not** install any analytics, CMS, or auth packages. Do **not** install component libraries (no shadcn, no Radix) — write the few components needed (button, input, modal) with semantic HTML and Tailwind. The site is small enough not to need them.

### 2.3 Repo structure

```
fairfoodpricing/
├── public/
│   ├── downloads/                 # Symlinked or copied from Dropbox at build
│   │   ├── evidence-briefing.docx
│   │   ├── evidence-briefing.pdf
│   │   ├── draft-bill.docx
│   │   ├── draft-bill.pdf
│   │   ├── one-pager.docx
│   │   ├── one-pager.pdf
│   │   └── letter-template.docx
│   ├── favicon.svg
│   ├── og-image.png               # 1200x630 social share image
│   └── robots.txt
├── src/
│   ├── content/                   # Astro content collections
│   │   ├── config.ts
│   │   ├── statistics/            # JSON entries, one per stat with citation
│   │   ├── references/            # JSON entries for the References page
│   │   ├── resources/             # Food charity / help links
│   │   └── updates/                # MDX posts (Phase 2)
│   ├── components/
│   │   ├── Hero.astro
│   │   ├── StatCard.astro
│   │   ├── CTAButton.astro
│   │   ├── Footer.astro
│   │   ├── Header.astro
│   │   ├── MPFinder.tsx           # React island
│   │   ├── LetterGenerator.tsx    # React island
│   │   ├── Disclosure.astro      # Accessible <details>/<summary>
│   │   └── ...
│   ├── layouts/
│   │   └── Base.astro             # Sets up <head>, skip-link, header, footer
│   ├── pages/
│   │   ├── index.astro            # Front page
│   │   ├── the-problem.astro
│   │   ├── what-stores-are-doing.astro
│   │   ├── the-evidence.astro
│   │   ├── the-bill.astro
│   │   ├── find-your-mp.astro
│   │   ├── send-a-letter.astro
│   │   ├── downloads.astro
│   │   ├── resources.astro
│   │   ├── about.astro
│   │   ├── privacy.astro
│   │   └── 404.astro
│   ├── lib/
│   │   ├── mpLookup.ts            # Postcode → MP via Parliament API
│   │   ├── letterTemplate.ts      # Mail-merge into pre-written body
│   │   ├── citations.ts           # Source list with stable IDs
│   │   └── format.ts              # Date, number, currency formatters
│   └── styles/
│       └── global.css
├── tests/
│   ├── mp-lookup.test.ts
│   ├── letter-template.test.ts
│   └── e2e/
│       └── full-journey.spec.ts   # Playwright: postcode → MP → letter
├── astro.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### 2.4 Hosting

**Default**: Cloudflare Pages (free tier, generous, no egress fees, native CDN). Configure a `pages-build.toml` with Node 22.
**Alternative**: Netlify or Vercel — equally fine.
**Custom domain**: pointed via the registrar's DNS to the Pages project.
**HTTPS**: handled automatically by Cloudflare.

### 2.5 Linting and formatting

- ESLint flat config with `astro/recommended`, `@typescript-eslint`, `jsx-a11y`.
- Prettier with `prettier-plugin-astro`, `prettier-plugin-tailwindcss`.
- Husky + lint-staged to run `astro check`, `eslint`, `prettier --check` on commit.
- GitHub Action that runs the same checks on PRs plus a Playwright E2E test and an Axe accessibility scan.

---

## 3. Design system

### 3.1 Visual style

Calm, civic, trustworthy. **Not** a startup landing page. **Not** a charity-pity site. The tone is the same as the briefing document: factual, restrained, evidenced. Visual references: gov.uk, IFS, Joseph Rowntree Foundation, the Institute for Government, the Food Foundation site.

Avoid:

- Hero illustrations of sad children at empty fridges. This is patronising and counter-productive.
- AI-generated stock imagery.
- Animated counters that spin up. The numbers are bad enough without spectacle.
- Excessive emoji.

Prefer:

- Strong typography. Real headlines, not "hero copy".
- Charts and statistical visualisations where they earn their place.
- Real, attributed photography (from Trussell, Food Foundation, with permission) only if it adds information.

### 3.2 Tokens

```ts
// tailwind.config.ts (excerpt)
colors: {
  ink:      '#0F172A',  // Body text, headings — near-black, not pure black
  paper:    '#FAFAF7',  // Page background — warm off-white
  rule:     '#E5E7EB',  // Dividers
  primary:  '#1E40AF',  // CTA blue (WCAG AA on paper)
  accent:   '#B45309',  // Accent amber for highlights / quotes
  warning:  '#991B1B',  // Statistical "bad" numbers — use sparingly
  success:  '#166534',  // Action-positive
  muted:    '#64748B',  // Secondary text, captions
}
fontFamily: {
  display: ['"Source Serif 4"', 'Georgia', 'serif'],
  body:    ['"Inter"', 'system-ui', 'sans-serif'],
  mono:    ['"JetBrains Mono"', 'monospace'],
}
fontSize: {
  // Fluid type scale using clamp()
  'display': 'clamp(2.5rem, 5vw + 1rem, 4.5rem)',
  'h1':      'clamp(2rem, 3vw + 1rem, 3rem)',
  'h2':      'clamp(1.5rem, 2vw + 0.75rem, 2.25rem)',
  // ...
}
```

Load **Source Serif 4** (variable) and **Inter** (variable) from `fontsource` packages, self-hosted. **No** Google Fonts at runtime — that would leak IP addresses to Google.

### 3.3 Components

Write all components in `src/components/`. Each component must:

- Use semantic HTML first. `<button>`, `<a>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<figure>`, `<figcaption>`.
- Be keyboard-navigable. Visible focus rings (`:focus-visible`).
- Pass colour contrast 4.5:1 minimum for text, 3:1 for non-text UI.
- Have an `aria-` attribute only when semantic HTML cannot express the relationship.
- Respect `prefers-reduced-motion` — disable any animation when set.

Common components: `Header`, `Footer`, `Hero`, `StatCard`, `Quote`, `CTAButton`, `Disclosure` (accordion), `Callout`, `Citation`, `Breadcrumb`.

### 3.4 Iconography

Use a small set of inline SVG icons (chevron, download, external-link, search, share). Do **not** install an icon library. Each icon has `aria-hidden="true"` if decorative, or an `aria-label` if it carries meaning alone.

---

## 4. Information architecture

```
/                          Front page (the worry, the challenges, what stores are doing)
├── /the-problem           Deeper explanation of personalised + dynamic pricing
├── /what-stores-are-doing Named retailers, what they've deployed, what they've said
├── /the-evidence          Curated statistics page with citations
├── /the-bill              The Fair Food Pricing Bill — overview, FAQ, full text link
├── /find-your-mp          Postcode lookup → MP page
├── /send-a-letter         Letter generator (chooses physical or email)
├── /downloads             Info pack, briefing, bill, one-pager (all formats)
├── /resources             Food charity links, help if you need food today
├── /about                 Who runs this, why, who has endorsed (Phase 2)
├── /privacy               Privacy policy
└── /404                   Friendly 404
```

Header nav: `The problem · What stores are doing · The bill · Find your MP · Downloads`.
Footer nav: `Resources · About · Privacy · Contact · Imprint`.
Primary CTA in header: `Write to your MP →` (sticky on mobile after the hero scroll).

---

## 5. Page-by-page specifications

### 5.1 Front page — `/`

The user explicitly asked for: **the worry, the challenges, what stores are doing, and that we need to stop this.** Translate that into four sections, in this order:

#### Section 1 — Hero ("the worry")

A two-column hero on desktop, stacked on mobile.

**Headline** (serif, display weight, 60–80 characters):

> "Soon, the price of your loaf of bread could change based on who you are."

**Subhead** (sans, body weight):

> "Across the UK, supermarkets are installing the technology to charge each shopper a different price for the same essential food — in real time, based on your data. Right now, 6.3 million UK adults are food insecure. The law hasn't caught up. We can fix that."

**Primary CTA**: `Write to your MP →` (links to `/find-your-mp`)
**Secondary CTA**: `See the evidence` (links to `/the-evidence`)

No hero image. The headline does the work. A subtle background of fine ruling lines is fine; nothing more.

#### Section 2 — The numbers ("the challenges")

A 4-column grid of statistic cards on desktop, 2-column on tablet, single-column on mobile. Each card has a large figure, a one-sentence explanation, and a source link. Take the figures from `src/content/statistics/*.json`.

Cards (from the evidence briefing):

1. **6.3 million** UK adults are food insecure (January 2026) — _Food Foundation Food Insecurity Tracker._
2. **2.2 million** children live in homes that cut down or skip meals — _Food Foundation, January 2026._
3. **38%** rise in UK food prices since November 2020 — _House of Commons Library, CDP-2026-0004._
4. **2.9 million** emergency food parcels distributed by Trussell in 2024/25 — _Trussell end-of-year statistics._
5. **40%** of households with a disabled adult are food insecure — _Food Foundation._
6. **10.8 million** electronic shelf labels being installed across all 497 Morrisons stores — _Morrisons press release, October 2025._
7. **2,400 stores** Co-op is digitising by end-2026 — _Co-op statement, May 2025._
8. **21% → 31%** UK firms using market-responsive pricing tools, today vs. expected next year — _Bank of England Bank Insights, 2026._

Each card uses the `warning` colour for the figure (sparingly) only where the figure is itself a harm. Deployment figures (Morrisons, Co-op, BoE) use `ink` not `warning` — they are facts, not yet harms.

#### Section 3 — "What stores are doing"

A horizontally-scrolling card row on mobile, 3-column grid on desktop. One card per retailer with logo (text only, no copyrighted marks unless permission obtained), a one-line summary of what they've deployed, and a link to a longer explanation on `/what-stores-are-doing`.

- **Morrisons** — Installing 10.8 million electronic shelf labels across all 497 stores from early 2026.
- **Co-op** — Digital labels across all 2,400 stores by end-2026.
- **Asda** — Live facial recognition trial in five Greater Manchester stores; thousands of digital labels rolled out across Express.
- **Sainsbury's** — Trialling digital shelf-edge labels at "Future Stores".
- **Southern Co-op** — Found by the ICO in 2023 to have breached UK data protection law with its Facewatch live facial recognition deployment.

Caption above the grid: _"This is what's happening today. None of these stores has admitted to surge-pricing staples. The infrastructure to do it is being installed anyway."_

#### Section 4 — "We need to stop this" (the action)

A full-width band with `primary` background, white text. Three short statements and a single dominant CTA.

**Headline**: "We have one window to legislate before this becomes normal."

**Three points**:

- The British Retail Consortium has publicly said supermarkets will not surge-price. A statutory floor makes that promise enforceable.
- The Bank of England says 21% of firms already use market-responsive pricing, rising to 31% in a year.
- France, Maryland and the EU have already begun legislating. The UK is behind.

**Dominant CTA**: `Find your MP and send a letter →`
**Secondary**: `Read the evidence (PDF, 30 pages)` — download link.

#### Section 5 — Brief footer-of-front-page

Two-column row: on the left, "_If you need help with food today_" with two links (Trussell, Citizens Advice). On the right, "_Resources for MPs and journalists_" linking to `/downloads`.

#### Front-page accessibility specifics

- Page title: "Fair Food Pricing — Stop AI-driven dynamic pricing of essential UK food."
- Meta description: 150 characters explaining the campaign.
- A single `<h1>`. Headings cascade `h1 → h2 → h3` without skipping.
- Skip-to-content link at top of `<body>`.
- All CTAs are real `<a>` elements with `href`, not buttons that navigate.
- Statistic cards are `<article>` elements with internal heading hierarchy.

### 5.2 The Problem — `/the-problem`

Long-form explainer. Six sections:

1. What "dynamic pricing" means in a supermarket context.
2. What "personalised pricing" means.
3. The difference between welcome dynamic pricing (end-of-day markdowns) and harmful dynamic pricing (surge, surveillance).
4. Why essentials are different from other goods.
5. Why low-income households are most exposed.
6. The technology being installed today.

Use real prose, not bullet points. Pull quotes for memorable statistics. Footnotes inline using the `Citation` component, all linking back to the References page.

### 5.3 What Stores Are Doing — `/what-stores-are-doing`

A retailer-by-retailer rundown, each with:

- What they've installed
- What they say publicly
- What the ICO, BRC, CMA or BoE has said about it
- A direct link to the primary source

Cover: Morrisons, Co-op, Asda, Sainsbury's, Tesco, Lidl, Aldi, Waitrose, M&S, Southern Co-op. Each gets a `<section>` with a clear heading. Cite from `src/content/references/*.json`.

### 5.4 The Evidence — `/the-evidence`

The single most-cited page on the site. A clean, alphabetised, filterable presentation of every key statistic in the evidence briefing. Each statistic has:

- The figure
- A one-sentence interpretation
- Date / period of measurement
- Primary source citation with link
- A tag (e.g. `food-poverty`, `shrinkflation`, `loyalty-pricing`, `LFR`, `international`)

Filter controls at the top let visitors narrow by tag. Implemented as a static-rendered list with progressive enhancement — works without JS.

### 5.5 The Bill — `/the-bill`

Three sections:

1. **Plain-English summary** — the four substantive provisions.
2. **FAQ** — accordion of `Disclosure` components: "Does this ban electronic shelf labels?" "Does this stop end-of-day discounts?" "What about Clubcard prices?" "How is this enforced?" "What happens to small shops?" "Why aren't Article 22 and the Equality Act in scope?" Each answer is honest, evidenced, and cites the briefing.
3. **Full text** — Embed the Bill clauses (rendered from MDX) on the page, with a sticky table of contents.

A box at the top: `Download as Word | Download as PDF`.

### 5.6 Find Your MP — `/find-your-mp`

A React island (`MPFinder.tsx`) handling the postcode lookup. See Section 6 for the full implementation spec.

UI:

- A single `<input type="text" inputmode="text" autocomplete="postal-code">` with a clear label "Enter your UK postcode".
- A submit button.
- Validates the postcode client-side using a simple regex, then hits Postcodes.io and the Parliament Members API.
- On success: shows the MP's name, party, constituency, photo (if available), parliamentary email and Westminster address, plus a `Write to [MP name] →` CTA that deep-links to `/send-a-letter?mp=<id>`.
- On failure: an empty-state with manual entry fallback ("Can't find your MP? Enter their name here").
- On API outage: a static fallback page linking to `members.parliament.uk` with instructions.

### 5.7 Send a Letter — `/send-a-letter`

A React island (`LetterGenerator.tsx`). See Section 7 for the full spec.

UI:

- Reads `?mp=<id>` from the URL (set by the MP finder); falls back to a manual MP selector if missing.
- Three small form fields: visitor's full name, town/constituency (auto-filled from the postcode), and an optional personal note ("If you'd like, add why this matters to you").
- Two big options: `Send by email (opens your mail client)` and `Print and post (PDF download)`.
- Below the form: a live preview of the letter as it will go to the MP.
- All processing client-side; nothing sent to a server. The letter is generated locally.

### 5.8 Downloads — `/downloads`

A simple grid of cards. Each card: title, one-line description, two buttons (`Word .docx` and `PDF`), and a citation note ("Published 17 May 2026 · 30 pages · evidence briefing"). Provide both formats; generate PDFs from the markdown using `pandoc` at build time.

### 5.9 Resources — `/resources`

Two clearly separated sections:

**If you need food help today**:

- Trussell Trust food bank locator
- Independent Food Aid Network
- Citizens Advice — for benefits and budgeting support
- Turn2us — for hardship grants
- Healthy Start — for pregnant women and families with children under 4
- Local Welfare Assistance — link to gov.uk page that lets people find their council scheme
- The Felix Project (London)
- FareShare

**If you want to research or campaign**:

- Food Foundation
- Trussell research
- Joseph Rowntree Foundation
- Marmot Institute of Health Equity
- House of Commons Library briefings
- Big Brother Watch (on facial recognition)
- Which? (consumer protection)
- CMA
- ICO

Each link must open in a new tab with `rel="noopener noreferrer"`. Each section is preceded by a short paragraph explaining what the visitor will find and not patronising them.

### 5.10 About — `/about`

Who runs this site, why, and what its funding/independence position is. If there are endorsements (Phase 2: an MP, a charity, a faith leader), they go here with a quote and an attribution. No celebrity quotes without verified permission.

### 5.11 Privacy — `/privacy`

A real privacy notice. The site processes:

- Postcode entered into the MP finder. Sent to Postcodes.io (a non-profit) only to look up a constituency. Not stored.
- IP and basic request metadata in CDN edge logs (Cloudflare), retained for 7 days for abuse prevention only.
- No cookies on first visit.
- If an email list is added in Phase 2, full GDPR consent flow with named controller.

Reference the ICO's guide on privacy notices. Include a "Right to complain to the ICO" link.

---

## 6. MP lookup — implementation spec

### 6.1 Data sources

**Postcode → constituency**: `https://api.postcodes.io/postcodes/{postcode}` — free, no key, returns `parliamentary_constituency` as a string.

**Constituency → MP**: UK Parliament Members API. Endpoint:
`https://members-api.parliament.uk/api/Location/Constituency/Search?searchText={constituency}&skip=0&take=1`
Returns the current MP's member ID. Then:
`https://members-api.parliament.uk/api/Members/{memberId}`
Returns full member details: name, party, constituency, photo URL (`thumbnailUrl`), gender, Twitter/X handle.

For the email/Westminster address:
`https://members-api.parliament.uk/api/Members/{memberId}/Contact`
Returns an array of contact records — `type` includes `Parliamentary office`, `Constituency office` and `Parliamentary website`. The email and physical address come from `Parliamentary office`.

### 6.2 TypeScript module — `src/lib/mpLookup.ts`

```ts
import { z } from 'zod';

const PostcodeResult = z.object({
  result: z.object({
    postcode: z.string(),
    parliamentary_constituency: z.string(),
    country: z.string(),
    admin_district: z.string(),
  }),
});

const MPSearchResult = z.object({
  items: z.array(
    z.object({
      value: z.object({
        currentRepresentation: z.object({
          member: z.object({
            value: z.object({
              id: z.number(),
              nameDisplayAs: z.string(),
              latestParty: z.object({ name: z.string() }),
              latestHouseMembership: z.object({ membershipFrom: z.string() }),
              thumbnailUrl: z.string().nullable(),
            }),
          }),
        }),
      }),
    }),
  ),
});

export async function findMPByPostcode(postcode: string) {
  // 1. Normalise & validate
  const normalised = postcode.toUpperCase().replace(/\s+/g, ' ').trim();
  if (!/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(normalised)) {
    throw new Error('Invalid UK postcode');
  }

  // 2. Postcode → constituency
  const pcRes = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(normalised)}`);
  if (!pcRes.ok) throw new Error('Postcode not found');
  const pc = PostcodeResult.parse(await pcRes.json());

  // 3. Constituency → MP
  const mpRes = await fetch(
    `https://members-api.parliament.uk/api/Location/Constituency/Search?searchText=${encodeURIComponent(pc.result.parliamentary_constituency)}&skip=0&take=1`,
  );
  if (!mpRes.ok) throw new Error('Constituency lookup failed');
  const mp = MPSearchResult.parse(await mpRes.json());

  // 4. Contact details
  const memberId = mp.items[0].value.currentRepresentation.member.value.id;
  const contactRes = await fetch(
    `https://members-api.parliament.uk/api/Members/${memberId}/Contact`,
  );
  const contact = await contactRes.json();
  const parliamentary = contact.value.find((c: any) => c.type === 'Parliamentary office');

  return {
    id: memberId,
    name: mp.items[0].value.currentRepresentation.member.value.nameDisplayAs,
    party: mp.items[0].value.currentRepresentation.member.value.latestParty.name,
    constituency: pc.result.parliamentary_constituency,
    photo: mp.items[0].value.currentRepresentation.member.value.thumbnailUrl,
    email: parliamentary?.email ?? null,
    address: parliamentary?.line1
      ? [parliamentary.line1, parliamentary.line2, parliamentary.line3, parliamentary.postcode]
          .filter(Boolean)
          .join(', ')
      : 'House of Commons, London, SW1A 0AA',
  };
}
```

Important:

- **No API key needed** for either Postcodes.io or the Members API. They are both free public services.
- **Rate limits**: Postcodes.io is generous; the Members API has no documented limit but assume 60 req/min. Phase-2 idea: cache the constituency→MP map at build time and check freshness daily.
- **Graceful failure**: every fetch wrapped in try/catch with a user-friendly error. Never expose raw API errors.
- **No PII sent anywhere else**: the postcode hits Postcodes.io only. Not logged on our side.

### 6.3 React island — `src/components/MPFinder.tsx`

- Controlled input. Debounce 300ms on Enter or button click.
- Aria-live region announces the result to screen readers.
- Visible loading state ("Looking up your MP…") with a non-spinning indicator (respects `prefers-reduced-motion`).
- Result card shows MP photo (with `loading="lazy"` and an `alt` describing photo content), name, party, constituency, and the two CTAs: `Write to [name] →` and `View [name]'s record on TheyWorkForYou →` (link to `https://www.theyworkforyou.com/mp/{constituency-slug}`).
- "Wrong MP? Try again" button resets the form.
- Stores nothing client-side — does not write to localStorage (the recipient may not want their postcode persisted).

---

## 7. Letter generator — implementation spec

### 7.1 Template

The base letter is in `03_Letter_to_MP.md` already prepared. The letter generator does a mail-merge with these variables:

- `{{mp_name}}` — full name with honorific (e.g. "Rt Hon Liam Byrne MP")
- `{{mp_address}}` — Westminster address or constituency office
- `{{visitor_name}}` — entered in the form
- `{{visitor_town}}` — auto-filled from postcode
- `{{date}}` — today's date in `D MMMM YYYY` format
- `{{personal_note}}` — optional free-text from visitor, inserted as a single paragraph between the third and fourth paragraphs of the letter body

The pre-merged template lives at `src/lib/letterTemplate.ts`:

```ts
export function buildLetter(input: {
  mpName: string;
  mpAddress: string;
  visitorName: string;
  visitorTown: string;
  personalNote?: string;
}): { subject: string; body: string } {
  const date = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const subject = 'Fair pricing of essential food in UK supermarkets';

  const body = `
${date}

Dear ${input.mpName},

${SUBJECT_HEADING}

I am writing as your constituent in ${input.visitorTown} to ask you to...
[full letter body, paragraph by paragraph, exactly matching 03_Letter_to_MP.md]
${input.personalNote ? `\n\n${input.personalNote}\n` : ''}

[remaining body]

Yours sincerely,
${input.visitorName}
`.trim();

  return { subject, body };
}
```

### 7.2 Delivery — email mode

A `mailto:` link with `subject` and `body` URL-encoded:

```ts
const mailto = `mailto:${mpEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
```

Limitations:

- Some mail clients truncate long `body` parameters. Cap at ~1,800 characters; if longer, offer "Copy to clipboard" and "Open mail client with subject + truncated intro" alternatives.
- Some users will be on shared / public machines without a configured mail client. Always offer the `Print and post` option as an equally prominent CTA.

### 7.3 Delivery — physical mode

A PDF generated client-side using **pdfme** or **react-pdf**. The PDF must:

- Be A4 portrait
- Have the visitor's return address top-left (entered in the form)
- Have the MP's address right-aligned
- Be in 11pt serif body type, 1.4 line height
- Include "PRINT THIS PAGE" as a small note at the top so the visitor knows it is the letter, not a screenshot
- Be downloaded as `letter-to-{mp-slug}-{date}.pdf`

Below the download CTA, a short "How to post" guide: cost of a first-class stamp, link to the Royal Mail "Find a postbox" page, and a reminder to keep a copy for follow-up.

### 7.4 Preview and consent

- Always show the full generated letter on screen before the user sends or downloads.
- A single checkbox: "I have read the letter and I agree it should be sent in my name." Required to enable the Send / Download button.
- No "subscribe me to updates" checkbox by default. If Phase 2 introduces an email list, that's a separate consent on a separate page.

---

## 8. Accessibility — WCAG 2.2 AA

Non-negotiable. Specific requirements:

- **Keyboard navigation**: every interactive element reachable and operable with keyboard alone. Visible `:focus-visible` outline (2px solid, primary colour, 2px offset).
- **Skip link**: first focusable element in `<body>`, jumps to `#main`.
- **Headings**: `h1` once per page, hierarchical thereafter.
- **Form labels**: every input has a real `<label>` (no placeholder-as-label).
- **Error messages**: inline, associated with the input via `aria-describedby`. Live region announces submission errors.
- **Colour contrast**: 4.5:1 for body text, 3:1 for non-text UI. Test the entire palette with Axe-core.
- **Don't rely on colour alone**: error states have an icon and a text label, not just red.
- **`prefers-reduced-motion`**: respect it. No animated counters, no scroll-driven animations.
- **`prefers-color-scheme: dark`**: provide a dark theme. Same tokens, recoloured. Test contrast in both.
- **Language**: `<html lang="en-GB">`.
- **Images**: every `<img>` has meaningful `alt`. Decorative images use `alt=""`. SVG icons used alone have `<title>` or `aria-label`.
- **Live regions**: MP lookup result announced via `aria-live="polite"`.
- **Touch targets**: minimum 44×44 CSS px.
- **Zoom**: usable at 200% browser zoom and at 400% with horizontal scroll only where unavoidable.
- **Text spacing**: usable with `line-height: 1.5`, `letter-spacing: 0.12em`, `word-spacing: 0.16em` overrides.
- **Reading order**: matches visual order in the DOM (no `order: -1` tricks that confuse screen readers).

Run `axe-core` in the Playwright suite. Fail the build if it returns errors.

---

## 9. Content strategy

### 9.1 Voice

- Plain, evidenced, calm. Same voice as the briefing.
- Active sentences. Second person ("you", "your MP") on calls-to-action; third person elsewhere.
- Never write "we believe" — write "the evidence shows" or "X reports that".
- Always cite a primary source for any statistic. Inline citation pattern: `(Food Foundation, 2026)` with a footnote linking to the source.
- Numbers: always with context. "6.3 million UK adults" not "6.3 million people". "38% rise since November 2020" not "rapid inflation".

### 9.2 Calls to action

In priority order:

1. **Find your MP and send a letter** — main CTA on every page except `/resources` and `/privacy`.
2. **Download the evidence briefing** — secondary CTA on every content page.
3. **Read the bill** — tertiary, linked from contextual mentions.

Avoid "Get involved" — too vague. Avoid "Donate" — there is nothing to donate to yet.

### 9.3 Microcopy

- Buttons: verb + object. `Write to your MP`. `Download the briefing`. Not `Click here`.
- Empty states: helpful and human. "We couldn't find an MP for that postcode. Double-check it, or [look up your MP manually]."
- Error states: explain what went wrong and how to fix it. Never blame the user.

### 9.4 Statistics catalogue

Create `src/content/statistics/*.json` with one file per stat. Schema:

```ts
{
  "id": "food-insecurity-2026",
  "figure": "6.3 million",
  "label": "UK adults food insecure",
  "context": "January 2026",
  "interpretation": "About 12% of UK households were food insecure at the start of 2026.",
  "tags": ["food-poverty"],
  "source": {
    "name": "Food Foundation Food Insecurity Tracker",
    "url": "https://foodfoundation.org.uk/news/latest-food-insecurity-tracker-shows-millions-struggling-feed-themselves",
    "date": "2026"
  }
}
```

Build the front-page stat cards and the `/the-evidence` page from this collection. Single source of truth.

### 9.5 References catalogue

`src/content/references/*.json` mirrors the briefing's source list. Schema:

```ts
{
  "id": "boe-bank-insights-2026",
  "title": "This time it's personal: the rise of dynamic, personalised pricing and what it means for inflation",
  "author": "Bank of England",
  "type": "primary",         // 'primary' | 'secondary' | 'industry' | 'academic'
  "date": "2026",
  "url": "https://www.bankofengland.co.uk/bank-insights/2026/this-time-its-personal-the-rise-of-dynamic-personalised-pricing-and-what-it-means-for-inflation"
}
```

Render the References page sorted by type then date.

---

## 10. SEO, social and metadata

### 10.1 Per-page metadata

Every page exports:

```ts
export const meta = {
  title: '...', // <60 chars including " — Fair Food Pricing"
  description: '...', // 150-160 chars, no marketing fluff
  ogImage: '/og-...png', // 1200x630, page-specific
};
```

The Base layout reads these and renders OpenGraph and Twitter meta tags.

### 10.2 Sitemap and robots

`@astrojs/sitemap` generates `/sitemap-index.xml`. `robots.txt` allows all crawlers.

### 10.3 Structured data

Use JSON-LD on the front page only:

```json
{
  "@context": "https://schema.org",
  "@type": "NGO",
  "name": "Fair Food Pricing",
  "url": "https://fairfoodpricing.uk",
  "description": "...",
  "areaServed": "United Kingdom"
}
```

Don't over-do schema markup. One good entity beats five duplicated ones.

### 10.4 Open Graph image

A simple, generated 1200×630 PNG: black wordmark "Fair Food Pricing" on a paper background, with the strapline "Stop AI-driven pricing of essential food in UK supermarkets" beneath. Generated at build time using `satori` or a static asset committed to the repo. Page-specific images optional in Phase 2.

---

## 11. Privacy, GDPR and legal

### 11.1 Data flows

| Data                             | Where                                           | Retention              | Lawful basis                                           |
| -------------------------------- | ----------------------------------------------- | ---------------------- | ------------------------------------------------------ |
| Postcode (entered for MP lookup) | Sent to api.postcodes.io                        | Not stored on our side | Legitimate interests (transparent constituency lookup) |
| IP address                       | Cloudflare CDN edge logs                        | 7 days                 | Legitimate interests (abuse prevention)                |
| Letter contents                  | Generated client-side, never sent to our server | N/A                    | N/A                                                    |

### 11.2 Cookies

None by default. Add a cookie banner only if/when an analytics provider is added.

### 11.3 Analytics

**Default**: no analytics. If demand for measurement is high, use **Plausible** or **Cabin** (privacy-respecting, no cookies, no consent needed).

### 11.4 Imprint

UK does not require a statutory imprint, but trustworthy campaigns publish a contact. Include in the footer: "_Published by [registrant name] · [contact email] · This site is independent and not affiliated with any political party._"

### 11.5 Accessibility statement

A short statement at `/privacy#accessibility` or `/accessibility.html`: "This site aims to be accessible to WCAG 2.2 AA. If you find a barrier, email [contact]." Cite the AbilityNet model statement.

---

## 12. Testing

### 12.1 Unit tests (Vitest)

- `mpLookup.ts` — happy path, invalid postcode, postcode not found, API outage, malformed response.
- `letterTemplate.ts` — variable substitution, no-personal-note path, with-personal-note path, escaping in subject and body, mailto URL length limit.
- `format.ts` — date, currency, number formatters.

### 12.2 E2E tests (Playwright)

- **Full journey**: visit front page → click "Write to your MP" → enter a known postcode → see correct MP → click "Write" → see letter preview → click email button → verify mailto opens with expected subject and first 200 chars of body.
- **No-JS path**: same journey with JavaScript disabled — verify the static fallback page (`/find-your-mp` rendered server-side with instructions to use members.parliament.uk directly).
- **Mobile viewport**: same journey at iPhone 14 size.
- **Accessibility scan**: run axe-core against every public page; fail on any error.
- **Lighthouse CI**: run against `/`, `/find-your-mp`, `/send-a-letter`, `/the-evidence`. Fail if any score drops below 95.

### 12.3 Manual QA checklist

Before launch, manually verify with:

- Screen reader: VoiceOver on macOS, NVDA on Windows, TalkBack on Android.
- Keyboard only: tab through every page; ensure focus order matches reading order.
- 200% browser zoom: layout doesn't break.
- Print: front page and the bill prints cleanly with no clipped content.
- Slow 3G: throttle and verify the page is usable.

---

## 13. Deployment

### 13.1 First deploy

1. Push to GitHub.
2. Connect repo to Cloudflare Pages.
3. Build command: `npm run build`. Output: `dist/`.
4. Set Node version: 22.
5. Custom domain: add in Cloudflare Pages settings; Cloudflare handles DNS if domain is registered there, otherwise add CNAME at the registrar.
6. HTTPS, HSTS and HTTP/3 — enabled by default on Cloudflare.

### 13.2 CI

GitHub Action `.github/workflows/ci.yml`:

```yaml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npx astro check
      - run: npm test
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - run: npm run lighthouse-ci
```

### 13.3 Monitoring

- Cloudflare's free real-user metrics for performance regression alerts.
- An uptime check (e.g. UptimeRobot free tier) hitting `/` every 5 minutes.

### 13.4 Backups

The site is statically generated and committed to Git. The Git history is the backup. Downloads in `public/downloads/` are also versioned.

---

## 14. Phased delivery

### Phase 1 — minimum viable site (target: 1 week)

Sections 5.1 (front page), 5.5 (the bill), 5.6 (find your MP), 5.7 (send a letter), 5.8 (downloads), 5.9 (resources), 5.11 (privacy). The MP lookup and letter generator working end-to-end. All accessibility and performance budgets met.

### Phase 2 — depth and discovery (week 2)

Sections 5.2 (the problem), 5.3 (what stores are doing), 5.4 (the evidence). Filterable statistics page. Updates page (MDX) for tracking parliamentary activity. About page with endorsements.

### Phase 3 — refinement (week 3+)

- Open Graph images per page.
- Dark mode polish.
- Email signup (only if a campaign entity exists to receive consent).
- Translations into Welsh and Scottish Gaelic (gov.uk parity).
- A "share this with your MP" feature for journalists and policy researchers.
- Analytics review (Plausible self-hosted if/when needed).

### Phase 4 — campaign-stage features

- Pledge tracker (number of letters sent — anonymous count via a tiny serverless function).
- A "Find your candidate" mode for the next general election.
- Direct PDF generation from a signed letter the visitor types into a textarea.
- Interactive map of UK constituencies coloured by MP party / stance.

---

## 15. README contents for the repo

Claude Code should produce a `README.md` in the repo root that includes:

1. Project description in three sentences.
2. Live URL.
3. Tech stack at a glance.
4. Local development: `npm install && npm run dev`.
5. Build: `npm run build`. Preview: `npm run preview`.
6. Tests: `npm test` (unit), `npm run test:e2e` (Playwright).
7. Linting: `npm run lint`, `npm run format`.
8. How to update statistics — point to `src/content/statistics/`.
9. How to update the letter — point to `src/lib/letterTemplate.ts` and `03_Letter_to_MP.md` (the canonical source).
10. How to deploy.
11. License: prose and statistics content **CC BY 4.0**; code **MIT**. Photographs use individual photographer's licence.
12. Contributing: pull requests welcome, must pass CI, must keep accessibility budget.
13. Contact and imprint.

---

## 16. Pre-flight checklist for Claude Code

Before considering any phase "done", Claude Code must confirm:

- [ ] Lighthouse mobile scores ≥ 95 on Performance, Accessibility, Best Practices, SEO across all listed pages.
- [ ] Axe-core scan returns zero errors on all pages.
- [ ] All `<img>` have meaningful `alt` (or empty `alt` for decorative).
- [ ] Skip link is the first focusable element.
- [ ] `<html lang="en-GB">` set.
- [ ] No console errors in dev or production builds.
- [ ] Postcode validation handles space and no-space variants.
- [ ] Letter mailto opens correctly in macOS Mail, Gmail web (via `mailto:` handler), and Outlook.
- [ ] Letter PDF opens cleanly in Preview, Acrobat and Chrome PDF viewer.
- [ ] The site renders and is fully usable with JavaScript disabled (graceful degradation for the two interactive islands).
- [ ] The downloads link to the four source files in the Dropbox-prepared workspace and have correct file sizes and dates.
- [ ] Privacy policy names the controller, the data flows, and the right-to-complain.
- [ ] No third-party trackers, no Google fonts at runtime, no Facebook pixel, no Twitter widget.
- [ ] Footer contains the imprint and an accessibility statement link.
- [ ] The site builds reproducibly from a clean clone in under 60 seconds.

---

## 17. Anti-patterns Claude Code must avoid

- **Do not** add a chatbot.
- **Do not** add a "petition" form unless we have a campaign entity to receive signatures. A letter to your own MP is more powerful than a generic petition.
- **Do not** add hero illustrations of children at empty fridges.
- **Do not** auto-play any video, ever.
- **Do not** add a cookie banner if there are no cookies.
- **Do not** use sticky CTAs that block content on mobile.
- **Do not** add a newsletter modal that interrupts reading.
- **Do not** use a date format anywhere except `D MMMM YYYY` (e.g. "17 May 2026").
- **Do not** load fonts from Google.
- **Do not** call analytics from the front page on load.
- **Do not** style the body text in a colour with less than 7:1 contrast against the background — that's AAA-level for body, and easy to hit with `#0F172A` on `#FAFAF7`.
- **Do not** generate AI imagery and pass it off as photography.
- **Do not** introduce React state for things HTML can do (use `<details>` for accordions; use `<dialog>` for modals).

---

_End of brief._
