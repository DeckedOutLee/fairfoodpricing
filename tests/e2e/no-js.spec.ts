import { test, expect } from '@playwright/test';

/**
 * No-JavaScript verification.
 *
 * Chromium with JavaScript disabled keeps <noscript> contents as opaque text
 * (it does not unwrap them into the DOM tree as Firefox does), so Playwright's
 * DOM locators won't see text inside <noscript>. We assert against the raw
 * HTML content of the page instead, which is the strict contract: the static
 * fallback is present in the response and rendered when JS is off.
 */

test.describe('No-JavaScript path', () => {
  test('front page renders without JavaScript', async ({ page, javaScriptEnabled }) => {
    expect(javaScriptEnabled).toBe(false);
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Soon, the price of your loaf of bread',
    );
    // SSR stat cards must be present in the DOM (they are not behind a noscript).
    await expect(page.getByText('6.3 million').first()).toBeVisible();
    await expect(page.getByText('10.8 million').first()).toBeVisible();
  });

  test('find-your-mp ships the noscript fallback with manual instructions', async ({ page }) => {
    await page.goto('/find-your-mp');
    const html = await page.content();
    expect(html).toContain('JavaScript is needed for instant lookup');
    expect(html).toContain('members.parliament.uk/FindYourMP');
    // The MP-finder form's `<input>` is also rendered SSR (so even with JS on,
    // the input is visible immediately) — but it won't be functional here.
    await expect(page.getByLabel(/Enter your UK postcode/i)).toBeVisible();
  });

  test('send-a-letter ships the noscript fallback linking to the Word template', async ({
    page,
  }) => {
    await page.goto('/send-a-letter');
    const html = await page.content();
    expect(html).toContain('JavaScript is needed for the live preview');
    expect(html).toContain('Word version');
    // Static page header still renders.
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Send your letter');
  });

  test('downloads page lists all four packs without JS', async ({ page }) => {
    await page.goto('/downloads');
    await expect(page.getByRole('heading', { name: 'Evidence briefing' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Draft Bill text' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'One-page cross-party summary' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Letter to MP/ })).toBeVisible();
  });
});
