// Карта сайта. Адреса строятся от site + base из astro.config.mjs —
// при переезде на свой домен менять ничего не нужно.
// Пробные варианты (proto/, varianty/) в карту не входят.
import { getCollection } from 'astro:content';

const day = (d) => d.toISOString().slice(0, 10);

export async function GET({ site }) {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const abs = (p) => new URL(base + p, site).href;
  const stati = (await getCollection('stati', ({ data }) => !data.draft))
    .sort((a, b) => a.data.order - b.data.order);

  const urls = [
    { loc: abs('') },
    { loc: abs('stati/') },
    ...stati.map((e) => {
      const d = e.data.reviewed || e.data.date;
      return { loc: abs(`stati/${e.id}/`), lastmod: d && day(d) };
    }),
  ];

  const body = urls
    .map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
}
