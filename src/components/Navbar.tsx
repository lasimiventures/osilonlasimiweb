import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, ChevronDown, ShoppingCart, Search, MapPin, Phone, Mail,
  Laptop, Monitor, Smartphone, Tablet, Printer, Wifi,
  Shield, Settings, Cloud, Database, Wrench, Lightbulb, LayoutGrid, Globe, Info, Plug, Code,
} from 'lucide-react';
import { useQuote } from '../context/QuoteContext';
import { services } from '../data/services';
import { products } from '../data/products';
import { categories } from '../data/categories';
import { allBrands } from '../data/brands';

/* ─── nav structure ─────────────────────────────────────────────────── */

const navCategories = [
  {
    label: 'Laptops',
    href: '/category/laptops',
    icon: <Laptop className="w-4 h-4" />,
    subcategories: [
      { label: 'Dell Laptops', href: '/brand/dell' },
      { label: 'HP Laptops', href: '/brand/hp' },
      { label: 'Lenovo Laptops', href: '/brand/lenovo' },
      { label: 'Microsoft Surface', href: '/brand/microsoft' },
      { label: 'View All Laptops', href: '/category/laptops', featured: true },
    ],
  },
  {
    label: 'Computers',
    href: '/category/desktops',
    icon: <Monitor className="w-4 h-4" />,
    subcategories: [
      { label: 'Desktop Computers', href: '/category/desktops' },
      { label: 'Workstations', href: '/category/workstations' },
      { label: 'Dell Desktops', href: '/brand/dell' },
      { label: 'HP Desktops', href: '/brand/hp' },
      { label: 'View All Computers', href: '/category/desktops', featured: true },
    ],
  },
  {
    label: 'Networking',
    href: '/category/networking',
    icon: <Wifi className="w-4 h-4" />,
    subcategories: [
      { label: 'Routers & Gateways', href: '/category/networking' },
      { label: 'Switches', href: '/category/networking' },
      { label: 'Access Points', href: '/category/networking' },
      { label: 'Cisco', href: '/brand/cisco' },
      { label: 'Ubiquiti / UniFi', href: '/brand/ubiquiti' },
      { label: 'View All Networking', href: '/category/networking', featured: true },
    ],
  },
  {
    label: 'CCTV & Security',
    href: '/category/security',
    icon: <Shield className="w-4 h-4" />,
    subcategories: [
      { label: 'IP Cameras', href: '/category/security' },
      { label: 'NVR / DVR Systems', href: '/category/security' },
      { label: 'Access Control', href: '/category/security' },
      { label: 'Hikvision', href: '/brand/hikvision' },
      { label: 'Dahua', href: '/brand/dahua' },
      { label: 'View All Security', href: '/category/security', featured: true },
    ],
  },
  {
    label: 'Printers',
    href: '/category/printers',
    icon: <Printer className="w-4 h-4" />,
    subcategories: [
      { label: 'Laser Printers', href: '/category/printers' },
      { label: 'Inkjet Printers', href: '/category/printers' },
      { label: 'Multifunction', href: '/category/printers' },
      { label: 'Epson', href: '/brand/epson' },
      { label: 'Brother', href: '/brand/brother' },
      { label: 'View All Printers', href: '/category/printers', featured: true },
    ],
  },
  {
    label: 'POS & Software',
    href: '/category/software',
    icon: <Code className="w-4 h-4" />,
    subcategories: [
      { label: 'Windows Licenses', href: '/category/software' },
      { label: 'Microsoft Office 365', href: '/category/software' },
      { label: 'Antivirus Solutions', href: '/category/software' },
      { label: 'Cloud Services', href: '/category/software' },
      { label: 'View All Software', href: '/category/software', featured: true },
    ],
  },
  {
    label: 'Phones',
    href: '/category/phones',
    icon: <Smartphone className="w-4 h-4" />,
    subcategories: [
      { label: 'Samsung Galaxy', href: '/brand/samsung' },
      { label: 'Apple iPhone', href: '/brand/apple' },
      { label: 'Xiaomi', href: '/brand/xiaomi' },
      { label: 'Tecno', href: '/brand/tecno' },
      { label: 'Infinix', href: '/brand/infinix' },
      { label: 'View All Phones', href: '/category/phones', featured: true },
    ],
  },
  {
    label: 'Tablets',
    href: '/category/tablets',
    icon: <Tablet className="w-4 h-4" />,
    subcategories: [
      { label: 'Apple iPad', href: '/brand/apple-ipad' },
      { label: 'Samsung Galaxy Tab', href: '/brand/samsung-galaxy-tab' },
      { label: 'Lenovo Tablets', href: '/brand/lenovo-tablets' },
      { label: 'Microsoft Surface', href: '/brand/microsoft-surface' },
      { label: 'View All Tablets', href: '/category/tablets', featured: true },
    ],
  },
  {
    label: 'Accessories',
    href: '/category/accessories',
    icon: <Plug className="w-4 h-4" />,
    subcategories: [
      { label: 'Keyboards & Mice', href: '/category/accessories' },
      { label: 'Monitors & Displays', href: '/category/accessories' },
      { label: 'Docking Stations', href: '/category/accessories' },
      { label: 'Logitech', href: '/brand/logitech' },
      { label: 'View All Accessories', href: '/category/accessories', featured: true },
    ],
  },
];

