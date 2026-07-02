import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { ExternalLink, ChevronRight, Package, Shield, Truck, Headphones, Zap, Award, CheckCircle } from 'lucide-react';
import { SEO, generateBreadcrumbSchema, getCanonicalUrl } from '../components/SEO';
import { Breadcrumb } from '../components/Breadcrumb';
import { ProductGrid } from '../components/ProductGrid';
import { FilterSidebar } from '../components/FilterSidebar';
import { getBrandBySlug, allBrands } from '../data/brands';
import { getProductsByBrand, products } from '../data/products';
import { categories } from '../data/categories';

const brandBannerImages: Record<string, string> = {
  dell: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1600',
  hp: 'https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=1600',
  lenovo: 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1600',
  cisco: 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=1600',
  microsoft: 'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=1600',
  samsung: 'https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=1600',
  apple: 'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=1600',
  ubiquiti: 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=1600',
  hikvision: 'https://images.pexels.com/photos/96612/pexels-photo-96612.jpeg?auto=compress&cs=tinysrgb&w=1600',
  dahua: 'https://images.pexels.com/photos/96612/pexels-photo-96612.jpeg?auto=compress&cs=tinysrgb&w=1600',
  epson: 'https://images.pexels.com/photos/4792717/pexels-photo-4792717.jpeg?auto=compress&cs=tinysrgb&w=1600',
  brother: 'https://images.pexels.com/photos/4792717/pexels-photo-4792717.jpeg?auto=compress&cs=tinysrgb&w=1600',
};

const brandSeoContent: Record<string, { overview: string; strengths: string[]; keywords: string[] }> = {
  dell: {
    overview: 'Dell laptops, desktops, and servers. Latitude, OptiPlex, PowerEdge, XPS with warranty.',
    strengths: ['Enterprise reliability', 'Business laptops', 'Server solutions', 'XPS premium line', 'Global support', 'Sustainability'],
    keywords: ['Dell Kenya', 'Dell laptops Nairobi', 'Dell Latitude', 'Dell OptiPlex', 'Dell PowerEdge', 'Dell XPS Kenya'],
  },
  hp: {
    overview: 'HP laptops, desktops, printers. EliteBook, ProDesk, HP printers with warranty.',
    strengths: ['Industry printers', 'Enterprise security', 'Product range', 'Reliable devices', 'Strong presence', 'Innovation'],
    keywords: ['HP Kenya', 'HP laptops Nairobi', 'HP EliteBook', 'HP ProDesk', 'HP printers Kenya', 'HP servers'],
  },
  lenovo: {
    overview: 'Lenovo ThinkPad, ThinkCentre, Legion. World\'s #1 PC maker with genuine products.',
    strengths: ['#1 PC manufacturer', 'ThinkPad durability', 'Legion gaming', 'Business focus', 'Keyboards', 'Warranties'],
    keywords: ['Lenovo Kenya', 'ThinkPad Nairobi', 'Lenovo laptops', 'ThinkCentre', 'Lenovo Legion'],
  },
  cisco: {
    overview: 'Cisco enterprise networking, security, collaboration. Routers, switches, firewalls.',
    strengths: ['Industry networking', 'Security solutions', 'Webex collaboration', 'Meraki cloud', 'Certifications', 'Reliability'],
    keywords: ['Cisco Kenya', 'Cisco routers Nairobi', 'Cisco switches', 'Cisco firewalls', 'Meraki Kenya'],
  },
  microsoft: {
    overview: 'Microsoft Surface, Windows, Office 365. Authorized Microsoft partner with genuine licenses.',
    strengths: ['Windows & Office', 'Azure cloud', 'Surface devices', 'Enterprise solutions', 'Developer tools', 'Gaming Xbox'],
    keywords: ['Microsoft Kenya', 'Surface Kenya', 'Windows 11 Nairobi', 'Office 365 Kenya', 'Microsoft licenses'],
  },
  samsung: {
    overview: 'Samsung Galaxy smartphones, tablets, displays. Genuine products with warranty.',
    strengths: ['#1 smartphone brand', 'Leading displays', 'Galaxy ecosystem', '5G innovation', 'Foldable phones', 'Accessories'],
    keywords: ['Samsung Kenya', 'Galaxy phones Nairobi', 'Samsung smartphones', 'Galaxy Tab', 'Galaxy S series'],
  },
  apple: {
    overview: 'Apple iPhone, iPad, Mac. Genuine Apple products with warranty for premium quality.',
    strengths: ['Premium quality', 'iOS ecosystem', 'Leading chips', 'Software support', 'Resale value', 'Privacy'],
    keywords: ['Apple Kenya', 'iPhone Nairobi', 'iPad Kenya', 'iPhone prices Kenya', 'MacBook'],
  },
  ubiquiti: {
    overview: 'Ubiquiti UniFi, EdgeRouter networking. Enterprise features at SMB prices.',
    strengths: ['Enterprise at SMB prices', 'UniFi ecosystem', 'WiFi performance', 'Easy management', 'Disruptive pricing', 'Community'],
    keywords: ['Ubiquiti Kenya', 'UniFi Nairobi', 'Ubiquiti routers', 'UniFi access points', 'EdgeRouter Kenya'],
  },
};

