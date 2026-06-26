import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { SEO, generateBreadcrumbSchema, getCanonicalUrl } from '../components/SEO';
import { Breadcrumb } from '../components/Breadcrumb';
import { ProductGrid } from '../components/ProductGrid';
import { SearchBar } from '../components/SearchBar';
import { getCategoryBySlug, getRelatedCategories } from '../data/categories';
import { getProductsByCategory, getFeaturedProducts } from '../data/products';
import { getBrandsByCategory } from '../data/brands';
import { ChevronRight, Package, Shield, Truck, Headphones, Zap, Award, CheckCircle } from 'lucide-react';

const categorySeoContent: Record<string, { overview: string; features: string[]; keywords: string[] }> = {
  laptops: {
    overview: 'Discover our extensive collection of business laptops, gaming laptops, and ultrabooks from top brands like Dell, HP, Lenovo, and Microsoft. OSIL Ltd Kenya offers genuine laptops with manufacturer warranty, fast delivery across Nairobi, Mombasa, and all Kenyan counties. Perfect for remote work, business operations, education, and gaming.',
    features: ['Business laptops with Intel and AMD processors', 'Gaming laptops with NVIDIA RTX graphics', 'Ultrabooks for portability', 'Workstations for professionals', 'Touchscreen and 2-in-1 laptops', 'Budget-friendly options for students'],
    keywords: ['laptops Kenya', 'business laptops Nairobi', 'gaming laptops Kenya', 'Dell laptops', 'HP laptops', 'Lenovo laptops', 'laptop prices Kenya', 'laptop deals Kenya'],
  },
  desktops: {
    overview: 'Shop desktop computers for office, home, and gaming at OSIL Ltd Kenya. We offer tower desktops, all-in-one PCs, and mini PCs from Dell, HP, and Lenovo. Genuine products with warranty, expert setup support, and delivery across Kenya.',
    features: ['Tower desktops for expandability', 'All-in-one computers for space-saving', 'Mini PCs for compact workspaces', 'Gaming desktops with dedicated GPUs', 'Business desktops with enterprise features', 'Budget desktops for home use'],
    keywords: ['desktop computers Kenya', 'office desktops Nairobi', 'gaming PC Kenya', 'Dell OptiPlex', 'HP desktop', 'Lenovo ThinkCentre', 'desktop prices Kenya'],
  },
  servers: {
    overview: 'Enterprise servers and server solutions for data centers, virtualization, and business-critical applications. OSIL Ltd Kenya provides Dell PowerEdge, HP ProLiant, and other enterprise servers with warranty and professional installation services.',
    features: ['Tower servers for small businesses', 'Rack servers for data centers', 'Blade servers for density', 'Storage servers for archives', 'Virtualization-ready servers', 'Enterprise-grade components'],
    keywords: ['servers Kenya', 'enterprise servers Nairobi', 'Dell PowerEdge', 'HP ProLiant', 'data center servers Kenya', 'server prices Kenya', 'virtualization servers'],
  },
  phones: {
    overview: 'Shop the latest smartphones from Samsung, Apple, Xiaomi, Tecno, Infinix, and more at OSIL Ltd Kenya. Genuine phones with manufacturer warranty, competitive prices, and fast delivery across Kenya.',
    features: ['Flagship smartphones with premium features', 'Mid-range phones for value', 'Budget smartphones for everyday use', 'Business phones with enterprise features', 'Gaming phones with performance', '5G smartphones for connectivity'],
    keywords: ['smartphones Kenya', 'phones Nairobi', 'Samsung phones Kenya', 'iPhone Kenya', 'Xiaomi Kenya', 'Tecno phones', 'Infinix Kenya', 'phone prices Kenya'],
  },
  tablets: {
    overview: 'Discover tablets for productivity, education, and entertainment from Apple iPad, Samsung Galaxy Tab, Lenovo, and Microsoft Surface. Genuine products at OSIL Ltd Kenya with warranty and support.',
    features: ['Tablets for work and productivity', 'Educational tablets for schools', 'Entertainment tablets with great displays', '2-in-1 tablets with keyboards', 'Drawing tablets with stylus support', 'Kids tablets with parental controls'],
    keywords: ['tablets Kenya', 'iPad Kenya', 'Samsung tablets', 'Lenovo tablets', 'Microsoft Surface Kenya', 'tablet prices Kenya'],
  },
  printers: {
    overview: 'Office printers, multifunction devices, and large-format printers from HP, Epson, Brother, and Canon at OSIL Ltd Kenya. Laser and inkjet printers for businesses of all sizes with warranty and support.',
    features: ['Laser printers for high-volume printing', 'Inkjet printers for photos and graphics', 'Multifunction printers (print/scan/copy)', 'Wide-format printers for posters', 'Wireless printers for mobile printing', 'Enterprise printers with workflow features'],
    keywords: ['printers Kenya', 'office printers Nairobi', 'HP printers Kenya', 'Epson printers', 'laser printers Kenya', 'multifunction printers'],
  },
  networking: {
    overview: 'Enterprise networking equipment including routers, switches, access points, and firewalls from Cisco, Fortinet, Ubiquiti, and more. OSIL Ltd Kenya provides networking solutions for businesses across East Africa.',
    features: ['Enterprise routers and gateways', 'Managed switches for VLANs', 'WiFi access points for coverage', 'Firewalls for security', 'VPN gateways for remote access', 'Network accessories and cables'],
    keywords: ['networking equipment Kenya', 'Cisco Kenya', 'routers Nairobi', 'switches Kenya', 'WiFi access points', 'firewalls Kenya', 'Ubiquiti Kenya'],
  },
  storage: {
    overview: 'Enterprise storage solutions including NAS, SAN, external drives, and backup solutions at OSIL Ltd Kenya. Reliable storage from leading brands with warranty and expert support.',
    features: ['NAS for small business storage', 'SAN for enterprise data centers', 'External hard drives for backup', 'SSD upgrades for performance', 'RAID arrays for redundancy', 'Cloud storage gateways'],
    keywords: ['storage solutions Kenya', 'NAS Kenya', 'external drives Nairobi', 'SAN storage', 'backup solutions Kenya', 'enterprise storage'],
  },
  projectors: {
    overview: 'Business projectors, classroom projectors, and home theater projectors from Epson, Sony, and other leading brands at OSIL Ltd Kenya. High brightness, HD and 4K resolution options available.',
    features: ['Business projectors for presentations', 'Education projectors for classrooms', 'Home theater projectors', 'Portable projectors for travel', 'Short-throw projectors for small rooms', 'Laser projectors for longevity'],
    keywords: ['projectors Kenya', 'business projectors Nairobi', 'classroom projectors', 'home theater projectors Kenya', 'Epson projectors', 'projector prices Kenya'],
  },
  conferencing: {
    overview: 'Video conferencing systems, meeting room solutions, and collaboration equipment from Poly, Jabra, Yealink, and Logitech at OSIL Ltd Kenya. Hybrid work solutions for modern businesses.',
    features: ['Video bars for meeting rooms', 'Conference phones for audio clarity', 'Webcams for individual use', 'Headsets for remote work', 'Room scheduling displays', 'Complete room packages'],
    keywords: ['video conferencing Kenya', 'meeting room solutions Nairobi', 'Poly Kenya', 'Jabra headsets', 'Yealink phones', 'Zoom rooms Kenya', 'Teams rooms'],
  },
  accessories: {
    overview: 'IT accessories including keyboards, mice, monitors, docking stations, cables, and more at OSIL Ltd Kenya. Genuine accessories from Logitech, Dell, HP, and other top brands.',
    features: ['Keyboards for productivity', 'Mice for precision and comfort', 'Monitors for expanded workspace', 'Docking stations for laptops', 'Cables and adapters', 'Laptop stands and ergonomics'],
    keywords: ['IT accessories Kenya', 'keyboards Nairobi', 'computer mice', 'monitors Kenya', 'docking stations', 'Logitech Kenya'],
  },
  software: {
    overview: 'Genuine software licenses including Microsoft Windows, Office 365, antivirus, and enterprise software at OSIL Ltd Kenya. Authorized Microsoft partner with volume licensing available.',
    features: ['Windows operating systems', 'Microsoft Office suites', 'Antivirus and security software', 'Backup and recovery software', 'Virtualization licenses', 'Cloud service subscriptions'],
    keywords: ['software Kenya', 'Microsoft licenses Nairobi', 'Windows 11 Kenya', 'Office 365 Kenya', 'antivirus Kenya', 'volume licensing'],
  },
  security: {
    overview: 'Security solutions including CCTV cameras, surveillance systems, access control, and cybersecurity products at OSIL Ltd Kenya. Protect your business with enterprise-grade security.',
    features: ['IP cameras for surveillance', 'NVR systems for recording', 'Access control systems', 'Intruder alarms', 'Video intercoms', 'Cybersecurity appliances'],
    keywords: ['CCTV Kenya', 'security cameras Nairobi', 'surveillance systems Kenya', 'access control', 'Hikvision Kenya', 'Dahua Kenya'],
  },
  workstations: {
    overview: 'Professional workstations for CAD, video editing, 3D modeling, and data science at OSIL Ltd Kenya. HP Z Workstation, Dell Precision, and Lenovo ThinkStation with ISV certification.',
    features: ['CAD workstations for engineering', 'Video editing workstations', '3D rendering workstations', 'Data science workstations', 'ISV-certified systems', 'Multi-GPU configurations'],
    keywords: ['workstations Kenya', 'CAD workstations Nairobi', 'HP Z Workstation', 'Dell Precision', 'video editing PC Kenya', 'workstation prices Kenya'],
  },
};

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const category = getCategoryBySlug(slug || '');
  const [query, setQuery] = useState('');

  const seoData = useMemo(() => {
    if (!category) return null;

    const seoContent = categorySeoContent[slug || ''] || categorySeoContent.laptops;
    const title = `${category.name} | ${category.name} Kenya | OSIL Ltd Electronics`;
    const description = `${category.description} Shop genuine ${category.name.toLowerCase()} at OSIL Ltd Kenya with warranty, fast delivery, and expert support.`;
    const canonicalUrl = getCanonicalUrl(`/category/${category.slug}`);

    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://osil.co.ke' },
      { name: 'Products', url: 'https://osil.co.ke/products' },
      { name: category.name, url: canonicalUrl },
    ]);

    return { title, description, keywords: seoContent.keywords, canonicalUrl, breadcrumbSchema, seoContent };
  }, [category, slug]);

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Category Not Found</h1>
        <p className="text-slate-500 mb-6">The category you are looking for does not exist.</p>
        <Link to="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }

  const products = getProductsByCategory(slug || '').filter((p) =>
    query ? p.name.toLowerCase().includes(query.toLowerCase()) || p.brand.toLowerCase().includes(query.toLowerCase()) : true
  );
  const brands = getBrandsByCategory(slug || '');
  const relatedCats = getRelatedCategories(slug || '');
  const featuredInCategory = products.filter(p => p.isFeatured).slice(0, 4);
  const seoContent = seoData?.seoContent || categorySeoContent.laptops;

  return (
    <>
      <SEO meta={{
        title: seoData?.title || `${category.name} | OSIL Ltd`,
        description: seoData?.description || category.description,
        keywords: seoData?.keywords || [category.name, 'products', 'Kenya', 'OSIL'],
        canonicalUrl: seoData?.canonicalUrl,
        ogType: 'website',
        ogImage: category.image,
      }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData?.breadcrumbSchema) }} />

      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src={category.image} alt={`${category.name} at OSIL Ltd Kenya`} className="w-full h-full object-cover opacity-30" loading="lazy" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <Breadcrumb crumbs={[
            { label: 'Products', path: '/products' },
            { label: category.name },
          ]} />
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">{category.name} Kenya</h1>
          <p className="text-lg text-slate-300 max-w-2xl">{category.description}</p>
          <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
            <span>{products.length} products</span>
            <span>|</span>
            <span>{brands.length} brands</span>
            <span>|</span>
            <span>Authorized dealer</span>
          </div>
        </div>
      </section>

      <section className="py-8 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-slate-900 mb-3">About {category.name} at OSIL Ltd Kenya</h2>
          <p className="text-slate-600 leading-relaxed mb-4">{seoContent.overview}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {seoContent.features.slice(0, 6).map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {brands.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Shop {category.name} by Brand</h2>
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => (
                  <Link key={b.id} to={`/brand/${b.slug}`} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors">
                    {b.name} <span className="text-slate-400">({b.productCount})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {featuredInCategory.length > 0 && (
            <div className="mb-8 bg-slate-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-900">Featured {category.name}</h2>
                <span className="text-xs text-slate-500">Hand-picked top products</span>
              </div>
              <ProductGrid products={featuredInCategory} />
            </div>
          )}

          <div className="mb-6">
            <SearchBar initialValue={query} onSearch={setQuery} placeholder={`Search in ${category.name}...`} />
          </div>

          <ProductGrid products={products} emptyMessage={`No products found in ${category.name}.`} />

          {relatedCats.length > 0 && (
            <div className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Related Categories</h2>
              <div className="flex flex-wrap gap-3">
                {relatedCats.map((c) => (
                  <Link key={c.id} to={`/category/${c.slug}`} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors">
                    {c.name} <ChevronRight className="w-3 h-3 inline ml-1" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-8 bg-blue-50 border-t border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 text-center">Why Shop {category.name} at OSIL Ltd Kenya?</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: <Package className="w-5 h-5" />, title: 'Genuine Products', desc: 'Authorized dealer' },
              { icon: <Shield className="w-5 h-5" />, title: 'Local Warranty', desc: 'Kenya coverage' },
              { icon: <Truck className="w-5 h-5" />, title: 'Fast Delivery', desc: 'All counties' },
              { icon: <Headphones className="w-5 h-5" />, title: 'Expert Support', desc: 'Certified team' },
              { icon: <Zap className="w-5 h-5" />, title: 'Best Prices', desc: 'Competitive rates' },
              { icon: <Award className="w-5 h-5" />, title: '15+ Years', desc: 'Experience' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-10 h-10 mx-auto bg-blue-600 text-white rounded-lg flex items-center justify-center mb-2">{item.icon}</div>
                <div className="text-xs font-semibold text-slate-900">{item.title}</div>
                <div className="text-xs text-slate-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-slate-900">Need Help Choosing {category.name}?</h2>
            <p className="text-sm text-slate-500">Our experts are ready to help you find the right {category.name.toLowerCase()} for your needs.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Contact Us
            </Link>
            <Link to="/request-quote" className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors">
              Request a Quote
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
