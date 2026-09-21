// Принимает новые присланные файлы: имена, обрезка знака 2ГИС, веб-форматы.
// Ничего не удаляет — исходники остаются на месте.
import sharp from 'sharp';
import { readdirSync, renameSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OFFICE = 'public/images/office';
const TEX = 'public/images/textures';
const KEEP = 'images/office-src';   // куда складываем присланные оригиналы

mkdirSync(KEEP, { recursive: true });

// ── 1. Фон первого экрана: двойное расширение, в webp
const heroRaw = readdirSync(TEX).find((f) => /^hero-bg\./.test(f) && f !== 'hero-bg.webp');
if (heroRaw) {
  const m = await sharp(join(TEX, heroRaw)).metadata();
  await sharp(join(TEX, heroRaw))
    .resize(2000, null, { withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(join(TEX, 'hero-bg.webp'));
  renameSync(join(TEX, heroRaw), join(KEEP, heroRaw));
  console.log(`фон: ${heroRaw} ${m.width}x${m.height} -> hero-bg.webp`);
}

// ── 2. Кабинет: присланные кадры вместо прежних room-*
//    Порядок соответствует тому, что было: комбайн, стол, стойка, кресло.
const ORDER = ['room-4', 'room-2', 'room-1', 'room-3'];
const fresh = readdirSync(OFFICE).filter((f) => !/^room-/.test(f)).sort();

if (fresh.length === ORDER.length) {
  for (let i = 0; i < fresh.length; i++) {
    const src = join(OFFICE, fresh[i]);
    const name = ORDER[i];
    const m = await sharp(src).metadata();
    const cut = Math.round(m.height * 0.045);   // знак 2ГИС в правом нижнем углу

    const base = sharp(src).extract({ left: 0, top: 0, width: m.width, height: m.height - cut });
    for (const w of [640, 1024]) {
      if (w > m.width) continue;
      await base.clone().resize(w, null, { withoutEnlargement: true })
        .webp({ quality: 86 }).toFile(join(OFFICE, `${name}-${w}.webp`));
    }
    await base.clone().resize(1024, null, { withoutEnlargement: true })
      .jpeg({ quality: 88, mozjpeg: true }).toFile(join(OFFICE, `${name}-1024.jpg`));

    renameSync(src, join(KEEP, `${name}-original.png`));
    console.log(`кабинет: ${name} <- ${m.width}x${m.height}, срезано ${cut}px снизу`);
  }
} else {
  console.log(`кабинет: ожидалось ${ORDER.length} новых файлов, найдено ${fresh.length} — пропускаю`);
}

// ── 3. Сверка: не осталось ли ширины, на которую ссылается страница
for (const n of ORDER) {
  const missing = [640, 1024].filter((w) => !existsSync(join(OFFICE, `${n}-${w}.webp`)));
  if (missing.length) console.log(`  ВНИМАНИЕ: ${n} — нет ширин ${missing.join(', ')}`);
}

console.log('\nготово');
