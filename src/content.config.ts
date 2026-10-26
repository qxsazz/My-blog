import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
const schema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  category: z.string(),
  column: z.enum(['年终总结', '阶段总结', '游记', '思考', '游戏推荐']).optional(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  pinned: z.boolean().default(false),
  mood: z.string().optional(),
});
export const collections = {
  posts: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/posts' }), schema }),
  notes: defineCollection({ loader: glob({ pattern: '**/*.md', base: './src/content/notes' }), schema }),
};
