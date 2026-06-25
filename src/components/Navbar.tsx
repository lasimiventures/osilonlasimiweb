import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, ShoppingCart, Search, Laptop, Monitor, Cpu, Server, Smartphone, Tablet, Printer, Wifi, HardDrive, Projector, Video, Plug, Code, Shield, LayoutGrid, ChevronRight } from 'lucide-react';
import { useQuote } from '../context/QuoteContext';
import { categories } from '../data/categories';
import { services } from '../data/services';

const categoryIcons: Record<string, React.ReactNode> = {
  Laptop: <Laptop className="w-4 h-4" />,
  Monitor: <Monitor className="w-4 h-4" />,
  Cpu: <Cpu className="w-4 h-4" />,
  Server: <Server className="w-4 h-4" />,
  Smartphone: <Smartphone className="w-4 h-4" />,
  Tablet: <Tablet className="w-4 h-4" />,
  Printer: <Printer className="w-4 h-4" />,
  Wifi: <Wifi className="w-4 h-4" />,
  HardDrive: <HardDrive className="w-4 h-4" />,
  Projector: <Projector className="w-4 h-4" />,
  Video: <Video className="w-4 h-4" />,
  Plug: <Plug className="w-4 h-4" />,
  Code: <Code className="w-4 h-4" />,
  Shield: <Shield className="w-4 h-4" />,
};

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const { itemCount } = useQuote();

  useEffect(() => {
    setIsOpen(false);
    setProductsOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md' : 'bg-white/90 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/Osil_Logo.jpg" alt="OSIL Ltd" className="h-10 w-auto" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5">
            <Link to="/" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-blue rounded-md transition-colors">Home</Link>

            {/* Products Mega Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-brand-blue bg-brand-blue-pale rounded-md transition-colors">
                <LayoutGrid className="w-4 h-4" /> Products <ChevronDown className={`w-3 h-3 transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
              </button>
              {productsOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-[640px] bg-white rounded-xl shadow-xl border border-slate-100 py-3 mt-1 z-50">
                  <div className="px-4 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Shop by Category</div>
                  <div className="grid grid-cols-3 gap-0.5 px-3">
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        to={`/category/${cat.slug}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-brand-blue-pale hover:text-brand-blue rounded-lg transition-colors"
                      >
                        <span className="text-slate-400">{categoryIcons[cat.icon] || <Laptop className="w-4 h-4" />}</span>
                        <span className="truncate">{cat.name}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 mt-2 pt-2 px-3">
                    <Link to="/products" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-brand-blue hover:bg-brand-blue-pale rounded-lg transition-colors">
                      <Search className="w-4 h-4" /> Browse All Products
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* More Dropdown - Services, Solutions, Brands, About, Contact */}
            <div
              className="relative"
              onMouseEnter={() => setMoreOpen(true)}
              onMouseLeave={() => setMoreOpen(false)}
            >
              <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-blue rounded-md transition-colors">
                More <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              {moreOpen && (
                <div className="absolute top-full right-0 w-64 bg-white rounded-xl shadow-xl border border-slate-100 py-2 mt-1 z-50">
                  <div className="border-b border-slate-100 pb-2 mb-2">
                    <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">Services</div>
                    {services.map((svc) => (
                      <Link key={svc.id} to="/services" className="flex items-center gap-2 px-4 py-1.5 text-sm text-slate-700 hover:bg-brand-blue-pale hover:text-brand-blue transition-colors">
                        {svc.title}
                      </Link>
                    ))}
                    <Link to="/services" className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-brand-blue hover:bg-brand-blue-pale transition-colors">
                      <ChevronRight className="w-3 h-3" /> View All Services
                    </Link>
                  </div>
                  <Link to="/solutions" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-brand-blue-pale hover:text-brand-blue transition-colors">
                    <Shield className="w-4 h-4 text-slate-400" /> Solutions
                  </Link>
                  <Link to="/brands" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-brand-blue-pale hover:text-brand-blue transition-colors">
                    <LayoutGrid className="w-4 h-4 text-slate-400" /> Brands
                  </Link>
                  <Link to="/about" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-brand-blue-pale hover:text-brand-blue transition-colors">
                    <Cpu className="w-4 h-4 text-slate-400" /> About Us
                  </Link>
                  <Link to="/contact" className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-brand-blue-pale hover:text-brand-blue transition-colors">
                    <Wifi className="w-4 h-4 text-slate-400" /> Contact Us
                  </Link>
                </div>
              )}
            </div>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Link to="/products" className="hidden sm:flex items-center justify-center w-9 h-9 text-slate-500 hover:text-brand-blue rounded-full hover:bg-brand-blue-pale transition-colors" aria-label="Search">
              <Search className="w-5 h-5" />
            </Link>
            <Link to="/quote-cart" className="relative flex items-center justify-center w-9 h-9 text-slate-500 hover:text-brand-blue rounded-full hover:bg-brand-blue-pale transition-colors" aria-label="Quote Cart">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-blue text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </Link>
            <Link to="/request-quote" className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-lg hover:bg-brand-blue-dark transition-colors">
              Request Quote
            </Link>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden flex items-center justify-center w-9 h-9 text-slate-600 hover:text-brand-blue rounded-md hover:bg-brand-blue-pale transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-white border-t border-slate-100 max-h-[calc(100vh-80px)] overflow-y-auto">
          <div className="px-4 py-3 space-y-1">
            <Link to="/" className="block px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-blue hover:bg-brand-blue-pale rounded-md">Home</Link>
            <Link to="/products" className="block px-3 py-2 text-sm font-medium text-brand-blue bg-brand-blue-pale rounded-md">All Products</Link>
            <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">Categories</div>
            {categories.map((cat) => (
              <Link key={cat.id} to={`/category/${cat.slug}`} className="block px-3 py-2 text-sm text-slate-600 hover:text-brand-blue hover:bg-brand-blue-pale rounded-md ml-3">
                {cat.name}
              </Link>
            ))}
            <div className="border-t border-slate-100 mt-2 pt-2">
              <Link to="/services" className="block px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-blue hover:bg-brand-blue-pale rounded-md">Services</Link>
              <Link to="/solutions" className="block px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-blue hover:bg-brand-blue-pale rounded-md">Solutions</Link>
              <Link to="/brands" className="block px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-blue hover:bg-brand-blue-pale rounded-md">Brands</Link>
              <Link to="/about" className="block px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-blue hover:bg-brand-blue-pale rounded-md">About Us</Link>
              <Link to="/contact" className="block px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-blue hover:bg-brand-blue-pale rounded-md">Contact</Link>
            </div>
            <Link to="/request-quote" className="block px-3 py-2 text-sm font-medium text-white bg-brand-blue rounded-md text-center mt-2">Request Quote</Link>
          </div>
        </div>
      )}
    </header>
  );
}
