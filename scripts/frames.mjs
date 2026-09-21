// Снимает несколько экранов подряд по каждому прототипу — для осмотра глазами.
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = 'http://localhost:4321';
const routes = process.argv[2] ? process.argv[2].split(',') : ['proto/a', 'proto/b', 'proto/c'];
const frames = process.argv[3] ? Number(process.argv[3]) : 3;

const outDir = resolve(process.cwd(), '.impeccable/review/frames');
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

  for (let i = 0; i < frames; i++) {
    const y = i * 800;
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await new Promise((r) => setTimeout(r, 180));
    await page.screenshot({ path: `${outDir}/${slug}-f${i}.png` });
  }
  await page.close();
  console.log('снято:', slug);
}
await browser.close();
