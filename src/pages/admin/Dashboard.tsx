import { useEffect, useState } from 'react';
import { Package, Layers, Tag, FileText, TrendingUp, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface Stats {
  products: number;
  categories: number;
  brands: number;
  quotes: number;
}

export function AdminDashboard() {
  const { session } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [pRes, cRes, bRes, qRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('brands').select('id', { count: 'exact', head: true }),
        supabase.from('quote_requests').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        products: pRes.count ?? 0,
        categories: cRes.count ?? 0,
        brands: bRes.count ?? 0,
        quotes: qRes.count ?? 0,
      });
      setLoadingStats(false);
    }
    fetchStats();
  }, []);

  const cards = [
    { label: 'Products', value: stats?.products, icon: Package, color: 'blue', href: '/admin/products' },
    { label: 'Categories', value: stats?.categories, icon: Layers, color: 'emerald', href: '/admin/categories' },
    { label: 'Brands', value: stats?.brands, icon: Tag, color: 'violet', href: '/admin/brands' },
    { label: 'Quote Requests', value: stats?.quotes, icon: FileText, color: 'amber', href: '/admin/quotes' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400 ring-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    violet: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
    amber: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
  };

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {greeting}, {session?.user?.email?.split('@')[0]}
        </h1>
        <p className="text-slate-400 mt-1 text-sm flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {now.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ring-1 flex items-center justify-center ${colorMap[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <TrendingUp className="w-4 h-4 text-slate-600" />
            </div>
            <p className="text-3xl font-bold text-white">
              {loadingStats ? (
                <span className="inline-block w-10 h-8 bg-slate-800 rounded animate-pulse" />
              ) : (
                value?.toLocaleString()
              )}
            </p>
            <p className="text-slate-400 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Info banner */}
      <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6">
        <h3 className="text-blue-300 font-semibold mb-1">Admin Portal — Phase 3</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          Management tools for products, categories, brands, and quote requests are being built out.
          Stats above reflect live data from the database.
        </p>
      </div>
    </div>
  );
}
