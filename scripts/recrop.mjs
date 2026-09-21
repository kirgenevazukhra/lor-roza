// Находит, откуда был вырезан отредактированный кадр, и повторяет тот же
// вырез на оригинале в полном разрешении — чтобы вернуть резкость.
import sharp from 'sharp';

const ORIGINAL = 'images/1T9A3946.jpg';
const EDITED = 'public/images/portrait-tools-2000.jpg';
const NAME = 'portrait-tools';
const WORK = 2000;          // ширина, из которой резали
const SCALE = 10;           // грубый поиск на уменьшенных копиях

const grey = async (input, opts) => {
  const { data, info } = await sharp(input).resize(opts).greyscale().raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
};

const om = await sharp(ORIGINAL).metadata();
const em = await sharp(EDITED).metadata();
const workH = Math.round(WORK * om.height / om.width);

// уменьшенные копии для поиска
const hay = await grey(await sharp(ORIGINAL).resize(WORK).toBuffer(), { width: Math.round(WORK / SCALE) });
const nee = await grey(EDITED, { width: Math.round(em.width / SCALE) });

let best = { score: Infinity, x: 0, y: 0 };
for (let y = 0; y + nee.h <= hay.h; y++) {
  for (let x = 0; x + nee.w <= hay.w; x++) {
    let sum = 0;
    // считаем по разреженной решётке: быстрее и достаточно для сдвига
    for (let ny = 0; ny < nee.h; ny += 3) {
      const hRow = (y + ny) * hay.w + x;
      const nRow = ny * nee.w;
      for (let nx = 0; nx < nee.w; nx += 3) {
        const d = hay.data[hRow + nx] - nee.data[nRow + nx];
        sum += d * d;
      }
      if (sum > best.score * 1.6) break;   // отсекаем заведомо худшие
    }
    if (sum < best.score) best = { score: sum, x, y };
  }
}

const offX = best.x * SCALE;
const offY = best.y * SCALE;
const k = om.width / WORK;                 // 4480 / 2000
const box = {
  left: Math.max(0, Math.round(offX * k)),
  top: Math.max(0, Math.round(offY * k)),
  width: Math.min(om.width, Math.round(em.width * k)),
  height: Math.min(om.height, Math.round(em.height * k)),
};
if (box.left + box.width > om.width) box.left = om.width - box.width;
if (box.top + box.height > om.height) box.top = om.height - box.height;

console.log(`найденный сдвиг в системе 2000px: x=${offX}, y=${offY}`);
console.log(`вырез на оригинале: ${box.width}x${box.height} от (${box.left}, ${box.top})`);

const cropped = await sharp(ORIGINAL).extract(box).toBuffer();

// сравниваем найденный вырез с вашим файлом — насколько совпало
const a = await grey(cropped, { width: 200 });
const bb = await grey(EDITED, { width: 200 });
let diff = 0;
const n = Math.min(a.data.length, bb.data.length);
for (let i = 0; i < n; i++) diff += Math.abs(a.data[i] - bb.data[i]);
console.log(`среднее расхождение яркости: ${(diff / n).toFixed(1)} из 255`);

for (const w of [640, 1024, 1440, 1600, 2000]) {
  await sharp(cropped).resize(w, null, { kernel: 'lanczos3' })
    .webp({ quality: 90, effort: 6 }).toFile(`public/images/${NAME}-${w}.webp`);
}
await sharp(cropped).resize(1024, null, { kernel: 'lanczos3' })
  .jpeg({ quality: 90, mozjpeg: true }).toFile(`public/images/${NAME}-1024.jpg`);

console.log('пересобрано из оригинала: 640, 1024, 1440, 1600, 2000');
