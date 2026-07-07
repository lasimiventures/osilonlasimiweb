import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';
import { SEO } from '../components/SEO';

export function NotFound() {
  return (
    <>
      <SEO meta={{
        title: 'Page Not Found | 404 | OSIL Ltd Kenya',
        description: 'The page you are looking for does not exist. Browse our products or return to the homepage.',
      }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="text-8xl font-extrabold text-slate-100 mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Page Not Found</h1>
        <p className="text-slate-500 mb-8 max-w-md mx-auto">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Home className="w-4 h-4" /> Home Page
          </Link>
          <Link to="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Browse Products
          </Link>
        </div>
      </div>
    </>
  );
}
