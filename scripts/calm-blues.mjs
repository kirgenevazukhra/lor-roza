// Гасит кричащий сине-фиолетовый на аппаратуре, не трогая тёплые тона.
//
// Общее обесцвечивание убило бы и тёплый свет кабинета, поэтому правка
// идёт по оттенку: синий и фиолетовый теряют насыщенность и слегка
// уводятся к спокойному сине-серому, остальное остаётся как есть.
import sharp from 'sharp';

const OFFICE = 'public/images/office';

const HUE_LO = 185, HUE_HI = 305;   // диапазон «холодного» на аппаратуре
const FEATHER = 22;                 // мягкие края, чтобы не было резких границ
const KEEP = 0.34;                  // сколько насыщенности оставить в центре диапазона

function rgb2hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  return [h, max === 0 ? 0 : d / max, max];
}

function hsv2rgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

/** 1 в середине холодного диапазона, 0 за его пределами, плавно на краях. */
function coolness(h) {
  if (h <= HUE_LO - FEATHER || h >= HUE_HI + FEATHER) return 0;
  if (h >= HUE_LO && h <= HUE_HI) return 1;
  if (h < HUE_LO) return (h - (HUE_LO - FEATHER)) / FEATHER;
  return ((HUE_HI + FEATHER) - h) / FEATHER;
}

for (let i = 1; i <= 4; i++) {
  const src = `${OFFICE}/room-${i}-1024.jpg`;
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  let touched = 0;

  for (let p = 0; p < data.length; p += ch) {
    const [h, s, v] = rgb2hsv(data[p], data[p + 1], data[p + 2]);
    const k = coolness(h);
    if (k === 0 || s < 0.12) continue;
    const factor = 1 - k * (1 - KEEP);
    const [r, g, b] = hsv2rgb(h, s * factor, v);
    data[p] = Math.round(r); data[p + 1] = Math.round(g); data[p + 2] = Math.round(b);
    touched++;
  }

  const base = sharp(data, { raw: { width: info.width, height: info.height, channels: ch } });
  for (const w of [640, 1024]) {
    await base.clone().resize(w, null, { withoutEnlargement: true })
      .webp({ quality: 86 }).toFile(`${OFFICE}/room-${i}-${w}-c.webp`);
  }
  await base.clone().resize(1024, null, { withoutEnlargement: true })
    .jpeg({ quality: 90, mozjpeg: true }).toFile(`${OFFICE}/room-${i}-1024-c.jpg`);

  const pct = ((touched / (data.length / ch)) * 100).toFixed(1);
  console.log(`room-${i}: приглушено ${pct}% пикселей (сине-фиолетовый диапазон)`);
}

console.log('\nготово');
