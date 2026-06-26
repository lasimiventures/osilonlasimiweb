import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface Crumb {
  label: string;
  path?: string;
}

export function Breadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="w-full">
      <ol className="flex items-center flex-wrap gap-1 text-sm text-slate-500" itemScope itemType="https://schema.org/BreadcrumbList">
        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
          <Link to="/" className="flex items-center gap-1 hover:text-blue-600 transition-colors" aria-label="Home" itemProp="item">
            <Home className="w-3.5 h-3.5" />
            <meta itemProp="name" content="Home" />
            <meta itemProp="position" content="1" />
          </Link>
        </li>
        {crumbs.map((crumb, i) => (
          <li key={i} className="flex items-center gap-1" itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <ChevronRight className="w-3 h-3 text-slate-300" />
            {crumb.path ? (
              <Link to={crumb.path} className="hover:text-blue-600 transition-colors" itemProp="item">
                <span itemProp="name">{crumb.label}</span>
              </Link>
            ) : (
              <span className="text-slate-900 font-medium" aria-current="page" itemProp="name">{crumb.label}</span>
            )}
            <meta itemProp="position" content={`${i + 2}`} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
