// Собирает Word-документ с вопросами для врача.
// Источник вопросов — данные сайта и открытые пункты брифа.
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
} from 'docx';
import { writeFileSync } from 'node:fs';

const GOLD = '9C7B4E';
const INK = '221D18';
const SOFT = '6E6358';
const CREAM = 'F4EFE7';

const W = 9360;            // ширина текстового блока A4 при полях 1"
const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

const t = (text, o = {}) => new TextRun({ text, font: 'Calibri', ...o });

const p = (text, o = {}) =>
  new Paragraph({
    spacing: { after: o.after ?? 120, before: o.before ?? 0, line: 276 },
    alignment: o.align,
    children: [t(text, { size: o.size ?? 22, bold: o.bold, italics: o.italics, color: o.color ?? INK })],
  });

const kicker = (text) =>
  new Paragraph({
    spacing: { before: 360, after: 80 },
    keepNext: true,
    children: [t(text.toUpperCase(), { size: 16, bold: true, color: GOLD, characterSpacing: 60 })],
  });

const h1 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 0, after: 160 },
    children: [t(text, { size: 34, bold: true, color: INK })],
  });

const h2 = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 320, after: 140 },
    keepNext: true,
    children: [t(text, { size: 26, bold: true, color: INK })],
  });

const rule = () =>
  new Paragraph({
    spacing: { before: 60, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D9D2C6' } },
    children: [t('')],
  });

/** Рамка для ответа: врач пишет прямо внутрь. */
const answerBox = (hint, lines = 3) => {
  const inner = [
    new Paragraph({
      spacing: { after: 40 },
      children: [t(hint, { size: 16, italics: true, color: SOFT })],
    }),
  ];
  for (let i = 0; i < lines; i++) {
    inner.push(new Paragraph({ spacing: { after: 0, line: 300 }, children: [t('')] }));
  }
  return new Table({
    width: { size: W, type: WidthType.DXA },
    columnWidths: [W],
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: W, type: WidthType.DXA },
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            shading: { type: ShadingType.CLEAR, fill: 'FBF8F3', color: 'auto' },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'D9D2C6' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'D9D2C6' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'D9D2C6' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'D9D2C6' },
            },
            children: inner,
          }),
        ],
      }),
    ],
  });
};

/** Вопрос с вариантами выбора. */
const choice = (options) =>
  new Paragraph({
    spacing: { after: 120 },
    children: [t(options.map((o) => `☐  ${o}`).join('        '), { size: 22, color: INK })],
  });

const question = (n, text, hint, lines = 3) => [
  new Paragraph({
    spacing: { before: 280, after: 100 },
    keepNext: true,
    children: [
      t(`${n}.  `, { size: 22, bold: true, color: GOLD }),
      t(text, { size: 22, bold: true, color: INK }),
    ],
  }),
  answerBox(hint, lines),
];

const note = (text) =>
  new Paragraph({
    spacing: { before: 60, after: 160 },
    children: [t(text, { size: 18, italics: true, color: SOFT })],
  });

const bullet = (text) =>
  new Paragraph({
    spacing: { after: 60 },
    indent: { left: 360, hanging: 200 },
    children: [t('— ', { size: 22, color: GOLD }), t(text, { size: 22, color: INK })],
  });

// ── темы статей: галочка + строка
const topicRow = (topic) =>
  new Paragraph({
    spacing: { after: 80 },
    indent: { left: 200 },
    children: [t('☐   ', { size: 22, color: GOLD }), t(topic, { size: 22, color: INK })],
  });

const children = [];

// ═══ ШАПКА ═══
children.push(
  new Paragraph({
    spacing: { after: 60 },
    children: [t('LOR.ROZA  ·  САЙТ', { size: 16, bold: true, color: GOLD, characterSpacing: 60 })],
  }),
  h1('Что осталось заполнить'),
  p(
    'Розалия Галинуровна, здравствуйте! Сайт почти собран — ссылка ниже, посмотрите. ' +
    'Осталось несколько мест, где нужен именно ваш ответ: я не могу написать за вас медицинский текст и не хочу ничего придумывать.',
    { color: SOFT },
  ),
  p(
    'Отвечать можно как удобно: вписать прямо в этот файл, ответить текстом в WhatsApp с номером вопроса или наговорить голосовыми. ' +
    'Если на что-то ответа нет или вопрос кажется лишним — так и напишите, уберём этот блок с сайта.',
    { color: SOFT },
  ),
  new Paragraph({
    spacing: { before: 200, after: 40 },
    children: [t('ЧЕРНОВИК САЙТА', { size: 16, bold: true, color: GOLD, characterSpacing: 60 })],
  }),
  new Paragraph({
    spacing: { after: 60 },
    children: [t('kirgenevazukhra.github.io/lor-roza', { size: 24, bold: true, color: INK })],
  }),
  note('Открывайте с телефона — почти все пациенты будут смотреть именно так. Это черновик: в поиске он не появится.'),
  note('Всего 15–20 минут. Самое важное — первый раздел: без него четыре вопроса на сайте стоят пустыми.'),
  rule(),
);

