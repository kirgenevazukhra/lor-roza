// Готовит фотографии клиента к вебу: осмысленные имена, WebP + JPG, несколько ширин.
// Исходники остаются в images/ нетронутыми.
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = 'images';
const OUT = 'public/images';

// Карта: исходник -> смысловое имя, роль, кадрирование.
const MAP = [
  // ── широкие (их всего три, идут на акценты во всю полосу)
  { src: '1T9A3980.jpg', name: 'wide-flatlay',  role: 'широкая раскладка: врач и инструменты сверху', wide: true },
  { src: '1T9A3724.jpg', name: 'wide-child',    role: 'широкий: врач присела к ребёнку',             wide: true },
  { src: '1T9A3807.jpg', name: 'wide-exam',     role: 'широкий: осмотр ребёнка',                     wide: true },

  // ── портреты
  { src: '1T9A3592.jpg', name: 'portrait-folder', role: 'портрет крупно, папка «Кабинет оториноларинголога»' },
  { src: '1T9A3534.jpg', name: 'portrait-seated', role: 'портрет сидя, шоколадный пиджак' },
  { src: '1T9A3687.jpg', name: 'portrait-full',   role: 'в полный рост, светлый костюм' },
  { src: '1T9A4161.jpg', name: 'portrait-laugh',  role: 'смеётся, в кабинете' },
  { src: '1T9A3973.jpg', name: 'portrait-lamp',   role: 'поправляет налобный осветитель' },
  { src: '1T9A3946.jpg', name: 'portrait-tools',  role: 'с инструментом в руках' },

  // ── с ребёнком
  { src: '1T9A3863.jpg', name: 'child-exam',   role: 'осмотр, обе улыбаются' },
  { src: '1T9A3900.jpg', name: 'child-hug',    role: 'врач обнимает ребёнка' },
  { src: '1T9A3701.jpg', name: 'child-toy',    role: 'ребёнок с игрушкой' },
  { src: '1T9A3859.jpg', name: 'child-table',  role: 'за столом с инструментами' },
  { src: '1T9A3803.jpg', name: 'child-lamp',   role: 'осмотр с налобником' },

  // ── предметное
  { src: '1T9A3776.jpg', name: 'tool-hand',    role: 'рука с инструментом' },
  { src: '1T9A4067.jpg', name: 'tools-flat',   role: 'инструменты раскладкой' },
  { src: '1T9A4064.jpg', name: 'tool-otoscope',role: 'отоскоп' },
  { src: '1T9A3694.jpg', name: 'portrait-alt', role: 'запасной портрет' },
];

const WIDTHS = [640, 1024, 1600, 2000];

mkdirSync(resolve(OUT), { recursive: true });

let made = 0;
for (const item of MAP) {
  const src = resolve(SRC, item.src);
  if (!existsSync(src)) { console.log('  пропуск, нет файла:', item.src); continue; }

  const meta = await sharp(src).metadata();
  const maxW = meta.width;

  for (const w of WIDTHS) {
    if (w > maxW) continue;
    const base = `${OUT}/${item.name}-${w}`;
    await sharp(src).rotate().resize(w, null, { withoutEnlargement: true })
      .webp({ quality: 78 }).toFile(resolve(`${base}.webp`));
    made++;
  }
  // Один JPG-запасной вариант на случай древнего браузера.
  await sharp(src).rotate().resize(1024, null, { withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true }).toFile(resolve(`${OUT}/${item.name}-1024.jpg`));
  made++;

  console.log(`  ${item.name.padEnd(18)} ${meta.width}x${meta.height}  ${item.wide ? '[широкий]' : ''} ${item.role}`);
}

console.log(`\nготово: ${made} файлов в ${OUT}/`);
