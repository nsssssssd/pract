import CareContent from './CareContent';

export const metadata = {
  title: 'Уход за тюльпанами',
  description: 'Как правильно ухаживать за тюльпанами, чтобы они простояли 7–10 дней. Советы по воде, температуре, вазе и подкормке.',
  keywords: 'уход за тюльпанами, как сохранить тюльпаны, тюльпаны в вазе, свежесть цветов',
  openGraph: {
    title: 'Уход за тюльпанами | TulpanOmsk55',
    description: 'Как правильно ухаживать за тюльпанами, чтобы они простояли 7–10 дней.',
    url: 'https://tulpanomsk55.ru/care',
    type: 'article',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Уход за тюльпанами | TulpanOmsk55',
    description: 'Как правильно ухаживать за тюльпанами, чтобы они простояли 7–10 дней.',
    images: ['https://tulpanomsk55.ru/og-image.svg'],
  },
  alternates: {
    canonical: 'https://tulpanomsk55.ru/care',
  },
};

const jsonLdHowTo = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Как ухаживать за тюльпанами в вазе',
  description: 'Пошаговая инструкция по уходу за срезанными тюльпанами, чтобы они простояли 7–10 дней.',
  image: 'https://tulpanomsk55.ru/og-image.svg',
  totalTime: 'PT10M',
  step: [
    {
      '@type': 'HowToStep',
      position: 1,
      name: 'Подготовьте вазу',
      text: 'Вымойте вазу тёплой водой с содой. Тюльпаны не любят бактерии — чистая ваза продлит жизнь цветам.',
    },
    {
      '@type': 'HowToStep',
      position: 2,
      name: 'Налейте прохладную воду',
      text: 'Налейте воду комнатной температуры (18–20°C). Слишком холодная или горячая вода стрессирует цветы.',
    },
    {
      '@type': 'HowToStep',
      position: 3,
      name: 'Срежьте стебли под углом',
      text: 'Срежьте 1–2 см стебля под углом 45° острым ножом или секатором. Делайте это под проточной водой или сразу погружайте в вазу.',
    },
    {
      '@type': 'HowToStep',
      position: 4,
      name: 'Меняйте воду ежедневно',
      text: 'Меняйте воду каждый день и мойте вазу. При каждой смене воды слегка подрезайте стебли.',
    },
    {
      '@type': 'HowToStep',
      position: 5,
      name: 'Держите в прохладном месте',
      text: 'Поставьте вазу подальше от батарей, прямых солнечных лучей и фруктов (этилен ускоряет увядание).',
    },
    {
      '@type': 'HowToStep',
      position: 6,
      name: 'Добавьте подкормку',
      text: 'Используйте специальную подкормку для срезанных цветов или 1 чайную ложку сахара на литр воды.',
    },
  ],
};

export default function CarePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdHowTo) }}
      />
      <CareContent />
    </>
  );
}
