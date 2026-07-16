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
    .select('*, product_inventory(*)')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProductsByIds(ids: string[]) {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_inventory(*)')
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
  source?: string;
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

// Orders API
export async function createOrder(order: {
  customer_name: string;
  company_name?: string;
  email: string;
  phone: string;
  county?: string;
  delivery_address?: string;
  notes?: string;
  order_status?: string;
  source?: string;
  items: Array<{
    product_id?: string;
    product_name: string;
    product_sku?: string;
    quantity: number;
    unit_price?: number | null;
    subtotal?: number | null;
  }>;
}) {
  const { items, ...orderData } = order;

  const { data: createdOrder, error: orderError } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (orderError) throw orderError;

  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(items.map(item => ({ ...item, order_id: createdOrder.id })));
    if (itemsError) throw itemsError;
  }

  return createdOrder;
}

export async function getOrders(options?: { status?: string; limit?: number }) {
  let query = supabase
    .from('orders')
    .select('*, order_items(*)');

  if (options?.status) {
    query = query.eq('order_status', options.status);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(orderId: string, status: string, fromStatus?: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ order_status: status })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  if (fromStatus) {
    await supabase.from('order_history').insert({
      order_id: orderId,
      event_type: 'status_change',
      from_status: fromStatus,
      to_status: status,
    });
  }
  return data;
}

// Admin — Category CRUD

export async function adminGetCategoryById(id: string) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function adminCreateCategory(data: Record<string, unknown>) {
  const { data: created, error } = await supabase
    .from('categories')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function adminUpdateCategory(id: string, data: Record<string, unknown>) {
  const { data: updated, error } = await supabase
    .from('categories')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return updated;
}

export async function adminDeleteCategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// Admin — Brand CRUD

export async function adminGetBrandById(id: string) {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function adminCreateBrand(data: Record<string, unknown>) {
  const { data: created, error } = await supabase
    .from('brands')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function adminUpdateBrand(id: string, data: Record<string, unknown>) {
  const { data: updated, error } = await supabase
    .from('brands')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return updated;
}

export async function adminDeleteBrand(id: string) {
  const { error } = await supabase.from('brands').delete().eq('id', id);
  if (error) throw error;
}

// Admin — Product CRUD

export async function adminGetProductById(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_inventory(*)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function adminCreateProduct(data: Record<string, unknown>) {
  const { data: created, error } = await supabase
    .from('products')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function adminUpdateProduct(id: string, data: Record<string, unknown>) {
  const { data: updated, error } = await supabase
    .from('products')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return updated;
}

export async function adminDeleteProduct(id: string) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
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

// ─── Banners API ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBanner(raw: any) {
  return {
    id: raw.id,
    title: raw.title,
    subtitle: raw.subtitle,
    badgeText: raw.badge_text,
    ctaPrimaryText: raw.cta_primary_text,
    ctaPrimaryLink: raw.cta_primary_link,
    ctaSecondaryText: raw.cta_secondary_text,
    ctaSecondaryLink: raw.cta_secondary_link,
    imageUrl: raw.image_url,
    isActive: raw.is_active,
    sortOrder: raw.sort_order,
    bannerType: raw.banner_type as 'hero' | 'promo',
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export async function getActiveBanners(type?: 'hero' | 'promo') {
  let query = supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (type) query = query.eq('banner_type', type);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapBanner);
}

export async function adminGetBanners() {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .order('banner_type')
    .order('sort_order');
  if (error) throw error;
  return (data ?? []).map(mapBanner);
}

export async function adminGetBannerById(id: string) {
  const { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapBanner(data) : null;
}

export async function adminCreateBanner(payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('banners')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return mapBanner(data);
}

export async function adminUpdateBanner(id: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('banners')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapBanner(data);
}

export async function adminDeleteBanner(id: string) {
  const { error } = await supabase.from('banners').delete().eq('id', id);
  if (error) throw error;
}

export async function adminToggleBannerActive(id: string, isActive: boolean) {
  const { data, error } = await supabase
    .from('banners')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return mapBanner(data);
}