export function BrandPage() {
  const { slug } = useParams<{ slug: string }>();
  const brand = getBrandBySlug(slug || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<string | null>(null);

  const seoData = useMemo(() => {
    if (!brand) return null;

    const seoContent = brandSeoContent[slug || ''] || brandSeoContent.dell;
    const title = `${brand.name} Kenya | Authorized ${brand.name} Dealer | OSIL Ltd`;
    const description = `Shop ${brand.name} products in Kenya at OSIL Ltd. ${brand.description} Genuine ${brand.name} products with warranty, fast delivery Nairobi Kenya-wide.`;
    const canonicalUrl = getCanonicalUrl(`/brand/${brand.slug}`);

    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://osil.co.ke' },
      { name: 'Brands', url: 'https://osil.co.ke/brands' },
      { name: brand.name, url: canonicalUrl },
    ]);

    return { title, description, keywords: seoContent.keywords, canonicalUrl, breadcrumbSchema, seoContent };
  }, [brand, slug]);

  const brandProducts = useMemo(() => {
    let result = getProductsByBrand(slug || '');
    if (selectedCategory) {
      result = result.filter((p) => p.categorySlug === selectedCategory);
    }
    if (selectedAvailability) {
      result = result.filter((p) => p.availability === selectedAvailability);
    }
    return result;
  }, [slug, selectedCategory, selectedAvailability]);

  if (!brand) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Brand Not Found</h1>
        <p className="text-slate-500 mb-6">The brand you are looking for does not exist.</p>
        <Link to="/brands" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          View All Brands
        </Link>
      </div>
    );
  }

  const relatedBrands = allBrands.filter(b => b.categorySlug === brand.categorySlug && b.slug !== brand.slug).slice(0, 6);
  const seoContent = seoData?.seoContent || brandSeoContent.dell;
  const bannerImage = brandBannerImages[slug || ''] || brandBannerImages.dell;
  const brandCategories = [...new Set(brandProducts.map(p => p.category))];

  return (
    <>
      <SEO meta={{
        title: seoData?.title || `${brand.name} Products | OSIL Ltd`,
        description: seoData?.description || brand.description,
        keywords: seoData?.keywords || [brand.name, 'products', brand.category, 'Kenya'],
        canonicalUrl: seoData?.canonicalUrl,
        ogType: 'website',
        ogImage: bannerImage,
      }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData?.breadcrumbSchema) }} />

      {/* Compact Banner */}
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src={bannerImage} alt={`${brand.name} products at OSIL Ltd Kenya`} className="w-full h-full object-cover opacity-40" loading="eager" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <Breadcrumb crumbs={[
            { label: 'Brands', path: '/brands' },
            { label: brand.name },
          ]} />
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">{brand.name} Kenya</h1>
              <p className="text-sm text-slate-300 max-w-xl">{seoContent.overview}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                <span>{brandProducts.length} products</span>
                <span className="w-1 h-1 bg-slate-500 rounded-full" />
                <span>{brandCategories.length} categories</span>
                <span className="w-1 h-1 bg-slate-500 rounded-full" />
                <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /> Authorized Dealer</span>
              </div>
              {brand.website && (
                <a href={brand.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-300 hover:text-white transition-colors mt-2">
                  Visit Official Website <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <Link to="/request-quote" className="hidden sm:inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors shrink-0">
              Request Quote
            </Link>
          </div>
        </div>
      </section>

      {/* Category Quick Links */}
      {brandCategories.length > 0 && (
        <section className="py-3 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-medium text-slate-500 shrink-0">Shop {brand.name}:</span>
              {brandCategories.map((cat) => {
                const catData = categories.find(c => c.name === cat);
                return (
                  <Link
                    key={cat}
                    to={`/brand/${slug}?category=${catData?.slug || cat.toLowerCase()}`}
                    onClick={() => setSelectedCategory(catData?.slug || cat.toLowerCase())}
                    className="px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors shrink-0"
                  >
                    {cat}
                  </Link>
                );
              })}
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
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedBrands={[slug || '']}
                onBrandChange={() => {}}
                selectedAvailability={selectedAvailability}
                onAvailabilityChange={setSelectedAvailability}
                productCount={brandProducts.length}
                hideBrandFilter={true}
                filterCategoriesByBrand={slug || undefined}
              />
            </div>
            <div className="flex-1 min-w-0">
              <ProductGrid products={brandProducts} emptyMessage={`No products found for ${brand.name}.`} />
            </div>
          </div>

          {relatedBrands.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">Related Brands</h2>
              <div className="flex flex-wrap gap-2">
                {relatedBrands.map((b) => (
                  <Link key={b.id} to={`/brand/${b.slug}`} className="px-3 py-1.5 bg-slate-100 text-slate-700 text-sm rounded-lg hover:bg-slate-200 transition-colors">
                    {b.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Why Buy Section */}
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
