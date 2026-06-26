import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Shield, Truck, Headphones, Zap, Star,
  Laptop, Monitor, Cpu, Server, Smartphone, Tablet, Printer, Wifi,
  HardDrive, Projector, Video, Plug, Code,
  Lightbulb, Settings, Database, Cloud, Wrench, ChevronDown,
  CheckCircle, BadgeCheck, ArrowUpRight, Play
} from 'lucide-react';
import { SEO, generateOrganizationSchema, getCanonicalUrl } from '../components/SEO';
import { ProductGrid } from '../components/ProductGrid';
import { getFeaturedProducts, getNewArrivals, getBestSellers } from '../data/products';
import { categories } from '../data/categories';
import { allBrands } from '../data/brands';
import { services } from '../data/services';
import { solutions } from '../data/solutions';
import { testimonials } from '../data/testimonials';
import { clientLogos, techPartners, industries, companyStats } from '../data/company';

const categoryIconMap: Record<string, React.ReactNode> = {
  Laptop: <Laptop className="w-5 h-5" />,
  Monitor: <Monitor className="w-5 h-5" />,
  Cpu: <Cpu className="w-5 h-5" />,
  Server: <Server className="w-5 h-5" />,
  Smartphone: <Smartphone className="w-5 h-5" />,
  Tablet: <Tablet className="w-5 h-5" />,
  Printer: <Printer className="w-5 h-5" />,
  Wifi: <Wifi className="w-5 h-5" />,
  HardDrive: <HardDrive className="w-5 h-5" />,
  Projector: <Projector className="w-5 h-5" />,
  Video: <Video className="w-5 h-5" />,
  Plug: <Plug className="w-5 h-5" />,
  Code: <Code className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
};

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  laptops: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  desktops: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  workstations: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  servers: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
  phones: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100' },
  tablets: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100' },
  printers: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
  networking: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'border-teal-100' },
  storage: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
  projectors: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100' },
  conferencing: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-100' },
  accessories: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' },
  software: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
  security: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
};

const serviceIcons: Record<string, React.ReactNode> = {
  'Lightbulb': <Lightbulb className="w-5 h-5" />,
  'Server': <Server className="w-5 h-5" />,
  'Settings': <Settings className="w-5 h-5" />,
  'Wifi': <Wifi className="w-5 h-5" />,
  'Database': <Database className="w-5 h-5" />,
  'Cloud': <Cloud className="w-5 h-5" />,
  'Shield': <Shield className="w-5 h-5" />,
  'Monitor': <Monitor className="w-5 h-5" />,
  'Video': <Video className="w-5 h-5" />,
  'Wrench': <Wrench className="w-5 h-5" />,
};

const brandColorMap: Record<string, string> = {
  samsung: 'bg-blue-600',
  apple: 'bg-gray-800',
  xiaomi: 'bg-orange-500',
  redmi: 'bg-red-500',
  oppo: 'bg-green-600',
  vivo: 'bg-blue-700',
  tecno: 'bg-teal-500',
  infinix: 'bg-amber-500',
  nokia: 'bg-cyan-600',
  honor: 'bg-indigo-500',
  oneplus: 'bg-red-600',
  'google-pixel': 'bg-sky-500',
  'apple-ipad': 'bg-gray-700',
  'samsung-galaxy-tab': 'bg-blue-500',
  'lenovo-tablets': 'bg-red-600',
  'xiaomi-pad': 'bg-orange-600',
  'huawei-matepad': 'bg-red-700',
  'microsoft-surface': 'bg-sky-600',
  dell: 'bg-blue-600',
  hp: 'bg-blue-500',
  lenovo: 'bg-red-600',
  cisco: 'bg-sky-600',
  apc: 'bg-amber-600',
  epson: 'bg-blue-800',
  brother: 'bg-green-600',
  logitech: 'bg-blue-500',
  microsoft: 'bg-sky-600',
  poly: 'bg-indigo-600',
  jabra: 'bg-teal-600',
  yealink: 'bg-emerald-600',
  hikvision: 'bg-red-700',
  dahua: 'bg-orange-600',
  ubiquiti: 'bg-blue-700',
  fortinet: 'bg-red-700',
};

