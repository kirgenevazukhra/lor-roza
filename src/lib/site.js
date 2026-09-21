import contacts from '../data/contacts.json';
import prices from '../data/prices.json';
import services from '../data/services.json';
import faq from '../data/faq.json';
import reviews from '../data/reviews.json';
import guides from '../data/guides.json';

export { contacts, prices, services, faq, reviews, guides };

/** 14000 -> "14 000" (неразрывные пробелы, чтобы цена не переносилась) */
export const money = (n) =>
  String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');

export const priced = prices.items.map((i) => ({
  ...i,
  amount: money(i.price),
  currency: prices.currency,
}));

export const byGroup = (g) => priced.filter((i) => i.group === g);

/** Только подтверждённые врачом ответы идут в разметку как ответы. */
export const faqAnswered = faq.items.filter((i) => i.a);
export const faqPending = faq.items.filter((i) => !i.a);

export const hero = {
  title: 'ЛОР-врач для детей и взрослых в Астане',
  subtitle:
    'Доказательный подход к диагностике и лечению заболеваний уха, горла и носа.',
  line: 'Без ненужных назначений. С понятным объяснением диагноза и плана лечения.',
};

/** Строка врача «Без ненужных назначений. С понятным объяснением…» —
 *  первая половина идёт заголовком раздела, вторая подзаголовком. */
export const heroLineHead = 'Без ненужных назначений';
export const heroLineTail = 'С понятным объяснением диагноза и плана лечения.';

export const about =
  'Латыпова Розалия Галинуровна — врач-оториноларинголог (ЛОР) для детей и взрослых. Практикую с 2020 года. Работаю по принципам доказательной медицины, уделяю особое внимание точной диагностике и обоснованному назначению лечения.';

/** Приём идёт сверху вниз по анатомии — порядок, а не украшение. */
export const regionOrder = ['ухо', 'нос', 'горло'];
export const complaintsByRegion = regionOrder.map((r) => ({
  region: r,
  items: services.complaints.filter((c) => c.region === r),
}));

export const years = new Date().getFullYear() - contacts.practiceSince;
