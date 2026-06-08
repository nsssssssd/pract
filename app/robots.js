export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/login',
          '/register',
          '/profile',
          '/wishlist',
          '/api/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/admin',
          '/login',
          '/register',
          '/profile',
          '/wishlist',
          '/api/',
        ],
      },
      {
        userAgent: 'Yandex',
        allow: '/',
        disallow: [
          '/admin',
          '/login',
          '/register',
          '/profile',
          '/wishlist',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://tulpanomsk55.ru/sitemap.xml',
    host: 'https://tulpanomsk55.ru',
  };
}
