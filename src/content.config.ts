import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const chapters = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chapters' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    volume: z.union([z.literal(1), z.literal(2)]).default(1),
    epigraph: z.string().optional(),
  }),
});

export const collections = { chapters };
