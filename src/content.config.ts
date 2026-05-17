import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const statistics = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/statistics' }),
  schema: z.object({
    figure: z.string(),
    label: z.string(),
    context: z.string(),
    interpretation: z.string(),
    isHarm: z.boolean().default(false),
    tags: z.array(
      z.enum([
        'food-poverty',
        'shrinkflation',
        'loyalty-pricing',
        'lfr',
        'deployment',
        'international',
        'consumer-protection',
        'algorithmic-pricing',
      ]),
    ),
    source: z.object({
      name: z.string(),
      url: z.string().url(),
      date: z.string(),
    }),
    featured: z.boolean().default(false),
    order: z.number().default(99),
  }),
});

const references = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/references' }),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    type: z.enum(['primary', 'secondary', 'industry', 'academic', 'government', 'press']),
    date: z.string(),
    url: z.string().url(),
    note: z.string().optional(),
  }),
});

const resources = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/resources' }),
  schema: z.object({
    name: z.string(),
    description: z.string(),
    url: z.string().url(),
    section: z.enum(['help-now', 'research-campaign']),
    coverage: z.string().optional(),
    order: z.number().default(99),
  }),
});

export const collections = { statistics, references, resources };
