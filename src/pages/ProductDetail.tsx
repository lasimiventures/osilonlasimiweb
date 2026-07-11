import { useParams, Link } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ShoppingCart, Check, Package, Shield, Truck, Headphones, Zap, Award, Building2, Users, ChevronRight, Download, Users2 } from 'lucide-react';
import { SEO, generateProductSchema, generateBreadcrumbSchema, generateProductPageTitle, generateProductDescription, getCanonicalUrl, AVAILABILITY_SCHEMA_MAP } from '../components/SEO';
import { Breadcrumb } from '../components/Breadcrumb';
import { ProductGrid } from '../components/ProductGrid';
import { FAQAccordion } from '../components/FAQAccordion';
import { BulkPricingModal } from '../components/BulkPricingModal';
import { useCatalog } from '../context/CatalogContext';
import { productFaqs } from '../data/faqs';
import { useQuote } from '../context/QuoteContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';

const benefitIcons = [Package, Shield, Truck, Headphones, Zap, Award];

const businessUseCases: Record<string, string[]> = {
  laptops: ['Remote work and telecommuting', 'Business presentations and meetings', 'Content creation and design', 'Software development and coding', 'Field sales and client visits'],
  desktops: ['Office workstation setup', 'Graphic design and video editing', 'Data processing and analysis', 'Customer service terminals', 'Development and testing environments'],
  servers: ['Data center infrastructure', 'Virtualization and cloud hosting', 'Database management', 'Enterprise application hosting', 'Backup and disaster recovery'],
  networking: ['Office network infrastructure', 'Guest WiFi for hospitality', 'Warehouse inventory systems', 'Multi-site connectivity', 'Video surveillance integration'],
  phones: ['Mobile workforce communication', 'Field operations and logistics', 'Sales team connectivity', 'Customer support hotlines', 'Executive communication'],
  tablets: ['Mobile workforce productivity', 'Retail point-of-sale systems', 'Education and e-learning', 'Inventory and asset management', 'Customer presentations'],
  printers: ['Office document management', 'Marketing material production', 'Invoice and receipt printing', 'Blueprint and technical drawing output', 'High-volume printing operations'],
  projectors: ['Boardroom presentations', 'Classroom instruction', 'Training and workshops', 'Home theater entertainment', 'Digital signage and displays'],
  conferencing: ['Remote team collaboration', 'Client video meetings', 'Interviews and recruitment', 'Training and webinars', 'Multi-site conference calls'],
  security: ['Office building surveillance', 'Parking lot monitoring', 'Access control for labs', 'Retail loss prevention', 'Home security systems'],
};

const categoryDescriptionContent: Record<string, { overview: string; features: string[]; benefits: string[] }> = {
  laptops: {
    overview: 'Business laptops designed for productivity, mobility, and professional performance.',
    features: ['Lightweight and portable design', 'Long battery life for all-day work', 'Powerful processors for multitasking', 'High-resolution displays', 'Enterprise security features'],
    benefits: ['Work from anywhere with mobility', 'Increase productivity with fast performance', 'Protect data with security features', 'Connect easily with modern ports', 'Professional appearance for meetings'],
  },
  desktops: {
    overview: 'Desktop computers built for office productivity, creative work, and business applications.',
    features: ['Powerful desktop processors', 'Expandable storage and memory', 'Multiple display support', 'Flexible form factors', 'Cost-effective performance'],
    benefits: ['Handle demanding applications easily', 'Upgrade components as needs grow', 'Connect multiple monitors for productivity', 'Reliable performance for daily tasks', 'Lower total cost of ownership'],
  },
  servers: {
    overview: 'Enterprise servers for data centers, virtualization, and business-critical applications.',
    features: ['Scalable processing power', 'Redundant power supplies', 'ECC memory for reliability', 'Remote management capabilities', 'High storage capacity'],
    benefits: ['Ensure uptime with redundancy', 'Scale as your business grows', 'Manage infrastructure remotely', 'Protect data with enterprise features', 'Support virtualized workloads'],
  },
  networking: {
    overview: 'Enterprise networking equipment for reliable, secure, and high-performance connectivity.',
    features: ['Gigabit and multi-gig speeds', 'Enterprise-grade security', 'Centralized management', 'Scalable architecture', 'PoE for easy deployment'],
    benefits: ['Ensure reliable connectivity', 'Protect network from threats', 'Simplify network management', 'Support business growth', 'Power devices without extra cabling'],
  },
};

