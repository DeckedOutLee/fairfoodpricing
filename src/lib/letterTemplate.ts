/**
 * Letter generator — mail-merges the canonical Fair Food Pricing letter
 * (see ../../Dynamic Food Pricing/03_Letter_to_MP.md) with visitor fields.
 *
 * Pure module: no DOM, no fetch. Used by the React island and tested in Vitest.
 */

import { formatDate, slugify } from './format';

export interface LetterInput {
  mpName: string;
  mpAddress?: string;
  visitorName: string;
  visitorTown: string;
  visitorEmail?: string;
  personalNote?: string;
  /** Override date for deterministic tests. */
  today?: Date;
}

export interface LetterOutput {
  subject: string;
  body: string;
  filename: string;
}

export const LETTER_SUBJECT = 'Fair pricing of essential food in UK supermarkets';

/** Approximate cap for mailto body — older clients break above ~2000 chars. */
export const MAILTO_BODY_LIMIT = 1800;

const PARAGRAPHS: string[] = [
  'I am writing to ask you to support, table or co-sponsor a Private Member’s Bill — provisionally the Fair Food Pricing Bill — that would restrict AI-driven personalised and dynamic pricing of essential food items in UK supermarkets, require disclosure of shrinkflation, and close the UK gap on advertised reference prices left by Brexit.',
  'I have prepared, alongside this letter, a 30-page evidence briefing and an indicative draft of the Bill. Both are available at fairfoodpricing.co.uk/downloads. The briefing engages openly with the strongest arguments against legislation. The case for prevention, narrowly drawn, is now overwhelming.',
  'The hardware for individualised, real-time pricing of food is being installed across the major UK supermarket estates as I write. Morrisons is fitting 10.8 million electronic shelf labels across all 497 of its supermarkets. Co-op is doing the same across all 2,400 of its stores by the end of 2026. Asda has installed thousands across its Express estate. The Bank of England has found that 21% of UK firms already use market-responsive pricing tools, expected to rise to 31% within a year — the largest planned increase among any pricing tool the Bank surveyed.',
  'At the same time, the protections consumers might rely on have just been weakened: the Data (Use and Access) Act 2025, in force from 19 June 2025, has relaxed the Article 22 prohibition on solely automated decisions affecting individuals. The British Retail Consortium has stated publicly that "supermarkets do not use, and have no plan to use, dynamic or surge pricing in their stores". A statutory floor turns that public commitment into a legally binding promise. It costs supermarkets nothing if they meant what they said. It protects consumers if they did not.',
  'UK food poverty is at the worst point in living memory. In January 2026, approximately 6.3 million UK adults — about 12% of households — were food insecure. Around 2.2 million children live in homes that cut down on or skip meals. Households containing a disabled adult are food insecure at around 40%. UK food prices have risen 38% in the five years to November 2025. The households most exposed to food poverty are also the households most exposed to algorithmic pricing — they cannot drive to a competitor, cannot wait for prices to fall, and depend on a particular store at a particular time.',
  'The attached Bill takes a narrow, prospective approach. It does not propose price controls. It does not ban electronic shelf labels. It does not ban loyalty schemes. It does not interfere with end-of-day markdowns, supplier cost pass-through or uniform promotions. It does four substantive things: prohibits supermarkets above 280 m² from charging different prices for the same essential food item to different identifiable consumers at the same time; restricts upward time-of-day price changes on essentials to one per 24 hours, with no restriction on markdowns; requires shelf-edge and online disclosure of shrinkflation for 60 days; and transposes for essentials the EU 30-day reference-price rule. Enforcement is vested in the CMA using the architecture of the Digital Markets, Competition and Consumers Act 2024.',
  'This proposal does not belong to any single party. Liberal Democrats tabled a shrinkflation amendment to the Product Regulation and Metrology Bill. Blair McDougall MP (Labour) has a Groceries Labelling (Size Reduction) Bill 2024–26 before Parliament. The Business and Trade Committee under Liam Byrne MP took oral evidence on supermarket pricing in June 2025. The SNP has manifesto commitments on price caps for essentials. The Bishop of Truro chairs faith-based engagement on food poverty in the Lords. The CMA itself has flagged dynamic and drip pricing for further work under the DMCCA.',
  'I am not asking you to commit to a position that is not yet evidenced. I am asking you to take the evidence seriously and to use the platform you hold — through a Ten Minute Rule motion, a written question, a Westminster Hall debate, a letter to the Secretary of State, or a question at Business and Trade questions — to keep the issue alive long enough for the Government to respond.',
  'If you are willing, the most useful things you could do are: a Ten Minute Rule motion in the 2026 slots (30 June, 1, 7, 8 July); a written question asking what plans the Government has to use section 240 of the Digital Markets, Competition and Consumers Act 2024 to add personalised and time-of-day surge pricing of essential food to the Schedule 19 list of "in all circumstances unfair" practices; or a letter to the Information Commissioner on the impact of the Data (Use and Access) Act 2025 on automated pricing decisions affecting consumers of essential goods.',
  'Thank you for reading this far. Most of my concern with politics in recent years has been that, by the time we recognise a harm, the practice has already calcified and the legislative response is reactive. This is one of the rare moments where the harm is visible on the horizon and the hardware is being installed, but the practices it enables have not yet become normal. We have, for once, the time to draw the line first.',
];

