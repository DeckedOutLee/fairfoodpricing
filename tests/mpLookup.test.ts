import { describe, expect, it, vi } from 'vitest';
import {
  findMPByPostcode,
  isValidPostcode,
  MPLookupError,
  normalisePostcode,
} from '@/lib/mpLookup';

describe('isValidPostcode', () => {
  it.each(['SW1A 1AA', 'sw1a1aa', 'EH8 8DX', 'L1 8JQ', 'GIR 0AA'])('accepts %s', (pc) =>
    expect(isValidPostcode(pc)).toBe(true),
  );

  it.each(['', '12345', 'ABC', 'SW1A 1A', 'SW1A 1AAA'])('rejects %s', (pc) =>
    expect(isValidPostcode(pc)).toBe(false),
  );
});

describe('normalisePostcode', () => {
  it('inserts a space before the inward code', () => {
    expect(normalisePostcode('sw1a1aa')).toBe('SW1A 1AA');
    expect(normalisePostcode(' SW1A1AA ')).toBe('SW1A 1AA');
  });

  it('collapses multiple spaces', () => {
    expect(normalisePostcode('SW1A   1AA')).toBe('SW1A 1AA');
  });
});

// Helpers --------------------------------------------------------------

function makeFetchMock(responses: Record<string, { ok: boolean; status?: number; json: unknown }>) {
  return vi.fn(async (url: string) => {
    for (const key of Object.keys(responses)) {
      if (url.includes(key)) {
        const r = responses[key]!;
        return {
          ok: r.ok,
          status: r.status ?? (r.ok ? 200 : 500),
          json: async () => r.json,
        } as Response;
      }
    }
    throw new Error(`No mock for ${url}`);
  }) as unknown as typeof fetch;
}

const mockSuccessful = makeFetchMock({
  'api.postcodes.io/postcodes/': {
    ok: true,
    json: {
      status: 200,
      result: {
        postcode: 'SW1A 1AA',
        parliamentary_constituency: 'Cities of London and Westminster',
        country: 'England',
        admin_district: 'Westminster',
      },
    },
  },
  'Location/Constituency/Search': {
    ok: true,
    json: {
      items: [
        {
          value: {
            currentRepresentation: {
              member: {
                value: {
                  id: 5678,
                  nameDisplayAs: 'Rachel Blake',
                  nameFullTitle: 'Rachel Blake MP',
                  latestParty: { name: 'Labour' },
                  latestHouseMembership: { membershipFrom: 'Cities of London and Westminster' },
                  thumbnailUrl: 'https://example.test/photo.jpg',
                },
              },
            },
          },
        },
      ],
    },
  },
  '/Contact': {
    ok: true,
    json: {
      value: [
        {
          type: 'Parliamentary office',
          line1: 'House of Commons',
          line2: 'London',
          postcode: 'SW1A 0AA',
          email: 'rachel.blake.mp@parliament.uk',
        },
      ],
    },
  },
});

describe('findMPByPostcode', () => {
  it('returns a structured MP on the happy path', async () => {
    const mp = await findMPByPostcode('SW1A 1AA', { fetch: mockSuccessful });
    expect(mp.name).toBe('Rachel Blake');
    expect(mp.fullTitle).toBe('Rachel Blake MP');
    expect(mp.party).toBe('Labour');
    expect(mp.constituency).toBe('Cities of London and Westminster');
    expect(mp.email).toBe('rachel.blake.mp@parliament.uk');
    expect(mp.address).toContain('House of Commons');
    expect(mp.photoUrl).toBe('https://example.test/photo.jpg');
    expect(mp.theyWorkForYouUrl).toContain('theyworkforyou.com/mp/');
  });

  it('throws INVALID_POSTCODE on a malformed postcode', async () => {
    await expect(
      findMPByPostcode('not a postcode', { fetch: mockSuccessful }),
    ).rejects.toMatchObject({ code: 'INVALID_POSTCODE' });
  });

  it('throws POSTCODE_NOT_FOUND when postcodes.io returns 404', async () => {
    const fetchMock = makeFetchMock({
      'api.postcodes.io/postcodes/': { ok: false, status: 404, json: {} },
    });
    await expect(findMPByPostcode('ZZ99 9ZZ', { fetch: fetchMock })).rejects.toMatchObject({
      code: 'POSTCODE_NOT_FOUND',
    });
  });

  it('throws NETWORK when the upstream returns 500', async () => {
    const fetchMock = makeFetchMock({
      'api.postcodes.io/postcodes/': { ok: false, status: 500, json: {} },
    });
    await expect(findMPByPostcode('SW1A 1AA', { fetch: fetchMock })).rejects.toMatchObject({
      code: 'NETWORK',
    });
  });

  it('throws NETWORK when fetch itself throws', async () => {
    const failingFetch = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    try {
      await findMPByPostcode('SW1A 1AA', { fetch: failingFetch });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(MPLookupError);
      expect((err as MPLookupError).code).toBe('NETWORK');
    }
  });

  it('throws UNKNOWN when the postcode result is malformed', async () => {
    const fetchMock = makeFetchMock({
      'api.postcodes.io/postcodes/': { ok: true, json: { status: 200, foo: 'bar' } },
    });
    await expect(findMPByPostcode('SW1A 1AA', { fetch: fetchMock })).rejects.toMatchObject({
      code: 'UNKNOWN',
    });
  });

  it('throws NO_MP_FOUND when the Members API returns no items', async () => {
    const fetchMock = makeFetchMock({
      'api.postcodes.io/postcodes/': {
        ok: true,
        json: {
          status: 200,
          result: {
            postcode: 'SW1A 1AA',
            parliamentary_constituency: 'Nowhere',
            country: 'England',
            admin_district: 'Nowhere',
          },
        },
      },
      'Location/Constituency/Search': { ok: true, json: { items: [] } },
    });
    await expect(findMPByPostcode('SW1A 1AA', { fetch: fetchMock })).rejects.toMatchObject({
      code: 'NO_MP_FOUND',
    });
  });

  it('falls back to the Westminster address when the Contact endpoint fails', async () => {
    const fetchMock = makeFetchMock({
      'api.postcodes.io/postcodes/': {
        ok: true,
        json: {
          status: 200,
          result: {
            postcode: 'SW1A 1AA',
            parliamentary_constituency: 'Cities of London and Westminster',
            country: 'England',
            admin_district: 'Westminster',
          },
        },
      },
      'Location/Constituency/Search': {
        ok: true,
        json: {
          items: [
            {
              value: {
                currentRepresentation: {
                  member: {
                    value: {
                      id: 1,
                      nameDisplayAs: 'X',
                      nameFullTitle: 'X MP',
                      latestParty: { name: 'Independent' },
                      latestHouseMembership: { membershipFrom: 'Cities of London and Westminster' },
                      thumbnailUrl: null,
                    },
                  },
                },
              },
            },
          ],
        },
      },
      '/Contact': { ok: false, status: 500, json: {} },
    });
    const mp = await findMPByPostcode('SW1A 1AA', { fetch: fetchMock });
    expect(mp.email).toBeNull();
    expect(mp.address).toBe('House of Commons, London, SW1A 0AA');
  });
});
