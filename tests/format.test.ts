import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  slugify,
  todayISO,
} from '@/lib/format';

describe('formatDate', () => {
  it('formats a Date as D MMMM YYYY in en-GB', () => {
    expect(formatDate(new Date(Date.UTC(2026, 4, 17)))).toBe('17 May 2026');
  });

  it('accepts an ISO string', () => {
    expect(formatDate('2026-12-01')).toBe('1 December 2026');
  });

  it('returns empty string for invalid input', () => {
    expect(formatDate('not-a-date')).toBe('');
  });
});

describe('formatDateTime', () => {
  it('includes the time', () => {
    const out = formatDateTime(new Date('2026-05-17T09:30:00Z'));
    expect(out).toMatch(/17 May 2026/);
    expect(out).toMatch(/\d{2}:\d{2}/);
  });
});

describe('formatNumber', () => {
  it('uses UK thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });
});

describe('formatCurrency', () => {
  it('formats as GBP', () => {
    expect(formatCurrency(1.65)).toBe('£1.65');
    expect(formatCurrency(1000)).toBe('£1,000.00');
  });
});

describe('slugify', () => {
  it('lowercases, replaces non-alphanumerics with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify("Sir Edward O'Brien MP")).toBe('sir-edward-o-brien-mp');
  });

  it('collapses repeated separators and trims', () => {
    expect(slugify('---foo---bar---')).toBe('foo-bar');
  });
});

describe('todayISO', () => {
  it('returns a yyyy-mm-dd string of length 10', () => {
    const out = todayISO();
    expect(out).toHaveLength(10);
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
