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

// Admin — Supplier CRUD

export async function adminGetSupplierById(id: string) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*, category:supplier_categories(id,name,slug), payment_terms:supplier_payment_terms(id,name,code), supplier_contacts(id,name,position,email,phone,is_primary)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function adminCreateSupplier(data: Record<string, unknown>) {
  const { data: created, error } = await supabase
    .from('suppliers')
    .insert(data)
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function adminUpdateSupplier(id: string, data: Record<string, unknown>) {
  const { data: updated, error } = await supabase
    .from('suppliers')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return updated;
}

export async function adminDeleteSupplier(id: string) {
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw error;
}

export async function adminTogglePreferredSupplier(id: string, isPreferred: boolean) {
  const payload: Record<string, unknown> = { is_preferred: isPreferred };
  if (isPreferred) payload.preferred_since = new Date().toISOString();
  else payload.preferred_since = null;
  const { data, error } = await supabase
    .from('suppliers')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminGetSupplierCategories() {
  const { data, error } = await supabase
    .from('supplier_categories')
    .select('id,name,slug,description')
    .order('name');
  if (error) throw error;
  return data;
}

export async function adminGetSupplierPaymentTerms() {
  const { data, error } = await supabase
    .from('supplier_payment_terms')
    .select('id,name,code,description,default_days,is_active')
    .order('default_days');
  if (error) throw error;
  return data;
}

// Admin — Purchase Order CRUD

export async function adminGetPurchaseOrders() {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('id,po_number,supplier_id,supplier:suppliers(id,name),warehouse:warehouses(id,name,code),status,order_date,expected_delivery_date,currency,total,created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function adminGetPurchaseOrderById(id: string) {
  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, supplier:suppliers(id,name,slug), warehouse:warehouses(id,name,code), payment_terms:supplier_payment_terms(id,name,code), purchase_order_items(*, product:products(id,name,sku))')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function adminCreatePurchaseOrder(header: Record<string, unknown>, items: Array<Record<string, unknown>>) {
  const { data: created, error } = await supabase
    .from('purchase_orders')
    .insert(header)
    .select()
    .single();
  if (error) throw error;
  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(items.map(it => ({ ...it, po_id: created.id })));
    if (itemsError) throw itemsError;
  }
  return created;
}

export async function adminUpdatePurchaseOrder(id: string, header: Record<string, unknown>, items: Array<Record<string, unknown>>) {
  const { data: updated, error } = await supabase
    .from('purchase_orders')
    .update(header)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  // Replace items only when a fresh list is provided
  if (items.length > 0) {
    await supabase.from('purchase_order_items').delete().eq('po_id', id);
    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(items.map(it => ({ ...it, po_id: id })));
    if (itemsError) throw itemsError;
  }
  return updated;
}

export async function adminUpdatePurchaseOrderStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function adminDeletePurchaseOrder(id: string) {
  const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
  if (error) throw error;
}

// Admin — Goods Received Notes

export async function adminGetGRNsForPO(poId: string) {
  const { data, error } = await supabase
    .from('goods_received_notes')
    .select('id,grn_number,po_id,warehouse:warehouses(id,name,code),received_by,received_date,status,notes, goods_received_note_items(id,quantity_received,quantity_rejected,rejection_reason,product_id,po_item_id)')
    .eq('po_id', poId)
    .order('received_date', { ascending: false });
  if (error) throw error;
  return data;
}

export async function adminCreateGRN(grn: Record<string, unknown>, items: Array<Record<string, unknown>>) {
  const { data: created, error } = await supabase
    .from('goods_received_notes')
    .insert(grn)
    .select()
    .single();
  if (error) throw error;
  if (items.length > 0) {
    const { error: itemsError } = await supabase
      .from('goods_received_note_items')
      .insert(items.map(it => ({ ...it, grn_id: created.id })));
    if (itemsError) throw itemsError;
  }
  return created;
}

// Admin — Supplier Deliveries

export async function adminGetSupplierDeliveries() {
  const { data, error } = await supabase
    .from('supplier_deliveries')
    .select('id,delivery_number,supplier:suppliers(name),po:purchase_orders(po_number),carrier,tracking_number,shipped_date,expected_delivery_date,actual_delivery_date,status,warehouse:warehouses(name),created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function adminCreateSupplierDelivery(delivery: Record<string, unknown>) {
  const { data: created, error } = await supabase
    .from('supplier_deliveries')
    .insert(delivery)
    .select()
    .single();
  if (error) throw error;
  return created;
}

export async function adminUpdateDeliveryStatus(id: string, status: string, actualDeliveryDate?: string) {
  const payload: Record<string, unknown> = { status };
  if (actualDeliveryDate) payload.actual_delivery_date = actualDeliveryDate;
  const { data, error } = await supabase
    .from('supplier_deliveries')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Admin — Back Orders

export async function adminGetBackOrders() {
  const { data, error } = await supabase
    .from('back_orders')
    .select('id,po:purchase_orders(po_number),supplier:suppliers(name),product:products(name,sku),quantity_backordered,reason,status,expected_date,fulfilled_date,created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function adminUpdateBackOrderStatus(id: string, status: string) {
  const payload: Record<string, unknown> = { status };
  if (status === 'fulfilled') payload.fulfilled_date = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('back_orders')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Admin — Procurement status summary

export async function adminGetProcurementStatus() {
  const { data, error } = await supabase.rpc('procurement_status_summary');
  if (error) throw error;
  return data;
}

// Admin — Stock Movements

export async function adminGetStockMovements(filters?: {
  productId?: string;
  warehouseId?: string;
  movementType?: string;
  limit?: number;
}) {
  let query = supabase
    .from('stock_movements')
    .select('id,movement_number,product_id,product:products(name,sku),warehouse_id,warehouse:warehouses(name,code),movement_type,quantity_change,quantity_before,quantity_after,reference_type,reference_number,reason,notes,performed_by,created_at')
    .order('created_at', { ascending: false });
  if (filters?.productId) query = query.eq('product_id', filters.productId);
  if (filters?.warehouseId) query = query.eq('warehouse_id', filters.warehouseId);
  if (filters?.movementType && filters.movementType !== 'all') query = query.eq('movement_type', filters.movementType);
  if (filters?.limit) query = query.limit(filters.limit);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function adminRecordStockMovement(params: {
  product_id: string;
  warehouse_id: string;
  movement_type: string;
  quantity_change: number;
  reference_type?: string;
  reference_id?: string;
  reference_number?: string;
  reason?: string;
  notes?: string;
  performed_by?: string;
}) {
  const { data, error } = await supabase.rpc('record_stock_movement', { params: params as unknown as Record<string, unknown> });
  if (error) throw error;
  return data;
}

export async function adminGetProductMovementSummary() {
  const { data, error } = await supabase
    .from('product_movement_summary')
    .select('*')
    .order('last_movement_at', { ascending: false, nullsFirst: false })
    .limit(200);
  if (error) throw error;
  return data;
}

// Admin — Cost & Pricing

export async function adminGetPricingOverview() {
  const { data, error } = await supabase
    .from('product_pricing_view')
    .select('id,name,sku,brand,category,cost_price,selling_price,distributor_price,dealer_price,promotional_price,promo_start_date,promo_end_date,promo_active,effective_price,margin_amount,margin_pct,markup_pct,on_hand,availability,pricing_currency')
    .order('name');
  if (error) throw error;
  return data;
}

export async function adminGetCostHistory(productId: string) {
  const { data, error } = await supabase
    .from('product_cost_history')
    .select('id,old_cost,new_cost,change_source,reference_type,reference_number,changed_by,notes,created_at')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Admin — Inventory Alerts

export interface InventoryAlert {
  id: string;
  alert_type: 'low_stock'|'out_of_stock'|'expiring_warranty'|'incoming_shipment'|'price_change'|'supplier_delay';
  severity: 'info'|'warning'|'critical';
  title: string;
  message: string;
  entity_type: string;
  entity_id: string | null;
  entity_ref: string | null;
  metric_value: number | null;
  threshold_value: number | null;
  status: 'active'|'acknowledged'|'resolved';
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function adminRefreshAlerts(): Promise<number> {
  const { data, error } = await supabase.rpc('refresh_inventory_alerts');
  if (error) throw error;
  return data as number;
}

export async function adminGetAlerts(status?: 'active'|'acknowledged'|'resolved') {
  let q = supabase
    .from('inventory_alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as InventoryAlert[];
}

export async function adminAcknowledgeAlert(id: string, by: string) {
  const { error } = await supabase
    .from('inventory_alerts')
    .update({ status: 'acknowledged', acknowledged_by: by, acknowledged_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function adminResolveAlert(id: string, by: string) {
  const { error } = await supabase
    .from('inventory_alerts')
    .update({ status: 'resolved', resolved_by: by, resolved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function adminGetActiveAlertCount(): Promise<number> {
  const { count, error } = await supabase
    .from('inventory_alerts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  if (error) throw error;
  return count ?? 0;
}
