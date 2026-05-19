import HomePage from '@/components/pages/HomePage';
import { FAQS } from '@/lib/faq';

export const metadata = {
  title: 'Купить тюльпаны в Омске — Свежие тюльпаны с доставкой',
  description: 'Купить свежие тюльпаны в Омске с доставкой за 2 часа. Букеты и штучные тюльпаны от 130 ₽. 500+ довольных клиентов.',
  keywords: 'купить тюльпаны Омск, доставка тюльпанов Омск, букеты тюльпанов, свежие цветы Омск',
  openGraph: {
    title: 'Купить тюльпаны в Омске — Свежие тюльпаны с доставкой',
    description: 'Свежие тюльпаны с доставкой за 2 часа по Омску. Букеты и штучные тюльпаны от 130 ₽.',
    type: 'website',
    url: 'https://tulpanomsk55.ru',
  },
  alternates: {
    canonical: 'https://tulpanomsk55.ru',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.answer,
    },
  })),
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'TulpanOmsk55',
  description: 'Магазин свежих тюльпанов с доставкой в Омске',
  url: 'https://tulpanomsk55.ru',
  logo: 'https://tulpanomsk55.ru/og-image.svg',
  image: 'https://tulpanomsk55.ru/og-image.svg',
  telephone: '+7-908-107-41-45',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Омск',
    addressCountry: 'RU',
  },
  priceRange: '$$',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '08:00',
      closes: '22:00',
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HomePage />
    </>
  );
}
