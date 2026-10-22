import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// News posts: src/content/news/*.md. Files starting with _ are ignored.
const news = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    games: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

// Sets: src/content/sets/<game>/<set>.md. Drives set pages and release lists.
const sets = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_*.md'], base: './src/content/sets' }),
  schema: z.object({
    title: z.string(),
    game: z.string(),
    description: z.string(),
    nzRelease: z.coerce.date().optional(),
    products: z
      .array(z.object({ name: z.string(), rrp: z.string().optional() }))
      .default([]),
    tcgdexId: z.string().optional(),
    sealed: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { news, sets };
