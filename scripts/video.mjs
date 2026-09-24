// Готовит ролики к вебу и снимает обложки.
//
// Перекодировать не нужно: файлы уже H.264 High@3.1 + AAC, 720x1280,
// по 2–4 МБ — это ровно то, что играет во всех браузерах. Меняем
// только имена. Обложку снимаем кадром из самого ролика через браузер:
// ffmpeg в системе нет.
import http from 'node:http';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const SRC = 'incoming/video';
const OUT = 'public/video';
const POSTERS = 'public/video';

const MAP = [
  { from: 'Инструкция родителям.mp4',             to: 'instrukciya-roditelyam',   at: 0.15 },
  { from: 'Как промывать нос.mp4',                to: 'kak-promyvat-nos',         at: 0.10 },
  { from: 'Что происходит у меня на приемах.mp4', to: 'chto-proishodit-na-prieme', at: 0.12 },
];

mkdirSync(OUT, { recursive: true });

// 1. Копируем под понятными именами
for (const m of MAP) {
  copyFileSync(join(SRC, m.from), join(OUT, m.to + '.mp4'));
  const kb = Math.round(statSync(join(OUT, m.to + '.mp4')).size / 1024);
  console.log(`  ${m.to}.mp4  ${kb} КБ`);
}

// 2. Обложки: сервер + браузер. Плеер создаём на странице этого же
//    сервера — с about:blank загрузка медиа блокируется.
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    return res.end('<!doctype html><meta charset="utf-8"><title>кадр</title>');
  }
  const f = join(OUT, decodeURIComponent(req.url.slice(1)));
  let size;
  try { size = statSync(f).size; } catch { res.writeHead(404); return res.end(); }
  const buf = readFileSync(f);
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m[1] ? parseInt(m[1], 10) : 0;
    const end = m[2] ? parseInt(m[2], 10) : size - 1;
    res.writeHead(206, {
      'content-type': 'video/mp4',
      'content-range': `bytes ${start}-${end}/${size}`,
      'accept-ranges': 'bytes',
      'content-length': end - start + 1,
    });
    return res.end(buf.subarray(start, end + 1));
  }
  res.writeHead(200, { 'content-type': 'video/mp4', 'accept-ranges': 'bytes', 'content-length': size });
  res.end(buf);
});
await new Promise((r) => server.listen(4460, r));

const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const p = await b.newPage();
await p.goto('http://localhost:4460/', { waitUntil: 'domcontentloaded' });

for (const m of MAP) {
  const data = await p.evaluate(
    (name, at) =>
      new Promise((res) => {
        const v = document.createElement('video');
        v.preload = 'auto';
        v.muted = true;
        v.playsInline = true;
        document.body.appendChild(v);
        v.onerror = () => res({ err: 'код ' + (v.error || {}).code });
        v.onloadeddata = () => { v.currentTime = v.duration * at; };
        v.onseeked = () => {
          const c = document.createElement('canvas');
          c.width = v.videoWidth;
          c.height = v.videoHeight;
          c.getContext('2d').drawImage(v, 0, 0);
          res({ url: c.toDataURL('image/jpeg', 0.82), w: c.width, h: c.height });
        };
        setTimeout(() => res({ err: 'таймаут' }), 30000);
        v.src = name + '.mp4';
      }),
    m.to,
    m.at,
  );
  if (data.err) { console.log(`  обложка ${m.to}: ${data.err}`); continue; }
  writeFileSync(join(POSTERS, m.to + '-poster.jpg'), Buffer.from(data.url.split(',')[1], 'base64'));
  const kb = Math.round(statSync(join(POSTERS, m.to + '-poster.jpg')).size / 1024);
  console.log(`  обложка ${m.to}-poster.jpg  ${data.w}x${data.h}  ${kb} КБ`);
}

await b.close();
server.close();
console.log('\nготово');
