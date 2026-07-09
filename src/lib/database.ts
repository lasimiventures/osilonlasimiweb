import { supabase } from './supabase';

// Connection test function
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase.from('categories').select('count', { count: 'exact', head: true });
    if (error) {
      return { success: false, message: `Database error: ${error.message}` };
    }
    return { success: true, message: 'Connected to Supabase successfully' };
  } catch (err) {
    return { success: false, message: `Connection failed: ${err instanceof Error ? err.message : 'Unknown error'}` };
  }
}

// Categories API
export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

// Brands API
export async function getBrands() {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
}

export async function getBrandBySlug(slug: string) {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Products API
export async function getProducts(options?: {
  categorySlug?: string;
  brandSlug?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  availability?: string;
  limit?: number;
}) {
  let query = supabase.from('products').select('*');

  if (options?.categorySlug) {
    query = query.eq('category_slug', options.categorySlug);
  }
  if (options?.brandSlug) {
    query = query.eq('brand_slug', options.brandSlug);
  }
  if (options?.isFeatured !== undefined) {
    query = query.eq('is_featured', options.isFeatured);
  }
  if (options?.isNew !== undefined) {
    query = query.eq('is_new', options.isNew);
  }
  if (options?.isBestSeller !== undefined) {
    query = query.eq('is_best_seller', options.isBestSeller);
  }
  if (options?.availability) {
    query = query.eq('availability', options.availability);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProductsByIds(ids: string[]) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .in('id', ids);
  if (error) throw error;
  return data;
}

export async function searchProducts(query: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .or(`name.ilike.%${query}%,brand.ilike.%${query}%,category.ilike.%${query}%`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// FAQs API
export async function getFaqs(category?: string) {
  let query = supabase
    .from('faqs')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Quote Requests API
export async function createQuoteRequest(quote: {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company?: string;
  position?: string;
  address?: string;
  city?: string;
  country?: string;
  message?: string;
  items: Array<{
    product_id?: string;
    product_name: string;
    product_sku?: string;
    quantity: number;
    notes?: string;
  }>;
}) {
  const { items, ...requestData } = quote;

  // Create the quote request first
  const { data: quoteRequest, error: quoteError } = await supabase
    .from('quote_requests')
    .insert({
      ...requestData,
      total_items: items.length,
    })
    .select()
    .single();

  if (quoteError) throw quoteError;

  // Create the quote items
  const { error: itemsError } = await supabase
    .from('quote_items')
    .insert(
      items.map((item) => ({
        ...item,
        quote_request_id: quoteRequest.id,
      }))
    );

  if (itemsError) throw itemsError;

  return quoteRequest;
}

// Bulk pricing request (simplified - stores as a quote request with notes)
export async function createBulkPricingRequest(request: {
  product_name: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  quantity: string;
  message?: string;
}) {
  const { data, error } = await supabase
    .from('quote_requests')
    .insert({
      customer_name: request.name,
      customer_email: request.email,
      customer_phone: request.phone,
      company: request.company,
      message: `Bulk Pricing Request for: ${request.product_name}\nQuantity: ${request.quantity}\n${request.message || ''}`,
      total_items: 1,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
