// Аналитика и атрибуция записи.
//
// 1. Яндекс Метрика (с вебвизором) и GA4. Пока вместо ID стоят заглушки,
//    счётчики не грузятся вовсе: ни запросов, ни ошибок.
// 2. События нажатий на связь: whatsapp_click, phone_click, 2gis_click,
//    instagram_click. Секция берётся из ближайшего data-section.
// 3. Источник: utm_source из адреса запоминается на сессию и дописывается
//    в текст сообщения WhatsApp, чтобы администратор видел, откуда пришёл
//    пациент. Без метки — «сайт» (этот же текст зашит в ссылки и без JS).
//
// Отладка: добавьте к адресу ?debug=analytics — события пойдут в консоль.

const YM_ID = '{{TODO: ID Яндекс Метрики}}';
const GA4_ID = '{{TODO: ID GA4}}';

const WA_TEXT = 'Здравствуйте! Хочу записаться на приём к ЛОР-врачу';
const SOURCE_KEY = 'lor_utm_source';
const DEFAULT_SOURCE = 'сайт';

const params = new URLSearchParams(location.search);
const debug = params.get('debug') === 'analytics';

const hasYm = /^\d+$/.test(YM_ID);
const hasGa = /^G-[A-Z0-9]+$/.test(GA4_ID);

// ── счётчики ────────────────────────────────────────
if (hasYm) {
  (function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    k = e.createElement(t); a = e.getElementsByTagName(t)[0];
    k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
  window.ym(Number(YM_ID), 'init', {
    clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true,
  });
}

if (hasGa) {
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA4_ID);
}

// ── события ─────────────────────────────────────────
function eventFor(href) {
  if (href.includes('wa.me/')) return 'whatsapp_click';
  if (href.startsWith('tel:')) return 'phone_click';
  if (href.includes('2gis.')) return '2gis_click';
  if (href.includes('instagram.com')) return 'instagram_click';
  return null;
}

function send(name, section) {
  if (debug) console.info(`[analytics] ${name} section=${section}`);
  try {
    if (hasYm && window.ym) window.ym(Number(YM_ID), 'reachGoal', name, { section });
    // GA4 не принимает имена событий, начинающиеся с цифры.
    if (hasGa && window.gtag) window.gtag('event', name.replace(/^2gis/, 'dgis'), { section });
  } catch { /* аналитика не должна ломать переход по ссылке */ }
}

document.addEventListener('click', (e) => {
  const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
  // Подложка карты ведёт на 2ГИС только без JS; с JS она открывает карту.
  if (!a || a.hasAttribute('data-map-open')) return;
  const name = eventFor(a.getAttribute('href') || '');
  if (!name) return;
  const section = a.closest('[data-section]')?.getAttribute('data-section') || 'other';
  send(name, section);
}, { capture: true });

// ── источник записи ─────────────────────────────────
function clean(v) {
  return (v || '').toLowerCase().replace(/[^\p{L}\p{N}_.-]+/gu, '').slice(0, 40);
}

let source = clean(params.get('utm_source'));
try {
  if (source) sessionStorage.setItem(SOURCE_KEY, source);
  else source = clean(sessionStorage.getItem(SOURCE_KEY));
} catch { /* хранилище недоступно — источник живёт до конца страницы */ }
if (!source) source = DEFAULT_SOURCE;

const text = encodeURIComponent(`${WA_TEXT} (источник: ${source})`);
document.querySelectorAll('a[href*="wa.me/"]').forEach((a) => {
  const base = a.getAttribute('href').split('?')[0];
  a.setAttribute('href', `${base}?text=${text}`);
});
