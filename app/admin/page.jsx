import AdminContent from './AdminContent';

export const metadata = {
  title: 'Панель администратора',
  description: 'Админ-панель TulpanOmsk55. Управление товарами, заказами, пользователями и статистикой.',
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: 'https://tulpanomsk55.ru/admin',
  },
};

export default function AdminPage() {
  return <AdminContent />;
}
