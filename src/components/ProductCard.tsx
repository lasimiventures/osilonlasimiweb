import { Link } from 'react-router-dom';
import { memo } from 'react';
import { ShoppingCart, ArrowRight, BarChart2 } from 'lucide-react';
import { useQuote } from '../context/QuoteContext';
import { useCompare } from '../context/CompareContext';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useQuote();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();

  const inCompare = isInCompare(product.id);

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
    'pre-order': 'bg-blue-100 text-brand-blue',
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inCompare) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  return (
    <article className="group bg-white rounded-xl border border-slate-100 overflow-hidden hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
      <Link to={`/products/${product.slug}`} className="block relative aspect-[4/3] bg-slate-50 overflow-hidden">
        <img
          src={product.images[0]}
          alt={`${product.name} - ${product.brand} ${product.category} at OSIL Ltd Kenya`}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.isNew && (
            <span className="px-2 py-1 bg-brand-blue text-white text-xs font-semibold rounded-md">New</span>
          )}
          {product.isBestSeller && (
            <span className="px-2 py-1 bg-amber-500 text-white text-xs font-semibold rounded-md">Best Seller</span>
          )}
          {product.isFeatured && !product.isNew && !product.isBestSeller && (
            <span className="px-2 py-1 bg-slate-800 text-white text-xs font-semibold rounded-md">Featured</span>
          )}
        </div>
        <div className="absolute bottom-3 left-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-md ${availabilityColor[product.availability]}`}>
            {availabilityLabel[product.availability]}
          </span>
        </div>
        {/* Compare toggle */}
        <button
          onClick={handleCompare}
          title={inCompare ? 'Remove from compare' : 'Add to compare'}
          className={`absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg border transition-all duration-200 ${inCompare ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white/90 border-slate-200 text-slate-500 opacity-0 group-hover:opacity-100 hover:border-blue-300 hover:text-blue-600'}`}
        >
          <BarChart2 className="w-3.5 h-3.5" />
        </button>
      </Link>
      <div className="p-4">
        <div className="text-xs text-slate-500 mb-1">{product.brand}</div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2 leading-snug">
          <Link to={`/products/${product.slug}`} className="hover:text-brand-blue transition-colors">
            {product.name}
          </Link>
        </h3>
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{product.shortDescription}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => addItem(product)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-brand-blue rounded-lg hover:bg-brand-blue-dark transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Add to Quote
          </button>
          <Link
            to={`/products/${product.slug}`}
            className="flex items-center justify-center w-9 h-9 text-slate-500 border border-slate-200 rounded-lg hover:text-brand-blue hover:border-brand-blue/20 transition-colors"
            aria-label={`View ${product.name} details`}
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </article>
  );
});
