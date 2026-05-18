import CareContent from './CareContent';

export const metadata = {
  title: 'Уход за тюльпанами',
  description: 'Как правильно ухаживать за тюльпанами, чтобы они простояли 7–10 дней. Советы по воде, температуре, вазе и подкормке.',
  keywords: 'уход за тюльпанами, как сохранить тюльпаны, тюльпаны в вазе, свежесть цветов',
  openGraph: {
    title: 'Уход за тюльпанами | TulpanOmsk55',
    description: 'Как правильно ухаживать за тюльпанами, чтобы они простояли 7–10 дней.',
  },
  alternates: {
    canonical: 'https://tulpanomsk55.ru/care',
  },
};

export default function CarePage() {
  return <CareContent />;
}
