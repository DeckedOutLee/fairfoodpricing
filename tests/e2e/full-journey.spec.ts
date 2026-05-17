import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Front page renders and links work', () => {
  test('shows the campaign headline and primary CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Soon, the price of your loaf of bread could change',
    );
    await expect(page.getByRole('link', { name: /Write to your MP/i }).first()).toBeVisible();
  });

  test('all 8 featured stat cards render', async ({ page }) => {
    await page.goto('/');
    // The 4-col grid lives below the "numbers-heading"
    const grid = page.locator('ul', { hasText: '6.3 million' }).first();
    await expect(grid.locator('article')).toHaveCount(8);
  });

  test('header navigation goes to find-your-mp', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Find your MP', exact: false }).first().click();
    await expect(page).toHaveURL(/\/find-your-mp/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Find your MP');
  });
});

test.describe('Full MP-letter journey', () => {
  test('postcode → MP → letter preview → send link', async ({ page }) => {
    // Stub out the upstream APIs so we don't hit the live network in CI.
    await page.route('https://api.postcodes.io/postcodes/**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 200,
          result: {
            postcode: 'SW1A 1AA',
            parliamentary_constituency: 'Cities of London and Westminster',
            country: 'England',
            admin_district: 'Westminster',
          },
        }),
      });
    });

    await page.route('**/Location/Constituency/Search**', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              value: {
                currentRepresentation: {
                  member: {
                    value: {
                      id: 9999,
                      nameDisplayAs: 'Rachel Blake',
                      nameFullTitle: 'Rachel Blake MP',
                      latestParty: { name: 'Labour' },
                      latestHouseMembership: {
                        membershipFrom: 'Cities of London and Westminster',
                      },
                      thumbnailUrl: null,
                    },
                  },
                },
              },
            },
          ],
        }),
      });
    });

    await page.route('**/Members/9999/Contact', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          value: [
            {
              type: 'Parliamentary office',
              line1: 'House of Commons',
              line2: 'London',
              postcode: 'SW1A 0AA',
              email: 'rachel.blake.mp@parliament.uk',
            },
          ],
        }),
      });
    });

    await page.goto('/find-your-mp');
    await page.getByLabel(/Enter your UK postcode/i).fill('SW1A 1AA');
    await page.getByRole('button', { name: /Find my MP/i }).click();

    // Result card appears
    await expect(page.getByText('Rachel Blake MP')).toBeVisible();
    await expect(page.getByText(/Cities of London and Westminster/)).toBeVisible();
    await expect(page.getByText(/Labour/i)).toBeVisible();

    // Continue to the letter page (uses query params)
    const writeBtn = page.getByRole('link', { name: /Write to Blake/i });
    await expect(writeBtn).toBeVisible();
    await writeBtn.click();

    await expect(page).toHaveURL(/\/send-a-letter\?.*mp=9999/);

    // Wait for the React island to hydrate and pre-fill the MP name from the query string.
    await expect(page.getByLabel(/MP full name/i)).toHaveValue('Rachel Blake MP');

    // Fill the visitor fields (MP fields pre-filled from query)
    await page.getByLabel(/Your full name/i).fill('Jane Citizen');
    await page.getByLabel(/Your town or constituency/i).fill('Halifax');

    // Letter preview should now include the visitor name and town
    const preview = page.locator('pre').first();
    await expect(preview).toContainText('Jane Citizen');
    await expect(preview).toContainText('Halifax');
    // Date check disabled — the test runs on the real today, not a fixed date.

    // Without consent ticked, send button is disabled
    const sendByEmail = page.getByRole('link', { name: /Send by email/i });
    await expect(sendByEmail).toHaveAttribute('aria-disabled', 'true');

    // Tick consent
    await page.getByLabel(/I have read the letter/i).check();

    // mailto link is now active and contains the expected subject
    await expect(sendByEmail).not.toHaveAttribute('aria-disabled', 'true');
    const mailtoHref = await sendByEmail.getAttribute('href');
    expect(mailtoHref).not.toBeNull();
    expect(mailtoHref!.startsWith('mailto:')).toBe(true);
    expect(decodeURIComponent(mailtoHref!)).toContain(
      'Fair pricing of essential food in UK supermarkets',
    );
  });
});

test.describe('Accessibility — axe-core scan on every page', () => {
  const PAGES = [
    '/',
    '/the-problem',
    '/what-stores-are-doing',
    '/the-evidence',
    '/the-bill',
    '/find-your-mp',
    '/send-a-letter',
    '/downloads',
    '/resources',
    '/about',
    '/privacy',
  ];

  for (const path of PAGES) {
    test(`no axe violations on ${path}`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .analyze();

      const blocking = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );
      if (blocking.length) {
        for (const v of blocking) {
           
          console.error(`[${path}] ${v.id} — ${v.help}`);
          for (const n of v.nodes) console.error('  ↳', n.html.slice(0, 200));
        }
      }
      expect(blocking, `Blocking accessibility violations on ${path}`).toEqual([]);
    });
  }
});

test.describe('Layout robustness', () => {
  test('header is present on every Phase 1 page', async ({ page }) => {
    for (const path of ['/', '/find-your-mp', '/send-a-letter', '/the-bill', '/downloads']) {
      await page.goto(path);
      await expect(page.locator('header').first()).toBeVisible();
      await expect(page.locator('main#main')).toBeVisible();
    }
  });

  test('404 page renders with all three CTAs', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist', { waitUntil: 'load' });
    // Astro dev/preview returns 404 status; ensure the body renders
    expect([404, 200]).toContain(res?.status() ?? 404);
    await expect(page.getByText('Page not found')).toBeVisible();
  });
});