export function ProductDetail() {
  const { getProductBySlug, getRelatedProducts, getProductsByBrand, getCategoryBySlug, loading } = useCatalog();
  const { slug } = useParams<{ slug: string }>();
  const product = getProductBySlug(slug || '');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const { addItem } = useQuote();
  const { trackProduct, recentlyViewed } = useRecentlyViewed();

  useEffect(() => {
    if (product) trackProduct(product.id);
  }, [product?.id]);

  const recentlyViewedFiltered = product
    ? recentlyViewed.filter(p => p.id !== product.id).slice(0, 4)
    : [];

  const seoData = useMemo(() => {
    if (!product) return null;

    const title = generateProductPageTitle(product.name, product.brand, product.category);
    const description = generateProductDescription(product.name, product.brand, product.category, product.tags);
    const canonicalUrl = getCanonicalUrl(`/products/${product.slug}`);

    const productSchema = generateProductSchema({
      name: product.name,
      description: product.description,
      brand: product.brand,
      sku: product.sku,
      category: product.category,
      image: product.images[0],
      availability: AVAILABILITY_SCHEMA_MAP[product.availability],
    });

    const breadcrumbSchema = generateBreadcrumbSchema([
      { name: 'Home', url: 'https://osil.co.ke' },
      { name: 'Products', url: 'https://osil.co.ke/products' },
      { name: product.category, url: `https://osil.co.ke/category/${product.categorySlug}` },
      { name: product.brand, url: `https://osil.co.ke/brand/${product.brandSlug}` },
      { name: product.name, url: canonicalUrl },
    ]);

    return { title, description, canonicalUrl, productSchema, breadcrumbSchema };
  }, [product]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-block w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Product Not Found</h1>
        <p className="text-slate-500 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link to="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Browse Products
        </Link>
      </div>
    );
  }

  const category = getCategoryBySlug(product.categorySlug);
  const related = getRelatedProducts(product);
  const brandProducts = getProductsByBrand(product.brandSlug).filter(p => p.id !== product.id).slice(0, 4);
  const categoryContent = categoryDescriptionContent[product.categorySlug] || categoryDescriptionContent.laptops;
  const useCases = businessUseCases[product.categorySlug] || businessUseCases.laptops;

  const availabilityLabel = {
    'in-stock': 'In Stock',
    'low-stock': 'Low Stock - Order Soon',
    'out-of-stock': 'Out of Stock',
    'pre-order': 'Pre-Order Available',
  };

  const availabilityColor = {
    'in-stock': 'bg-green-100 text-green-700 border-green-200',
    'low-stock': 'bg-amber-100 text-amber-700 border-amber-200',
    'out-of-stock': 'bg-red-100 text-red-700 border-red-200',
    'pre-order': 'bg-blue-100 text-blue-700 border-blue-200',
  };

  const seoKeywords = [
    product.name,
    product.brand,
    product.category,
    'Kenya',
    'OSIL Ltd',
    'ICT solutions',
    ...product.tags,
  ];

  return (
    <>
      <SEO meta={{
        title: seoData?.title || `${product.name} | OSIL Ltd`,
        description: seoData?.description || product.shortDescription,
        keywords: seoKeywords,
        canonicalUrl: seoData?.canonicalUrl,
        ogType: 'product',
        ogImage: product.images[0],
        structuredData: seoData?.productSchema,
      }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(seoData?.breadcrumbSchema) }} />

      <section className="bg-slate-50 py-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb crumbs={[
            { label: 'Products', path: '/products' },
            { label: category?.name || 'Category', path: category ? `/category/${category.slug}` : undefined },
            { label: product.brand, path: `/brand/${product.brandSlug}` },
            { label: product.name },
          ]} />
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div>
                <div className="aspect-square bg-white rounded-xl border border-slate-100 overflow-hidden mb-4">
                  <img src={product.images[activeImage]} alt={`${product.name} - ${product.brand} ${product.category} at OSIL Ltd Kenya`} className="w-full h-full object-cover" loading="lazy" />
                </div>
                {product.images.length > 1 && (
                  <div className="flex gap-3">
                    {product.images.map((img, i) => (
                      <button key={i} onClick={() => setActiveImage(i)} className={`w-16 h-16 rounded-lg border overflow-hidden ${activeImage === i ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`}>
                        <img src={img} alt={`${product.name} view ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-3 py-1 text-xs font-medium rounded-md border ${availabilityColor[product.availability]}`}>
                    {availabilityLabel[product.availability]}
                  </span>
                  {product.isNew && <span className="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded-md">New Arrival</span>}
                  {product.isBestSeller && <span className="px-2 py-1 bg-amber-500 text-white text-xs font-medium rounded-md">Best Seller</span>}
                  {product.isFeatured && <span className="px-2 py-1 bg-slate-700 text-white text-xs font-medium rounded-md">Featured</span>}
                </div>

                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">{product.name}</h1>

                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-slate-700">SKU:</span>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{product.sku}</span>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-slate-700">Brand:</span>
                    <Link to={`/brand/${product.brandSlug}`} className="text-blue-600 hover:underline">{product.brand}</Link>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-slate-700">Category:</span>
                    <Link to={`/category/${product.categorySlug}`} className="text-blue-600 hover:underline">{product.category}</Link>
                  </span>
                </div>

                <p className="text-slate-600 leading-relaxed mb-6">{product.description}</p>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { icon: <Shield className="w-4 h-4" />, text: 'Genuine Product' },
                    { icon: <Truck className="w-4 h-4" />, text: 'Fast Delivery' },
                    { icon: <Headphones className="w-4 h-4" />, text: 'Expert Support' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                      <div className="text-blue-600">{item.icon}</div>
                      <span className="text-xs font-medium text-slate-700">{item.text}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50">-</button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-50">+</button>
                  </div>
                  <button
                    onClick={() => addItem(product, quantity)}
                    className="flex-1 max-w-xs flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4" /> Add to Quote
                  </button>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Genuine product with manufacturer warranty. Authorized {product.brand} dealer in Kenya.</span>
                </div>

                <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-slate-100">
                  <a
                    href={product.datasheetUrl || '#'}
                    onClick={e => { if (!product.datasheetUrl) { e.preventDefault(); alert('Datasheet available on request. Please contact our sales team.'); } }}
                    className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
                    download={!!product.datasheetUrl}
                  >
                    <Download className="w-4 h-4" /> Download Datasheet
                  </a>
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-blue-200 bg-blue-50 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    <Users2 className="w-4 h-4" /> Request Bulk Pricing
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-6 mb-12">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Product Overview</h2>
              <p className="text-slate-600 leading-relaxed mb-4">{product.description}</p>
              <p className="text-slate-500 text-sm leading-relaxed">{categoryContent.overview} Ideal for businesses and professionals across Kenya looking for reliable {product.category.toLowerCase()} solutions with local warranty and support.</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden mb-12">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-lg font-bold text-slate-900">Technical Specifications</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="px-6 py-3 grid grid-cols-1 sm:grid-cols-3 gap-2 hover:bg-slate-50 transition-colors">
                    <div className="text-sm font-medium text-slate-700">{key}</div>
                    <div className="sm:col-span-2 text-sm text-slate-600">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              <div className="bg-white border border-slate-100 rounded-xl p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" /> Key Features
                </h2>
                <ul className="space-y-3">
                  {categoryContent.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-green-600" /> Benefits
                </h2>
                <ul className="space-y-3">
                  {categoryContent.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-6 mb-12">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-600" /> Business Use Cases
              </h2>
              <p className="text-slate-500 text-sm mb-4">This {product.name} is ideal for various business applications across Kenya:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {useCases.slice(0, 6).map((useCase, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-600">{useCase}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-12">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Why Buy from OSIL Ltd Kenya?</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { icon: <Shield className="w-5 h-5" />, title: 'Genuine Products', desc: 'Authorized dealer' },
                  { icon: <Truck className="w-5 h-5" />, title: 'Fast Delivery', desc: 'Across Kenya' },
                  { icon: <Headphones className="w-5 h-5" />, title: 'Expert Support', desc: 'Certified technicians' },
                  { icon: <Package className="w-5 h-5" />, title: 'Local Warranty', desc: 'Kenya coverage' },
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

            <div className="mb-12">
              <h2 className="text-xl font-bold text-slate-900 mb-2">Product Availability & Delivery</h2>
              <p className="text-slate-500 text-sm mb-4">Check availability and estimated delivery times for {product.name} across Kenya.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { region: 'Nairobi & Central', time: 'Same day / Next day', note: 'Free delivery on orders over KES 50,000' },
                  { region: 'Mombasa & Coastal', time: '1-2 business days', note: 'Express delivery available' },
                  { region: 'Other Regions', time: '2-4 business days', note: 'Nationwide coverage' },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-4">
                    <div className="text-sm font-semibold text-slate-900">{item.region}</div>
                    <div className="text-sm text-blue-600 font-medium">{item.time}</div>
                    <div className="text-xs text-slate-500 mt-1">{item.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {related.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Related Products in {product.category}</h2>
                  <Link to={`/category/${product.categorySlug}`} className="text-sm font-medium text-blue-600 hover:underline">View All {product.category}</Link>
                </div>
                <ProductGrid products={related} />
              </div>
            )}

            {brandProducts.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-slate-900">More from {product.brand}</h2>
                  <Link to={`/brand/${product.brandSlug}`} className="text-sm font-medium text-blue-600 hover:underline">View All {product.brand} Products</Link>
                </div>
                <ProductGrid products={brandProducts} />
              </div>
            )}

            {/* FAQ Section */}
            <div className="mb-12">
              <FAQAccordion faqs={productFaqs} title="Frequently Asked Questions" />
            </div>

            {/* Recently Viewed */}
            {recentlyViewedFiltered.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Recently Viewed</h2>
                <ProductGrid products={recentlyViewedFiltered} />
              </div>
            )}

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Explore More</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link to={`/category/${product.categorySlug}`} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors">
                  {product.category} <ChevronRight className="w-3 h-3" />
                </Link>
                <Link to={`/brand/${product.brandSlug}`} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors">
                  {product.brand} Products <ChevronRight className="w-3 h-3" />
                </Link>
                <Link to="/products" className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors">
                  All Products <ChevronRight className="w-3 h-3" />
                </Link>
                <Link to="/request-quote" className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors">
                  Request Quote <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {showBulkModal && (
        <BulkPricingModal productName={product.name} onClose={() => setShowBulkModal(false)} />
      )}
    </>
  );
}
