import type { Product, Category, Brand } from '../types';

type RawProduct = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  brand_slug: string;
  category: string;
  category_slug: string;
  description: string;
  short_description: string;
  images: string[];
  specifications: Record<string, string>;
  price: number | null;
  availability: string;
  is_featured: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  related_products: string[];
  tags: string[];
  datasheet_url?: string;
};

type RawCategory = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  product_count: number;
};

type RawBrand = {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  category: string;
  category_slug: string;
  product_count: number;
  website?: string;
};

const RELATED_CATEGORIES: Record<string, string[]> = {
  laptops: ['desktops', 'tablets', 'accessories'],
  desktops: ['laptops', 'monitors', 'accessories'],
  workstations: ['desktops', 'servers', 'storage'],
  servers: ['networking', 'storage', 'workstations'],
  phones: ['tablets', 'accessories', 'networking'],
  tablets: ['phones', 'laptops', 'accessories'],
  printers: ['accessories', 'desktops', 'networking'],
  networking: ['servers', 'security', 'accessories'],
  storage: ['servers', 'workstations', 'networking'],
  projectors: ['conferencing', 'accessories', 'desktops'],
  conferencing: ['projectors', 'networking', 'accessories'],
  accessories: ['laptops', 'desktops', 'phones'],
  software: ['servers', 'networking', 'security'],
  security: ['networking', 'servers', 'accessories'],
};

export function mapProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    sku: raw.sku,
    brand: raw.brand,
    brandSlug: raw.brand_slug,
    category: raw.category,
    categorySlug: raw.category_slug,
    description: raw.description,
    shortDescription: raw.short_description,
    images: raw.images ?? [],
    specifications: raw.specifications ?? {},
    price: raw.price,
    availability: raw.availability as Product['availability'],
    isFeatured: raw.is_featured,
    isNew: raw.is_new,
    isBestSeller: raw.is_best_seller,
    relatedProducts: raw.related_products ?? [],
    tags: raw.tags ?? [],
    datasheetUrl: raw.datasheet_url,
  };
}

export function mapCategory(raw: RawCategory): Category {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    image: raw.image,
    icon: raw.icon,
    productCount: raw.product_count,
    relatedCategories: RELATED_CATEGORIES[raw.slug] ?? [],
  };
}

export function mapBrand(raw: RawBrand): Brand {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    logo: raw.logo,
    category: raw.category,
    categorySlug: raw.category_slug,
    productCount: raw.product_count,
    website: raw.website,
  };
}
