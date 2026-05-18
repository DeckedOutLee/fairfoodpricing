# Fair Food Pricing — campaign brief

## What this is

A UK voter-led campaign asking Parliament to legislate against AI-driven personalised and dynamic pricing of essential food in supermarkets. Not a charity, not a CIC, not a political party — Lee, one voter, with a website, a draft Bill, and 30 pages of primary-source evidence.

**V1 live at https://www.fairfoodpricing.co.uk/** since 18 May 2026. (Built 17 May; hardened, audited, and shipped as public V1 the next morning.)

## What the site does

1. Explains, in plain English, what personalised and dynamic supermarket pricing is and why it matters.
2. Cites the figures the supermarkets, the Bank of England and the regulators have themselves published.
3. Lets a UK voter find their MP via postcode in under two seconds.
4. Generates a personalised, evidenced letter the voter can send by email, copy to their inbox, or download as Word/PDF.
5. Publishes the full evidence briefing, draft Bill, one-page cross-party summary, and editable letter template in Word and PDF.
6. Links to food-poverty support services for visitors who themselves need help today.

## What it does not do

- No newsletter, no email list, no signup form.
- No cookies on first visit. No analytics. No tracking pixels. No ad networks.
- No third-party fonts at runtime — Montserrat is self-hosted.
- No donation page, no "buy me a coffee", no supporter tiers.
- No social media embeds, no chatbot, no petition form.

## The Bill in one paragraph

Four clauses, narrow and prospective:

1. **One price per essential.** Supermarkets above 280 m² cannot charge different prices for the same essential food item to different identifiable consumers at the same time.
2. **One upward change per 24 hours.** Time-of-day price increases on essentials are capped at one per 24h. Markdowns are entirely unrestricted.
3. **Shrinkflation disclosure for 60 days.** Shelf-edge and online notice when a product has shrunk and unit price hasn't fallen.
4. **30-day reference-price rule for essentials.** Transposes the EU rule, closing the post-Brexit gap.

Enforced by the CMA under the Digital Markets, Competition and Consumers Act 2024. No price controls. No ban on electronic shelf labels. No interference with loyalty schemes or end-of-day yellow stickers. Cross-party by design.

## Who runs this

Lee, a UK voter. Contact: hello@fairfoodpricing.co.uk. No affiliation with any retailer, retail body, technology vendor, or political party.

## What's shipped (Phase 1, as of 18 May 2026)

- Front page with hero, eight primary-source statistic cards, retailer rundown, action band.
- `/the-problem` long-form explainer.
- `/what-stores-are-doing` retailer-by-retailer rundown (five chains).
- `/the-evidence` filterable statistics catalogue + references.
- `/the-bill` plain-English summary + eight-question FAQ + enforcement detail.
- `/find-your-mp` postcode lookup using the UK Parliament Members API + postcodes.io.
- `/send-a-letter` letter generator with four delivery options: email (mailto:), copy to clipboard, download as Word, download as PDF.
- `/downloads` evidence pack, draft Bill, one-pager, letter template — all in Word + PDF.
- `/resources` food-help-now and research-and-campaign link lists.
- `/about`, `/privacy`, `/404`.
- Auto-deploys from GitHub to Vercel on every push to `main`.
- Lighthouse 100/100/100/100 mobile + desktop on live production.
- All six standard security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).

## What's deferred

- Permanent campaign logo (placeholder Montserrat wordmark in place — separate designer brief written).
- GitHub Actions CI (workflow file is local; needs `workflow` OAuth scope or paste via UI).
- Dark mode (palette tokens are in place but contrast not yet polished — light theme is the locked design).
- Phase 2 endorsements section on `/about` (no endorsers yet).
- Phase 4 "letters sent" pledge counter — would need a small serverless function and a back-end store.

## Licensing

- Prose, statistics, briefing, draft Bill, letter template: **Creative Commons CC BY 4.0** — reuse with attribution.
- Codebase: **MIT**.
