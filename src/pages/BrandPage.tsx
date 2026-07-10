import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { ExternalLink, ChevronRight, Package, Shield, Truck, Headphones, Zap, Award, CheckCircle } from 'lucide-react';
import { SEO, generateBreadcrumbSchema, getCanonicalUrl } from '../components/SEO';
import { Breadcrumb } from '../components/Breadcrumb';
import { ProductGrid } from '../components/ProductGrid';
import { FilterSidebar } from '../components/FilterSidebar';
import { useCatalog } from '../context/CatalogContext';

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

const brandSeoContent: Record<string, { tagline: string; overview: string; strengths: string[]; productLines: string[]; keywords: string[] }> = {
  dell: {
    tagline: 'Authorized Dell dealer — Latitude, OptiPlex, PowerEdge & XPS with local warranty.',
    overview: 'Founded in 1984 by Michael Dell, Dell Technologies is one of the world\'s largest technology companies, renowned for building purpose-built business PCs, enterprise servers, and storage solutions. In Kenya, OSIL Ltd is an authorized Dell partner — the only way to guarantee genuine Dell hardware backed by manufacturer warranty honored locally. The Dell Latitude series is widely adopted by Kenya\'s banking, telecom, and government sectors for its MIL-STD durability and enterprise security chipset. Dell OptiPlex desktops dominate corporate office deployments for their tool-free serviceability and long product lifecycle. For high-performance creative and data workloads, Dell XPS and Precision workstations deliver exceptional processing power. Dell PowerEdge servers underpin data centers across the region, offering scalable compute from entry-level tower units to full rack configurations.',
    strengths: ['MIL-STD Certified Durability', 'Enterprise Security (TPM 2.0)', 'AI-powered Dell Optimizer', 'Extensive local service network', 'Configurable to order', 'Sustainable packaging & parts'],
    productLines: ['Latitude (Business Laptops)', 'XPS (Premium Laptops)', 'OptiPlex (Business Desktops)', 'Precision (Workstations)', 'PowerEdge (Servers)', 'PowerVault (Storage)'],
    keywords: ['Dell Kenya', 'Dell laptops Nairobi', 'Dell Latitude Kenya', 'Dell OptiPlex', 'Dell PowerEdge server', 'Dell XPS Kenya'],
  },
  hp: {
    tagline: 'Authorized HP dealer — EliteBook, ProBook, LaserJet & ProDesk with local warranty.',
    overview: 'Hewlett-Packard (HP) is a global technology leader with a 85-year heritage of innovation spanning personal computing, enterprise printing, and business infrastructure. In Kenya, HP holds one of the strongest brand recognition scores in the ICT sector, particularly for its printer and multifunction device range. OSIL Ltd carries the full HP business product portfolio: the ultra-secure HP EliteBook series (featuring HP Sure Start and HP Sure Click security features) for senior enterprise staff; the cost-effective HP ProBook range for SME deployments; and HP ProDesk desktops for call-centre and office productivity workloads. HP\'s printing division — LaserJet Pro and OfficeJet Pro — remains the preferred choice for Nairobi law firms, accounting practices, and government offices. HP also offers Z-series workstations for engineering and creative agencies needing ISV-certified graphics performance.',
    strengths: ['HP Sure Start BIOS security', 'HP Wolf Security platform', 'Full SMB-to-enterprise range', 'Industry-leading printer share', 'HP Amplify partner ecosystem', 'Long-lifecycle product support'],
    productLines: ['EliteBook (Enterprise Laptops)', 'ProBook (SMB Laptops)', 'ZBook (Mobile Workstations)', 'ProDesk (Business Desktops)', 'LaserJet Pro (Printers)', 'HP Z Workstations'],
    keywords: ['HP Kenya', 'HP laptops Nairobi', 'HP EliteBook Kenya', 'HP ProBook', 'HP printers Kenya', 'HP LaserJet Nairobi'],
  },
  lenovo: {
    tagline: "World's #1 PC maker — ThinkPad, ThinkCentre & Legion with genuine warranty.",
    overview: "Lenovo is the world's largest PC manufacturer by unit volume, shipping over 70 million PCs annually to more than 180 markets. Founded in Beijing in 1984, Lenovo acquired IBM's PC division in 2005 — inheriting the legendary ThinkPad brand and its reputation for keyboard quality, durability, and business reliability. In Kenya, Lenovo's ThinkPad line is a fixture in the country's NGO, UN agency, and financial sector laptop fleets, prized for its seven-point durability testing standard and industry-leading keyboard travel. The ThinkCentre desktop family provides long-lifecycle, highly expandable office workstations at competitive price points. For the gaming and content creator segment, Lenovo's Legion Pro series delivers class-leading performance with advanced thermal engineering. IdeaPad and IdeaCentre round out the consumer range for students and home users seeking reliability at an accessible price.",
    strengths: ["World's #1 PC brand by volume", 'ThinkPad 7-point durability testing', 'Industry-best keyboard design', 'Legion gaming performance', 'Wide accessory ecosystem', 'Strong SME to enterprise portfolio'],
    productLines: ['ThinkPad (Business Laptops)', 'IdeaPad (Consumer Laptops)', 'Legion (Gaming Laptops)', 'ThinkCentre (Business Desktops)', 'ThinkStation (Workstations)', 'ThinkServer (Servers)'],
    keywords: ['Lenovo Kenya', 'ThinkPad Nairobi', 'Lenovo laptops Kenya', 'Lenovo ThinkCentre', 'Lenovo Legion Kenya', 'IdeaPad Kenya'],
  },
  cisco: {
    tagline: 'Cisco authorized partner — enterprise routers, switches, firewalls & Meraki cloud.',
    overview: 'Cisco Systems is the undisputed global leader in enterprise networking, cybersecurity, and collaboration — responsible for routing the majority of the world\'s internet traffic. Founded in 1984 at Stanford University, Cisco\'s hardware, software, and services portfolio spans LAN/WAN infrastructure, cloud-managed networking (Meraki), video conferencing (Webex), and enterprise security (Umbrella, Firepower). In East Africa, Cisco equipment underpins the backbone networks of Kenya\'s major banks, telcos, hospitals, and government ministries. OSIL Ltd is an authorized Cisco reseller, enabling Kenyan businesses to acquire genuine Cisco equipment with Smart Net support contracts and CCNA/CCNP-certified pre-sales and post-sales technical guidance. The Cisco Catalyst switch family and ISR router series are the most widely deployed in Kenyan enterprise networks, while Cisco Meraki is rapidly gaining adoption for its zero-touch provisioning and cloud-based network management.',
    strengths: ['Global #1 enterprise networking brand', 'Cisco Meraki cloud management', 'Webex collaboration platform', 'Firepower & Umbrella security', 'CCNA/CCNP-certified support team', 'Smart Net maintenance contracts'],
    productLines: ['Catalyst (Switches)', 'ISR (Routers)', 'Firepower (Firewalls)', 'Meraki (Cloud Networking)', 'Webex (Collaboration)', 'Umbrella (Security)'],
    keywords: ['Cisco Kenya', 'Cisco switches Nairobi', 'Cisco routers Kenya', 'Cisco Meraki Kenya', 'Cisco firewall Nairobi', 'Cisco Webex Kenya'],
  },
  microsoft: {
    tagline: 'Authorized Microsoft partner — Surface, Windows 11 & Microsoft 365 licenses.',
    overview: 'Microsoft Corporation is one of the most valuable technology companies in the world, transforming global business with Windows, Office, Azure cloud, and the Surface device family. As a Microsoft Cloud Solutions Partner, OSIL Ltd is authorized to supply and activate genuine Microsoft 365 (formerly Office 365) subscriptions, Windows OEM and Volume Licensing, Azure services, and the full Microsoft Surface hardware range. In Kenya, Microsoft 365 is rapidly replacing standalone Office installations across corporate, NGO, and government sectors due to its integrated Teams collaboration, SharePoint document management, and cloud backup capabilities. The Surface Pro and Surface Laptop series offer premium Windows experiences — particularly valued by executives, architects, and creative professionals who require a sleek, ultraportable device with enterprise-grade security and stylus support.',
    strengths: ['Microsoft Cloud Solutions Partner', 'Windows 11 & Microsoft 365', 'Azure cloud expertise', 'Surface premium devices', 'Teams & SharePoint integration', 'Volume licensing for enterprises'],
    productLines: ['Surface Pro (2-in-1)', 'Surface Laptop (Ultrabooks)', 'Surface Studio (Desktops)', 'Microsoft 365 (SaaS)', 'Windows 11 (OS)', 'Azure (Cloud)'],
    keywords: ['Microsoft Kenya', 'Surface laptop Kenya', 'Microsoft 365 Nairobi', 'Windows 11 Kenya', 'Azure Kenya', 'Office 365 Kenya'],
  },
  samsung: {
    tagline: 'Authorized Samsung dealer — Galaxy smartphones, tablets & displays with warranty.',
    overview: 'Samsung Electronics is the world\'s largest smartphone manufacturer and a top-three global consumer electronics brand, employing over 270,000 people across 74 countries. Headquartered in Suwon, South Korea, Samsung\'s mobile division produces the Galaxy S flagship, Galaxy A mid-range, and Galaxy Z foldable series — each offering cutting-edge cameras, display technology, and long software support cycles. In Kenya, Samsung Galaxy phones are among the best-selling smartphones across all price tiers. OSIL Ltd stocks genuine Samsung devices sourced through authorized channels, ensuring customers receive valid manufacturer warranty and software updates. Beyond smartphones, Samsung\'s Galaxy Tab series is a popular choice for business productivity and digital signage, while Samsung\'s commercial display panels (used in conference rooms, retail, and hospitality) are available through our enterprise sales team.',
    strengths: ["World's #1 smartphone brand", 'Galaxy S / A / Z series range', 'AMOLED display leadership', '5G & Wi-Fi 6 connectivity', 'Samsung Knox enterprise security', 'Long software update support'],
    productLines: ['Galaxy S (Flagship)', 'Galaxy A (Mid-range)', 'Galaxy Z (Foldables)', 'Galaxy Tab (Tablets)', 'Samsung Display (Commercial)', 'Galaxy Buds (Audio)'],
    keywords: ['Samsung Kenya', 'Galaxy S series Kenya', 'Samsung phones Nairobi', 'Galaxy A series Kenya', 'Samsung Galaxy Tab', 'Samsung foldable Kenya'],
  },
  apple: {
    tagline: 'Genuine Apple products — iPhone, iPad & MacBook with local warranty.',
    overview: 'Apple Inc. is the world\'s most valuable technology brand, renowned for designing products that seamlessly integrate hardware, software, and services into premium user experiences. From the iPhone — which pioneered the modern smartphone category in 2007 — to the M-series chip-powered MacBook Pro and iPad Pro, Apple consistently delivers class-leading performance, privacy, and longevity. In Kenya, Apple devices command a significant premium but retain their value exceptionally well, making them a preferred choice for executives, media professionals, and digital creatives. OSIL Ltd stocks genuine Apple products sourced through authorized distribution channels, ensuring customers receive valid Apple warranty coverage and access to Apple\'s global support resources. The iPhone 15 series and iPad Pro (M2) are particularly popular among Kenyan professionals seeking seamless cross-device productivity via iCloud, AirDrop, and Handoff.',
    strengths: ["World's most valuable tech brand", 'Apple Silicon (M-series chips)', 'iOS / macOS / iPadOS integration', 'iCloud ecosystem connectivity', 'Industry-best privacy controls', 'Exceptional resale value'],
    productLines: ['iPhone (Smartphones)', 'iPad / iPad Pro (Tablets)', 'MacBook Air / Pro (Laptops)', 'Apple Watch (Wearables)', 'AirPods (Audio)', 'Apple TV / HomePod'],
    keywords: ['Apple Kenya', 'iPhone 15 Kenya', 'iPad Pro Nairobi', 'MacBook Kenya', 'Apple Watch Kenya', 'AirPods Kenya'],
  },
  ubiquiti: {
    tagline: 'Ubiquiti UniFi & EdgeMax networking — enterprise performance at SMB prices.',
    overview: 'Ubiquiti Inc. disrupted the enterprise networking market by delivering carrier-class hardware at dramatically lower prices than Cisco or HPE, without sacrificing performance. Founded in 2005 by Robert Pera, Ubiquiti\'s flagship UniFi ecosystem — comprising access points, switches, security gateways, and NVR cameras — is managed through a single intuitive cloud controller, making it ideal for Kenyan businesses that want enterprise-grade network management without the cost of dedicated network engineers. The UniFi WiFi 6 and WiFi 6E access points deliver multi-gigabit throughput suitable for high-density office deployments, hotels, schools, and shopping centres. Ubiquiti\'s EdgeRouter series provides advanced routing features (BGP, OSPF, VPN) at a fraction of Cisco ISR pricing. In Kenya, Ubiquiti has seen explosive adoption among SMEs, ISPs, hospitality venues, and healthcare facilities looking to maximize network investment.',
    strengths: ['Enterprise performance at SMB cost', 'UniFi unified cloud management', 'WiFi 6 / WiFi 6E access points', 'Zero-touch provisioning', 'Active community & documentation', 'EdgeRouter advanced routing'],
    productLines: ['UniFi WiFi (Access Points)', 'UniFi Switch (PoE Switches)', 'UniFi Gateway (Security)', 'EdgeRouter (Routing)', 'UniFi Protect (Cameras)', 'airMAX (Point-to-Point)'],
    keywords: ['Ubiquiti Kenya', 'UniFi access points Nairobi', 'Ubiquiti switches Kenya', 'UniFi WiFi 6 Kenya', 'EdgeRouter Kenya', 'Ubiquiti CCTV Kenya'],
  },
};

