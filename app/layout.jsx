import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import Providers from '@/components/Providers';
import PageTransition from '@/components/PageTransition';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import YandexMetrika from '@/components/YandexMetrika';
import Breadcrumbs from '@/components/Breadcrumbs';
import Cart from '@/components/Cart';
import MobileBottomNav from '@/components/MobileBottomNav';
import MobileCartFAB from '@/components/MobileCartFAB';
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

const jsonLdWebSite = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'TulpanOmsk55',
  url: 'https://tulpanomsk55.ru',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://tulpanomsk55.ru/?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'TulpanOmsk55',
  url: 'https://tulpanomsk55.ru',
  logo: 'https://tulpanomsk55.ru/og-image.svg',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+7-908-107-41-45',
    contactType: 'customer service',
    areaServed: 'RU',
    availableLanguage: 'Russian',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
      </head>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col`}>
        <YandexMetrika />
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <Header />
            <Breadcrumbs />
            <Cart />
            <main className="flex-1 pb-16 md:pb-0">
              <PageTransition>{children}</PageTransition>
            </main>
            <MobileCartFAB />
            <MobileBottomNav />
            <Footer />
            <Toaster position="top-right" />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
