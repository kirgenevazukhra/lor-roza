// Приводит присланные ассеты в порядок: имена, форматы, вес.
// Иконки и разделитель — PNG с альфой, текстура и фото — WebP.
import sharp from 'sharp';
import { readdirSync, renameSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ICONS = 'public/images/icons';
const TEX = 'public/images/textures';
const OFFICE = 'public/images/office';

// ── 1. Двойные расширения: ear.png.png -> ear.png
for (const dir of [ICONS, TEX]) {
  for (const f of readdirSync(dir)) {
    const fixed = f.replace(/\.(png|jpg|jpeg)\.png$/i, '.$1');
    if (fixed !== f) {
      renameSync(join(dir, f), join(dir, fixed));
      console.log(`  имя: ${f} -> ${fixed}`);
    }
  }
}

// ── 2. Иконки: ужимаем до рабочего размера, альфу сохраняем
for (const f of readdirSync(ICONS).filter((f) => f.endsWith('.png'))) {
  const src = join(ICONS, f);
  const buf = await sharp(src).resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, palette: true }).toBuffer();
  await sharp(buf).toFile(src.replace('.png', '-256.png'));
  rmSync(src);
  renameSync(src.replace('.png', '-256.png'), src);
  console.log(`  иконка: ${f} -> 256x256`);
}

// ── 3. Текстура бумаги: PNG 2 МБ ни к чему, нужен лёгкий тайл
if (existsSync(join(TEX, 'paper.jpg'))) {
  await sharp(join(TEX, 'paper.jpg')).resize(512, 512).webp({ quality: 72 }).toFile(join(TEX, 'paper.webp'));
  rmSync(join(TEX, 'paper.jpg'));
  console.log('  текстура: paper.webp 512x512');
}

// ── 4. Разделитель: обрезаем пустые поля, оставляем саму линейку
if (existsSync(join(TEX, 'divider.png'))) {
  await sharp(join(TEX, 'divider.png')).trim({ threshold: 8 })
    .resize(1200, null, { fit: 'inside' })
    .png({ compressionLevel: 9 }).toFile(join(TEX, 'divider-trim.png'));
  rmSync(join(TEX, 'divider.png'));
  renameSync(join(TEX, 'divider-trim.png'), join(TEX, 'divider.png'));
  const m = await sharp(join(TEX, 'divider.png')).metadata();
  console.log(`  разделитель: ${m.width}x${m.height} после обрезки полей`);
}

// ── 5. Фото кабинета: срезаем нижнюю полосу с чужим водяным знаком
const shots = readdirSync(OFFICE).filter((f) => /^photo_/.test(f)).sort();
let n = 0;
for (const f of shots) {
  n++;
  const src = join(OFFICE, f);
  const m = await sharp(src).metadata();
  const cut = Math.round(m.height * 0.055); // знак 2ГИС сидит в правом нижнем углу
  const base = join(OFFICE, `room-${n}`);
  for (const w of [640, 1024]) {
    if (w > m.width) continue;
    await sharp(src)
      .extract({ left: 0, top: 0, width: m.width, height: m.height - cut })
      .resize(w, null, { withoutEnlargement: true })
      .webp({ quality: 80 }).toFile(`${base}-${w}.webp`);
  }
  await sharp(src)
    .extract({ left: 0, top: 0, width: m.width, height: m.height - cut })
    .resize(1024, null, { withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true }).toFile(`${base}-1024.jpg`);
  rmSync(src);
  console.log(`  кабинет: ${f} -> room-${n} (срезано ${cut}px снизу)`);
}

console.log('\nготово');
