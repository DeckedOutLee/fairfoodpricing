import { z } from 'zod';

/**
 * MP lookup pipeline.
 *
 * Public data only:
 *  - postcodes.io  → postcode → parliamentary_constituency
 *  - members-api.parliament.uk → constituency → MP details + contact
 *
 * No API key required. No PII persisted on this side. Postcode is sent
 * to postcodes.io only; everything else uses constituency names.
 */

// ----- Validation ----------------------------------------------------

// Permissive UK postcode regex — accepts BFPO and Gibraltar.
// Reference: https://ideal-postcodes.co.uk/guides/uk-postcode-format
const UK_POSTCODE_RE = /^(GIR ?0AA|[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}|BFPO ?\d{1,4})$/i;

export function isValidPostcode(input: string): boolean {
  return UK_POSTCODE_RE.test(input.trim());
}

export function normalisePostcode(input: string): string {
  const compact = input.toUpperCase().replace(/\s+/g, '');
  if (compact.length < 5) return compact;
  // Insert single space before inward code (last 3 chars).
  return `${compact.slice(0, -3)} ${compact.slice(-3)}`.trim();
}

// ----- Schemas -------------------------------------------------------

const PostcodeResult = z.object({
  status: z.number(),
  result: z.object({
    postcode: z.string(),
    parliamentary_constituency: z.string().nullable(),
    country: z.string().optional(),
    admin_district: z.string().optional(),
    admin_ward: z.string().optional(),
  }),
});

// The Members API has a deep, nested shape; we only validate the bits we use.
const MPSearchResult = z.object({
  items: z.array(
    z.object({
      value: z.object({
        currentRepresentation: z.object({
          member: z.object({
            value: z
              .object({
                id: z.number(),
                nameDisplayAs: z.string(),
                nameFullTitle: z.string().optional(),
                latestParty: z.object({ name: z.string() }).passthrough(),
                latestHouseMembership: z.object({ membershipFrom: z.string() }).passthrough(),
                thumbnailUrl: z.string().nullable().optional(),
              })
              .passthrough(),
          }),
        }),
      }),
    }),
  ),
});

const ContactResult = z.object({
  value: z.array(
    z
      .object({
        type: z.string(),
        typeDescription: z.string().optional(),
        typeId: z.number().optional(),
        line1: z.string().nullable().optional(),
        line2: z.string().nullable().optional(),
        line3: z.string().nullable().optional(),
        line4: z.string().nullable().optional(),
        line5: z.string().nullable().optional(),
        postcode: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        fax: z.string().nullable().optional(),
        email: z.string().nullable().optional(),
      })
      .passthrough(),
  ),
});

// ----- Types ---------------------------------------------------------

export interface MP {
  id: number;
  name: string;
  fullTitle: string;
  party: string;
  constituency: string;
  photoUrl: string | null;
  email: string | null;
  address: string;
  theyWorkForYouUrl: string;
}

export type LookupError =
  | 'INVALID_POSTCODE'
  | 'POSTCODE_NOT_FOUND'
  | 'NO_MP_FOUND'
  | 'NETWORK'
  | 'UNKNOWN';

export class MPLookupError extends Error {
  constructor(
    public code: LookupError,
    message: string,
  ) {
    super(message);
    this.name = 'MPLookupError';
  }
}

// ----- Helpers -------------------------------------------------------

const WESTMINSTER_FALLBACK = 'House of Commons, London, SW1A 0AA';

function constituencySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function joinAddress(parts: Array<string | null | undefined>): string {
  const cleaned = parts.map((p) => p?.trim()).filter((p): p is string => !!p);
  return cleaned.length > 0 ? cleaned.join(', ') : WESTMINSTER_FALLBACK;
}

