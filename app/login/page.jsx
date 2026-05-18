import LoginContent from './LoginContent';

export const metadata = {
  title: 'Вход в аккаунт',
  description: 'Войдите в свой аккаунт TulpanOmsk55, чтобы отслеживать заказы и управлять профилем.',
  keywords: 'вход, логин, аккаунт TulpanOmsk55',
  openGraph: {
    title: 'Вход в аккаунт | TulpanOmsk55',
    description: 'Войдите в свой аккаунт, чтобы отслеживать заказы и управлять профилем.',
  },
  alternates: {
    canonical: 'https://tulpanomsk55.ru/login',
  },
};

export default function LoginPage() {
  return <LoginContent />;
}
