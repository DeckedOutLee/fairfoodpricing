/**
 * Site-wide constants. Single source of truth for brand strings used in
 * <meta> tags, the imprint, the privacy notice and structured data.
 */
export const site = {
  name: 'Fair Food Pricing',
  domain: 'fairfoodpricing.co.uk',
  url: 'https://fairfoodpricing.co.uk',
  tagline: 'Stop AI-driven pricing of essential food in UK supermarkets.',
  strapline:
    'A campaign to make Britain’s supermarkets keep their promise — one price per essential, for every shopper, every time.',
  publisher: {
    name: 'Lee',
    email: 'hello@fairfoodpricing.co.uk',
    affiliation: 'Published independently. Not affiliated with any political party.',
  },
  launched: '2026-05-17',
  defaultOgImage: '/og-image.png',
} as const;

export const nav = {
  primary: [
    { href: '/the-problem', label: 'The problem' },
    { href: '/what-stores-are-doing', label: 'What stores are doing' },
    { href: '/the-bill', label: 'The bill' },
    { href: '/find-your-mp', label: 'Find your MP' },
    { href: '/downloads', label: 'Downloads' },
  ],
  footer: [
    { href: '/resources', label: 'Resources' },
    { href: '/about', label: 'About' },
    { href: '/privacy', label: 'Privacy' },
    { href: 'mailto:hello@fairfoodpricing.co.uk', label: 'Contact' },
  ],
} as const;