const serviceIconMap: Record<string, React.ReactNode> = {
  Lightbulb: <Lightbulb className="w-3.5 h-3.5" />,
  Server: <Monitor className="w-3.5 h-3.5" />,
  Settings: <Settings className="w-3.5 h-3.5" />,
  Wifi: <Wifi className="w-3.5 h-3.5" />,
  Database: <Database className="w-3.5 h-3.5" />,
  Cloud: <Cloud className="w-3.5 h-3.5" />,
  Shield: <Shield className="w-3.5 h-3.5" />,
  Monitor: <Monitor className="w-3.5 h-3.5" />,
  Video: <Monitor className="w-3.5 h-3.5" />,
  Wrench: <Wrench className="w-3.5 h-3.5" />,
};

/* ─── component ─────────────────────────────────────────────────────── */

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useQuote();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsOpen(false);
    setOpenDropdown(null);
    setMobileSearchOpen(false);
    setShowSuggestions(false);
    setSearchQuery('');
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return { products: [], categories: [], brands: [] };

    const query = searchQuery.toLowerCase();

    const matchingProducts = products
      .filter(p => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query))
      .slice(0, 4);

    const matchingCategories = categories
      .filter(c => c.name.toLowerCase().includes(query))
      .slice(0, 3);

    const matchingBrands = allBrands
      .filter(b => b.name.toLowerCase().includes(query))
      .slice(0, 3);

    return { products: matchingProducts, categories: matchingCategories, brands: matchingBrands };
  }, [searchQuery]);

  const handleMouseEnter = (key: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenDropdown(key);
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSuggestions(false);
      setMobileSearchOpen(false);
    }
  };

  const hasSuggestions = searchSuggestions.products.length > 0 || searchSuggestions.categories.length > 0 || searchSuggestions.brands.length > 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      {/* Top contact bar */}
      <div className="bg-slate-800 text-slate-300 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-9">
            <div className="flex items-center gap-4">
              <a href="tel:+254795030476" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <Phone className="w-3 h-3" /> +254 795 030 476
              </a>
              <a href="mailto:info@osilltd.co.ke" className="hidden sm:flex items-center gap-1.5 hover:text-white transition-colors">
                <Mail className="w-3 h-3" /> info@osilltd.co.ke
              </a>
            </div>
            <div className="hidden md:flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-blue-400" />
              <span>1st Floor, Jethalal Chambers, Tubman Rd, Suite 103, Nairobi, Kenya</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logo + Search + Cart */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16 lg:h-[70px]">
            {/* Logo */}
            <Link to="/" className="shrink-0">
              <img src="/Osil_Logo.jpg" alt="OSIL Ltd" className="h-10 w-auto" />
            </Link>

            {/* Search bar - desktop with autocomplete */}
            <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-2xl mx-auto items-center relative" ref={searchRef}>
              <div className="flex w-full rounded-lg overflow-hidden border border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search laptops, phones, CCTV, routers, printers..."
                    className="w-full px-4 py-2.5 text-sm text-slate-700 outline-none bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shrink-0"
                >
                  Search
                </button>
              </div>

              {/* Autocomplete Dropdown */}
              {showSuggestions && searchQuery.length >= 2 && hasSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-slate-200 z-50 max-h-[400px] overflow-y-auto">
                  {searchSuggestions.products.length > 0 && (
                    <div className="p-2">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Products</div>
                      {searchSuggestions.products.map((p) => (
                        <Link
                          key={p.id}
                          to={`/products/${p.slug}`}
                          className="flex items-center gap-3 px-2 py-2 hover:bg-slate-50 rounded-lg transition-colors"
                          onClick={() => setShowSuggestions(false)}
                        >
                          <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded" />
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
                            <div className="text-xs text-slate-500">{p.brand} - {p.category}</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchSuggestions.categories.length > 0 && (
                    <div className="p-2 border-t border-slate-100">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Categories</div>
                      {searchSuggestions.categories.map((c) => (
                        <Link
                          key={c.id}
                          to={`/category/${c.slug}`}
                          className="flex items-center gap-2 px-2 py-2 hover:bg-slate-50 rounded-lg transition-colors"
                          onClick={() => setShowSuggestions(false)}
                        >
                          <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center text-blue-600">
                            <Laptop className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{c.name}</div>
                            <div className="text-xs text-slate-500">{c.productCount} products</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchSuggestions.brands.length > 0 && (
                    <div className="p-2 border-t border-slate-100">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Brands</div>
                      {searchSuggestions.brands.map((b) => (
                        <Link
                          key={b.id}
                          to={`/brand/${b.slug}`}
                          className="flex items-center gap-2 px-2 py-2 hover:bg-slate-50 rounded-lg transition-colors"
                          onClick={() => setShowSuggestions(false)}
                        >
                          <img src={b.logo} alt={b.name} className="w-8 h-8 object-cover rounded" />
                          <div>
                            <div className="text-sm font-medium text-slate-900">{b.name}</div>
                            <div className="text-xs text-slate-500">{b.productCount} products</div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="p-2 border-t border-slate-100">
                    <Link
                      to={`/products?search=${encodeURIComponent(searchQuery)}`}
                      className="block px-2 py-2 text-sm text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors"
                      onClick={() => setShowSuggestions(false)}
                    >
                      View all results for "{searchQuery}"
                    </Link>
                  </div>
                </div>
              )}
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-2 ml-auto lg:ml-0 shrink-0">
              {/* Mobile search toggle */}
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="lg:hidden w-9 h-9 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Cart */}
              <Link
                to="/quote-cart"
                className="relative flex items-center justify-center w-9 h-9 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                aria-label="Quote Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>

              {/* Request Quote */}
              <Link
                to="/request-quote"
                className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Request Quote
              </Link>

              {/* Mobile hamburger */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden w-9 h-9 flex items-center justify-center text-slate-600 hover:text-blue-600 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile search bar */}
        {mobileSearchOpen && (
          <div className="lg:hidden px-4 pb-3">
            <form onSubmit={handleSearch} className="flex rounded-lg overflow-hidden border border-slate-200">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 px-4 py-2.5 text-sm outline-none"
                autoFocus
              />
              <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold shrink-0">
                Search
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Category nav row */}
      <div className="hidden lg:block bg-white border-b border-slate-200" ref={dropdownRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center">
            {navCategories.map((cat) => (
              <div
                key={cat.label}
                className="relative"
                onMouseEnter={() => handleMouseEnter(cat.label)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  to={cat.href}
                  className={`flex items-center gap-1 px-3 py-3 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2 ${
                    openDropdown === cat.label
                      ? 'text-blue-600 border-blue-600'
                      : 'text-slate-700 border-transparent hover:text-blue-600 hover:border-blue-300'
                  }`}
                >
                  {cat.label}
                  <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${openDropdown === cat.label ? 'rotate-180' : ''}`} />
                </Link>

                {openDropdown === cat.label && (
                  <div
                    className="absolute top-full left-0 min-w-[220px] bg-white rounded-b-xl shadow-xl border border-t-0 border-slate-100 py-1.5 z-50"
                    onMouseEnter={() => handleMouseEnter(cat.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {cat.subcategories.map((sub) => (
                      <Link
                        key={sub.href + sub.label}
                        to={sub.href}
                        className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                          sub.featured
                            ? 'text-blue-600 font-semibold hover:bg-blue-50 border-t border-slate-100 mt-1 pt-2'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-blue-600'
                        }`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Services dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('services')}
              onMouseLeave={handleMouseLeave}
            >
              <Link
                to="/services"
                className={`flex items-center gap-1 px-3 py-3 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2 ${
                  openDropdown === 'services'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-700 border-transparent hover:text-blue-600 hover:border-blue-300'
                }`}
              >
                Services
                <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'services' ? 'rotate-180' : ''}`} />
              </Link>

              {openDropdown === 'services' && (
                <div
                  className="absolute top-full left-0 w-[260px] bg-white rounded-b-xl shadow-xl border border-t-0 border-slate-100 py-1.5 z-50"
                  onMouseEnter={() => handleMouseEnter('services')}
                  onMouseLeave={handleMouseLeave}
                >
                  {services.slice(0, 8).map((svc) => (
                    <Link
                      key={svc.id}
                      to="/services"
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <span className="text-slate-400">{serviceIconMap[svc.icon] || <Settings className="w-3.5 h-3.5" />}</span>
                      {svc.title}
                    </Link>
                  ))}
                  <Link
                    to="/services"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 font-semibold hover:bg-blue-50 border-t border-slate-100 mt-1 transition-colors"
                  >
                    View All Services
                  </Link>
                </div>
              )}
            </div>

            {/* More dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('more')}
              onMouseLeave={handleMouseLeave}
            >
              <button
                className={`flex items-center gap-1 px-3 py-3 text-[13px] font-medium whitespace-nowrap transition-colors border-b-2 ${
                  openDropdown === 'more'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-slate-700 border-transparent hover:text-blue-600 hover:border-blue-300'
                }`}
              >
                More
                <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === 'more' ? 'rotate-180' : ''}`} />
              </button>

              {openDropdown === 'more' && (
                <div
                  className="absolute top-full right-0 w-[200px] bg-white rounded-b-xl shadow-xl border border-t-0 border-slate-100 py-1.5 z-50"
                  onMouseEnter={() => handleMouseEnter('more')}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link to="/solutions" className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                    <Globe className="w-4 h-4 text-slate-400" /> Solutions
                  </Link>
                  <Link to="/brands" className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                    <LayoutGrid className="w-4 h-4 text-slate-400" /> Brands
                  </Link>
                  <Link to="/about" className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                    <Info className="w-4 h-4 text-slate-400" /> About Us
                  </Link>
                  <Link to="/contact" className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors">
                    <Phone className="w-4 h-4 text-slate-400" /> Contact Us
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-slate-100 max-h-[75vh] overflow-y-auto shadow-lg">
          <div className="px-4 py-3 space-y-0.5">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 pt-1 pb-2">Shop by Category</div>
            {navCategories.map((cat) => (
              <Link
                key={cat.label}
                to={cat.href}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <span className="text-slate-400">{cat.icon}</span>
                {cat.label}
              </Link>
            ))}

            <div className="border-t border-slate-100 pt-2 mt-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">Services</div>
              {services.slice(0, 5).map((svc) => (
                <Link
                  key={svc.id}
                  to="/services"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-2"
                >
                  <span className="text-slate-400">{serviceIconMap[svc.icon] || <Settings className="w-3.5 h-3.5" />}</span>
                  {svc.title}
                </Link>
              ))}
              <Link to="/services" className="block px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg ml-2">
                View All Services
              </Link>
            </div>

            <div className="border-t border-slate-100 pt-2 mt-2 space-y-0.5">
              <Link to="/solutions" className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                <Globe className="w-4 h-4 text-slate-400" /> Solutions
              </Link>
              <Link to="/brands" className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                <LayoutGrid className="w-4 h-4 text-slate-400" /> Brands
              </Link>
              <Link to="/about" className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                <Info className="w-4 h-4 text-slate-400" /> About Us
              </Link>
              <Link to="/contact" className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                <Phone className="w-4 h-4 text-slate-400" /> Contact Us
              </Link>
            </div>

            <Link
              to="/request-quote"
              className="block px-4 py-3 mt-3 text-sm font-semibold text-white bg-blue-600 rounded-lg text-center hover:bg-blue-700 transition-colors"
            >
              Request a Quote
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
