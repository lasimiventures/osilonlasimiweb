import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { SEO, generateBreadcrumbSchema, getCanonicalUrl } from '../components/SEO';
import { Breadcrumb } from '../components/Breadcrumb';
import { ProductGrid } from '../components/ProductGrid';
import { FilterSidebar } from '../components/FilterSidebar';
import { useCatalog } from '../context/CatalogContext';
import { ChevronRight, Package, Shield, Truck, Headphones, Zap, Award, CheckCircle } from 'lucide-react';

const categoryBannerImages: Record<string, string> = {
  laptops: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1600',
  desktops: 'https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=1600',
  servers: 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=1600',
  phones: 'https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=1600',
  tablets: 'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=1600',
  printers: 'https://images.pexels.com/photos/4792717/pexels-photo-4792717.jpeg?auto=compress&cs=tinysrgb&w=1600',
  networking: 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=1600',
  storage: 'https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&w=1600',
  projectors: 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=1600',
  conferencing: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=1600',
  accessories: 'https://images.pexels.com/photos/129208/pexels-photo-129208.jpeg?auto=compress&cs=tinysrgb&w=1600',
  software: 'https://images.pexels.com/photos/177598/pexels-photo-177598.jpeg?auto=compress&cs=tinysrgb&w=1600',
  security: 'https://images.pexels.com/photos/96612/pexels-photo-96612.jpeg?auto=compress&cs=tinysrgb&w=1600',
  workstations: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1600',
};

