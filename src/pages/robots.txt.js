// robots.txt собирается здесь, чтобы адрес карты сайта шёл от той же
// константы site + base, что и все остальные ссылки.
export function GET({ site }) {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const sitemap = new URL(`${base}sitemap.xml`, site).href;
  // Черновик на согласовании: индексация закрыта.
  // При запуске на своём домене заменить «Disallow: /» на «Allow: /».
  const body = [
    '# Черновик на согласовании. Индексация закрыта до запуска на своём домене.',
    'User-agent: *',
    'Disallow: /',
    '',
    `Sitemap: ${sitemap}`,
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
