import WishlistContent from './WishlistContent';

export const metadata = {
  title: 'Избранное',
  description: 'Ваши избранные товары в TulpanOmsk55. Сохраняйте понравившиеся букеты и тюльпаны.',
  keywords: 'избранное, wishlist, понравившиеся товары',
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
