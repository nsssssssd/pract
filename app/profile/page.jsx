import ProfileContent from './ProfileContent';
import { getCurrentUser } from '@/lib/auth';

export const metadata = {
  title: 'Личный кабинет',
  description: 'Ваш профиль на TulpanOmsk55. Управляйте данными, просматривайте историю заказов и настройки аккаунта.',
  keywords: 'личный кабинет, профиль, мои заказы',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: 'https://tulpanomsk55.ru/profile',
  },
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  return <ProfileContent initialUser={user} />;
}
