import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Warehouse,
  TrendingUp,
  Tag,
  Layers,
  FileText,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Settings,
  ShoppingBag,
  Image,
  Megaphone,
  Users,
  FileSpreadsheet,
  BarChart3,
  Building2,
  ShoppingCart,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

const navItems = [
  { to: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/orders',     icon: ShoppingBag,     label: 'Orders' },
  { to: '/admin/customers',  icon: Users,           label: 'Customers' },
  { to: '/admin/products',   icon: Package,         label: 'Products' },
  { to: '/admin/inventory',  icon: Boxes,           label: 'Inventory' },
  { to: '/admin/warehouses', icon: Warehouse,       label: 'Warehouses' },
  { to: '/admin/transfers',  icon: TrendingUp,      label: 'Transfers' },
  { to: '/admin/categories', icon: Layers,          label: 'Categories' },
  { to: '/admin/brands',     icon: Tag,             label: 'Brands' },
  { to: '/admin/media',      icon: Image,           label: 'Media Library' },
  { to: '/admin/quotes',     icon: FileText,          label: 'Quote Requests' },
  { to: '/admin/rfqs',       icon: FileSpreadsheet,   label: 'RFQ Requests' },
  { to: '/admin/crm',        icon: BarChart3,         label: 'CRM Prep' },
  { to: '/admin/suppliers',  icon: Building2,         label: 'Suppliers' },
  { to: '/admin/procurement', icon: ShoppingCart,     label: 'Procurement' },
  { to: '/admin/banners',    icon: Megaphone,         label: 'Banners' },
  { to: '/admin/settings',   icon: Settings,        label: 'Settings' },
];

export function AdminLayout() {
  const { session, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    navigate('/admin/login', { replace: true });
  }

  const email = session?.user?.email ?? '';
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 border-r border-slate-800 z-30 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <img src="/Osil_Logo.jpg" alt="OSIL" className="w-7 h-7 rounded-md object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-tight truncate">OSIL Admin</p>
            <p className="text-slate-500 text-xs truncate">Portal</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-slate-500 hover:text-white lg:hidden transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 border-t border-slate-800 pt-3 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{email}</p>
              <p className="text-slate-500 text-xs">Administrator</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top bar (mobile) */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center gap-4 px-4 lg:px-6 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white lg:hidden transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button
            onClick={handleSignOut}
            className="hidden lg:flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
