// Снимает конкретные секции по якорю — чтобы смотреть подписные моменты, а не ленту целиком.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = 'http://localhost:4321';
const routes = ['proto/a', 'proto/b', 'proto/c'];
const anchors = process.argv[2] ? process.argv[2].split(',') : ['prices'];

const outDir = resolve(process.cwd(), '.impeccable/review/sections');
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--disable-gpu', '--font-render-hinting=none'],
});

for (const route of routes) {
  const slug = route.replace(/\//g, '-');
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(`${base}/${route}/`, { waitUntil: 'networkidle0', timeout: 45000 });
  await page.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 300));

  for (const a of anchors) {
    const ok = await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 8);
      return true;
    }, a);
    if (!ok) { console.log(`  нет якоря #${a} в ${slug}`); continue; }
    await new Promise((r) => setTimeout(r, 200));
    await page.screenshot({ path: `${outDir}/${slug}-${a}.png` });
  }
  // отдельно — проверка, что закреплённая кнопка действительно отрисована
  const wa = await page.evaluate(() => {
    const el = document.querySelector('.sticky-wa');
    if (!el) return 'ОТСУТСТВУЕТ В DOM';
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return `${Math.round(r.width)}x${Math.round(r.height)} @ y=${Math.round(r.top)} display=${cs.display} vis=${cs.visibility} op=${cs.opacity}`;
  });
  console.log(`${slug}: sticky-wa -> ${wa}`);
  await page.close();
}
await browser.close();