export function Home() {
  const featuredProducts = getFeaturedProducts().slice(0, 4);
  const newArrivals = getNewArrivals().slice(0, 4);
  const bestSellers = getBestSellers().slice(0, 4);
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const organizationSchema = useMemo(() => generateOrganizationSchema(), []);

  return (
    <>
      <SEO meta={{
        title: 'OSIL Ltd - ICT Solutions & Electronics | Kenya',
        description: 'OSIL Ltd is a leading ICT solutions provider in Kenya, offering laptops, desktops, phones, servers, networking equipment, and professional IT services for enterprises and consumers across East Africa.',
        keywords: ['OSIL', 'ICT solutions', 'Kenya', 'laptops', 'phones', 'servers', 'networking', 'IT services', 'Nairobi', 'Dell', 'HP', 'Lenovo', 'Cisco', 'electronics', 'enterprise solutions'],
        canonicalUrl: getCanonicalUrl('/'),
        ogType: 'website',
        structuredData: organizationSchema,
      }} />

      {/* Category Quick Bar — small icons, one row, above hero */}
      <section className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
            {categories.map((cat) => {
              const colors = categoryColors[cat.slug] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' };
              return (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg border ${colors.border} bg-white hover:shadow-sm transition-all shrink-0`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg} ${colors.text} group-hover:scale-105 transition-transform`}>
                    {categoryIconMap[cat.icon] || <Laptop className="w-4 h-4" />}
                  </div>
                  <div className="leading-none">
                    <div className="text-xs font-semibold text-slate-900 group-hover:text-brand-blue transition-colors whitespace-nowrap">{cat.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{cat.productCount} products</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Minimal Hero */}
      <section className="relative bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 py-10 lg:py-14">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-blue-pale text-brand-blue text-xs font-semibold rounded-full mb-4">
                <BadgeCheck className="w-3.5 h-3.5" /> Authorized Dealer in Kenya
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight mb-3">
                Quality Tech Products, <span className="text-brand-blue">Delivered to You</span>
              </h1>
              <p className="text-sm text-slate-500 mb-5 max-w-lg mx-auto lg:mx-0">
                Laptops, phones, servers, and accessories from global brands. Shop online or request a quote for your business.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <Link to="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue text-white text-sm font-semibold rounded-lg hover:bg-brand-blue-dark transition-colors">
                  Shop Products <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/request-quote" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:border-brand-blue hover:text-brand-blue transition-colors">
                  Request a Quote
                </Link>
              </div>
              <div className="flex items-center justify-center lg:justify-start gap-5 mt-5 text-xs text-slate-400">
                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-brand-green" /> Genuine Products</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-brand-green" /> Kenya Warranty</span>
                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-brand-green" /> Fast Delivery</span>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex-shrink-0">
              <div className="relative w-72 h-52 lg:w-96 lg:h-64 rounded-2xl overflow-hidden shadow-2xl">
                <img src="https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800" alt="Products" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 text-white text-sm font-semibold">
                    <Play className="w-4 h-4 fill-white" /> Browse 77+ Products
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
            {companyStats.map((stat) => (
              <div key={stat.id} className="text-center">
                <div className="text-xl lg:text-2xl font-bold text-brand-blue">{stat.value}{stat.suffix}</div>
                <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Featured Products</h2>
              <p className="text-xs text-slate-400 mt-0.5">Hand-picked top deals for you</p>
            </div>
            <Link to="/products" className="text-xs font-medium text-brand-blue hover:text-brand-blue-dark flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">New Arrivals</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest products just landed</p>
            </div>
            <Link to="/products" className="text-xs font-medium text-brand-blue hover:text-brand-blue-dark flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ProductGrid products={newArrivals} />
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Best Sellers</h2>
              <p className="text-xs text-slate-400 mt-0.5">Most popular among our customers</p>
            </div>
            <Link to="/products" className="text-xs font-medium text-brand-blue hover:text-brand-blue-dark flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <ProductGrid products={bestSellers} />
        </div>
      </section>

      {/* Featured Brands — single row, text-style logos */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Featured Brands</h2>
            <p className="text-xs text-slate-400 mt-1">Authorized dealer for leading brands</p>
          </div>
          <div className="flex items-center justify-center flex-wrap gap-3 lg:gap-4">
            {allBrands.slice(0, 16).map((brand) => {
              const colorClass = brandColorMap[brand.slug] || 'bg-slate-500';
              return (
                <Link
                  key={brand.id}
                  to={`/brand/${brand.slug}`}
                  className="group flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-lg hover:border-brand-blue/20 hover:shadow-sm transition-all"
                >
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-white font-bold text-[10px] ${colorClass}`}>
                    {brand.name.slice(0, 1)}
                  </div>
                  <span className="text-sm font-semibold text-slate-700 group-hover:text-brand-blue transition-colors whitespace-nowrap">{brand.name}</span>
                  <span className="text-[10px] text-slate-400 bg-white border border-slate-100 px-1.5 py-0.5 rounded">{brand.productCount}</span>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-5">
            <Link to="/brands" className="inline-flex items-center gap-1 text-xs font-medium text-brand-blue hover:text-brand-blue-dark transition-colors">
              View All Brands <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose OSIL */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Why Choose OSIL</h2>
            <p className="text-xs text-slate-400 mt-1">Trusted by 1,200+ businesses across Kenya</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: <Shield className="w-5 h-5" />, title: 'Genuine Products', desc: 'Sourced directly from authorized distributors with full warranties.', color: 'text-blue-600 bg-blue-50' },
              { icon: <Truck className="w-5 h-5" />, title: 'Fast Delivery', desc: 'Same-day in Nairobi. Nationwide shipping to all counties.', color: 'text-emerald-600 bg-emerald-50' },
              { icon: <Headphones className="w-5 h-5" />, title: 'Expert Support', desc: 'Certified technicians for installation, training, and ongoing support.', color: 'text-sky-600 bg-sky-50' },
              { icon: <Zap className="w-5 h-5" />, title: 'Best Prices', desc: 'Competitive pricing with flexible terms for enterprise orders.', color: 'text-amber-600 bg-amber-50' },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${item.color}`}>{item.icon}</div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Overview - Compact */}
      <section className="py-10 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Our Services</h2>
              <p className="text-xs text-slate-400 mt-0.5">Beyond products — we deliver complete solutions</p>
            </div>
            <Link to="/services" className="text-xs font-medium text-brand-blue hover:text-brand-blue-dark flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {services.slice(0, 5).map((svc) => (
              <div
                key={svc.id}
                className="group border border-slate-100 rounded-xl p-4 hover:shadow-md hover:border-brand-blue/20 transition-all cursor-pointer"
                onClick={() => setExpandedService(expandedService === svc.id ? null : svc.id)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-blue-pale text-brand-blue flex items-center justify-center flex-shrink-0">
                    {serviceIcons[svc.icon] || <Settings className="w-4 h-4" />}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-brand-blue transition-colors">{svc.title}</h3>
                </div>
                <p className="text-xs text-slate-500 mb-2">{svc.shortDescription}</p>
                <div className="flex items-center gap-1 text-xs text-brand-blue font-medium">
                  <span>Learn more</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${expandedService === svc.id ? 'rotate-180' : ''}`} />
                </div>
                {expandedService === svc.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t border-slate-100">
                    <ul className="space-y-1">
                      {svc.features.slice(0, 4).map((f, j) => (
                        <li key={j} className="flex items-center gap-1.5 text-xs text-slate-500">
                          <CheckCircle className="w-3 h-3 text-brand-green" /> {f}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Overview */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Solutions by Industry</h2>
            <p className="text-xs text-slate-400 mt-1">Tailored packages for your sector</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {solutions.map((sol) => (
              <Link key={sol.id} to={`/solutions`} className="group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-32 bg-slate-100 overflow-hidden">
                  <img src={sol.image} alt={sol.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-brand-blue transition-colors">{sol.title}</h3>
                  <p className="text-xs text-slate-500 mb-2">{sol.shortDescription}</p>
                  <div className="flex items-center gap-1 text-xs text-brand-blue font-medium">
                    Explore <ArrowUpRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Industries We Serve */}
      <section className="py-10 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-5">
            <h2 className="text-xl font-bold text-slate-900">Industries We Serve</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {industries.map((ind) => (
              <div key={ind.id} className="bg-white border border-slate-100 rounded-xl p-3 text-center hover:shadow-sm transition-shadow">
                <div className="text-sm font-semibold text-slate-900">{ind.name}</div>
                <p className="text-xs text-slate-400 mt-0.5">{ind.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Client Logos */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-5">
            <h2 className="text-base font-bold text-slate-900">Trusted By Leading Organizations</h2>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
            {clientLogos.map((cl) => (
              <div key={cl.id} className="flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-colors">
                <div className="w-8 h-8 bg-slate-200 rounded flex items-center justify-center text-xs font-bold text-slate-600">{cl.name.slice(0, 1)}</div>
                <span className="text-sm font-medium hidden sm:inline">{cl.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">What Our Clients Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testimonials.slice(0, 3).map((t) => (
              <div key={t.id} className="bg-white border border-slate-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < t.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                  ))}
                </div>
                <p className="text-sm text-slate-600 mb-3 leading-relaxed">{t.content}</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden">
                    <img src={t.avatar} alt={t.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}, {t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Partners — single row with text-style logos */}
      <section className="py-8 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-5">
            <h2 className="text-base font-bold text-slate-900">Our Technology Partners</h2>
          </div>
          <div className="flex items-center justify-center flex-wrap gap-3 lg:gap-4">
            {techPartners.map((tp) => {
              const colorClass = brandColorMap[tp.name.toLowerCase()] || brandColorMap[tp.name.toLowerCase().replace(' ', '-')] || 'bg-slate-500';
              return (
                <div key={tp.id} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 hover:border-brand-blue/20 transition-colors">
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-white font-bold text-[10px] ${colorClass}`}>
                    {tp.name.slice(0, 1)}
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{tp.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 bg-brand-blue">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Order?</h2>
          <p className="text-sm text-blue-100 mb-6">Get a personalized quote or speak to our sales team. We deliver anywhere in Kenya.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/request-quote" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-blue text-sm font-semibold rounded-lg hover:bg-blue-50 transition-colors">
              Request a Quote <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue-dark text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors border border-blue-400">
              Contact Us <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
