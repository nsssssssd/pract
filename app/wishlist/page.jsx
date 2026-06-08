import WishlistContent from './WishlistContent';

export const metadata = {
  title: 'Избранное',
  description: 'Ваши избранные товары в TulpanOmsk55. Сохраняйте понравившиеся букеты и тюльпаны.',
  keywords: 'избранное, wishlist, понравившиеся товары',
  openGraph: {
    title: 'Избранное | TulpanOmsk55',
    description: 'Ваши избранные товары в TulpanOmsk55. Сохраняйте понравившиеся букеты и тюльпаны.',
    url: 'https://tulpanomsk55.ru/wishlist',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Избранное | TulpanOmsk55',
    description: 'Ваши избранные товары в TulpanOmsk55. Сохраняйте понравившиеся букеты и тюльпаны.',
    images: ['https://tulpanomsk55.ru/og-image.svg'],
  },
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: 'https://tulpanomsk55.ru/wishlist',
  },
};

export default function WishlistPage() {
  return <WishlistContent />;
}
