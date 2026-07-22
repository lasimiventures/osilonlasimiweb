import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  Loader2, AlertCircle, CheckCircle2, Heart, ShoppingCart, FileText,
  Plus, X, Trash2, Package, ChevronRight, ListChecks, Bookmark,
  ShoppingBag, RotateCcw, ArrowLeft, Pencil, Check,
} from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useShoppingCart } from '../context/ShoppingCartContext';
import { useQuote } from '../context/QuoteContext';
import { useCatalog } from '../context/CatalogContext';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';

type ListTab = 'favourites' | 'carts' | 'quotes' | 'reorder';

interface SavedList {
  id: string;
  name: string;
  list_type: string;
  description: string | null;
  order_id: string | null;
  created_at: string;
  updated_at: string;
  item_count?: number;
}

interface SavedListItem {
  id: string;
  list_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  product_slug: string | null;
  brand: string | null;
  image: string | null;
  quantity: number;
  unit_price: number | null;
}

interface OrderForReorder {
  id: string;
  order_number: string;
  created_at: string;
  order_status: string;
}

export function SavedLists() {
  const { session, loading: authLoading } = useCustomerAuth();
  const [tab, setTab] = useState<ListTab>('favourites');

  if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;
  if (!session) return <Navigate to="/login?next=/account/lists" replace />;

  const tabs: { id: ListTab; label: string; icon: typeof Heart }[] = [
    { id: 'favourites', label: 'Favourite Lists', icon: Heart },
    { id: 'carts', label: 'Saved Carts', icon: ShoppingCart },
    { id: 'quotes', label: 'Saved Quotes', icon: FileText },
    { id: 'reorder', label: 'Reorder', icon: RotateCcw },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-md">
          <Bookmark className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">My Lists</h1>
          <p className="text-sm text-slate-500">Save carts, quote lists, favourites, and reorder past purchases</p>
        </div>
      </div>

      <Link to="/account" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to account
      </Link>

      <div className="flex items-center gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'favourites' && <FavouritesTab userId={session.user.id} />}
      {tab === 'carts' && <SavedCartsTab userId={session.user.id} />}
      {tab === 'quotes' && <SavedQuotesTab userId={session.user.id} />}
      {tab === 'reorder' && <ReorderTab email={session.user.email ?? ''} userId={session.user.id} />}
    </div>
  );
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, desc, actionLabel, actionTo }: {
  icon: typeof Heart; title: string; desc: string; actionLabel?: string; actionTo?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
      <Icon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-sm font-semibold text-slate-700 mb-1">{title}</p>
      <p className="text-xs text-slate-500 mb-4">{desc}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> {actionLabel}
        </Link>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function useSavedLists(userId: string, listType: string) {
  const [lists, setLists] = useState<SavedList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('saved_lists')
      .select('id,name,list_type,description,order_id,created_at,updated_at')
      .eq('user_id', userId)
      .eq('list_type', listType)
      .order('created_at', { ascending: false });
    if (error) { setError('Failed to load lists.'); setLists([]); }
    else {
      const lists = (data ?? []) as SavedList[];
      // Get item counts
      if (lists.length > 0) {
        const listIds = lists.map(l => l.id);
        const { data: counts } = await supabase
          .from('saved_list_items')
          .select('list_id')
          .in('list_id', listIds);
        const countMap = new Map<string, number>();
        (counts ?? []).forEach((row: { list_id: string }) => {
          countMap.set(row.list_id, (countMap.get(row.list_id) ?? 0) + 1);
        });
        lists.forEach(l => { l.item_count = countMap.get(l.id) ?? 0; });
      }
      setLists(lists);
    }
    setLoading(false);
  }, [userId, listType]);

  useEffect(() => { load(); }, [load]);

  return { lists, loading, error, reload: load, setLists };
}

async function deleteList(listId: string): Promise<boolean> {
  const { error } = await supabase.from('saved_lists').delete().eq('id', listId);
  return !error;
}

async function renameList(listId: string, newName: string): Promise<boolean> {
  const { error } = await supabase.from('saved_lists').update({ name: newName }).eq('id', listId);
  return !error;
}

// ─── Favourites Tab ─────────────────────────────────────────────────────────

