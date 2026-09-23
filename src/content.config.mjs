import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Статьи врача. Медицинские тексты публикуются только после её проверки,
// поэтому неготовое помечается draft и на сайте показывается как «готовится».
const stati = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/stati' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    series: z.string(),
    order: z.number().default(100),
    draft: z.boolean().default(false),
    date: z.coerce.date().optional(),
    // Заметка для внутренней работы: чего не хватает, чтобы опубликовать.
    note: z.string().optional(),
  }),
});

export const collections = { stati };
