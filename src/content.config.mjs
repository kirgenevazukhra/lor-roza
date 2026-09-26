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
    // Когда врач проверил текст. Ставится только по факту проверки:
    // уходит в разметку как lastReviewed.
    reviewed: z.coerce.date().optional(),
    // Заметка для внутренней работы: чего не хватает, чтобы опубликовать.
    note: z.string().optional(),
    // Ролик врача. Файлы лежат в public/video/, обложка снята кадром из него.
    video: z
      .object({
        src: z.string(),
        poster: z.string(),
        caption: z.string().optional(),
      })
      .optional(),
  }),
});

export const collections = { stati };
