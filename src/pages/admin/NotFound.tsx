import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, AlertTriangle } from 'lucide-react';

export function AdminNotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20 flex items-center justify-center mb-6">
        <AlertTriangle className="w-7 h-7 text-amber-400" />
      </div>
      <h1 className="text-3xl font-bold text-white mb-2">Page not found</h1>
      <p className="text-slate-400 text-sm mb-8 max-w-sm">
        This admin page doesn't exist yet or the URL is incorrect.
      </p>
      <button
        onClick={() => navigate('/admin/dashboard')}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
      >
        <LayoutDashboard className="w-4 h-4" />
        Back to Dashboard
      </button>
    </div>
  );
}