/** Letter as bytes the visitor can paste, email, or print. */
export function buildLetter(input: LetterInput): LetterOutput {
  const today = input.today ?? new Date();
  const dateStr = formatDate(today);

  const opening = `I am writing to you as your constituent in ${escapeText(input.visitorTown)}.`;

  const noteBlock = input.personalNote?.trim()
    ? `\n\n${escapeText(input.personalNote.trim())}`
    : '';

  // Insert the personal note between paragraph 5 and 6 — between the food
  // poverty paragraph and the Bill detail paragraph (per Section 7.1).
  const intro = [opening, ...PARAGRAPHS.slice(0, 5)].join('\n\n');
  const tail = PARAGRAPHS.slice(5).join('\n\n');

  const header = [
    escapeText(input.visitorName),
    escapeText(input.visitorTown),
    input.visitorEmail ? escapeText(input.visitorEmail) : '',
    '',
    dateStr,
    '',
    escapeText(input.mpName),
    escapeText(input.mpAddress ?? 'House of Commons, London, SW1A 0AA'),
  ]
    .filter((line) => line !== null && line !== undefined)
    .join('\n');

  const greeting = `Dear ${escapeText(formalSalutation(input.mpName))},`;

  const body = [
    header,
    '',
    greeting,
    '',
    LETTER_SUBJECT,
    '',
    intro,
    noteBlock.replace(/^\n+/, ''),
    '',
    tail,
    '',
    'Yours sincerely,',
    '',
    escapeText(input.visitorName),
  ]
    .filter((part) => part !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');

  const filename = `letter-to-${slugify(input.mpName) || 'mp'}-${dateStr
    .replace(/\s+/g, '-')
    .toLowerCase()}.txt`;

  return { subject: LETTER_SUBJECT, body, filename };
}

/** Sanitise free-text fields — strip ASCII control chars and zero-width chars. */
function escapeText(input: string): string {
  return (
    input
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim()
  );
}

/** "Rt Hon Keir Starmer MP" → "Mr Starmer" — best-effort salutation. */
export function formalSalutation(fullTitle: string): string {
  const cleaned = fullTitle
    .replace(/\bMP\b/gi, '')
    .replace(/^Rt Hon\s+/i, '')
    .replace(/^The\s+/i, '')
    .replace(/^(Sir|Dame|Lord|Lady|Baroness|Baron|Dr|Prof|Professor|Mr|Mrs|Ms|Mx)\s+/i, '')
    .trim();
  // Use full given+family for warmth; safer than wrong-gender honorific.
  return cleaned || fullTitle.replace(/\bMP\b/gi, '').trim();
}

/** Build a mailto: link, truncating the body for compatibility with older clients. */
export function buildMailto(
  email: string,
  letter: LetterOutput,
  options: { limit?: number } = {},
): { href: string; truncated: boolean } {
  const limit = options.limit ?? MAILTO_BODY_LIMIT;
  let body = letter.body;
  let truncated = false;
  if (body.length > limit) {
    const truncatedBody = body.slice(0, limit - 200);
    body = `${truncatedBody}\n\n[The full letter has been truncated for your mail client. The complete text was previewed before sending.]`;
    truncated = true;
  }
  const href = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(letter.subject)}&body=${encodeURIComponent(body)}`;
  return { href, truncated };
}
