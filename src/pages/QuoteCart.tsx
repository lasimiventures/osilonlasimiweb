import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingCart, Send, MoveRight, ShoppingBag, Bookmark, Loader2 } from 'lucide-react';
import { SEO } from '../components/SEO';
import { useQuote } from '../context/QuoteContext';
import { useShoppingCart } from '../context/ShoppingCartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { supabase } from '../lib/supabase';

export function QuoteCart() {
  const { items, removeItem, updateQuantity, clearQuote, itemCount } = useQuote();
  const { addItem: addToCart, items: cartItems } = useShoppingCart();
  const { session } = useCustomerAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  function moveToCart(item: typeof items[0]) {
    const alreadyInCart = cartItems.find(c => c.productId === item.productId);
    if (!alreadyInCart) {
      addToCart(item.product, item.quantity);
    } else {
      // Just increment quantity without duplicating
      addToCart(item.product, item.quantity);
    }
    removeItem(item.productId);
  }

  function moveAllToCart() {
    items.forEach(item => addToCart(item.product, item.quantity));
    clearQuote();
  }

  if (itemCount === 0) {
    return (
      <>
        <SEO meta={{ title: 'Quote Cart | Request a Price Quote | OSIL Ltd Kenya', description: 'Your quote request cart is empty.' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Your Quote Cart is Empty</h1>
          <p className="text-slate-500 mb-6">Add products to request a quotation from our sales team.</p>
          <Link to="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Browse Products
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO meta={{ title: 'Quote Cart | Request a Price Quote | OSIL Ltd Kenya', description: 'Review your selected products and proceed to request a quotation.' }} />

      <section className="bg-slate-50 py-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Quote Cart</h1>
          <p className="text-sm text-slate-500">Review your selected items and request a quotation</p>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="bg-white border border-slate-100 rounded-xl p-4 flex gap-4">
                  <div className="w-24 h-24 bg-slate-50 rounded-lg overflow-hidden shrink-0">
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link to={`/products/${item.product.slug}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1">
                          {item.product.name}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">{item.product.brand} &bull; {item.product.category}</p>
                        <p className="text-xs text-slate-400 mt-0.5">SKU: {item.product.sku}</p>
                      </div>
                      <button onClick={() => removeItem(item.productId)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 border border-slate-200 rounded-lg">
                          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded-l-lg">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded-r-lg">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs text-slate-400">Request pricing</span>
                      </div>
                      {item.product.buyNowEnabled && (
                        <button
                          onClick={() => moveToCart(item)}
                          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
                        >
                          <MoveRight className="w-3.5 h-3.5" /> Move to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-4 flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <button onClick={clearQuote} className="text-sm text-red-500 hover:text-red-600 font-medium">
                    Clear all items
                  </button>
                  <button onClick={moveAllToCart} className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium">
                    <ShoppingBag className="w-3.5 h-3.5" /> Move all to Cart
                  </button>
                </div>
                <Link to="/products" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Continue Shopping
                </Link>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-100 rounded-xl p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Quote Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Items</span>
                    <span className="font-medium text-slate-900">{itemCount}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Products</span>
                    <span className="font-medium text-slate-900">{items.length}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-3 text-xs text-slate-400">
                    Prices will be provided in your quotation based on current availability and volume.
                  </div>
                </div>
                <button
                  onClick={() => navigate('/request-quote')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mb-3"
                >
                  <Send className="w-4 h-4" /> Proceed to Quote
                </button>
                {session && (
                  <button
                    onClick={async () => {
                      if (!session.user.id) return;
                      setSaving(true);
                      const listName = `Quote List ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
                      const { data: listData, error: listErr } = await supabase.from('saved_lists').insert({
                        user_id: session.user.id,
                        name: listName,
                        list_type: 'quote',
                      }).select().maybeSingle();
                      if (listErr || !listData) { setSaveMsg('Failed to save quote list.'); setSaving(false); return; }
                      const insertItems = items.map(i => ({
                        list_id: listData.id,
                        product_id: i.productId,
                        product_name: i.product.name,
                        product_sku: i.product.sku,
                        product_slug: i.product.slug,
                        brand: i.product.brand,
                        image: i.product.images[0] ?? null,
                        quantity: i.quantity,
                        unit_price: i.product.displayPrice ?? i.product.price ?? null,
                      }));
                      await supabase.from('saved_list_items').insert(insertItems);
                      setSaving(false);
                      setSaveMsg('Quote list saved! Find it in My Lists.');
                      setTimeout(() => setSaveMsg(null), 4000);
                    }}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-amber-200 text-amber-700 font-medium rounded-lg hover:bg-amber-50 transition-colors text-sm disabled:opacity-50 mb-3"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4" />} Save Quote List
                  </button>
                )}
                {saveMsg && <p className="text-xs text-emerald-600 text-center mb-3">{saveMsg}</p>}
                <Link
                  to="/cart"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-lg hover:border-green-300 hover:text-green-700 transition-colors text-sm"
                >
                  <ShoppingBag className="w-4 h-4" /> View Shopping Cart
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