export function BrandPage() {
  const { slug } = useParams<{ slug: string }>();
  const { getBrandBySlug, getProductsByBrand, categories, brands, loading } = useCatalog();
  const brand = getBrandBySlug(slug || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAvailability, setSelectedAvailability] = useState<string | null>(null);

  const seoData = useMemo(() => {
    if (!brand) return null;

    const seoContent = brandSeoContent[slug || ''] || brandSeoContent.dell;
    const title = `${brand.name} | Authorized ${brand.name} Dealer | OSIL Ltd Kenya`;
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500">Loading brand...</p>
      </div>
    );
  }

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

  const relatedBrands = brands.filter(b => b.categorySlug === brand.categorySlug && b.slug !== brand.slug).slice(0, 6);
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
              <p className="text-sm text-slate-300 max-w-xl">{seoContent.tagline || seoContent.overview}</p>
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

      {/* Brand Profile */}
      {seoContent.overview && seoContent.overview.length > 100 && (
        <section className="py-6 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <h2 className="text-base font-bold text-slate-900 mb-3">About {brand.name}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{seoContent.overview}</p>
                {seoContent.strengths.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {seoContent.strengths.map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              {seoContent.productLines && seoContent.productLines.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3">Product Lines</h3>
                  <ul className="space-y-2">
                    {seoContent.productLines.map((line, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
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
