import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface Crumb {
  label: string;
  path?: string;
}

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="w-full">
      <ol className="flex items-center flex-wrap gap-1 text-sm text-slate-500">
        <li>
          <Link to="/" className="flex items-center gap-1 hover:text-blue-600 transition-colors" aria-label="Home">
            <Home className="w-3.5 h-3.5" />
          </Link>
        </li>
        {crumbs.map((crumb, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-slate-300" />
            {crumb.path ? (
              <Link to={crumb.path} className="hover:text-blue-600 transition-colors">{crumb.label}</Link>
            ) : (
              <span className="text-slate-900 font-medium" aria-current="page">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
