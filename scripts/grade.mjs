// Подгоняет снимки кабинета под свет фотосессии.
//
// sharp .gamma() работает только в паре с ресайзом — это опция качества,
// а не тоновая кривая. Поэтому кривая считается по пикселям вручную:
// out = 255 * (in/255)^(1/g). Она поднимает средние тона и не трогает
// белое (1 остаётся 1), так что окна и мониторы не выбиваются.
import sharp from 'sharp';

const OFFICE = 'public/images/office';
const TARGET = [198, 194, 183];   // тёплый воздушный свет фотосессии
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Применяет гамму и per-канальный коэффициент к сырым пикселям. */
function apply(data, channels, gamma, gains) {
  const lut = new Uint8Array(256);
  for (let v = 0; v < 256; v++) {
    lut[v] = Math.round(255 * Math.pow(v / 255, 1 / gamma));
  }
  for (let i = 0; i < data.length; i += channels) {
    for (let c = 0; c < 3; c++) {
      data[i + c] = clamp(Math.round(lut[data[i + c]] * gains[c]), 0, 255);
    }
  }
  return data;
}

const meanOf = (data, channels) => {
  const sum = [0, 0, 0];
  let n = 0;
  for (let i = 0; i < data.length; i += channels) {
    sum[0] += data[i]; sum[1] += data[i + 1]; sum[2] += data[i + 2];
    n++;
  }
  return sum.map((s) => s / n);
};

for (let i = 1; i <= 4; i++) {
  const src = `${OFFICE}/room-${i}-1024.jpg`;
  const { data, info } = await sharp(src).raw().toBuffer({ resolveWithObject: true });
  const before = meanOf(data, info.channels);

  // гамма под целевую яркость
  const lum = (before[0] + before[1] + before[2]) / 3 / 255;
  const want = (TARGET[0] + TARGET[1] + TARGET[2]) / 3 / 255;
  const gamma = clamp(Math.log(lum) / Math.log(want), 1.0, 4.0);

  // первый проход — только кривая, чтобы замерить остаточный баланс
  const probe = apply(Buffer.from(data), info.channels, gamma, [1, 1, 1]);
  const mid = meanOf(probe, info.channels);
  const gains = TARGET.map((t, c) => clamp(t / mid[c], 0.9, 1.15));

  const out = apply(data, info.channels, gamma, gains);
  const after = meanOf(out, info.channels);

  const base = sharp(out, { raw: { width: info.width, height: info.height, channels: info.channels } })
    .modulate({ saturation: 0.9 });

  for (const w of [640, 1024]) {
    await base.clone().resize(w, null, { withoutEnlargement: true })
      .webp({ quality: 82 }).toFile(`${OFFICE}/room-${i}-${w}.webp`);
  }
  await base.clone().resize(1024, null, { withoutEnlargement: true })
    .jpeg({ quality: 86, mozjpeg: true }).toFile(`${OFFICE}/room-${i}-1024-new.jpg`);

  console.log(
    `room-${i}: ${before.map(Math.round).join(',')} -> ${after.map(Math.round).join(',')}` +
    `  (гамма ${gamma.toFixed(2)}, каналы ${gains.map((g) => g.toFixed(2)).join('/')})`
  );
}

console.log('\nготово');
