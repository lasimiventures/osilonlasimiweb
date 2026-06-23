export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  brandSlug: string;
  category: string;
  categorySlug: string;
  description: string;
  shortDescription: string;
  images: string[];
  specifications: Record<string, string>;
  price: number | null;
  availability: 'in-stock' | 'low-stock' | 'out-of-stock' | 'pre-order';
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  relatedProducts: string[];
  tags: string[];
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  productCount: number;
  parentCategory?: string;
  relatedCategories: string[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  category: string;
  categorySlug: string;
  productCount: number;
  website?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatar: string;
  rating: number;
}

export interface Service {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  icon: string;
  features: string[];
  image: string;
}

export interface Solution {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  icon: string;
  features: string[];
  image: string;
  targetAudience: string[];
}

export interface QuoteItem {
  productId: string;
  quantity: number;
  product: Product;
  notes?: string;
}

export interface QuoteRequest {
  id: string;
  items: QuoteItem[];
  customerInfo: CustomerInfo;
  status: 'pending' | 'submitted' | 'processing' | 'completed';
  createdAt: string;
  notes?: string;
}

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  address: string;
  city: string;
  country: string;
  message: string;
}

export interface ClientLogo {
  id: string;
  name: string;
  logo: string;
  industry: string;
}

export interface Industry {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
  linkedin?: string;
  email?: string;
}

export interface CompanyStat {
  id: string;
  label: string;
  value: string;
  suffix?: string;
}

export interface NavItem {
  label: string;
  path: string;
  children?: NavItem[];
}

export interface SeoMeta {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: string;
}