// ═══ 1. FAQ ═══
children.push(
  kicker('Раздел 1 · самое важное'),
  h2('Ответы на частые вопросы пациентов'),
  p(
    'Эти вопросы вы назвали сами. На три из семи ответы уже есть — они на сайте. Остались четыре.',
    { color: SOFT },
  ),

  ...question(
    1,
    'Нужно ли как-то подготовиться к приёму?',
    'Что взять с собой: выписки, снимки, анализы, список препаратов? Нужно ли что-то не делать перед приёмом — например, не капать капли?',
    4,
  ),

  ...question(
    2,
    'Как проходит онлайн-консультация и когда она не подходит?',
    'В каком формате — видеозвонок, WhatsApp, переписка? Сколько длится? В каких случаях вы скажете «надо прийти очно»?',
    4,
  ),

  ...question(
    3,
    'Можно ли прийти с ребёнком, если у него температура, сильный насморк или болит ухо?',
    'Родители часто боятся, что их развернут. Как есть на самом деле?',
    4,
  ),

  ...question(
    4,
    'Можно ли записаться, если лечение уже назначил другой врач?',
    'Это считается первичным приёмом? Что взять с собой — назначения, выписку?',
    4,
  ),
);

// ═══ 2. РЕШЕНИЯ ═══
children.push(
  kicker('Раздел 2'),
  h2('Что показывать на сайте'),
  p('Здесь достаточно отметить галочкой или написать одно слово.', { color: SOFT }),

  new Paragraph({
    spacing: { before: 280, after: 80 },
    children: [t('5.  ', { size: 22, bold: true, color: GOLD }), t('Операции', { size: 22, bold: true })],
  }),
  p(
    'Сейчас на сайте в составе консультации есть только «оценка необходимости хирургического лечения». ' +
    'Отдельного раздела про операции нет. Делать его?',
    { color: SOFT, size: 20 },
  ),
  choice(['Не нужно, оставить как есть', 'Нужен раздел про операции']),
  answerBox('Если нужен — какие именно вмешательства вы проводите и где?', 2),

  new Paragraph({
    spacing: { before: 280, after: 80 },
    children: [t('6.  ', { size: 22, bold: true, color: GOLD }), t('Выезд на дом', { size: 22, bold: true })],
  }),
  p(
    'В темах для статей выезд упоминался, но в прайсе его нет. Есть такая услуга?',
    { color: SOFT, size: 20 },
  ),
  choice(['Нет такой услуги', 'Есть']),
  answerBox('Если есть — сколько стоит и по какому району выезжаете?', 2),

  new Paragraph({
    spacing: { before: 280, after: 80 },
    children: [t('7.  ', { size: 22, bold: true, color: GOLD }), t('Полный прайс манипуляций', { size: 22, bold: true })],
  }),
  p(
    'На сайте сейчас пять позиций: первичный приём 14 000 ₸, онлайн 12 000 ₸, повторный 10 000 ₸, ' +
    'промывание носа 6 000 ₸, удаление серной пробки 3 000 ₸. В вашем ответе было «и т. д.» — ' +
    'значит, что-то не вошло.',
    { color: SOFT, size: 20 },
  ),
  answerBox('Перечислите остальные манипуляции с ценами. Или напишите «больше ничего», и оставим пять.', 5),

  new Paragraph({
    spacing: { before: 280, after: 80 },
    children: [t('8.  ', { size: 22, bold: true, color: GOLD }), t('Название клиники и лицензия', { size: 22, bold: true })],
  }),
  p(
    'Вы работаете от клиники. Сейчас на сайте указан только адрес, без названия — так вы и просили. ' +
    'Подтвердите, что это верно. И отдельно про лицензию: в анкете отметка была неясной.',
    { color: SOFT, size: 20 },
  ),
  choice(['Название клиники не указывать', 'Указать название']),
  choice(['Лицензию не показывать', 'Показать номер лицензии']),
  answerBox('Если показывать — номер лицензии.', 2),
);

