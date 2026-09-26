// Разметка schema.org (JSON-LD). Главная описывает клинику и врача,
// статьи ссылаются на них по @id — поисковик собирает это в один граф.
//
// Рейтинг (aggregateRating) намеренно не размечаем: отзывы живут в 2ГИС,
// а самостоятельная разметка отзывов о себе нарушает правила Google.
import { contacts, faq } from './site.js';

const isTodo = (v) => !v || String(v).startsWith('{{TODO');

export function ids(home) {
  return { clinic: `${home}#clinic`, doctor: `${home}#doctor`, site: `${home}#website` };
}

const address = () => ({
  '@type': 'PostalAddress',
  streetAddress: contacts.street,
  addressLocality: contacts.city,
  addressCountry: 'KZ',
});

const phone = () => contacts.phoneHref.replace('tel:', '');

export function homeGraph({ home, image, doctorImage }) {
  const id = ids(home);
  const hours = isTodo(contacts.hours) ? {} : { openingHours: contacts.hours };
  const clinic = {
    '@type': 'MedicalClinic',
    '@id': id.clinic,
    name: contacts.brand,
    url: home,
    image,
    telephone: phone(),
    address: address(),
    geo: { '@type': 'GeoCoordinates', latitude: contacts.geo.lat, longitude: contacts.geo.lon },
    medicalSpecialty: 'Otolaryngologic',
    sameAs: [contacts.instagram, contacts.dgis],
    ...hours,
  };
  const doctor = {
    '@type': 'Physician',
    '@id': id.doctor,
    name: contacts.doctorName,
    description: `${contacts.specialty}, приём детей и взрослых в Астане`,
    url: home,
    image: doctorImage,
    telephone: phone(),
    address: address(),
    medicalSpecialty: 'Otolaryngologic',
    parentOrganization: { '@id': id.clinic },
    sameAs: [contacts.instagram, contacts.dgis],
    ...hours,
  };
  const faqPage = {
    '@type': 'FAQPage',
    '@id': `${home}#faq`,
    mainEntity: faq.items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a.join('\n\n') },
    })),
  };
  return { '@context': 'https://schema.org', '@graph': [clinic, doctor, faqPage] };
}

const day = (d) => (d ? d.toISOString().slice(0, 10) : undefined);

export function articleGraph({ home, url, title, description, image, date, reviewed }) {
  const id = ids(home);
  const author = {
    '@type': 'Person',
    name: contacts.doctorName,
    jobTitle: contacts.specialty,
    url: home,
    sameAs: [contacts.instagram],
  };
  const page = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    '@id': url,
    url,
    name: title,
    headline: title,
    description,
    inLanguage: 'ru',
    image,
    author,
    publisher: { '@type': 'Organization', name: contacts.brand, url: home, sameAs: [contacts.instagram, contacts.dgis] },
    datePublished: day(date),
    // Дата проверки ставится только когда врач действительно проверил текст.
    ...(reviewed ? { lastReviewed: day(reviewed), reviewedBy: author } : {}),
    mainEntityOfPage: url,
  };
  return page;
}

// JSON внутри <script> не должен закрывать тег.
export const ld = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');
