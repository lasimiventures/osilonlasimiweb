import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, ArrowRight, FileText, MoveRight, Bookmark, Loader2 } from 'lucide-react';
import { SEO } from '../components/SEO';
import { useShoppingCart } from '../context/ShoppingCartContext';
import { useQuote } from '../context/QuoteContext';
import { useCatalog } from '../context/CatalogContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { supabase } from '../lib/supabase';

export function ShoppingCart() {
  const { items, removeItem, updateQuantity, clearCart, itemCount, estimatedTotal } = useShoppingCart();
  const { addItem: addToQuote } = useQuote();
  const { getProductBySlug } = useCatalog();
  const { session } = useCustomerAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  function moveToQuote(item: typeof items[0]) {
    const product = getProductBySlug(item.productSlug);
    if (product) {
      addToQuote(product, item.quantity);
      removeItem(item.productId);
    }
  }

  function moveAllToQuote() {
    items.forEach(item => {
      const product = getProductBySlug(item.productSlug);
      if (product) addToQuote(product, item.quantity);
    });
    clearCart();
  }

  if (itemCount === 0) {
    return (
      <>
        <SEO meta={{ title: 'Shopping Cart | OSIL Ltd Kenya', description: 'Your shopping cart is empty.' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Your Shopping Cart is Empty</h1>
          <p className="text-slate-500 mb-6">Browse our product catalogue and click "Buy Now" to add items.</p>
          <Link to="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Browse Products
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <SEO meta={{ title: 'Shopping Cart | OSIL Ltd Kenya', description: 'Review your cart and proceed to checkout.' }} />

      <section className="bg-slate-50 py-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Shopping Cart</h1>
          <p className="text-sm text-slate-500">Review your items and proceed to checkout</p>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Items list */}
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => (
                <div key={item.productId} className="bg-white border border-slate-100 rounded-xl p-4 flex gap-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-lg overflow-hidden shrink-0">
                    <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/products/${item.productSlug}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1">
                          {item.productName}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">{item.brand}</p>
                        <p className="text-xs text-slate-400 mt-0.5">SKU: {item.productSku}</p>
                      </div>
                      <button onClick={() => removeItem(item.productId)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 border border-slate-200 rounded-lg">
                          <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded-l-lg">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 rounded-r-lg">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        {item.unitPrice != null && (
                          <span className="text-sm font-semibold text-slate-900">
                            KES {(item.unitPrice * item.quantity).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => moveToQuote(item)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <MoveRight className="w-3.5 h-3.5" /> Move to Quote Cart
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between pt-4 flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 font-medium">
                    Clear cart
                  </button>
                  <button onClick={moveAllToQuote} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    <FileText className="w-3.5 h-3.5" /> Move all to Quote Cart
                  </button>
                </div>
                <Link to="/products" className="text-sm text-slate-600 hover:text-blue-600 font-medium flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Continue Shopping
                </Link>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-100 rounded-xl p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Summary</h2>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Items ({itemCount})</span>
                    <span className="font-medium text-slate-900">{items.length} product{items.length !== 1 ? 's' : ''}</span>
                  </div>
                  {estimatedTotal != null && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Estimated Total</span>
                      <span className="font-bold text-slate-900">KES {estimatedTotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="border-t border-slate-100 pt-3 text-xs text-slate-400">
                    Final price confirmed at checkout. Delivery charges calculated based on location.
                  </div>
                </div>
                <button
                  onClick={() => navigate('/checkout')}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors mb-3"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
                </button>
                {session && (
                  <button
                    onClick={async () => {
                      if (!session.user.id) return;
                      setSaving(true);
                      const listName = `Cart ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
                      const { data: listData, error: listErr } = await supabase.from('saved_lists').insert({
                        user_id: session.user.id,
                        name: listName,
                        list_type: 'cart',
                      }).select().maybeSingle();
                      if (listErr || !listData) { setSaveMsg('Failed to save cart.'); setSaving(false); return; }
                      const insertItems = items.map(i => ({
                        list_id: listData.id,
                        product_id: i.productId,
                        product_name: i.productName,
                        product_sku: i.productSku,
                        product_slug: i.productSlug,
                        brand: i.brand,
                        image: i.image,
                        quantity: i.quantity,
                        unit_price: i.unitPrice,
                      }));
                      await supabase.from('saved_list_items').insert(insertItems);
                      setSaving(false);
                      setSaveMsg('Cart saved! Find it in My Lists.');
                      setTimeout(() => setSaveMsg(null), 4000);
                    }}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-blue-200 text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors text-sm disabled:opacity-50 mb-3"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4" />} Save Cart for Later
                  </button>
                )}
                {saveMsg && <p className="text-xs text-emerald-600 text-center mb-3">{saveMsg}</p>}
                <Link
                  to="/quote-cart"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-blue-200 text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors text-sm"
                >
                  <FileText className="w-4 h-4" /> View Quote Cart
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