const categorySeoContent: Record<string, { overview: string; features: string[]; keywords: string[] }> = {
  laptops: {
    overview: 'Business laptops, gaming laptops, and ultrabooks from Dell, HP, Lenovo, and Microsoft. Genuine products with warranty and fast delivery across Kenya.',
    features: ['Business laptops with Intel/AMD', 'Gaming laptops with NVIDIA RTX', 'Ultrabooks for portability', 'Workstations for professionals', 'Touchscreen & 2-in-1 laptops', 'Budget options for students'],
    keywords: ['laptops Kenya', 'business laptops Nairobi', 'gaming laptops Kenya', 'Dell laptops', 'HP laptops', 'Lenovo laptops', 'laptop prices Kenya'],
  },
  desktops: {
    overview: 'Desktop computers for office, home, and gaming. Tower desktops, all-in-one PCs, and mini PCs from Dell, HP, and Lenovo with warranty.',
    features: ['Tower desktops', 'All-in-one computers', 'Mini PCs', 'Gaming desktops', 'Business desktops', 'Budget desktops'],
    keywords: ['desktop computers Kenya', 'office desktops Nairobi', 'gaming PC Kenya', 'Dell OptiPlex', 'HP desktop', 'desktop prices Kenya'],
  },
  servers: {
    overview: 'Enterprise servers for data centers, virtualization, and business applications. Dell PowerEdge, HP ProLiant with warranty and installation.',
    features: ['Tower servers', 'Rack servers', 'Blade servers', 'Storage servers', 'Virtualization-ready', 'Enterprise components'],
    keywords: ['servers Kenya', 'enterprise servers Nairobi', 'Dell PowerEdge', 'HP ProLiant', 'data center servers Kenya'],
  },
  phones: {
    overview: 'Smartphones from Samsung, Apple, Xiaomi, Tecno, Infinix. Genuine phones with warranty and competitive prices.',
    features: ['Flagship smartphones', 'Mid-range phones', 'Budget smartphones', 'Business phones', 'Gaming phones', '5G smartphones'],
    keywords: ['smartphones Kenya', 'phones Nairobi', 'Samsung phones Kenya', 'iPhone Kenya', 'Xiaomi Kenya', 'Tecno phones'],
  },
  tablets: {
    overview: 'Tablets for productivity, education, and entertainment. Apple iPad, Samsung Galaxy Tab, Lenovo, Microsoft Surface with warranty.',
    features: ['Work tablets', 'Educational tablets', 'Entertainment tablets', '2-in-1 tablets', 'Drawing tablets', 'Kids tablets'],
    keywords: ['tablets Kenya', 'iPad Kenya', 'Samsung tablets', 'Lenovo tablets', 'Microsoft Surface Kenya'],
  },
  printers: {
    overview: 'Office printers, multifunction devices, and large-format printers. HP, Epson, Brother laser and inkjet printers with warranty.',
    features: ['Laser printers', 'Inkjet printers', 'Multifunction printers', 'Wide-format printers', 'Wireless printers', 'Enterprise printers'],
    keywords: ['printers Kenya', 'office printers Nairobi', 'HP printers Kenya', 'Epson printers', 'laser printers Kenya'],
  },
  networking: {
    overview: 'Enterprise networking equipment - routers, switches, access points, firewalls. Cisco, Fortinet, Ubiquiti solutions for businesses.',
    features: ['Enterprise routers', 'Managed switches', 'WiFi access points', 'Firewalls', 'VPN gateways', 'Network accessories'],
    keywords: ['networking equipment Kenya', 'Cisco Kenya', 'routers Nairobi', 'switches Kenya', 'WiFi access points', 'Ubiquiti Kenya'],
  },
  storage: {
    overview: 'Enterprise storage solutions - NAS, SAN, external drives, backup solutions. Reliable storage with warranty and expert support.',
    features: ['NAS storage', 'SAN solutions', 'External drives', 'SSD upgrades', 'RAID arrays', 'Cloud gateways'],
    keywords: ['storage solutions Kenya', 'NAS Kenya', 'external drives Nairobi', 'SAN storage', 'backup solutions Kenya'],
  },
  security: {
    overview: 'Security solutions - CCTV cameras, surveillance systems, access control, cybersecurity. Hikvision, Dahua enterprise-grade security.',
    features: ['IP cameras', 'NVR systems', 'Access control', 'Intruder alarms', 'Video intercoms', 'Cybersecurity appliances'],
    keywords: ['CCTV Kenya', 'security cameras Nairobi', 'surveillance systems Kenya', 'Hikvision Kenya', 'Dahua Kenya'],
  },
  accessories: {
    overview: 'IT accessories - keyboards, mice, monitors, docking stations, cables. Logitech, Dell, HP genuine accessories with warranty.',
    features: ['Keyboards', 'Mice', 'Monitors', 'Docking stations', 'Cables & adapters', 'Laptop stands'],
    keywords: ['IT accessories Kenya', 'keyboards Nairobi', 'monitors Kenya', 'docking stations', 'Logitech Kenya'],
  },
  software: {
    overview: 'Genuine software licenses - Microsoft Windows, Office 365, antivirus, enterprise software. Authorized Microsoft partner.',
    features: ['Windows OS', 'Microsoft Office', 'Antivirus software', 'Backup software', 'Virtualization licenses', 'Cloud services'],
    keywords: ['software Kenya', 'Microsoft licenses Nairobi', 'Windows 11 Kenya', 'Office 365 Kenya', 'antivirus Kenya'],
  },
  workstations: {
    overview: 'Professional workstations for CAD, video editing, 3D modeling. HP Z, Dell Precision, Lenovo ThinkStation with ISV certification.',
    features: ['CAD workstations', 'Video editing', '3D rendering', 'Data science', 'ISV-certified', 'Multi-GPU configs'],
    keywords: ['workstations Kenya', 'CAD workstations Nairobi', 'HP Z Workstation', 'Dell Precision', 'workstation prices Kenya'],
  },
  projectors: {
    overview: 'Business, classroom, and home theater projectors. Epson, Sony with high brightness and HD/4K resolution options.',
    features: ['Business projectors', 'Education projectors', 'Home theater', 'Portable projectors', 'Short-throw', 'Laser projectors'],
    keywords: ['projectors Kenya', 'business projectors Nairobi', 'classroom projectors', 'Epson projectors', 'projector prices Kenya'],
  },
  conferencing: {
    overview: 'Video conferencing systems and meeting room solutions. Poly, Jabra, Yealink, Logitech for hybrid work environments.',
    features: ['Video bars', 'Conference phones', 'Webcams', 'Headsets', 'Room scheduling', 'Complete room packages'],
    keywords: ['video conferencing Kenya', 'meeting room solutions Nairobi', 'Poly Kenya', 'Jabra headsets', 'Yealink phones'],
  },
};

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { getCategoryBySlug, getRelatedCategories, getProductsByCategory, getBrandsByCategory, loading } = useCatalog();
  const category = getCategoryBySlug(slug || '');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedAvailability, setSelectedAvailability] = useState<string | null>(null);

  const seoData = useMemo(() => {
    if (!category) return null;

    const seoContent = categorySeoContent[slug || ''] || categorySeoContent.laptops;
    const title = `${category.name} | Buy ${category.name} in Kenya | OSIL Ltd Kenya`;
    const description = `Shop ${category.name.toLowerCase()} in Kenya at OSIL Ltd. ${category.description} Genuine products with warranty, fast delivery Nairobi Kenya-wide.`;
    const canonicalUrl = getCanonicalUrl(`/category/${category.slug}`);

    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://osil.co.ke' },
      { name: 'Products', url: 'https://osil.co.ke/products' },
      { name: category.name, url: canonicalUrl },
    ]);

    return { title, description, keywords: seoContent.keywords, canonicalUrl, breadcrumbSchema, seoContent };
  }, [category, slug]);

  const categoryProducts = useMemo(() => {
    let result = getProductsByCategory(slug || '');
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brandSlug));
    }
    if (selectedAvailability) {
      result = result.filter((p) => p.availability === selectedAvailability);
    }
    return result;
  }, [slug, selectedBrands, selectedAvailability]);

  const brands = getBrandsByCategory(slug || '');

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500">Loading category...</p>
      </div>
    );
  }

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

  const relatedCats = getRelatedCategories(slug || '');
  const seoContent = seoData?.seoContent || categorySeoContent.laptops;
  const bannerImage = categoryBannerImages[slug || ''] || categoryBannerImages.laptops;

  const handleBrandChange = (brandSlug: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brandSlug) ? prev.filter((s) => s !== brandSlug) : [...prev, brandSlug]
    );
  };

  return (
    <>
      <SEO meta={{
        title: seoData?.title || `${category.name} | OSIL Ltd`,
        description: seoData?.description || category.description,
        keywords: seoData?.keywords || [category.name, 'products', 'Kenya', 'OSIL'],
        canonicalUrl: seoData?.canonicalUrl,
        ogType: 'website',
        ogImage: bannerImage,
      }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData?.breadcrumbSchema) }} />

      {/* Compact Banner */}
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src={bannerImage} alt={`${category.name} at OSIL Ltd Kenya`} className="w-full h-full object-cover opacity-40" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <Breadcrumb crumbs={[
            { label: 'Products', path: '/products' },
            { label: category.name },
          ]} />
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">{category.name} Kenya</h1>
              <p className="text-sm text-slate-300 max-w-xl">{seoContent.overview}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>{categoryProducts.length} products</span>
                <span className="w-1 h-1 bg-slate-500 rounded-full" />
                <span>{brands.length} brands</span>
                <span className="w-1 h-1 bg-slate-500 rounded-full" />
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /> Authorized Dealer</span>
              </div>
            </div>
            <Link to="/request-quote" className="hidden sm:inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shrink-0">
              Request Quote
            </Link>
          </div>
        </div>
      </section>

      {/* Brand Quick Links */}
      {brands.length > 0 && (
        <section className="py-3 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-medium text-slate-500 shrink-0">Shop by brand:</span>
              {brands.slice(0, 8).map((b) => (
                <Link
                  key={b.id}
                  to={`/brand/${b.slug}`}
                  className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors shrink-0"
                >
                  {b.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content with Filter Sidebar */}
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <div className="w-56 shrink-0">
              <FilterSidebar
                selectedCategory={slug || null}
                onCategoryChange={() => {}}
                selectedBrands={selectedBrands}
                onBrandChange={handleBrandChange}
                selectedAvailability={selectedAvailability}
                onAvailabilityChange={setSelectedAvailability}
                productCount={categoryProducts.length}
                hideCategoryFilter={true}
              />
            </div>
            <div className="flex-1 min-w-0">
              <ProductGrid products={categoryProducts} emptyMessage={`No products found in ${category.name}.`} />
            </div>
          </div>

          {relatedCats.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Related Categories</h2>
              <div className="flex flex-wrap gap-2">
                {relatedCats.map((c) => (
                  <Link key={c.id} to={`/category/${c.slug}`} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors">
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Why Shop Section */}
      <section className="py-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { icon: <Package className="w-4 h-4" />, title: 'Genuine Products', desc: 'Authorized dealer' },
              { icon: <Shield className="w-4 h-4" />, title: 'Local Warranty', desc: 'Kenya coverage' },
              { icon: <Truck className="w-4 h-4" />, title: 'Fast Delivery', desc: 'All counties' },
              { icon: <Headphones className="w-4 h-4" />, title: 'Expert Support', desc: 'Certified team' },
              { icon: <Zap className="w-4 h-4" />, title: 'Best Prices', desc: 'Competitive rates' },
              { icon: <Award className="w-4 h-4" />, title: '15+ Years', desc: 'Experience' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-100">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">{item.icon}</div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
