import { readData } from '@/lib/db';

const STATIC_DATE = new Date();

export default function sitemap() {
  const baseUrl = 'https://tulpanomsk55.ru';
  let data;
  try {
    data = readData();
  } catch {
    data = { products: [] };
  }

  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: STATIC_DATE,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/care`,
      lastModified: STATIC_DATE,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  const productRoutes = (data.products || []).map((product) => ({
    url: `${baseUrl}/products/${product.id}`,
    lastModified: STATIC_DATE,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticRoutes, ...productRoutes];
}
