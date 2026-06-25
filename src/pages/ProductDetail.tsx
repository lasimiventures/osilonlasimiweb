import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Check } from 'lucide-react';
import { SEO } from '../components/SEO';
import { Breadcrumb } from '../components/Breadcrumb';
import { ProductGrid } from '../components/ProductGrid';
import { getProductBySlug, getRelatedProducts } from '../data/products';
import { getCategoryBySlug } from '../data/categories';

import { useQuote } from '../context/QuoteContext';

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const product = getProductBySlug(slug || '');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useQuote();

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Product Not Found</h1>
        <p className="text-slate-500 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link to="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Browse Products
        </Link>
      </div>
    );
  }

  const category = getCategoryBySlug(product.categorySlug);
  const related = getRelatedProducts(product);

  const availabilityLabel = {
    'in-stock': 'In Stock',
    'low-stock': 'Low Stock',
    'out-of-stock': 'Out of Stock',
    'pre-order': 'Pre-Order',
  };

  const availabilityColor = {
    'in-stock': 'bg-green-100 text-green-700',
    'low-stock': 'bg-amber-100 text-amber-700',
    'out-of-stock': 'bg-red-100 text-red-700',
    'pre-order': 'bg-blue-100 text-blue-700',
  };

  return (
    <>
      <SEO meta={{
        title: `${product.name} | ${product.brand} | OSIL Ltd`,
        description: product.shortDescription,
        keywords: product.tags,
      }} />

      <section className="bg-slate-50 py-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb crumbs={[
            { label: 'Products', path: '/products' },
            { label: category?.name || 'Category', path: category ? `/category/${category.slug}` : undefined },
            { label: product.brand, path: `/brand/${product.brandSlug}` },
            { label: product.name },
          ]} />
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Images */}
              <div>
                <div className="aspect-square bg-white rounded-xl border border-slate-100 overflow-hidden mb-4">
                  <img src={product.images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
                </div>
                {product.images.length > 1 && (
                  <div className="flex gap-3">
                    {product.images.map((img, i) => (
                      <button key={i} onClick={() => setActiveImage(i)} className={`w-16 h-16 rounded-lg border overflow-hidden ${activeImage === i ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`}>
                        <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-md ${availabilityColor[product.availability]}`}>
                    {availabilityLabel[product.availability]}
                  </span>
                  {product.isNew && <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-md">New</span>}
                  {product.isBestSeller && <span className="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-md">Best Seller</span>}
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>
                <div className="text-sm text-slate-500 mb-4">
                  SKU: <span className="font-mono">{product.sku}</span> &bull; Brand: <Link to={`/brand/${product.brandSlug}`} className="text-blue-600 hover:underline">{product.brand}</Link> &bull; Category: <Link to={`/category/${product.categorySlug}`} className="text-blue-600 hover:underline">{product.category}</Link>
                </div>
                <p className="text-slate-600 leading-relaxed mb-6">{product.description}</p>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50">-</button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50">+</button>
                  </div>
                  <button
                    onClick={() => addItem(product, quantity)}
                    className="flex-1 max-w-xs flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" /> Add to Quote
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Genuine product with manufacturer warranty</span>
                </div>
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden mb-12">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-900">Specifications</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="px-6 py-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="text-sm font-medium text-slate-700">{key}</div>
                    <div className="sm:col-span-2 text-sm text-slate-600">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Related Products */}
            {related.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4">Related Products</h2>
                <ProductGrid products={related} />
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </>
  );
}