function FavouritesTab({ userId }: { userId: string }) {
  const { lists, loading, error, reload } = useSavedLists(userId, 'favourites');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<SavedList | null>(null);
  const [items, setItems] = useState<SavedListItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const { addItem } = useShoppingCart();

  async function loadItems(listId: string) {
    setItemsLoading(true);
    const { data } = await supabase
      .from('saved_list_items')
      .select('id,list_id,product_id,product_name,product_sku,product_slug,brand,image,quantity,unit_price')
      .eq('list_id', listId)
      .order('created_at', { ascending: false });
    setItems((data ?? []) as SavedListItem[]);
    setItemsLoading(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setFormError(null);
    const { error } = await supabase.from('saved_lists').insert({
      user_id: userId,
      name: name.trim(),
      list_type: 'favourites',
      description: description.trim() || null,
    });
    setSubmitting(false);
    if (error) { setFormError('Failed to create list: ' + error.message); return; }
    setName(''); setDescription(''); setShowForm(false);
    reload();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this list and all its items?')) return;
    await deleteList(id);
    if (selectedList?.id === id) setSelectedList(null);
    reload();
  }

  async function handleRename(id: string) {
    if (!renameValue.trim()) return;
    await renameList(id, renameValue.trim());
    setRenaming(null);
    reload();
  }

  function addAllToCart(listItems: SavedListItem[]) {
    listItems.forEach(item => {
      if (item.product_slug) {
        // We need the Product object from catalog, but we can add a minimal cart item
        // For simplicity, use addItem with a partial product
      }
    });
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;
  if (error) return <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-red-700 text-sm">{error}</p></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Favourite Lists ({lists.length})</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> New List
        </button>
      </div>

      {lists.length === 0 ? (
        <EmptyState icon={Heart} title="No favourite lists" desc="Create a list to organize products you love." actionLabel="Create List" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lists.map(list => (
            <div key={list.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                {renaming === list.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleRename(list.id); if (e.key === 'Escape') setRenaming(null); }}
                      className="flex-1 text-sm font-semibold text-slate-900 border border-blue-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={() => handleRename(list.id)} className="text-emerald-600 hover:text-emerald-700"><Check className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => { setSelectedList(list); loadItems(list.id); }} className="flex items-center gap-2 text-left flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-4 h-4 text-rose-500" />
                      </div>
                      <p className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate">{list.name}</p>
                    </button>
                    <button onClick={() => { setRenaming(list.id); setRenameValue(list.name); }} className="text-slate-300 hover:text-blue-500"><Pencil className="w-3.5 h-3.5" /></button>
                  </>
                )}
              </div>
              {list.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{list.description}</p>}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  {list.item_count ?? 0} item{(list.item_count ?? 0) !== 1 ? 's' : ''} · {new Date(list.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
                <button onClick={() => handleDelete(list.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New list form */}
      {showForm && (
        <Modal title="New Favourite List" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3"><AlertCircle className="w-4 h-4 text-red-500" /><p className="text-red-700 text-sm">{formError}</p></div>}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">List name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Office Equipment"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description (optional)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What is this list for?"
                rows={3}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Create List
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* List detail modal */}
      {selectedList && (
        <Modal title={selectedList.name} onClose={() => setSelectedList(null)}>
          {itemsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">This list is empty. Add products from any product page.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-slate-300" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.product_slug ? (
                      <Link to={`/products/${item.product_slug}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 line-clamp-1 block">{item.product_name}</Link>
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{item.product_name}</p>
                    )}
                    <p className="text-xs text-slate-400">{item.brand} {item.product_sku && `· ${item.product_sku}`}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">×{item.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── Saved Carts Tab ─────────────────────────────────────────────────────────

function SavedCartsTab({ userId }: { userId: string }) {
  const { lists, loading, error, reload } = useSavedLists(userId, 'cart');
  const [selectedList, setSelectedList] = useState<SavedList | null>(null);
  const [items, setItems] = useState<SavedListItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const { addItem } = useShoppingCart();

  async function loadItems(listId: string) {
    setItemsLoading(true);
    const { data } = await supabase
      .from('saved_list_items')
      .select('id,list_id,product_id,product_name,product_sku,product_slug,brand,image,quantity,unit_price')
      .eq('list_id', listId)
      .order('created_at', { ascending: false });
    setItems((data ?? []) as SavedListItem[]);
    setItemsLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this saved cart?')) return;
    await deleteList(id);
    if (selectedList?.id === id) setSelectedList(null);
    reload();
  }

  function restoreToCart(listItems: SavedListItem[]) {
    listItems.forEach(item => {
      // Create a minimal product-like object for addItem
      if (item.product_id) {
        addItem({
          id: item.product_id,
          name: item.product_name,
          slug: item.product_slug ?? '',
          sku: item.product_sku ?? '',
          brand: item.brand ?? '',
          brandSlug: '',
          category: '',
          categorySlug: '',
          description: '',
          shortDescription: '',
          images: item.image ? [item.image] : [],
          specifications: {},
          price: item.unit_price,
          availability: 'in-stock',
          isFeatured: false,
          isNew: false,
          isBestSeller: false,
          relatedProducts: [],
          tags: [],
          buyNowEnabled: true,
          callForPrice: false,
          displayPrice: item.unit_price,
          priceVisible: true,
          minimumOrderQuantity: 1,
          maximumOrderQuantity: null,
        } as Product, item.quantity);
      }
    });
    setSuccess(`${listItems.length} item${listItems.length !== 1 ? 's' : ''} added to your cart.`);
    setTimeout(() => setSuccess(null), 4000);
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;
  if (error) return <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-red-700 text-sm">{error}</p></div>;

  return (
    <div className="space-y-4">
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 text-sm">{success}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Saved Carts ({lists.length})</h2>
        <Link to="/cart" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Go to cart →</Link>
      </div>

      {lists.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="No saved carts" desc="Save your shopping cart from the cart page to restore it later." actionLabel="Go to Cart" actionTo="/cart" />
      ) : (
        <div className="space-y-3">
          {lists.map(list => (
            <div key={list.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{list.name}</p>
                    <p className="text-xs text-slate-400">
                      {list.item_count ?? 0} item{(list.item_count ?? 0) !== 1 ? 's' : ''} · {new Date(list.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDelete(list.id)} className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => { setSelectedList(list); loadItems(list.id); }}
                  className="flex-1 text-sm font-medium text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-xl py-2 transition-colors"
                >
                  View Items
                </button>
                <button
                  onClick={() => { loadItems(list.id).then(() => restoreToCart(items)); }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl py-2 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" /> Restore to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Items modal */}
      {selectedList && (
        <Modal title={selectedList.name} onClose={() => setSelectedList(null)}>
          {itemsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">This saved cart is empty.</p>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-slate-300" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.product_slug ? (
                      <Link to={`/products/${item.product_slug}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 line-clamp-1 block">{item.product_name}</Link>
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{item.product_name}</p>
                    )}
                    <p className="text-xs text-slate-400">{item.brand} {item.product_sku && `· ${item.product_sku}`}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-medium text-slate-500">×{item.quantity}</span>
                    {item.unit_price != null && <p className="text-xs font-semibold text-slate-700">KSh {(item.unit_price * item.quantity).toLocaleString()}</p>}
                  </div>
                </div>
              ))}
              <button
                onClick={() => { restoreToCart(items); setSelectedList(null); }}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl py-2.5 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" /> Restore All to Cart
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── Saved Quotes Tab ────────────────────────────────────────────────────────

function SavedQuotesTab({ userId }: { userId: string }) {
  const { lists, loading, error, reload } = useSavedLists(userId, 'quote');
  const [selectedList, setSelectedList] = useState<SavedList | null>(null);
  const [items, setItems] = useState<SavedListItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const { addItem: addQuoteItem } = useQuote();
  const { getProductBySlug } = useCatalog();

  async function loadItems(listId: string) {
    setItemsLoading(true);
    const { data } = await supabase
      .from('saved_list_items')
      .select('id,list_id,product_id,product_name,product_sku,product_slug,brand,image,quantity,unit_price')
      .eq('list_id', listId)
      .order('created_at', { ascending: false });
    setItems((data ?? []) as SavedListItem[]);
    setItemsLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this saved quote list?')) return;
    await deleteList(id);
    if (selectedList?.id === id) setSelectedList(null);
    reload();
  }

  function restoreToQuote(listItems: SavedListItem[]) {
    let added = 0;
    listItems.forEach(item => {
      if (item.product_slug) {
        const product = getProductBySlug(item.product_slug);
        if (product) {
          addQuoteItem(product, item.quantity);
          added++;
        }
      }
    });
    setSuccess(`${added} item${added !== 1 ? 's' : ''} added to your quote cart.`);
    setTimeout(() => setSuccess(null), 4000);
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;
  if (error) return <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4"><AlertCircle className="w-5 h-5 text-red-500" /><p className="text-red-700 text-sm">{error}</p></div>;

  return (
    <div className="space-y-4">
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 text-sm">{success}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Saved Quote Lists ({lists.length})</h2>
        <Link to="/quote-cart" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Go to quote cart →</Link>
      </div>

      {lists.length === 0 ? (
        <EmptyState icon={FileText} title="No saved quote lists" desc="Save your quote cart from the quote cart page to reuse it later." actionLabel="Go to Quote Cart" actionTo="/quote-cart" />
      ) : (
        <div className="space-y-3">
          {lists.map(list => (
            <div key={list.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{list.name}</p>
                    <p className="text-xs text-slate-400">
                      {list.item_count ?? 0} item{(list.item_count ?? 0) !== 1 ? 's' : ''} · {new Date(list.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button onClick={() => handleDelete(list.id)} className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => { setSelectedList(list); loadItems(list.id); }}
                  className="flex-1 text-sm font-medium text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-xl py-2 transition-colors"
                >
                  View Items
                </button>
                <button
                  onClick={() => { loadItems(list.id).then(() => restoreToQuote(items)); }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl py-2 transition-colors"
                >
                  <FileText className="w-4 h-4" /> Restore to Quote Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedList && (
        <Modal title={selectedList.name} onClose={() => setSelectedList(null)}>
          {itemsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
          ) : items.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">This saved quote list is empty.</p>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 bg-white rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-slate-300" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.product_slug ? (
                      <Link to={`/products/${item.product_slug}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 line-clamp-1 block">{item.product_name}</Link>
                    ) : (
                      <p className="text-sm font-semibold text-slate-900 line-clamp-1">{item.product_name}</p>
                    )}
                    <p className="text-xs text-slate-400">{item.brand} {item.product_sku && `· ${item.product_sku}`}</p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">×{item.quantity}</span>
                </div>
              ))}
              <button
                onClick={() => { restoreToQuote(items); setSelectedList(null); }}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl py-2.5 transition-colors"
              >
                <FileText className="w-4 h-4" /> Restore All to Quote Cart
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── Reorder Tab ─────────────────────────────────────────────────────────────

function ReorderTab({ email, userId }: { email: string; userId: string }) {
  const [orders, setOrders] = useState<OrderForReorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<SavedListItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const { addItem } = useShoppingCart();
  const { getProductBySlug } = useCatalog();

  useEffect(() => {
    supabase
      .from('orders')
      .select('id,order_number,created_at,order_status')
      .eq('email', email)
      .in('order_status', ['delivered', 'completed', 'confirmed', 'shipped'])
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!error) setOrders((data ?? []) as OrderForReorder[]);
        setLoading(false);
      });
  }, [email]);

  async function loadOrderItems(orderId: string) {
    setItemsLoading(true);
    const { data } = await supabase
      .from('order_items')
      .select('id,product_id,product_name,product_sku,quantity,unit_price')
      .eq('order_id', orderId)
      .order('created_at');
    // Need to get product slug and image from catalog
    const items = (data ?? []) as Array<{ id: string; product_id: string | null; product_name: string; product_sku: string | null; quantity: number; unit_price: number | null }>;
    const enriched = items.map(item => {
      const product = item.product_id ? getProductBySlug('') : undefined;
      return {
        id: item.id,
        list_id: orderId,
        product_id: item.product_id,
        product_name: item.product_name,
        product_sku: item.product_sku,
        product_slug: null as string | null,
        brand: null as string | null,
        image: null as string | null,
        quantity: item.quantity,
        unit_price: item.unit_price,
      } as SavedListItem;
    });
    setOrderItems(enriched);
    setItemsLoading(false);
  }

  function reorderToCart(items: SavedListItem[]) {
    let added = 0;
    items.forEach(item => {
      // Try to find the product in catalog by SKU
      const allProducts = getAllProducts();
      const product = allProducts.find(p => p.sku === item.product_sku || p.id === item.product_id);
      if (product) {
        addItem(product, item.quantity);
        added++;
      }
    });
    if (added > 0) {
      setSuccess(`${added} item${added !== 1 ? 's' : ''} added to your cart.`);
      setTimeout(() => setSuccess(null), 4000);
    } else {
      setSuccess('Could not find these products in the current catalog. They may have been discontinued.');
      setTimeout(() => setSuccess(null), 4000);
    }
  }

  // Access catalog products
  const { products } = useCatalog();
  function getAllProducts() { return products; }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 text-sm">{success}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <RotateCcw className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900">Reorder Previous Purchases</p>
          <p className="text-xs text-blue-700 mt-0.5">Select a past order to quickly add all its items to your shopping cart.</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon={RotateCcw} title="No eligible orders" desc="Orders that have been delivered or confirmed will appear here for quick reordering." actionLabel="Browse Products" actionTo="/products" />
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{order.order_number}</p>
                    <p className="text-xs text-slate-400 capitalize">
                      {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {order.order_status}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => { setSelectedOrderId(selectedOrderId === order.id ? null : order.id); loadOrderItems(order.id); }}
                  className="flex-1 text-sm font-medium text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-xl py-2 transition-colors"
                >
                  {selectedOrderId === order.id ? 'Hide Items' : 'View Items'}
                </button>
                <button
                  onClick={() => { loadOrderItems(order.id).then(() => reorderToCart(orderItems)); }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl py-2 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" /> Add All to Cart
                </button>
              </div>

              {selectedOrderId === order.id && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  {itemsLoading ? (
                    <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
                  ) : (
                    orderItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg">
                        <div className="w-10 h-10 bg-white rounded-lg overflow-hidden flex-shrink-0">
                          {item.image ? <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-slate-300" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 line-clamp-1">{item.product_name}</p>
                          <p className="text-xs text-slate-400">{item.product_sku && `SKU: ${item.product_sku}`}</p>
                        </div>
                        <span className="text-xs font-medium text-slate-500">×{item.quantity}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
