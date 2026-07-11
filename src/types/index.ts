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
  datasheetUrl?: string;
  // B2C commerce fields
  buyNowEnabled: boolean;
  callForPrice: boolean;
  displayPrice: number | null;
  priceVisible: boolean;
  minimumOrderQuantity: number;
  maximumOrderQuantity: number | null;
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
  allowBuyNow: boolean;
  allowQuote: boolean;
  allowBulkQuote: boolean;
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
  allowBuyNow: boolean;
  allowQuote: boolean;
  allowBulkQuote: boolean;
}

export interface CartItem {
  productId: string;
  productName: string;
  productSku: string;
  productSlug: string;
  brand: string;
  image: string;
  quantity: number;
  unitPrice: number | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  companyName: string | null;
  email: string;
  phone: string;
  county: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  orderStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'awaiting_customer_confirmation'
  | 'processing'
  | 'ready_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  productName: string;
  productSku: string | null;
  quantity: number;
  unitPrice: number | null;
  subtotal: number | null;
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
  ogType?: 'website' | 'product' | 'article' | 'profile';
  canonicalUrl?: string;
  noindex?: boolean;
  structuredData?: object;
}

export interface ProductSeoData {
  name: string;
  description: string;
  brand: string;
  sku: string;
  category: string;
  image: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder' | 'LimitedAvailability';
  price?: number;
  currency?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: 'products' | 'services' | 'quotations' | 'delivery' | 'warranty';
}

export interface Promotion {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  ctaLabel: string;
  ctaPath: string;
  image: string;
  highlight?: string;
}
