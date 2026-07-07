import { X, BarChart2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useCompare } from '../context/CompareContext';
import { Link } from 'react-router-dom';

export function CompareBar() {
  const { compareList, removeFromCompare, clearCompare, isDrawerOpen, setDrawerOpen } = useCompare();

  if (compareList.length === 0) return null;

  const allSpecKeys = Array.from(
    new Set(compareList.flatMap(p => Object.keys(p.specifications)))
  );

  return (
    <>
      {/* Floating bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 py-3">
            <div className="flex items-center gap-2 shrink-0">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-slate-900">Compare</span>
              <span className="w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">{compareList.length}</span>
            </div>

            <div className="flex-1 flex items-center gap-2 overflow-x-auto">
              {[0, 1, 2, 3].map(idx => {
                const product = compareList[idx];
                return (
                  <div key={idx} className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs ${product ? 'bg-blue-50 border-blue-200 text-slate-700' : 'bg-slate-50 border-dashed border-slate-200 text-slate-400'}`}>
                    {product ? (
                      <>
                        <span className="font-medium line-clamp-1 max-w-[120px]">{product.name}</span>
                        <button onClick={() => removeFromCompare(product.id)} className="text-slate-400 hover:text-red-500 transition-colors shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <span>+ Add product</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {compareList.length >= 2 && (
                <button
                  onClick={() => setDrawerOpen(!isDrawerOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isDrawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  {isDrawerOpen ? 'Hide' : 'Compare Now'}
                </button>
              )}
              <button onClick={clearCompare} className="p-2 text-slate-400 hover:text-red-500 border border-slate-200 rounded-lg transition-colors" title="Clear comparison">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison drawer */}
      {isDrawerOpen && compareList.length >= 2 && (
        <div className="fixed bottom-[56px] left-0 right-0 z-39 bg-white border-t border-slate-200 shadow-2xl max-h-[60vh] overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide pr-4 py-2 w-36 shrink-0">Specification</th>
                    {compareList.map(p => (
                      <th key={p.id} className="text-left py-2 px-3 min-w-[180px]">
                        <div className="flex items-start gap-2">
                          <div>
                            <div className="text-xs text-slate-500">{p.brand}</div>
                            <Link to={`/products/${p.slug}`} onClick={() => setDrawerOpen(false)} className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors leading-tight line-clamp-2">
                              {p.name}
                            </Link>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Availability row */}
                  <tr className="border-t border-slate-100">
                    <td className="py-2 pr-4 text-xs font-semibold text-slate-500">Availability</td>
                    {compareList.map(p => {
                      const colorMap: Record<string, string> = {
                        'in-stock': 'text-green-700 bg-green-50',
                        'low-stock': 'text-amber-700 bg-amber-50',
                        'out-of-stock': 'text-red-700 bg-red-50',
                        'pre-order': 'text-blue-700 bg-blue-50',
                      };
                      const labelMap: Record<string, string> = {
                        'in-stock': 'In Stock',
                        'low-stock': 'Low Stock',
                        'out-of-stock': 'Out of Stock',
                        'pre-order': 'Pre-Order',
                      };
                      return (
                        <td key={p.id} className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[p.availability]}`}>
                            {labelMap[p.availability]}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                  {allSpecKeys.map((key, i) => (
                    <tr key={key} className={`border-t border-slate-100 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                      <td className="py-2 pr-4 text-xs font-semibold text-slate-500 whitespace-nowrap">{key}</td>
                      {compareList.map(p => (
                        <td key={p.id} className="py-2 px-3 text-sm text-slate-700">
                          {p.specifications[key] || <span className="text-slate-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Actions row */}
                  <tr className="border-t border-slate-200">
                    <td className="pt-3 pr-4" />
                    {compareList.map(p => (
                      <td key={p.id} className="pt-3 px-3">
                        <Link
                          to={`/products/${p.slug}`}
                          onClick={() => setDrawerOpen(false)}
                          className="inline-block px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