// ═══ 3. МЕДИЦИНСКАЯ СВЕРКА ═══
children.push(
  kicker('Раздел 3 · важно для безопасности'),
  h2('Три места, которые нужно перепроверить'),
  p(
    'Когда я разбирал ваши темы для статей, нашлись три места, где формулировки спорят друг с другом ' +
    'или могут быть поняты неправильно. Это тексты про экстренные состояния — читать их будут в панике, ' +
    'поэтому здесь нужна ваша точная формулировка.',
    { color: SOFT },
  ),

  ...question(
    9,
    'Тепло при боли в ухе: когда можно, когда нельзя?',
    'В одной теме было «сухое тепло» при боли в ухе с температурой, в другой — «не греть» при заложенности после воды. Как правильно объяснить родителю разницу?',
    4,
  ),

  ...question(
    10,
    'Отёк гортани: что делать до приезда скорой?',
    'В черновике первой помощью значились антигистаминные. Если у человека назначен адреналин-автоинжектор — это другой алгоритм. Напишите, пожалуйста, вашу формулировку.',
    4,
  ),

  ...question(
    11,
    'Гной на миндалинах: как описать осложнения?',
    'В черновике рядом стояла ангина Людвига, но это флегмона дна полости рта, а не прямое осложнение миндалин. Как сформулировать точно?',
    3,
  ),
);

// ═══ 4. СТАТЬИ ═══
children.push(
  kicker('Раздел 4'),
  h2('Статьи: с чего начнём'),
  p(
    'На сайте есть раздел «Полезные материалы» — пока там только список тем, которые вы назвали. ' +
    'Писать все двенадцать сразу не нужно. Отметьте 2–3, с которых хотите начать, ' +
    'и по ним наговорите текст голосовыми — я соберу в статью, а вы потом вычитаете.',
    { color: SOFT },
  ),

  new Paragraph({
    spacing: { before: 240, after: 100 },
    children: [t('12.  ', { size: 22, bold: true, color: GOLD }), t('Отметьте, с чего начать', { size: 22, bold: true })],
  }),

  new Paragraph({ spacing: { before: 160, after: 80 }, children: [t('Как проходит приём', { size: 20, bold: true, color: GOLD })] }),
  topicRow('Как проходит осмотр ЛОР-эндоскопом у детей'),
  topicRow('Ребёнок часто болеет — что норма, а что повод для беспокойства'),

  new Paragraph({ spacing: { before: 200, after: 80 }, children: [t('Нос и дыхание', { size: 20, bold: true, color: GOLD })] }),
  topicRow('Сосудосуживающие капли: почему не дольше пяти дней'),
  topicRow('Правила промывания носа, или как не «намыть» отит'),
  topicRow('Устройства для промывания носа: какие бывают'),

  new Paragraph({ spacing: { before: 200, after: 80 }, children: [t('Экстренная помощь', { size: 20, bold: true, color: GOLD })] }),
  topicRow('Носовое кровотечение'),
  topicRow('Острая боль в ухе с температурой'),
  topicRow('Внезапная потеря слуха'),
  topicRow('Инородное тело в ухе, носу или глотке'),
  topicRow('Отёк гортани'),
  topicRow('Шумное дыхание у ребёнка'),
  topicRow('Заложенность уха после воды или полёта'),

  answerBox('Хотите добавить тему, которой здесь нет? Напишите её.', 3),
);

// ═══ 5. ОСТАЛЬНОЕ ═══
children.push(
  kicker('Раздел 5 · можно ответить позже'),
  h2('Остальное'),

  ...question(
    13,
    'Казахская версия: кто вычитает текст?',
    'Сайт будет на двух языках. Медицинский текст на казахском должен проверить носитель — машинному переводу доверять нельзя. Есть у вас такой человек?',
    3,
  ),

  ...question(
    14,
    'Дипломы и сертификаты',
    'Блока с дипломами на сайте пока нет — сканов не было. Если пришлёте фото или сканы, добавлю: для пациентов это заметный аргумент.',
    2,
  ),

  ...question(
    15,
    'Что-то не нравится на сайте?',
    'Посмотрите по ссылке с телефона. Что смущает, что хочется поменять, чего не хватает? Пишите прямо, это полезнее вежливости.',
    5,
  ),
);

children.push(
  rule(),
  p('Спасибо! Как ответите — соберу всё на сайт и пришлю обновлённую ссылку.', { color: SOFT, italics: true }),
);

const doc = new Document({
  creator: 'Lor.roza',
  title: 'Вопросы по сайту',
  description: 'Что осталось заполнить для сайта ЛОР-врача',
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 22, color: INK } },
    },
  },
  sections: [
    {
      properties: {
        page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } },
      },
      children,
    },
  ],
});

const buf = await Packer.toBuffer(doc);
writeFileSync('Вопросы по сайту.docx', buf);
console.log('готово: Вопросы по сайту.docx');
