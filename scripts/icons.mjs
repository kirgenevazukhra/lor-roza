// Уменьшенные копии иконок: исходники 256px, на странице они 44px
// (преимущества) и 30px (жалобы). Делаем 2x и 3x, исходники не трогаем.
import sharp from 'sharp';
import { readdirSync, statSync } from 'node:fs';

const DIR = 'public/images/icons';
const SIZES = { 44: ['evidence', 'explain', 'kids', 'nodrugs'], 30: ['ear', 'nose', 'throat'] };

for (const [css, names] of Object.entries(SIZES)) {
  for (const n of names) {
    for (const k of [2, 3]) {
      const px = css * k;
      const out = `${DIR}/${n}-${px}.png`;
      await sharp(`${DIR}/${n}.png`).resize(px, px).png({ compressionLevel: 9 }).toFile(out);
      console.log(out, Math.round(statSync(out).size / 1024) + ' КБ', '← было', Math.round(statSync(`${DIR}/${n}.png`).size / 1024) + ' КБ');
    }
  }
}
