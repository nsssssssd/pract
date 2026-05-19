import RegisterContent from './RegisterContent';

export const metadata = {
  title: 'Регистрация',
  description: 'Создайте аккаунт на TulpanOmsk55 за минуту. Отслеживайте заказы и получайте персональные предложения.',
  keywords: 'регистрация, создать аккаунт, TulpanOmsk55',
  openGraph: {
    title: 'Регистрация | TulpanOmsk55',
    description: 'Создайте аккаунт за минуту. Отслеживайте заказы и получайте персональные предложения.',
  },
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: 'https://tulpanomsk55.ru/register',
  },
};

export default function RegisterPage() {
  return <RegisterContent />;
}
