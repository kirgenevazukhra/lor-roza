// Снимает прототипы в двух ширинах и проверяет горизонтальное переполнение.
// Запуск: node scripts/shoot.mjs [--base http://localhost:4321]
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const base = process.argv.includes('--base')
  ? process.argv[process.argv.indexOf('--base') + 1]
  : 'http://localhost:4321';

const pages = process.argv.includes('--pages')
  ? process.argv[process.argv.indexOf('--pages') + 1].split(',')
  : [''];

const viewports = [
  { name: 'mobile', width: 390, height: 844, dsf: 2, mobile: true },
  { name: 'desktop', width: 1440, height: 900, dsf: 1, mobile: false },
];

const outDir = resolve(process.cwd(), '.impeccable/review');
mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--hide-scrollbars', '--disable-gpu', '--font-render-hinting=none'],
});

const report = [];

for (const route of pages) {
  const slug = route.replace(/\//g, '-');
  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport({
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: vp.dsf,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
    });
    await page.goto(`${base}/${route}`, { waitUntil: 'networkidle0', timeout: 45000 });
    // Шрифты должны сесть до съёмки, иначе метрики врут.
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 350));

    const diag = await page.evaluate((vw) => {
      const de = document.documentElement;
      const offenders = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        const cs = getComputedStyle(el);
        if (cs.position === 'fixed') continue;
        if (r.right > vw + 1 || r.left < -1) {
          offenders.push({
            sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''),
            left: Math.round(r.left),
            right: Math.round(r.right),
          });
        }
      }
      // Мелкий шрифт и недобор по цели нажатия — проверяем заодно.
      const tiny = [];
      for (const el of document.querySelectorAll('p, li, dd, span, cite, summary')) {
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs && fs < 13 && el.textContent.trim()) tiny.push({ sel: el.className || el.tagName, fs });
      }
      const smallTargets = [];
      for (const el of document.querySelectorAll('a, button, summary')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.height < 44) smallTargets.push({ sel: (el.className || el.tagName).toString().slice(0, 40), h: Math.round(r.height) });
      }
      return {
        scrollW: de.scrollWidth,
        clientW: de.clientWidth,
        docH: de.scrollHeight,
        offenders: offenders.slice(0, 12),
        tiny: tiny.slice(0, 8),
        smallTargets: smallTargets.slice(0, 8),
      };
    }, vp.width);

    const file = `${outDir}/${slug}-${vp.name}.png`;
    await page.screenshot({ path: file, fullPage: true });
    report.push({ route, vp: vp.name, file, ...diag });
    await page.close();
  }
}

await browser.close();

for (const r of report) {
  const overflow = r.scrollW > r.clientW;
  console.log(`\n=== ${r.route} @ ${r.vp} (${r.clientW}px) ===`);
  console.log(`  высота документа: ${r.docH}px`);
  console.log(`  горизонт: scrollW=${r.scrollW} clientW=${r.clientW} ${overflow ? '<<< ПЕРЕПОЛНЕНИЕ' : 'ok'}`);
  if (r.offenders.length) {
    console.log('  выходят за край:');
    for (const o of r.offenders) console.log(`    ${o.sel}  [${o.left} .. ${o.right}]`);
  }
  if (r.tiny.length) console.log('  мелкий шрифт (<13px):', JSON.stringify(r.tiny));
  if (r.smallTargets.length) console.log('  цель нажатия <44px:', JSON.stringify(r.smallTargets));
}
console.log('\nгde лежат файлы:', outDir);
