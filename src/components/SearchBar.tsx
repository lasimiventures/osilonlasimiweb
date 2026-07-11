import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import type { Product } from '../types';

interface SearchBarProps {
  initialValue?: string;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ initialValue = '', onSearch, placeholder = 'Search laptops, phones, servers...', className = '' }: SearchBarProps) {
  const { searchProducts } = useCatalog();
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length > 1) {
      const results = searchProducts(query).slice(0, 6);
      setSuggestions(results);
      setIsOpen(true);
      setHighlighted(0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsOpen(false);
    if (query.trim()) {
      if (onSearch) {
        onSearch(query.trim());
      } else {
        navigate(`/products?search=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const handleSelect = (product: Product) => {
    setIsOpen(false);
    navigate(`/products/${product.slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(suggestions[highlighted]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length > 1 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent bg-white"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); onSearch?.(''); setSuggestions([]); setIsOpen(false); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Predictive dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-50">
            {suggestions.length} product{suggestions.length > 1 ? 's' : ''} found
          </div>
          <div className="py-1">
            {suggestions.map((product, index) => (
              <button
                key={product.id}
                onClick={() => handleSelect(product)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  index === highlighted ? 'bg-brand-blue-pale' : 'hover:bg-slate-50'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{product.name}</div>
                  <div className="text-xs text-slate-400">{product.brand} · {product.category}</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
              </button>
            ))}
          </div>
          <div className="px-4 py-2 border-t border-slate-50">
            <button
              onClick={handleSubmit}
              className="w-full text-xs font-medium text-brand-blue hover:text-brand-blue-dark transition-colors"
            >
              View all results for "{query}" →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
