export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/login', '/register', '/profile', '/wishlist'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin', '/api/', '/login', '/register', '/profile', '/wishlist'],
      },
      {
        userAgent: 'Yandex',
        allow: '/',
        disallow: ['/admin', '/api/', '/login', '/register', '/profile', '/wishlist'],
      },
    ],
    sitemap: [
      'https://tulpanomsk55.ru/sitemap.xml',
      'https://tulpanomsk55.ru/image-sitemap.xml',
    ],
    host: 'https://tulpanomsk55.ru',
  };
}
