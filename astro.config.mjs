import { defineConfig } from 'astro/config';

// Черновик живёт на GitHub Pages по пути /lor-roza/.
// Когда купите домен — поменяйте site на него и уберите base,
// пути в коде соберутся сами через import.meta.env.BASE_URL.
export default defineConfig({
  site: process.env.SITE_URL || 'https://kirgenevazukhra.github.io',
  base: process.env.SITE_BASE ?? '/lor-roza',
  i18n: {
    locales: ['ru', 'kk'],
    defaultLocale: 'ru',
    routing: { prefixDefaultLocale: false },
  },
  build: { inlineStylesheets: 'auto' },
});
