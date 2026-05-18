import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import Providers from '@/components/Providers';
import PageTransition from '@/components/PageTransition';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Breadcrumbs from '@/components/Breadcrumbs';
import Cart from '@/components/Cart';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata = {
  metadataBase: new URL('https://tulpanomsk55.ru'),
  title: {
    default: 'TulpanOmsk55 — Купить тюльпаны в Омске с доставкой',
    template: '%s | TulpanOmsk55',
  },
  description: 'Купить свежие тюльпаны в Омске с доставкой за 2 часа. Букеты и штучные тюльпаны от 130 ₽. Оптовые поставки, оформление мероприятий.',
  keywords: 'купить тюльпаны Омск, доставка тюльпанов, букеты тюльпанов, свежие цветы Омск, тюльпаны оптом',
  authors: [{ name: 'TulpanOmsk55' }],
  creator: 'TulpanOmsk55',
  publisher: 'TulpanOmsk55',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://tulpanomsk55.ru',
    siteName: 'TulpanOmsk55',
    title: 'TulpanOmsk55 — Купить тюльпаны в Омске с доставкой',
    description: 'Свежие тюльпаны с доставкой за 2 часа по Омску. Букеты и штучные тюльпаны от 130 ₽.',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'TulpanOmsk55 — Свежие тюльпаны с доставкой в Омске',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TulpanOmsk55 — Купить тюльпаны в Омске с доставкой',
    description: 'Свежие тюльпаны с доставкой за 2 часа по Омску. Букеты и штучные тюльпаны от 130 ₽.',
    images: ['/og-image.svg'],
  },
  alternates: {
    canonical: 'https://tulpanomsk55.ru',
  },
  verification: {
    google: 'verification_token',
    yandex: 'verification_token',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <Header />
            <Breadcrumbs />
            <Cart />
            <main className="flex-1">
              <PageTransition>{children}</PageTransition>
            </main>
            <Footer />
            <Toaster position="top-right" />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
