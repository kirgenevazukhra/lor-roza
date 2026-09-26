import { defineConfig } from 'astro/config';

// Черновик живёт на GitHub Pages по пути /lor-roza/.
// Когда купите домен — поменяйте site на него и уберите base,
// пути в коде соберутся сами через import.meta.env.BASE_URL.
export default defineConfig({
  // Базовый адрес сайта — одна константа на всё: canonical, og:image,
  // JSON-LD, sitemap.xml и robots.txt строятся от site + base.
  // {{TODO: домен}} — при запуске на своём домене вписать его сюда,
  // base сделать '/', убрать noindex в index.astro и Article.astro
  // и открыть индексацию в src/pages/robots.txt.js.
  site: process.env.SITE_URL || 'https://kirgenevazukhra.github.io',
  base: process.env.SITE_BASE ?? '/lor-roza',
  i18n: {
    locales: ['ru', 'kk'],
    defaultLocale: 'ru',
    routing: { prefixDefaultLocale: false },
  },
  build: { inlineStylesheets: 'auto' },
});