async function fetchJson(
  url: string,
  fetchFn: typeof fetch,
  signal?: AbortSignal,
): Promise<unknown> {
  let res: Response;
  try {
    res = await fetchFn(url, { signal, headers: { Accept: 'application/json' } });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new MPLookupError('NETWORK', 'Network request failed');
  }
  if (!res.ok) {
    if (res.status === 404) {
      throw new MPLookupError('POSTCODE_NOT_FOUND', `Resource not found: ${url}`);
    }
    throw new MPLookupError('NETWORK', `Bad response from upstream (${res.status})`);
  }
  return res.json();
}

// ----- Public API ----------------------------------------------------

export interface FindMPOptions {
  fetch?: typeof fetch;
  signal?: AbortSignal;
}

export async function findMPByPostcode(postcode: string, options: FindMPOptions = {}): Promise<MP> {
  const fetchFn = options.fetch ?? fetch;
  const signal = options.signal;
  const trimmed = postcode.trim();
  if (!isValidPostcode(trimmed)) {
    throw new MPLookupError('INVALID_POSTCODE', 'Invalid UK postcode');
  }

  const normalised = normalisePostcode(trimmed);

  // 1. Postcode → constituency
  let postcodeJson: unknown;
  try {
    postcodeJson = await fetchJson(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(normalised)}`,
      fetchFn,
      signal,
    );
  } catch (err) {
    if (err instanceof MPLookupError && err.code === 'POSTCODE_NOT_FOUND') {
      throw err;
    }
    throw err;
  }
  const postcodeResult = PostcodeResult.safeParse(postcodeJson);
  if (!postcodeResult.success) {
    throw new MPLookupError('UNKNOWN', 'Unexpected postcode response');
  }
  const constituency = postcodeResult.data.result.parliamentary_constituency;
  if (!constituency) {
    throw new MPLookupError('NO_MP_FOUND', 'Postcode is not in a UK Parliament constituency');
  }

  // 2. Constituency → MP
  const mpJson = await fetchJson(
    `https://members-api.parliament.uk/api/Location/Constituency/Search?searchText=${encodeURIComponent(
      constituency,
    )}&skip=0&take=1`,
    fetchFn,
    signal,
  );
  const mpParsed = MPSearchResult.safeParse(mpJson);
  if (!mpParsed.success || mpParsed.data.items.length === 0) {
    throw new MPLookupError('NO_MP_FOUND', 'No MP found for constituency');
  }
  const memberValue = mpParsed.data.items[0]!.value.currentRepresentation.member.value;

  // 3. Contact details
  let email: string | null = null;
  let address: string = WESTMINSTER_FALLBACK;
  try {
    const contactJson = await fetchJson(
      `https://members-api.parliament.uk/api/Members/${memberValue.id}/Contact`,
      fetchFn,
      signal,
    );
    const contactParsed = ContactResult.safeParse(contactJson);
    if (contactParsed.success) {
      const parliamentary = contactParsed.data.value.find((c) => c.type === 'Parliamentary office');
      const constituencyOffice = contactParsed.data.value.find(
        (c) => c.type === 'Constituency office',
      );

      email = parliamentary?.email ?? constituencyOffice?.email ?? null;

      const source = parliamentary ?? constituencyOffice;
      if (source) {
        address = joinAddress([
          source.line1,
          source.line2,
          source.line3,
          source.line4,
          source.line5,
          source.postcode,
        ]);
      }
    }
  } catch (err) {
    // Non-fatal: we still have name + constituency, fall back to Westminster address.
    if ((err as Error).name === 'AbortError') throw err;
  }

  return {
    id: memberValue.id,
    name: memberValue.nameDisplayAs,
    fullTitle: memberValue.nameFullTitle ?? memberValue.nameDisplayAs,
    party: memberValue.latestParty.name,
    constituency,
    photoUrl: memberValue.thumbnailUrl ?? null,
    email,
    address,
    theyWorkForYouUrl: `https://www.theyworkforyou.com/mp/${constituencySlug(constituency)}`,
  };
}
