import { notFound } from 'next/navigation';
import { readData } from '@/lib/db';
import ProductPageClient from './ProductPageClient';

export async function generateStaticParams() {
  const data = readData();
  return data.products.map((p) => ({ id: String(p.id) }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const data = readData();
  const product = data.products.find((p) => p.id === parseInt(id));

  if (!product) {
    return {
      title: 'Товар не найден',
      robots: { index: false },
    };
  }

  const title = `${product.name} — купить в Омске от ${product.price} ₽ | TulpanOmsk55`;
  const description = `${product.description}. Доставка за 2 часа по Омску. Закажите ${product.name.toLowerCase()} с доставкой.`;
  const image = product.image ? `https://tulpanomsk55.ru${product.image}` : 'https://tulpanomsk55.ru/og-image.svg';

  return {
    title,
    description,
    keywords: `${product.name}, купить ${product.name.toLowerCase()} Омск, тюльпаны Омск, доставка цветов Омск`,
    openGraph: {
      title,
      description,
      images: [image],
      url: `https://tulpanomsk55.ru/products/${product.id}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: `https://tulpanomsk55.ru/products/${product.id}`,
    },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const data = readData();
  const product = data.products.find((p) => p.id === parseInt(id));

  if (!product) {
    notFound();
  }

  const baseUrl = 'https://tulpanomsk55.ru';
  const productUrl = `${baseUrl}/products/${product.id}`;
  const image = product.image ? `${baseUrl}${product.image}` : `${baseUrl}/og-image.svg`;

  const jsonLdProduct = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [image],
    description: product.description,
    brand: {
      '@type': 'Brand',
      name: 'TulpanOmsk55',
    },
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'RUB',
      price: product.price,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: product.available !== false
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'TulpanOmsk55',
      },
    },
    sku: `TULP-${product.id}`,
  };

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Главная',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Каталог',
        item: `${baseUrl}/#catalog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: productUrl,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProduct) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <ProductPageClient product={product} />
    </>
  );
}
