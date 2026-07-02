import { useEffect } from 'react';
import type { SeoMeta, ProductSeoData, BreadcrumbItem } from '../types';

interface SEOProps {
  meta: SeoMeta;
}

const BASE_URL = 'https://osil.co.ke';

export function SEO({ meta }: SEOProps) {
  useEffect(() => {
    document.title = meta.title;

    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      const selector = `[${attr}="${name}"]`;
      const existing = document.querySelector(`meta${selector}`);
      if (existing) {
        existing.setAttribute('content', content);
      } else {
        const el = document.createElement('meta');
        el.setAttribute(attr, name);
        el.content = content;
        document.head.appendChild(el);
      }
    };

    setMeta('description', meta.description);

    if (meta.keywords && meta.keywords.length > 0) {
      setMeta('keywords', meta.keywords.join(', '));
    }

    setMeta('og:title', meta.title, 'property');
    setMeta('og:description', meta.description, 'property');
    setMeta('og:type', meta.ogType || 'website', 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', meta.title);
    setMeta('twitter:description', meta.description);

    if (meta.ogImage) {
      setMeta('og:image', meta.ogImage, 'property');
      setMeta('twitter:image', meta.ogImage);
    }

    if (meta.canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = meta.canonicalUrl;
      setMeta('og:url', meta.canonicalUrl, 'property');
    }

    if (meta.noindex) {
      setMeta('robots', 'noindex, nofollow');
    }

    if (meta.structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(meta.structuredData);
    }

    return () => {
      if (meta.noindex) {
        const robots = document.querySelector('meta[name="robots"]');
        if (robots) robots.remove();
      }
    };
  }, [meta]);

  return null;
}

export function generateProductSchema(data: ProductSeoData): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: data.name,
    description: data.description,
    brand: {
      '@type': 'Brand',
      name: data.brand,
    },
    sku: data.sku,
    category: data.category,
    image: data.image,
    offers: {
      '@type': 'Offer',
      availability: `https://schema.org/${data.availability}`,
      priceCurrency: data.currency || 'KES',
      ...(data.price ? { price: data.price } : {}),
      seller: {
        '@type': 'Organization',
        name: 'OSIL Ltd',
      },
    },
  };
}

export function generateOrganizationSchema(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'OSIL Ltd',
    description: 'Leading ICT solutions provider in Kenya and East Africa, offering laptops, desktops, phones, servers, networking equipment, and professional IT services.',
    url: BASE_URL,
    logo: `${BASE_URL}/Osil_Logo.jpg`,
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+254-700-000-000',
      contactType: 'sales',
      availableLanguage: ['English', 'Swahili'],
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '1st Floor, Jethalal Chambers, Tubman Rd, Suite 103',
      addressLocality: 'Nairobi',
      addressCountry: 'KE',
    },
    sameAs: [
      'https://www.linkedin.com/company/osilltd',
      'https://twitter.com/osilltd',
      'https://www.facebook.com/osilltd',
    ],
  };
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateProductPageTitle(productName: string, brand: string, category: string): string {
  return `${productName} | ${brand} ${category} | OSIL Ltd Kenya`;
}

export function generateProductDescription(name: string, brand: string, category: string, features?: string[]): string {
  const baseDesc = `Shop the ${name} at OSIL Ltd Kenya. Authentic ${brand} ${category.toLowerCase()} with warranty, fast delivery across Kenya.`;
  if (features && features.length > 0) {
    const featuresText = features.slice(0, 3).join(', ');
    return `${baseDesc} Features: ${featuresText}. Best prices and expert support.`;
  }
  return baseDesc;
}

export function getCanonicalUrl(path: string): string {
  return `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

export const AVAILABILITY_SCHEMA_MAP: Record<string, 'InStock' | 'OutOfStock' | 'PreOrder' | 'LimitedAvailability'> = {
  'in-stock': 'InStock',
  'out-of-stock': 'OutOfStock',
  'pre-order': 'PreOrder',
  'low-stock': 'LimitedAvailability',
};
