import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Separate client for the admin portal. Uses a distinct localStorage key so
// admin and customer sessions are independent — logging into the admin portal
// does not log you into the storefront, and vice versa.
export const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'osil-admin-auth',
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database types
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          image: string | null;
          icon: string | null;
          product_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          image?: string | null;
          icon?: string | null;
          product_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          image?: string | null;
          icon?: string | null;
          product_count?: number;
          created_at?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo: string | null;
          category: string | null;
          category_slug: string | null;
          product_count: number;
          website: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo?: string | null;
          category?: string | null;
          category_slug?: string | null;
          product_count?: number;
          website?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          logo?: string | null;
          category?: string | null;
          category_slug?: string | null;
          product_count?: number;
          website?: string | null;
          created_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sku: string;
          brand: string;
          brand_slug: string;
          category: string;
          category_slug: string;
          description: string | null;
          short_description: string | null;
          images: string[];
          specifications: Record<string, string>;
          price: number | null;
          availability: 'in-stock' | 'low-stock' | 'out-of-stock' | 'pre-order';
          is_featured: boolean;
          is_new: boolean;
          is_best_seller: boolean;
          related_products: string[];
          tags: string[];
          datasheet_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          sku: string;
          brand: string;
          brand_slug: string;
          category: string;
          category_slug: string;
          description?: string | null;
          short_description?: string | null;
          images?: string[];
          specifications?: Record<string, string>;
          price?: number | null;
          availability?: 'in-stock' | 'low-stock' | 'out-of-stock' | 'pre-order';
          is_featured?: boolean;
          is_new?: boolean;
          is_best_seller?: boolean;
          related_products?: string[];
          tags?: string[];
          datasheet_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          sku?: string;
          brand?: string;
          brand_slug?: string;
          category?: string;
          category_slug?: string;
          description?: string | null;
          short_description?: string | null;
          images?: string[];
          specifications?: Record<string, string>;
          price?: number | null;
          availability?: 'in-stock' | 'low-stock' | 'out-of-stock' | 'pre-order';
          is_featured?: boolean;
          is_new?: boolean;
          is_best_seller?: boolean;
          related_products?: string[];
          tags?: string[];
          datasheet_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          category: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          answer: string;
          category?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          answer?: string;
          category?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
        };
      };
      quote_requests: {
        Row: {
          id: string;
          reference: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          company: string | null;
          position: string | null;
          address: string | null;
          city: string | null;
          country: string;
          message: string | null;
          status: string;
          total_items: number;
          notes: string | null;
          submitted_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reference?: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          company?: string | null;
          position?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string;
          message?: string | null;
          status?: string;
          total_items?: number;
          notes?: string | null;
          submitted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reference?: string;
          customer_name?: string;
          customer_email?: string;
          customer_phone?: string;
          company?: string | null;
          position?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string;
          message?: string | null;
          status?: string;
          total_items?: number;
          notes?: string | null;
          submitted_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      quote_items: {
        Row: {
          id: string;
          quote_request_id: string;
          product_id: string | null;
          product_name: string;
          product_sku: string | null;
          quantity: number;
          unit_price: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          quote_request_id: string;
          product_id?: string | null;
          product_name: string;
          product_sku?: string | null;
          quantity?: number;
          unit_price?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          quote_request_id?: string;
          product_id?: string | null;
          product_name?: string;
          product_sku?: string | null;
          quantity?: number;
          unit_price?: number | null;
          notes?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
