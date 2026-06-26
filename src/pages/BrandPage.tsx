import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { ExternalLink, ChevronRight, Package, Shield, Truck, Headphones, Zap, Award, CheckCircle, Globe } from 'lucide-react';
import { SEO, generateBreadcrumbSchema, getCanonicalUrl } from '../components/SEO';
import { Breadcrumb } from '../components/Breadcrumb';
import { ProductGrid } from '../components/ProductGrid';
import { SearchBar } from '../components/SearchBar';
import { getBrandBySlug, allBrands } from '../data/brands';
import { getProductsByBrand, getFeaturedProducts } from '../data/products';
import { categories } from '../data/categories';

const brandSeoContent: Record<string, { overview: string; history: string; strengths: string[]; keywords: string[] }> = {
  dell: {
    overview: 'Dell is a global leader in business computing, offering Latitude laptops, OptiPlex desktops, PowerEdge servers, and XPS premium devices. OSIL Ltd Kenya is an authorized Dell dealer with genuine products, warranty, and expert support.',
    history: 'Founded in 1984, Dell has grown to become one of the world\'s largest technology companies, known for direct-to-customer sales and customizable systems. Today, Dell Technologies provides end-to-end IT solutions for organizations of all sizes.',
    strengths: ['Enterprise-grade reliability', 'Extensive business laptop lineup', 'Scalable server solutions', 'Award-winning XPS premium line', 'Global support network', 'Sustainability commitment'],
    keywords: ['Dell Kenya', 'Dell laptops Nairobi', 'Dell Latitude', 'Dell OptiPlex', 'Dell PowerEdge', 'Dell XPS Kenya', 'Dell servers Kenya', 'Dell authorized dealer Kenya'],
  },
  hp: {
    overview: 'HP (Hewlett-Packard) offers comprehensive IT solutions including EliteBook laptops, ProDesk desktops, HP printers, and enterprise servers. OSIL Ltd Kenya provides genuine HP products with warranty and technical support.',
    history: 'Founded in 1939 in a Palo Alto garage, HP pioneered Silicon Valley innovation. Today, HP Inc. leads in personal computing and printing, while serving businesses and consumers worldwide with reliable technology.',
    strengths: ['Industry-leading printers', 'Enterprise security features', 'Comprehensive product range', 'Reliable business devices', 'Strong Kenyan presence', 'Innovation in printing'],
    keywords: ['HP Kenya', 'HP laptops Nairobi', 'HP EliteBook', 'HP ProDesk', 'HP printers Kenya', 'HP servers', 'HP authorized dealer Kenya'],
  },
  lenovo: {
    overview: 'Lenovo is the world\'s #1 PC maker, offering the legendary ThinkPad, ThinkCentre desktops, Legion gaming devices, and Motorola phones. OSIL Ltd Kenya is your authorized Lenovo partner with genuine products.',
    history: 'Lenovo acquired IBM\'s PC division in 2005, inheriting the legendary ThinkPad brand. Today, Lenovo leads global PC market share and continues to innovate in business computing and gaming.',
    strengths: ['World\'s #1 PC manufacturer', 'Legendary ThinkPad durability', 'Innovative Legion gaming', 'Strong business focus', 'Excellent keyboards', 'Comprehensive warranties'],
    keywords: ['Lenovo Kenya', 'ThinkPad Nairobi', 'Lenovo laptops', 'ThinkCentre', 'Lenovo Legion', 'Lenovo authorized Kenya'],
  },
  cisco: {
    overview: 'Cisco is the global leader in enterprise networking, security, and collaboration. OSIL Ltd Kenya provides Cisco routers, switches, firewalls, and collaboration solutions for businesses across East Africa.',
    history: 'Founded in 1984, Cisco pioneered the router technology that built the internet. Today, Cisco provides the networking infrastructure that powers the world\'s largest enterprises.',
    strengths: ['Industry-standard networking', 'Enterprise security solutions', 'Collaboration with Webex', 'Meraki cloud management', 'Global certifications', 'Enterprise reliability'],
    keywords: ['Cisco Kenya', 'Cisco routers Nairobi', 'Cisco switches', 'Cisco firewalls', 'Cisco networking Kenya', 'Meraki Kenya'],
  },
  microsoft: {
    overview: 'Microsoft Surface devices, Windows operating systems, and enterprise software solutions at OSIL Ltd Kenya. Authorized Microsoft partner with genuine licenses and Surface devices.',
    history: 'Founded by Bill Gates and Paul Allen in 1975, Microsoft revolutionized personal computing with Windows and Office. Today, Microsoft leads in cloud computing, productivity, and Surface devices.',
    strengths: ['Windows and Office', 'Azure cloud services', 'Surface premium devices', 'Enterprise solutions', 'Developer tools', 'Gaming with Xbox'],
    keywords: ['Microsoft Kenya', 'Surface Kenya', 'Windows 11 Nairobi', 'Office 365 Kenya', 'Microsoft licenses', 'Surface Pro'],
  },
  samsung: {
    overview: 'Samsung Galaxy smartphones, tablets, and displays at OSIL Ltd Kenya. Genuine Samsung products with warranty, featuring the latest Galaxy S and Galaxy A series smartphones.',
    history: 'Samsung is a South Korean conglomerate founded in 1938. The company has grown to become a global leader in smartphones, displays, and consumer electronics.',
    strengths: ['World\'s #1 smartphone brand', 'Industry-leading displays', 'Galaxy ecosystem', '5G innovation', 'Foldable phones', 'Comprehensive accessories'],
    keywords: ['Samsung Kenya', 'Galaxy phones Nairobi', 'Samsung smartphones', 'Galaxy Tab', 'Samsung authorized Kenya', 'Galaxy S series'],
  },
  apple: {
    overview: 'Apple iPhone, iPad, and Mac devices at OSIL Ltd Kenya. Genuine Apple products with warranty for professionals and consumers who demand premium quality.',
    history: 'Founded in 1976 by Steve Jobs, Steve Wozniak, and Ronald Wayne, Apple has become the world\'s most valuable company. Known for iPhone, iPad, Mac, and the iOS ecosystem.',
    strengths: ['Premium build quality', 'iOS ecosystem', 'Industry-leading chips', 'Long software support', 'High resale value', 'Privacy focus'],
    keywords: ['Apple Kenya', 'iPhone Nairobi', 'iPad Kenya', 'Apple authorized Kenya', 'iPhone prices Kenya', 'MacBook'],
  },
  ubiquiti: {
    overview: 'Ubiquiti Networks provides enterprise networking at disruptive prices. Unifi, EdgeRouter, and AirMAX solutions at OSIL Ltd Kenya for affordable business networking.',
    history: 'Founded in 2005, Ubiquiti disrupted the networking market with enterprise-grade equipment at SMB prices. Their UniFi line has become the standard for managed networks.',
    strengths: ['Enterprise features at SMB prices', 'UniFi controller ecosystem', 'Great WiFi performance', 'Easy management', 'Disruptive pricing', 'Active community'],
    keywords: ['Ubiquiti Kenya', 'UniFi Nairobi', 'Ubiquiti routers', 'UniFi access points', 'EdgeRouter Kenya', 'Ubiquiti switches'],
  },
};

export function BrandPage() {
  const { slug } = useParams<{ slug: string }>();
  const brand = getBrandBySlug(slug || '');
  const [query, setQuery] = useState('');

  const seoData = useMemo(() => {
    if (!brand) return null;

    const seoContent = brandSeoContent[slug || ''] || brandSeoContent.dell;
    const title = `${brand.name} Products Kenya | Authorized ${brand.name} Dealer | OSIL Ltd`;
    const description = `Shop genuine ${brand.name} products at OSIL Ltd Kenya. ${brand.description} Authorized ${brand.name} dealer with warranty, fast delivery, and expert support across Kenya.`;
    const canonicalUrl = getCanonicalUrl(`/brand/${brand.slug}`);

    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://osil.co.ke' },
      { name: 'Brands', url: 'https://osil.co.ke/brands' },
      { name: brand.name, url: canonicalUrl },
    ]);

    return { title, description, keywords: seoContent.keywords, canonicalUrl, breadcrumbSchema, seoContent };
  }, [brand, slug]);

  if (!brand) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Brand Not Found</h1>
        <p className="text-slate-500 mb-6">The brand you are looking for does not exist in our catalog.</p>
        <Link to="/brands" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          View All Brands
        </Link>
      </div>
    );
  }

  const products = getProductsByBrand(slug || '').filter((p) =>
    query ? p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()) : true
  );

  const featuredProducts = products.filter(p => p.isFeatured || p.isBestSeller).slice(0, 4);
  const brandCategories = [...new Set(products.map(p => p.category))];
  const relatedBrands = allBrands.filter(b => b.categorySlug === brand.categorySlug && b.slug !== brand.slug).slice(0, 6);
  const seoContent = seoData?.seoContent || brandSeoContent.dell;

  return (
    <>
      <SEO meta={{
        title: seoData?.title || `${brand.name} Products | OSIL Ltd`,
        description: seoData?.description || brand.description,
        keywords: seoData?.keywords || [brand.name, 'products', brand.category, 'Kenya'],
        canonicalUrl: seoData?.canonicalUrl,
        ogType: 'website',
        ogImage: brand.logo,
      }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData?.breadcrumbSchema) }} />

      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src={brand.logo} alt={`${brand.name} products at OSIL Ltd Kenya`} className="w-full h-full object-cover opacity-30" loading="lazy" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="mb-3">
            <Breadcrumb crumbs={[
              { label: 'Brands', path: '/brands' },
              { label: brand.name },
            ]} />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">{brand.name} Kenya</h1>
          <p className="text-lg text-slate-300 max-w-2xl mb-4">{brand.description}</p>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>{products.length} products</span>
            <span>|</span>
            <span>{brandCategories.length} categories</span>
            <span>|</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Authorized Dealer</span>
          </div>
          {brand.website && (
            <a href={brand.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-300 hover:text-white transition-colors mt-3">
              Visit Official Website <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </section>

      <section className="py-8 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-slate-900 mb-3">About {brand.name}</h2>
          <p className="text-slate-600 leading-relaxed mb-4">{seoContent.overview}</p>
          <p className="text-slate-500 text-sm leading-relaxed mb-4">{seoContent.history}</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {seoContent.strengths.map((strength, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                <span>{strength}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {brandCategories.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Shop {brand.name} by Category</h2>
              <div className="flex flex-wrap gap-2">
                {brandCategories.map((cat) => {
                  const catData = categories.find(c => c.name === cat);
                  return (
                    <Link key={cat} to={`/category/${catData?.slug || cat.toLowerCase()}`} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors">
                      {cat} <span className="text-slate-400">({products.filter(p => p.category === cat).length})</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {featuredProducts.length > 0 && (
            <div className="mb-8 bg-slate-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-900">Featured {brand.name} Products</h2>
                <span className="text-xs text-slate-500">Best sellers and new arrivals</span>
              </div>
              <ProductGrid products={featuredProducts} />
            </div>
          )}

          <div className="mb-6">
            <SearchBar initialValue={query} onSearch={setQuery} placeholder={`Search ${brand.name} products...`} />
          </div>

          <ProductGrid products={products} emptyMessage={`No products found for ${brand.name}.`} />

          {relatedBrands.length > 0 && (
            <div className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Related Brands</h2>
              <div className="flex flex-wrap gap-3">
                {relatedBrands.map((b) => (
                  <Link key={b.id} to={`/brand/${b.slug}`} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors">
                    {b.name} <ChevronRight className="w-3 h-3 inline ml-1" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-8 bg-blue-50 border-t border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 text-center">Why Buy {brand.name} from OSIL Ltd Kenya?</h2>
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
            <h2 className="text-lg font-bold text-slate-900">Need {brand.name} for Your Business?</h2>
            <p className="text-sm text-slate-500">We offer bulk pricing and enterprise solutions for organizations across Kenya.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Contact Us
            </Link>
            <Link to="/request-quote" className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 text-sm font-semibold rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors">
              Request Enterprise Quote
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
