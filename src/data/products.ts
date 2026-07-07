import type { Product } from '../types';

export const products: Product[] = [
  // Laptops
  {
    id: 'p-1', name: 'Dell Latitude 5540', slug: 'dell-latitude-5540', sku: 'DL-LAT-5540-001', brand: 'Dell', brandSlug: 'dell', category: 'Laptops', categorySlug: 'laptops',
    description: "Engineered for Kenya's enterprise and government sector, the Dell Latitude 5540 combines 13th Gen Intel Core i7-1370P performance with MIL-STD-810H-certified durability you can depend on in the field. Its 16GB DDR5 RAM and 512GB NVMe SSD ensure rapid application loading and smooth multitasking for finance, legal, and field operations. The FHD+ anti-glare display and backlit keyboard enable productive work in any lighting — from a dimly lit boardroom to an outdoor client site. Dell Optimizer AI learns your work patterns to automatically prioritise applications and extend battery life, while TPM 2.0 and optional fingerprint reader deliver the security posture required by corporate IT policies across Kenya.", shortDescription: '15.6" MIL-STD business laptop with Intel i7-1370P, 16GB DDR5, 512GB SSD.',
    images: ['https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Core i7-1370P', 'RAM': '16GB DDR5', 'Storage': '512GB NVMe SSD', 'Display': '15.6" FHD+ (1920x1080)', 'Graphics': 'Intel Iris Xe', 'OS': 'Windows 11 Pro', 'Battery': '54Wh', 'Weight': '1.79 kg' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-2', 'p-3', 'p-9'], tags: ['business', 'intel', 'ssd', 'windows']
  },
  {
    id: 'p-2', name: 'HP EliteBook 840 G9', slug: 'hp-elitebook-840-g9', sku: 'HP-EB-840G9-002', brand: 'HP', brandSlug: 'hp', category: 'Laptops', categorySlug: 'laptops',
    description: "The HP EliteBook 840 G9 is HP's flagship 14-inch business ultrabook, purpose-built for Kenya's hybrid-working professional. Intel Core i5-1245U (12th Gen) delivers consistent performance for Teams video calls, spreadsheet modelling, and document-intensive workflows, while 16GB DDR4 RAM ensures smooth multitasking without compromise. HP Sure Start Gen 7 and HP Wolf Security protect against firmware attacks and phishing — critical for organisations handling sensitive financial or client data in Nairobi's fast-paced business environment. At just 1.36 kg with a 51Wh battery rated for all-day use, it slips easily into a briefcase for commutes between Westlands and Upperhill.", shortDescription: '14" HP Wolf Security enterprise laptop with Intel i5-1245U, 16GB RAM.',
    images: ['https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Core i5-1245U', 'RAM': '16GB DDR4', 'Storage': '256GB NVMe SSD', 'Display': '14" FHD (1920x1080)', 'Graphics': 'Intel UHD', 'OS': 'Windows 11 Pro', 'Battery': '51Wh', 'Weight': '1.36 kg' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: true, isBestSeller: false,
    relatedProducts: ['p-1', 'p-4', 'p-10'], tags: ['enterprise', 'hp', 'lightweight', 'security']
  },
  {
    id: 'p-3', name: 'Lenovo ThinkPad X1 Carbon Gen 11', slug: 'lenovo-thinkpad-x1-carbon-gen11', sku: 'LN-X1C-G11-003', brand: 'Lenovo', brandSlug: 'lenovo', category: 'Laptops', categorySlug: 'laptops',
    description: "The Lenovo ThinkPad X1 Carbon Gen 11 represents the pinnacle of business ultrabook engineering — a 14-inch powerhouse that weighs just 1.12 kg yet passes 12 categories of MIL-STD-810H environmental testing. Intel Core i7-1365U (13th Gen) paired with 32GB LPDDR5 RAM and a 1TB NVMe SSD handles everything from complex financial models to multi-window research workflows without compromise. The 2.8K OLED display with 100% DCI-P3 colour coverage makes it indispensable for architects, designers, and senior executives who demand colour accuracy alongside raw computing power. Lenovo's renowned ThinkPad keyboard — with 1.5mm key travel and precise tactile feedback — remains the benchmark for business laptop typing comfort, making it ideal for East Africa's most demanding knowledge workers.", shortDescription: 'Ultra-light 1.12 kg 14" ThinkPad with 2.8K OLED, i7-1365U, 32GB RAM.',
    images: ['https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Core i7-1365U', 'RAM': '32GB LPDDR5', 'Storage': '1TB NVMe SSD', 'Display': '14" 2.8K OLED', 'Graphics': 'Intel Iris Xe', 'OS': 'Windows 11 Pro', 'Battery': '57Wh', 'Weight': '1.12 kg' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: true, isBestSeller: true,
    relatedProducts: ['p-1', 'p-2', 'p-5'], tags: ['ultrabook', 'oled', 'thinkpad', 'premium']
  },
  {
    id: 'p-4', name: 'HP ProBook 450 G9', slug: 'hp-probook-450-g9', sku: 'HP-PB-450G9-004', brand: 'HP', brandSlug: 'hp', category: 'Laptops', categorySlug: 'laptops',
    description: 'The HP ProBook 450 G9 is a reliable 15.6" business notebook with Intel Core i5-1235U, 8GB RAM, 512GB SSD, and essential security features for SMBs.', shortDescription: '15.6" SMB laptop with Intel i5, 8GB RAM, 512GB SSD.',
    images: ['https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Core i5-1235U', 'RAM': '8GB DDR4', 'Storage': '512GB NVMe SSD', 'Display': '15.6" FHD', 'Graphics': 'Intel UHD', 'OS': 'Windows 11 Pro', 'Battery': '51Wh', 'Weight': '1.74 kg' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: false,
    relatedProducts: ['p-2', 'p-1', 'p-6'], tags: ['smb', 'hp', 'budget', 'reliable']
  },
  {
    id: 'p-5', name: 'Dell XPS 15 9530', slug: 'dell-xps-15-9530', sku: 'DL-XPS-9530-005', brand: 'Dell', brandSlug: 'dell', category: 'Laptops', categorySlug: 'laptops',
    description: "The Dell XPS 15 9530 redefines the premium creator laptop — blending Intel Core i7-13700H performance with NVIDIA RTX 4050 discrete graphics in a precision-machined aluminium chassis that commands attention in any Nairobi creative studio or media house. The breathtaking 3.5K OLED InfinityEdge display covers 100% of the DCI-P3 colour space and achieves 400 nits of brightness, making colour-critical work — photo retouching, video grading, and architectural visualisation — genuinely accurate on-screen. With 32GB DDR5 RAM and a 1TB NVMe SSD, 4K video exports, large Photoshop composites, and multi-track audio sessions complete in record time. The 86Wh battery and Thunderbolt 4 with USB-C charging make it equally capable as a desktop replacement and an on-location production tool.", shortDescription: '15.6" OLED creator laptop: i7-13700H, RTX 4050, 32GB DDR5.',
    images: ['https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Core i7-13700H', 'RAM': '32GB DDR5', 'Storage': '1TB NVMe SSD', 'Display': '15.6" 3.5K OLED', 'Graphics': 'NVIDIA RTX 4050', 'OS': 'Windows 11 Pro', 'Battery': '86Wh', 'Weight': '1.86 kg' },
    price: null, availability: 'low-stock', isFeatured: true, isNew: true, isBestSeller: false,
    relatedProducts: ['p-3', 'p-1', 'p-9'], tags: ['creator', 'gaming', 'rtx', 'oled', 'premium']
  },
  {
    id: 'p-6', name: 'Lenovo IdeaPad Slim 5', slug: 'lenovo-ideapad-slim-5', sku: 'LN-IPS-5-006', brand: 'Lenovo', brandSlug: 'lenovo', category: 'Laptops', categorySlug: 'laptops',
    description: 'The Lenovo IdeaPad Slim 5 is an affordable 15.6" everyday laptop with AMD Ryzen 5 7530U, 8GB RAM, 512GB SSD, and a FHD IPS display. Great value for students and home users.', shortDescription: '15.6" everyday laptop with Ryzen 5, 8GB RAM, 512GB SSD.',
    images: ['https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'AMD Ryzen 5 7530U', 'RAM': '8GB DDR4', 'Storage': '512GB NVMe SSD', 'Display': '15.6" FHD IPS', 'Graphics': 'AMD Radeon', 'OS': 'Windows 11 Home', 'Battery': '56.5Wh', 'Weight': '1.63 kg' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: true,
    relatedProducts: ['p-4', 'p-3', 'p-7'], tags: ['budget', 'student', 'amd', 'value']
  },
  {
    id: 'p-7', name: 'Microsoft Surface Laptop 5', slug: 'microsoft-surface-laptop-5', sku: 'MS-SL-5-007', brand: 'Microsoft', brandSlug: 'microsoft', category: 'Laptops', categorySlug: 'laptops',
    description: "The Microsoft Surface Laptop 5 is Microsoft's most refined personal computer — a statement device that pairs an Alcantara-wrapped keyboard deck with a 13.5-inch PixelSense touch display in a chassis that feels as premium as it looks. Intel Core i5-1235U (12th Gen) with Intel Iris Xe graphics handles business productivity, light creative work, and video conferencing with ease, while up to 18 hours of battery life means you can present to clients, attend back-to-back meetings, and travel across Kenya without reaching for a charger. With Windows 11 pre-activated and seamless Microsoft 365 integration, this Surface is ready to work the moment you open the lid. Ideal for executives, consultants, and professionals across Nairobi who value premium craftsmanship alongside world-class performance.", shortDescription: '13.5" PixelSense touch laptop with 18-hour battery, Intel i5-1235U.',
    images: ['https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Core i5-1235U', 'RAM': '8GB LPDDR5x', 'Storage': '256GB SSD', 'Display': '13.5" PixelSense Touch', 'Graphics': 'Intel Iris Xe', 'OS': 'Windows 11', 'Battery': 'Up to 18 hours', 'Weight': '1.27 kg' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: false,
    relatedProducts: ['p-9', 'p-3', 'p-10'], tags: ['touchscreen', 'microsoft', 'elegant', 'premium']
  },
  {
    id: 'p-8', name: 'HP ZBook Power G9', slug: 'hp-zbook-power-g9', sku: 'HP-ZB-PG9-008', brand: 'HP', brandSlug: 'hp', category: 'Laptops', categorySlug: 'laptops',
    description: 'The HP ZBook Power G9 is a mobile workstation with Intel Core i7-12700H, 16GB RAM, 512GB SSD, and NVIDIA RTX A1000 graphics. ISV-certified for professional applications.', shortDescription: '15.6" mobile workstation with i7, RTX A1000, ISV certified.',
    images: ['https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Core i7-12700H', 'RAM': '16GB DDR5', 'Storage': '512GB NVMe SSD', 'Display': '15.6" FHD', 'Graphics': 'NVIDIA RTX A1000', 'OS': 'Windows 11 Pro', 'Battery': '83Wh', 'Weight': '1.89 kg' },
    price: null, availability: 'pre-order', isFeatured: false, isNew: false, isBestSeller: false,
    relatedProducts: ['p-5', 'p-3', 'p-1'], tags: ['workstation', 'nvidia', 'cad', 'engineering']
  },
  {
    id: 'p-9', name: 'Dell Inspiron 16 5630', slug: 'dell-inspiron-16-5630', sku: 'DL-INS-5630-009', brand: 'Dell', brandSlug: 'dell', category: 'Laptops', categorySlug: 'laptops',
    description: 'The Dell Inspiron 16 5630 is a versatile 16-inch laptop with Intel Core i5-1335U, 16GB RAM, 512GB SSD, and a FHD+ display. Ideal for home and productivity.', shortDescription: '16" versatile laptop with Intel i5, 16GB RAM, 512GB SSD.',
    images: ['https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Core i5-1335U', 'RAM': '16GB DDR5', 'Storage': '512GB NVMe SSD', 'Display': '16" FHD+', 'Graphics': 'Intel Iris Xe', 'OS': 'Windows 11 Home', 'Battery': '54Wh', 'Weight': '1.88 kg' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: true, isBestSeller: false,
    relatedProducts: ['p-1', 'p-6', 'p-7'], tags: ['home', 'productivity', '16-inch', 'fhd']
  },
  {
    id: 'p-10', name: 'Lenovo Legion Pro 7i', slug: 'lenovo-legion-pro-7i', sku: 'LN-LG-P7I-010', brand: 'Lenovo', brandSlug: 'lenovo', category: 'Laptops', categorySlug: 'laptops',
    description: "The Lenovo Legion Pro 7i is Lenovo's uncompromising gaming flagship — delivering desktop-class compute in a portable chassis for Kenya's most demanding gamers, 3D artists, and power users. The Intel Core i9-13900HX (24-core) paired with NVIDIA GeForce RTX 4080 at 175W TGP eliminates every performance bottleneck, whether you're playing AAA titles at max settings, running real-time 3D renders, or executing AI-accelerated creative workflows. The 16-inch WQXGA (2560×1600) IPS display with 240Hz refresh and 3ms response time delivers the smooth, tear-free experience competitive gamers demand. Lenovo's Coldfront 5.0 thermal management system with Phase-Change Material keeps thermals in check during sustained marathon sessions — ensuring peak clock speeds hold under pressure.", shortDescription: '16" WQXGA 240Hz gaming powerhouse: i9-13900HX, RTX 4080, 32GB DDR5.',
    images: ['https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Core i9-13900HX', 'RAM': '32GB DDR5', 'Storage': '1TB NVMe SSD', 'Display': '16" WQXGA 240Hz', 'Graphics': 'NVIDIA RTX 4080', 'OS': 'Windows 11 Home', 'Battery': '80Wh', 'Weight': '2.8 kg' },
    price: null, availability: 'low-stock', isFeatured: true, isNew: true, isBestSeller: true,
    relatedProducts: ['p-5', 'p-3', 'p-8'], tags: ['gaming', 'rtx', 'high-refresh', 'premium']
  },
  // Desktops
  {
    id: 'p-11', name: 'Dell OptiPlex 7010 Tower', slug: 'dell-optiplex-7010-tower', sku: 'DL-OP-7010T-011', brand: 'Dell', brandSlug: 'dell', category: 'Desktops', categorySlug: 'desktops',
    description: "The Dell OptiPlex 7010 Tower is the cornerstone business desktop powering Kenya's corporate offices, government ministries, and call-centre environments. The Intel Core i5-13500 (13th Gen, 14 cores) handles ERP applications, multi-monitor setups, and parallel productivity workflows with effortless efficiency, while 16GB DDR4 RAM and a 512GB NVMe SSD ensure responsive day-to-day performance. Dell's tool-free chassis design simplifies RAM, SSD, and graphics upgrades — an advantage for IT administrators managing large deployments across multiple sites. TPM 2.0, optional smart card reader, and Dell Trusted Device security meet the stringent data protection requirements of banks, insurers, and public institutions. Its standardised platform across three consecutive product generations dramatically reduces spare parts inventory and fleet management complexity.", shortDescription: 'Business tower desktop: Intel i5-13500, 16GB DDR4, 512GB SSD, tool-free chassis.',
    images: ['https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Core i5-13500', 'RAM': '16GB DDR4', 'Storage': '512GB NVMe SSD', 'Graphics': 'Intel UHD 770', 'OS': 'Windows 11 Pro', 'Form Factor': 'Mini Tower', 'Ports': 'USB-C, USB-A, HDMI, DP' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-12', 'p-13', 'p-14'], tags: ['business', 'tower', 'expandable', 'dell']
  },
  {
    id: 'p-12', name: 'HP Elite Tower 800 G9', slug: 'hp-elite-tower-800-g9', sku: 'HP-ET-800G9-012', brand: 'HP', brandSlug: 'hp', category: 'Desktops', categorySlug: 'desktops',
    description: 'The HP Elite Tower 800 G9 delivers enterprise-grade performance with Intel Core i7-12700, 16GB RAM, 512GB SSD, and advanced security features.', shortDescription: 'Enterprise desktop with Intel i7, 16GB RAM, 512GB SSD.',
    images: ['https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Core i7-12700', 'RAM': '16GB DDR5', 'Storage': '512GB NVMe SSD', 'Graphics': 'Intel UHD 770', 'OS': 'Windows 11 Pro', 'Form Factor': 'Tower', 'Ports': 'USB-C, USB-A, HDMI, DP' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: true, isBestSeller: false,
    relatedProducts: ['p-11', 'p-13', 'p-15'], tags: ['enterprise', 'hp', 'security', 'tower']
  },
  {
    id: 'p-13', name: 'Lenovo ThinkCentre M90q Gen 4', slug: 'lenovo-thinkcentre-m90q-gen4', sku: 'LN-TC-M90Q-013', brand: 'Lenovo', brandSlug: 'lenovo', category: 'Desktops', categorySlug: 'desktops',
    description: 'The Lenovo ThinkCentre M90q Gen 4 is a tiny 1L form factor desktop with Intel Core i7-13700T, 16GB RAM, 512GB SSD. Mountable behind monitors for clean workspaces.', shortDescription: 'Tiny 1L desktop with Intel i7, 16GB RAM, 512GB SSD.',
    images: ['https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Core i7-13700T', 'RAM': '16GB DDR4', 'Storage': '512GB NVMe SSD', 'Graphics': 'Intel UHD', 'OS': 'Windows 11 Pro', 'Form Factor': 'Tiny 1L', 'Ports': 'USB-C, USB-A, HDMI, DP' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: true, isBestSeller: false,
    relatedProducts: ['p-11', 'p-12', 'p-14'], tags: ['tiny', 'compact', 'thinkcentre', 'space-saving']
  },
  {
    id: 'p-14', name: 'Dell Precision 3660 Tower', slug: 'dell-precision-3660-tower', sku: 'DL-PR-3660T-014', brand: 'Dell', brandSlug: 'dell', category: 'Desktops', categorySlug: 'desktops',
    description: 'The Dell Precision 3660 Tower is a professional workstation with Intel Core i7-12700, 32GB RAM, 512GB SSD, and NVIDIA RTX A2000. ISV-certified for CAD and content creation.', shortDescription: 'Professional workstation with i7, RTX A2000, 32GB RAM.',
    images: ['https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Core i7-12700', 'RAM': '32GB DDR5', 'Storage': '512GB NVMe SSD', 'Graphics': 'NVIDIA RTX A2000', 'OS': 'Windows 11 Pro', 'Form Factor': 'Tower', 'Ports': 'USB-C, USB-A, HDMI, DP' },
    price: null, availability: 'pre-order', isFeatured: false, isNew: false, isBestSeller: false,
    relatedProducts: ['p-11', 'p-13', 'p-15'], tags: ['workstation', 'cad', 'nvidia', 'professional']
  },
  {
    id: 'p-15', name: 'HP Slim Desktop S01', slug: 'hp-slim-desktop-s01', sku: 'HP-SD-S01-015', brand: 'HP', brandSlug: 'hp', category: 'Desktops', categorySlug: 'desktops',
    description: 'The HP Slim Desktop S01 is a compact and affordable desktop with Intel Core i3-12100, 8GB RAM, 256GB SSD. Perfect for home offices and small businesses.', shortDescription: 'Compact desktop with Intel i3, 8GB RAM, 256GB SSD.',
    images: ['https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Core i3-12100', 'RAM': '8GB DDR4', 'Storage': '256GB NVMe SSD', 'Graphics': 'Intel UHD 730', 'OS': 'Windows 11 Home', 'Form Factor': 'Slim', 'Ports': 'USB-A, HDMI, DP' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: true,
    relatedProducts: ['p-11', 'p-12', 'p-13'], tags: ['compact', 'budget', 'home', 'slim']
  },
  // Workstations
  {
    id: 'p-16', name: 'Dell Precision 7960 Rack', slug: 'dell-precision-7960-rack', sku: 'DL-PR-7960R-016', brand: 'Dell', brandSlug: 'dell', category: 'Workstations', categorySlug: 'workstations',
    description: 'The Dell Precision 7960 Rack is a 2U rack workstation with dual Intel Xeon W-3400 series, up to 4TB RAM, and multiple NVIDIA RTX A6000 GPUs. Built for the most demanding HPC workloads.', shortDescription: '2U rack workstation with dual Xeon, up to 4TB RAM, multi-GPU.',
    images: ['https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Dual Intel Xeon W-3400', 'RAM': 'Up to 4TB DDR5', 'Storage': 'Up to 8TB NVMe', 'Graphics': 'Up to 4x NVIDIA RTX A6000', 'OS': 'Windows 11 Pro / Linux', 'Form Factor': '2U Rack', 'Power': '2000W' },
    price: null, availability: 'pre-order', isFeatured: true, isNew: false, isBestSeller: false,
    relatedProducts: ['p-17', 'p-14', 'p-18'], tags: ['hpc', 'rack', 'xeon', 'nvidia', 'enterprise']
  },
  {
    id: 'p-17', name: 'HP Z8 Fury G5', slug: 'hp-z8-fury-g5', sku: 'HP-Z8-FG5-017', brand: 'HP', brandSlug: 'hp', category: 'Workstations', categorySlug: 'workstations',
    description: 'The HP Z8 Fury G5 is the ultimate desktop workstation with dual Intel Xeon W-3400, up to 2TB RAM, and NVIDIA RTX 6000 Ada. Designed for AI, VFX, and scientific computing.', shortDescription: 'Ultimate desktop workstation with dual Xeon, up to 2TB RAM.',
    images: ['https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Dual Intel Xeon W-3400', 'RAM': 'Up to 2TB DDR5', 'Storage': 'Up to 4TB NVMe', 'Graphics': 'Up to 4x NVIDIA RTX 6000 Ada', 'OS': 'Windows 11 Pro / Linux', 'Form Factor': 'Tower', 'Power': '1700W' },
    price: null, availability: 'pre-order', isFeatured: true, isNew: true, isBestSeller: false,
    relatedProducts: ['p-16', 'p-14', 'p-18'], tags: ['ai', 'vfx', 'dual-xeon', 'ultimate', 'hp']
  },
  {
    id: 'p-18', name: 'Lenovo ThinkStation P7', slug: 'lenovo-thinkstation-p7', sku: 'LN-TS-P7-018', brand: 'Lenovo', brandSlug: 'lenovo', category: 'Workstations', categorySlug: 'workstations',
    description: 'The Lenovo ThinkStation P7 is a high-performance workstation with Intel Xeon W-3400, up to 1TB RAM, and NVIDIA RTX A6000. Ideal for engineering and media production.', shortDescription: 'High-performance workstation with Xeon W-3400, up to 1TB RAM.',
    images: ['https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Xeon W-3400', 'RAM': 'Up to 1TB DDR5', 'Storage': 'Up to 4TB NVMe', 'Graphics': 'Up to 2x NVIDIA RTX A6000', 'OS': 'Windows 11 Pro / Linux', 'Form Factor': 'Tower', 'Power': '1700W' },
    price: null, availability: 'pre-order', isFeatured: false, isNew: true, isBestSeller: false,
    relatedProducts: ['p-16', 'p-17', 'p-14'], tags: ['engineering', 'media', 'xeon', 'thinkstation']
  },
  // Servers
  {
    id: 'p-19', name: 'Dell PowerEdge R750', slug: 'dell-poweredge-r750', sku: 'DL-PE-R750-019', brand: 'Dell', brandSlug: 'dell', category: 'Servers', categorySlug: 'servers',
    description: 'The Dell PowerEdge R750 is a 2U rack server with dual Intel Xeon Scalable, up to 32 DIMMs, and PCIe Gen4 support. Ideal for databases, virtualization, and HPC.', shortDescription: '2U rack server with dual Xeon Scalable, up to 32 DIMMs.',
    images: ['https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Dual Intel Xeon Scalable', 'RAM': 'Up to 8TB DDR4', 'Storage': 'Up to 12x 3.5" or 24x 2.5" drives', 'Network': 'Dual 10GbE', 'OS': 'Windows Server / Linux / VMware', 'Form Factor': '2U Rack', 'Power': 'Dual 1400W' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-20', 'p-21', 'p-22'], tags: ['rack', 'xeon', 'virtualization', 'enterprise']
  },
  {
    id: 'p-20', name: 'HPE ProLiant DL380 Gen11', slug: 'hpe-proliant-dl380-gen11', sku: 'HPE-DL380G11-020', brand: 'HPE', brandSlug: 'hp', category: 'Servers', categorySlug: 'servers',
    description: 'The HPE ProLiant DL380 Gen11 is a versatile 2U rack server with Intel Xeon Scalable, up to 8TB RAM, and HPE iLO 6 remote management. The world\'s best-selling server.', shortDescription: '2U rack server with Xeon Scalable, iLO 6, up to 8TB RAM.',
    images: ['https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Xeon Scalable', 'RAM': 'Up to 8TB DDR5', 'Storage': 'Up to 20x 2.5" drives', 'Network': 'Dual 10GbE', 'OS': 'Windows Server / Linux / VMware', 'Form Factor': '2U Rack', 'Management': 'HPE iLO 6' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: true, isBestSeller: false,
    relatedProducts: ['p-19', 'p-21', 'p-22'], tags: ['hpe', 'proliant', 'ilo', 'rack', 'enterprise']
  },
  {
    id: 'p-21', name: 'Dell PowerEdge T350', slug: 'dell-poweredge-t350', sku: 'DL-PE-T350-021', brand: 'Dell', brandSlug: 'dell', category: 'Servers', categorySlug: 'servers',
    description: 'The Dell PowerEdge T350 is an entry-level tower server with Intel Xeon E-2300, up to 128GB RAM, and 4x 3.5" drive bays. Perfect for small businesses.', shortDescription: 'Entry-level tower server with Xeon E-2300, up to 128GB RAM.',
    images: ['https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Xeon E-2300', 'RAM': 'Up to 128GB DDR4', 'Storage': 'Up to 4x 3.5" drives', 'Network': 'Dual 1GbE', 'OS': 'Windows Server / Linux', 'Form Factor': 'Tower', 'Management': 'iDRAC9' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: true,
    relatedProducts: ['p-19', 'p-20', 'p-22'], tags: ['tower', 'smb', 'entry-level', 'idrac']
  },
  {
    id: 'p-22', name: 'HPE ProLiant MicroServer Gen10 Plus', slug: 'hpe-proliant-microserver-gen10-plus', sku: 'HPE-MS-G10P-022', brand: 'HPE', brandSlug: 'hp', category: 'Servers', categorySlug: 'servers',
    description: 'The HPE ProLiant MicroServer Gen10 Plus is an ultra-compact server with Intel Xeon E-2224, up to 64GB RAM, and 4x 3.5" drive bays. Ideal for home offices and small businesses.', shortDescription: 'Ultra-compact server with Xeon E-2224, up to 64GB RAM.',
    images: ['https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Processor': 'Intel Xeon E-2224', 'RAM': 'Up to 64GB DDR4', 'Storage': 'Up to 4x 3.5" drives', 'Network': 'Dual 1GbE', 'OS': 'Windows Server / Linux', 'Form Factor': 'Ultra Compact', 'Management': 'HPE iLO 5' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: false,
    relatedProducts: ['p-21', 'p-19', 'p-20'], tags: ['compact', 'micro', 'smb', 'home-office']
  },
  // Phones
  {
    id: 'p-23', name: 'Samsung Galaxy S24 Ultra', slug: 'samsung-galaxy-s24-ultra', sku: 'SM-GS24U-023', brand: 'Samsung', brandSlug: 'samsung', category: 'Phones', categorySlug: 'phones',
    description: 'The Samsung Galaxy S24 Ultra features a 6.8" QHD+ AMOLED 120Hz display, Snapdragon 8 Gen 3, 12GB RAM, 256GB storage, and a 200MP camera with 5x optical zoom. S Pen included.', shortDescription: '6.8" flagship with 200MP camera, S Pen, Snapdragon 8 Gen 3.',
    images: ['https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '6.8" QHD+ AMOLED 120Hz', 'Processor': 'Snapdragon 8 Gen 3', 'RAM': '12GB', 'Storage': '256GB', 'Camera': '200MP + 50MP + 10MP + 12MP', 'Battery': '5000mAh', 'OS': 'Android 14', 'Weight': '233g' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: true, isBestSeller: true,
    relatedProducts: ['p-24', 'p-25', 'p-26'], tags: ['flagship', 's-pen', '200mp', 'samsung']
  },
  {
    id: 'p-24', name: 'iPhone 15 Pro Max', slug: 'iphone-15-pro-max', sku: 'AP-IP15PM-024', brand: 'Apple', brandSlug: 'apple', category: 'Phones', categorySlug: 'phones',
    description: 'The iPhone 15 Pro Max features a 6.7" Super Retina XDR display, A17 Pro chip, 8GB RAM, 256GB storage, and a 48MP camera with 5x telephoto. Titanium design.', shortDescription: '6.7" titanium flagship with A17 Pro, 48MP camera, 5x zoom.',
    images: ['https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '6.7" Super Retina XDR 120Hz', 'Processor': 'A17 Pro', 'RAM': '8GB', 'Storage': '256GB', 'Camera': '48MP + 12MP + 12MP', 'Battery': '4422mAh', 'OS': 'iOS 17', 'Weight': '221g' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: true, isBestSeller: true,
    relatedProducts: ['p-23', 'p-25', 'p-27'], tags: ['iphone', 'a17', 'titanium', 'premium', 'apple']
  },
  {
    id: 'p-25', name: 'Samsung Galaxy A54 5G', slug: 'samsung-galaxy-a54-5g', sku: 'SM-GA54-025', brand: 'Samsung', brandSlug: 'samsung', category: 'Phones', categorySlug: 'phones',
    description: 'The Samsung Galaxy A54 5G offers a 6.4" FHD+ 120Hz AMOLED, Exynos 1380, 8GB RAM, 256GB storage, and a 50MP camera with OIS. Excellent value mid-range phone.', shortDescription: '6.4" mid-range with 120Hz AMOLED, 50MP camera, 5G.',
    images: ['https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '6.4" FHD+ AMOLED 120Hz', 'Processor': 'Exynos 1380', 'RAM': '8GB', 'Storage': '256GB', 'Camera': '50MP + 12MP + 5MP', 'Battery': '5000mAh', 'OS': 'Android 14', 'Weight': '202g' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-23', 'p-26', 'p-28'], tags: ['mid-range', 'value', '5g', 'samsung', 'a-series']
  },
  {
    id: 'p-26', name: 'Xiaomi 14 Pro', slug: 'xiaomi-14-pro', sku: 'XM-14P-026', brand: 'Xiaomi', brandSlug: 'xiaomi', category: 'Phones', categorySlug: 'phones',
    description: 'The Xiaomi 14 Pro features a 6.73" 2K LTPO AMOLED, Snapdragon 8 Gen 3, 12GB RAM, 256GB storage, and a Leica-tuned 50MP triple camera system. Premium build quality.', shortDescription: '6.73" flagship with Leica camera, Snapdragon 8 Gen 3, 2K display.',
    images: ['https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '6.73" 2K LTPO AMOLED 120Hz', 'Processor': 'Snapdragon 8 Gen 3', 'RAM': '12GB', 'Storage': '256GB', 'Camera': '50MP + 50MP + 50MP', 'Battery': '4880mAh', 'OS': 'HyperOS', 'Weight': '223g' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: true, isBestSeller: false,
    relatedProducts: ['p-23', 'p-24', 'p-27'], tags: ['xiaomi', 'leica', 'hyperos', 'flagship', 'premium']
  },
  {
    id: 'p-27', name: 'iPhone 15', slug: 'iphone-15', sku: 'AP-IP15-027', brand: 'Apple', brandSlug: 'apple', category: 'Phones', categorySlug: 'phones',
    description: 'The iPhone 15 features a 6.1" Super Retina XDR display, A16 Bionic chip, 6GB RAM, 128GB storage, and a 48MP main camera with 2x optical zoom. USB-C connectivity.', shortDescription: '6.1" iPhone with A16 Bionic, 48MP camera, USB-C.',
    images: ['https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '6.1" Super Retina XDR 60Hz', 'Processor': 'A16 Bionic', 'RAM': '6GB', 'Storage': '128GB', 'Camera': '48MP + 12MP', 'Battery': '3349mAh', 'OS': 'iOS 17', 'Weight': '171g' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: true, isBestSeller: true,
    relatedProducts: ['p-24', 'p-25', 'p-28'], tags: ['iphone', 'a16', 'usb-c', 'mainstream', 'apple']
  },
  {
    id: 'p-28', name: 'Redmi Note 13 Pro+', slug: 'redmi-note-13-pro-plus', sku: 'RD-N13P-028', brand: 'Redmi', brandSlug: 'redmi', category: 'Phones', categorySlug: 'phones',
    description: 'The Redmi Note 13 Pro+ features a 6.67" 1.5K AMOLED 120Hz, MediaTek Dimensity 7200, 12GB RAM, 256GB storage, and a 200MP camera with 120W fast charging.', shortDescription: '6.67" mid-range with 200MP camera, 120W charging, 1.5K display.',
    images: ['https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '6.67" 1.5K AMOLED 120Hz', 'Processor': 'MediaTek Dimensity 7200', 'RAM': '12GB', 'Storage': '256GB', 'Camera': '200MP + 8MP + 2MP', 'Battery': '5000mAh', 'OS': 'MIUI 14', 'Weight': '199g' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: true, isBestSeller: true,
    relatedProducts: ['p-25', 'p-26', 'p-29'], tags: ['redmi', '200mp', 'fast-charging', 'value', 'budget']
  },
  {
    id: 'p-29', name: 'Tecno Phantom V2 Fold', slug: 'tecno-phantom-v2-fold', sku: 'TC-PV2F-029', brand: 'Tecno', brandSlug: 'tecno', category: 'Phones', categorySlug: 'phones',
    description: 'The Tecno Phantom V2 Fold is a foldable phone with a 7.85" 2K+ inner display, MediaTek Dimensity 9000+, 12GB RAM, 256GB storage, and a 50MP triple camera.', shortDescription: 'Foldable phone with 7.85" 2K+ display, Dimensity 9000+.',
    images: ['https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '7.85" 2K+ AMOLED 120Hz', 'Processor': 'MediaTek Dimensity 9000+', 'RAM': '12GB', 'Storage': '256GB', 'Camera': '50MP + 50MP + 13MP', 'Battery': '5000mAh', 'OS': 'HiOS 13', 'Weight': '299g' },
    price: null, availability: 'low-stock', isFeatured: true, isNew: true, isBestSeller: false,
    relatedProducts: ['p-23', 'p-28', 'p-30'], tags: ['foldable', 'tecno', 'phantom', 'innovative', 'premium']
  },
  {
    id: 'p-30', name: 'Infinix GT 20 Pro', slug: 'infinix-gt-20-pro', sku: 'IF-GT20P-030', brand: 'Infinix', brandSlug: 'infinix', category: 'Phones', categorySlug: 'phones',
    description: 'The Infinix GT 20 Pro is a gaming phone with a 6.78" FHD+ 144Hz AMOLED, Dimensity 8200, 12GB RAM, 256GB storage, and a 108MP camera with RGB lighting.', shortDescription: '6.78" gaming phone with 144Hz AMOLED, Dimensity 8200.',
    images: ['https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '6.78" FHD+ AMOLED 144Hz', 'Processor': 'MediaTek Dimensity 8200', 'RAM': '12GB', 'Storage': '256GB', 'Camera': '108MP + 2MP + 2MP', 'Battery': '5000mAh', 'OS': 'XOS 14', 'Weight': '196g' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: true, isBestSeller: false,
    relatedProducts: ['p-28', 'p-29', 'p-25'], tags: ['gaming', 'infinix', '144hz', 'rgb', 'youth']
  },
  {
    id: 'p-31', name: 'Oppo Reno11 Pro', slug: 'oppo-reno11-pro', sku: 'OP-R11P-031', brand: 'Oppo', brandSlug: 'oppo', category: 'Phones', categorySlug: 'phones',
    description: 'The Oppo Reno11 Pro features a 6.7" FHD+ 120Hz AMOLED, Dimensity 8200, 12GB RAM, 256GB storage, and a 50MP camera with portrait expertise. Elegant design.', shortDescription: '6.7" portrait phone with 50MP camera, Dimensity 8200.',
    images: ['https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '6.7" FHD+ AMOLED 120Hz', 'Processor': 'MediaTek Dimensity 8200', 'RAM': '12GB', 'Storage': '256GB', 'Camera': '50MP + 32MP + 8MP', 'Battery': '4600mAh', 'OS': 'ColorOS 14', 'Weight': '190g' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: false,
    relatedProducts: ['p-26', 'p-28', 'p-32'], tags: ['oppo', 'portrait', 'coloros', 'design', 'elegant']
  },
  {
    id: 'p-32', name: 'Vivo V29 Pro', slug: 'vivo-v29-pro', sku: 'VV-V29P-032', brand: 'Vivo', brandSlug: 'vivo', category: 'Phones', categorySlug: 'phones',
    description: 'The Vivo V29 Pro features a 6.78" 1.5K 120Hz AMOLED, Dimensity 8200, 12GB RAM, 256GB storage, and a 50MP camera with Aura Light for perfect portraits.', shortDescription: '6.78" portrait phone with Aura Light, 50MP camera, 1.5K display.',
    images: ['https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '6.78" 1.5K AMOLED 120Hz', 'Processor': 'MediaTek Dimensity 8200', 'RAM': '12GB', 'Storage': '256GB', 'Camera': '50MP + 8MP + 2MP', 'Battery': '4600mAh', 'OS': 'Funtouch OS 14', 'Weight': '188g' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: false,
    relatedProducts: ['p-31', 'p-28', 'p-25'], tags: ['vivo', 'aura-light', 'portrait', 'funtouch', 'mid-range']
  },
  {
    id: 'p-33', name: 'Nokia G42 5G', slug: 'nokia-g42-5g', sku: 'NK-G42-033', brand: 'Nokia', brandSlug: 'nokia', category: 'Phones', categorySlug: 'phones',
    description: 'The Nokia G42 5G features a 6.56" HD+ 90Hz display, Snapdragon 480+, 6GB RAM, 128GB storage, and a 50MP camera. Built to last with 3 years of OS updates.', shortDescription: '6.56" durable phone with 50MP camera, 5G, 3-year updates.',
    images: ['https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '6.56" HD+ 90Hz', 'Processor': 'Snapdragon 480+', 'RAM': '6GB', 'Storage': '128GB', 'Camera': '50MP + 2MP + 2MP', 'Battery': '5000mAh', 'OS': 'Android 13', 'Weight': '193g' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: false,
    relatedProducts: ['p-25', 'p-28', 'p-30'], tags: ['nokia', 'durable', 'budget', 'reliable', 'updates']
  },
  {
    id: 'p-34', name: 'OnePlus 12', slug: 'oneplus-12', sku: 'OP-12-034', brand: 'OnePlus', brandSlug: 'oneplus', category: 'Phones', categorySlug: 'phones',
    description: 'The OnePlus 12 features a 6.82" 2K 120Hz LTPO AMOLED, Snapdragon 8 Gen 3, 16GB RAM, 256GB storage, and a Hasselblad-tuned 50MP triple camera.', shortDescription: '6.82" flagship with Hasselblad camera, Snapdragon 8 Gen 3, 2K.',
    images: ['https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '6.82" 2K LTPO AMOLED 120Hz', 'Processor': 'Snapdragon 8 Gen 3', 'RAM': '16GB', 'Storage': '256GB', 'Camera': '50MP + 48MP + 64MP', 'Battery': '5400mAh', 'OS': 'OxygenOS 14', 'Weight': '220g' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: true, isBestSeller: false,
    relatedProducts: ['p-23', 'p-26', 'p-24'], tags: ['oneplus', 'hasselblad', 'oxygenos', 'flagship', 'premium']
  },
  {
    id: 'p-35', name: 'Google Pixel 8 Pro', slug: 'google-pixel-8-pro', sku: 'GP-P8P-035', brand: 'Google Pixel', brandSlug: 'google-pixel', category: 'Phones', categorySlug: 'phones',
    description: 'The Google Pixel 8 Pro features a 6.7" LTPO OLED 120Hz, Google Tensor G3, 12GB RAM, 128GB storage, and a 50MP camera with AI-powered photography. 7 years of updates.', shortDescription: '6.7" AI phone with Tensor G3, 50MP camera, 7-year updates.',
    images: ['https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '6.7" LTPO OLED 120Hz', 'Processor': 'Google Tensor G3', 'RAM': '12GB', 'Storage': '128GB', 'Camera': '50MP + 48MP + 48MP', 'Battery': '5050mAh', 'OS': 'Android 14', 'Weight': '213g' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: false,
    relatedProducts: ['p-24', 'p-27', 'p-34'], tags: ['google', 'pixel', 'ai', 'tensor', 'updates', 'pure-android']
  },
  // Tablets
  {
    id: 'p-36', name: 'iPad Pro 12.9" M2', slug: 'ipad-pro-12-9-m2', sku: 'AP-IP-12P-M2-036', brand: 'Apple iPad', brandSlug: 'apple-ipad', category: 'Tablets', categorySlug: 'tablets',
    description: 'The iPad Pro 12.9" M2 features a Liquid Retina XDR display, M2 chip, 8GB RAM, 128GB storage, and supports Apple Pencil 2 and Magic Keyboard. Professional-grade tablet.', shortDescription: '12.9" professional tablet with M2, Liquid Retina XDR, Apple Pencil.',
    images: ['https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '12.9" Liquid Retina XDR 120Hz', 'Processor': 'Apple M2', 'RAM': '8GB', 'Storage': '128GB', 'Camera': '12MP + 10MP', 'Battery': 'Up to 10 hours', 'OS': 'iPadOS 17', 'Weight': '682g' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-37', 'p-38', 'p-39'], tags: ['ipad', 'm2', 'pro', 'apple-pencil', 'xdr', 'premium']
  },
  {
    id: 'p-37', name: 'iPad Air 5', slug: 'ipad-air-5', sku: 'AP-IP-AIR5-037', brand: 'Apple iPad', brandSlug: 'apple-ipad', category: 'Tablets', categorySlug: 'tablets',
    description: 'The iPad Air 5 features a 10.9" Liquid Retina display, M1 chip, 8GB RAM, 64GB storage, and supports Apple Pencil 2. Perfect balance of power and portability.', shortDescription: '10.9" tablet with M1 chip, Liquid Retina, Apple Pencil support.',
    images: ['https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '10.9" Liquid Retina 60Hz', 'Processor': 'Apple M1', 'RAM': '8GB', 'Storage': '64GB', 'Camera': '12MP + 12MP', 'Battery': 'Up to 10 hours', 'OS': 'iPadOS 17', 'Weight': '461g' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-36', 'p-38', 'p-40'], tags: ['ipad', 'air', 'm1', 'portable', 'balance', 'apple']
  },
  {
    id: 'p-38', name: 'Samsung Galaxy Tab S9 Ultra', slug: 'samsung-galaxy-tab-s9-ultra', sku: 'SM-GT-S9U-038', brand: 'Samsung Galaxy Tab', brandSlug: 'samsung-galaxy-tab', category: 'Tablets', categorySlug: 'tablets',
    description: 'The Galaxy Tab S9 Ultra features a 14.6" Dynamic AMOLED 2X 120Hz display, Snapdragon 8 Gen 2, 12GB RAM, 256GB storage, and S Pen included. Ultimate Android tablet.', shortDescription: '14.6" ultimate Android tablet with AMOLED 2X, Snapdragon 8 Gen 2.',
    images: ['https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '14.6" Dynamic AMOLED 2X 120Hz', 'Processor': 'Snapdragon 8 Gen 2', 'RAM': '12GB', 'Storage': '256GB', 'Camera': '13MP + 8MP', 'Battery': '11200mAh', 'OS': 'Android 14', 'Weight': '732g' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: true, isBestSeller: false,
    relatedProducts: ['p-36', 'p-39', 'p-40'], tags: ['samsung', 'tab', 's-pen', 'amoled', 'ultimate', 'premium']
  },
  {
    id: 'p-39', name: 'Samsung Galaxy Tab A9+', slug: 'samsung-galaxy-tab-a9-plus', sku: 'SM-GT-A9P-039', brand: 'Samsung Galaxy Tab', brandSlug: 'samsung-galaxy-tab', category: 'Tablets', categorySlug: 'tablets',
    description: 'The Galaxy Tab A9+ features an 11" FHD+ 90Hz display, Snapdragon 695, 4GB RAM, 64GB storage, and quad speakers. Great entertainment tablet at an affordable price.', shortDescription: '11" entertainment tablet with 90Hz display, Snapdragon 695.',
    images: ['https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '11" FHD+ 90Hz', 'Processor': 'Snapdragon 695', 'RAM': '4GB', 'Storage': '64GB', 'Camera': '8MP + 5MP', 'Battery': '7040mAh', 'OS': 'Android 14', 'Weight': '480g' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: true, isBestSeller: true,
    relatedProducts: ['p-38', 'p-37', 'p-41'], tags: ['samsung', 'budget', 'entertainment', 'a-series', 'value']
  },
  {
    id: 'p-40', name: 'Lenovo Tab P12', slug: 'lenovo-tab-p12', sku: 'LN-TAB-P12-040', brand: 'Lenovo Tablets', brandSlug: 'lenovo-tablets', category: 'Tablets', categorySlug: 'tablets',
    description: 'The Lenovo Tab P12 features a 12.7" 3K display, Dimensity 7050, 8GB RAM, 128GB storage, and quad JBL speakers with Dolby Atmos. Great for media and productivity.', shortDescription: '12.7" tablet with 3K display, JBL speakers, Dimensity 7050.',
    images: ['https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '12.7" 3K LCD', 'Processor': 'Dimensity 7050', 'RAM': '8GB', 'Storage': '128GB', 'Camera': '13MP + 8MP', 'Battery': '10200mAh', 'OS': 'Android 13', 'Weight': '615g' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: false,
    relatedProducts: ['p-38', 'p-39', 'p-41'], tags: ['lenovo', 'p12', 'jbl', 'media', 'productivity']
  },
  {
    id: 'p-41', name: 'Microsoft Surface Pro 9', slug: 'microsoft-surface-pro-9', sku: 'MS-SP-9-041', brand: 'Microsoft Surface', brandSlug: 'microsoft-surface', category: 'Tablets', categorySlug: 'tablets',
    description: 'The Surface Pro 9 features a 13" PixelSense touchscreen, Intel Core i5-1235U, 8GB RAM, 256GB SSD, and supports Surface Pen and Type Cover. True 2-in-1 productivity.', shortDescription: '13" 2-in-1 tablet with Intel i5, PixelSense, Surface Pen.',
    images: ['https://images.pexels.com/photos/1334597/pexels-photo-1334597.jpeg?auto=compress&cs=tinysrgb&w=800', 'https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '13" PixelSense Touch 120Hz', 'Processor': 'Intel Core i5-1235U', 'RAM': '8GB LPDDR5', 'Storage': '256GB SSD', 'Camera': '10MP + 5MP', 'Battery': 'Up to 15.5 hours', 'OS': 'Windows 11', 'Weight': '879g' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-36', 'p-37', 'p-40'], tags: ['surface', '2-in-1', 'windows', 'productivity', 'microsoft']
  },
  // Printers
  {
    id: 'p-42', name: 'Epson EcoTank L4260', slug: 'epson-ecotank-l4260', sku: 'EP-ET-L4260-042', brand: 'Epson', brandSlug: 'epson', category: 'Printers', categorySlug: 'printers',
    description: 'The Epson EcoTank L4260 is a wireless 3-in-1 ink tank printer with Wi-Fi, auto duplex, and print speeds up to 10.5 ppm. Ultra-low cost per page with refillable ink tanks.', shortDescription: 'Wireless 3-in-1 ink tank printer with Wi-Fi, auto duplex.',
    images: ['https://images.pexels.com/photos/4792717/pexels-photo-4792717.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Type': 'Ink Tank 3-in-1', 'Print Speed': '10.5 ppm black, 5 ppm color', 'Resolution': '5760 x 1440 dpi', 'Connectivity': 'Wi-Fi, USB', 'Paper': 'A4, Letter, Legal', 'Duplex': 'Auto', 'Ink System': 'Refillable tanks' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-43', 'p-44', 'p-45'], tags: ['ecotank', 'epson', 'wireless', '3-in-1', 'cost-effective']
  },
  {
    id: 'p-43', name: 'Brother DCP-L2540DW', slug: 'brother-dcp-l2540dw', sku: 'BR-DCP-L2540-043', brand: 'Brother', brandSlug: 'brother', category: 'Printers', categorySlug: 'printers',
    description: 'The Brother DCP-L2540DW is a compact monochrome laser 3-in-1 with wireless, duplex printing, and speeds up to 30 ppm. Reliable and cost-effective for offices.', shortDescription: 'Compact mono laser 3-in-1 with wireless, duplex, 30 ppm.',
    images: ['https://images.pexels.com/photos/4792717/pexels-photo-4792717.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Type': 'Mono Laser 3-in-1', 'Print Speed': '30 ppm', 'Resolution': '2400 x 600 dpi', 'Connectivity': 'Wi-Fi, Ethernet, USB', 'Paper': 'A4, Letter', 'Duplex': 'Auto', 'Toner': 'High-yield cartridges' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: false,
    relatedProducts: ['p-42', 'p-44', 'p-45'], tags: ['brother', 'laser', 'mono', 'office', 'compact']
  },
  {
    id: 'p-44', name: 'HP LaserJet Pro MFP M428fdw', slug: 'hp-laserjet-pro-mfp-m428fdw', sku: 'HP-LJ-M428-044', brand: 'HP', brandSlug: 'hp', category: 'Printers', categorySlug: 'printers',
    description: 'The HP LaserJet Pro MFP M428fdw is a fast mono laser 4-in-1 with 40 ppm, duplex, wireless, and a 50-page ADF. HP JetIntelligence toner for efficiency.', shortDescription: 'Fast mono laser 4-in-1 with 40 ppm, duplex, 50-page ADF.',
    images: ['https://images.pexels.com/photos/4792717/pexels-photo-4792717.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Type': 'Mono Laser 4-in-1', 'Print Speed': '40 ppm', 'Resolution': '4800 x 600 dpi', 'Connectivity': 'Wi-Fi, Ethernet, USB', 'Paper': 'A4, Letter, Legal', 'Duplex': 'Auto', 'ADF': '50-page' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: true, isBestSeller: false,
    relatedProducts: ['p-42', 'p-43', 'p-45'], tags: ['hp', 'laserjet', 'adf', 'jetintelligence', 'enterprise']
  },
  {
    id: 'p-45', name: 'Epson WorkForce Pro WF-C5790', slug: 'epson-workforce-pro-wf-c5790', sku: 'EP-WF-C5790-045', brand: 'Epson', brandSlug: 'epson', category: 'Printers', categorySlug: 'printers',
    description: 'The Epson WorkForce Pro WF-C5790 is a business-grade inkjet 4-in-1 with 24 ppm, duplex, wireless, and PrecisionCore technology. Lower power than laser printers.', shortDescription: 'Business inkjet 4-in-1 with 24 ppm, duplex, PrecisionCore.',
    images: ['https://images.pexels.com/photos/4792717/pexels-photo-4792717.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Type': 'Business Inkjet 4-in-1', 'Print Speed': '24 ppm', 'Resolution': '4800 x 1200 dpi', 'Connectivity': 'Wi-Fi, Ethernet, USB', 'Paper': 'A4, Letter, Legal', 'Duplex': 'Auto', 'ADF': '50-page' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: false,
    relatedProducts: ['p-42', 'p-44', 'p-43'], tags: ['epson', 'workforce', 'precisioncore', 'business', 'energy-efficient']
  },
  // Networking
  {
    id: 'p-46', name: 'Cisco Catalyst 9200 Switch', slug: 'cisco-catalyst-9200', sku: 'CS-CT-9200-046', brand: 'Cisco', brandSlug: 'cisco', category: 'Networking', categorySlug: 'networking',
    description: 'The Cisco Catalyst 9200 is a 24-port Gigabit Ethernet switch with PoE+, Layer 3 routing, and Cisco DNA support. Enterprise-grade access layer switching.', shortDescription: '24-port Gigabit PoE+ switch with Layer 3, Cisco DNA.',
    images: ['https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Ports': '24x Gigabit + 4x SFP', 'PoE': 'PoE+ 370W', 'Layer': 'Layer 3', 'Management': 'Cisco DNA / CLI', 'Throughput': '88 Gbps', 'Power': 'Internal PSU', 'Rack': '1U' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-47', 'p-48', 'p-49'], tags: ['cisco', 'catalyst', 'poe', 'enterprise', 'layer3']
  },
  {
    id: 'p-47', name: 'Ubiquiti UniFi Dream Machine Pro', slug: 'ubiquiti-unifi-dream-machine-pro', sku: 'UB-UDM-PRO-047', brand: 'Ubiquiti', brandSlug: 'ubiquiti', category: 'Networking', categorySlug: 'networking',
    description: 'The UniFi Dream Machine Pro is an all-in-one network appliance with 8x Gigabit, 1x 10G SFP+, UniFi Protect NVR, and a powerful security gateway. Perfect for SMBs.', shortDescription: 'All-in-one network appliance with 8x Gigabit, 10G SFP+, NVR.',
    images: ['https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Ports': '8x Gigabit + 1x 10G SFP+', 'Firewall': '3.5 Gbps', 'VPN': 'IPSec / OpenVPN', 'Storage': '3.5" HDD bay', 'Management': 'UniFi Controller', 'Power': 'Internal PSU', 'Rack': '1U' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: true, isBestSeller: true,
    relatedProducts: ['p-46', 'p-48', 'p-49'], tags: ['ubiquiti', 'unifi', 'all-in-one', 'smb', 'security']
  },
  {
    id: 'p-48', name: 'Fortinet FortiGate 60F', slug: 'fortinet-fortigate-60f', sku: 'FT-FG-60F-048', brand: 'Fortinet', brandSlug: 'fortinet', category: 'Networking', categorySlug: 'networking',
    description: 'The FortiGate 60F is a next-gen firewall with 10x GE RJ45, 900 Mbps firewall throughput, and integrated SD-WAN. FortiGuard security subscription included.', shortDescription: 'Next-gen firewall with 10x GE, SD-WAN, 900 Mbps throughput.',
    images: ['https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Ports': '10x GE RJ45', 'Firewall': '900 Mbps', 'VPN': 'IPSec / SSL', 'SD-WAN': 'Integrated', 'UTM': 'FortiGuard', 'Power': 'External adapter', 'Form': 'Desktop' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: false,
    relatedProducts: ['p-46', 'p-47', 'p-49'], tags: ['fortinet', 'firewall', 'sd-wan', 'security', 'smb']
  },
  {
    id: 'p-49', name: 'Ubiquiti UniFi 6 Long-Range AP', slug: 'ubiquiti-unifi-6-long-range-ap', sku: 'UB-U6-LR-049', brand: 'Ubiquiti', brandSlug: 'ubiquiti', category: 'Networking', categorySlug: 'networking',
    description: 'The UniFi 6 Long-Range AP delivers Wi-Fi 6 with 4x4 MU-MIMO, 3 Gbps aggregate throughput, and a range of 183 meters. Ceiling and wall mountable.', shortDescription: 'Wi-Fi 6 access point with 4x4 MU-MIMO, 3 Gbps, 183m range.',
    images: ['https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Wi-Fi': '802.11ax (Wi-Fi 6)', 'Throughput': '3 Gbps', 'MIMO': '4x4 MU-MIMO', 'Range': '183 meters', 'PoE': '802.3af', 'Mount': 'Ceiling / Wall', 'Management': 'UniFi Controller' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-47', 'p-46', 'p-50'], tags: ['ubiquiti', 'wifi6', 'access-point', 'mu-mimo', 'long-range']
  },
  {
    id: 'p-50', name: 'Cisco Meraki MX68CW', slug: 'cisco-meraki-mx68cw', sku: 'CS-MX68CW-050', brand: 'Cisco', brandSlug: 'cisco', category: 'Networking', categorySlug: 'networking',
    description: 'The Cisco Meraki MX68CW is a cloud-managed security appliance with Wi-Fi 6, 450 Mbps firewall, 4G LTE backup, and 12x GE ports. Zero-touch deployment.', shortDescription: 'Cloud-managed security appliance with Wi-Fi 6, LTE backup.',
    images: ['https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Ports': '12x GE', 'Firewall': '450 Mbps', 'Wi-Fi': 'Wi-Fi 6', 'LTE': '4G Backup', 'Management': 'Cloud / Meraki Dashboard', 'VPN': 'Auto VPN', 'Form': 'Desktop' },
    price: null, availability: 'pre-order', isFeatured: false, isNew: true, isBestSeller: false,
    relatedProducts: ['p-46', 'p-48', 'p-47'], tags: ['cisco', 'meraki', 'cloud-managed', 'lte', 'wifi6', 'security']
  },
  // Storage
  {
    id: 'p-51', name: 'Synology DS923+ NAS', slug: 'synology-ds923-plus-nas', sku: 'SY-DS923-051', brand: 'Synology', brandSlug: 'synology', category: 'Storage', categorySlug: 'storage',
    description: 'The Synology DS923+ is a 4-bay NAS with AMD Ryzen R1600, 4GB RAM, dual 1GbE, and expandable up to 9 bays. DSM 7.2 with comprehensive apps and backup solutions.', shortDescription: '4-bay NAS with AMD Ryzen, expandable to 9 bays, DSM 7.2.',
    images: ['https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Bays': '4x 3.5" / 2.5"', 'Processor': 'AMD Ryzen R1600', 'RAM': '4GB DDR4', 'Network': 'Dual 1GbE', 'Expandable': 'Up to 9 bays', 'OS': 'DSM 7.2', 'Form': 'Desktop' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-52', 'p-53', 'p-19'], tags: ['synology', 'nas', 'backup', 'dsm', 'expandable', 'smb']
  },
  {
    id: 'p-52', name: 'WD My Cloud EX2 Ultra', slug: 'wd-my-cloud-ex2-ultra', sku: 'WD-EX2U-052', brand: 'Western Digital', brandSlug: 'western-digital', category: 'Storage', categorySlug: 'storage',
    description: 'The WD My Cloud EX2 Ultra is a 2-bay NAS with Marvell ARMADA, 1GB RAM, dual Gigabit Ethernet, and easy setup. Perfect for personal cloud and backups.', shortDescription: '2-bay personal NAS with dual Gigabit, easy cloud setup.',
    images: ['https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Bays': '2x 3.5"', 'Processor': 'Marvell ARMADA', 'RAM': '1GB', 'Network': 'Dual Gigabit', 'Capacity': 'Up to 24TB', 'Features': 'RAID 0/1, JBOD', 'Form': 'Desktop' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: false,
    relatedProducts: ['p-51', 'p-53', 'p-54'], tags: ['wd', 'personal', 'nas', 'cloud', 'backup', 'home']
  },
  {
    id: 'p-53', name: 'Seagate IronWolf Pro 8TB', slug: 'seagate-ironwolf-pro-8tb', sku: 'SG-IWP-8TB-053', brand: 'Seagate', brandSlug: 'seagate', category: 'Storage', categorySlug: 'storage',
    description: 'The Seagate IronWolf Pro 8TB is a 3.5" NAS-optimized hard drive with 7200 RPM, 256MB cache, and AgileArray technology. 5-year warranty and Rescue Data Recovery.', shortDescription: '8TB NAS-optimized HDD with 7200 RPM, 256MB cache.',
    images: ['https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Capacity': '8TB', 'Interface': 'SATA 6Gb/s', 'RPM': '7200', 'Cache': '256MB', 'Load/Unload': '600K', 'Warranty': '5 years', 'Recovery': 'Rescue Data Recovery' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: true,
    relatedProducts: ['p-51', 'p-52', 'p-54'], tags: ['seagate', 'ironwolf', 'hdd', 'nas', 'enterprise', '8tb']
  },
  {
    id: 'p-54', name: 'Samsung T7 Portable SSD 1TB', slug: 'samsung-t7-portable-ssd-1tb', sku: 'SM-T7-1TB-054', brand: 'Samsung', brandSlug: 'samsung', category: 'Storage', categorySlug: 'storage',
    description: 'The Samsung T7 Portable SSD delivers 1TB of storage with up to 1050 MB/s read speeds, USB-C 3.2 Gen 2, and compact pocket-sized design. AES 256-bit encryption.', shortDescription: '1TB portable SSD with 1050 MB/s, USB-C, AES encryption.',
    images: ['https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Capacity': '1TB', 'Interface': 'USB-C 3.2 Gen 2', 'Read': '1050 MB/s', 'Write': '1000 MB/s', 'Encryption': 'AES 256-bit', 'Size': '85 x 57 x 8 mm', 'Weight': '58g' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-51', 'p-53', 'p-55'], tags: ['samsung', 'portable', 'ssd', 'usb-c', 'fast', 'compact']
  },
  {
    id: 'p-55', name: 'SanDisk Extreme Portable SSD 2TB', slug: 'sandisk-extreme-portable-ssd-2tb', sku: 'SD-EXT-2TB-055', brand: 'SanDisk', brandSlug: 'sandisk', category: 'Storage', categorySlug: 'storage',
    description: 'The SanDisk Extreme Portable SSD 2TB offers up to 1050 MB/s, IP55 water/dust resistance, shock resistance, and compact design. Perfect for outdoor content creators.', shortDescription: '2TB rugged portable SSD with 1050 MB/s, IP55 resistance.',
    images: ['https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Capacity': '2TB', 'Interface': 'USB-C 3.2 Gen 2', 'Read': '1050 MB/s', 'Write': '1000 MB/s', 'Protection': 'IP55 water/dust', 'Shock': '2m drop resistance', 'Weight': '49g' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: true, isBestSeller: false,
    relatedProducts: ['p-54', 'p-53', 'p-52'], tags: ['sandisk', 'rugged', 'portable', 'ssd', 'outdoor', 'creator']
  },
  // Projectors
  {
    id: 'p-56', name: 'Epson EB-L260F Laser Projector', slug: 'epson-eb-l260f-laser-projector', sku: 'EP-EB-L260F-056', brand: 'Epson', brandSlug: 'epson', category: 'Projectors', categorySlug: 'projectors',
    description: 'The Epson EB-L260F is a 4600-lumen Full HD laser projector with 20,000 hours maintenance-free operation, wireless casting, and built-in speaker. Perfect for classrooms and meeting rooms.', shortDescription: '4600-lumen Full HD laser projector with 20,000h maintenance-free.',
    images: ['https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Brightness': '4600 lumens', 'Resolution': '1920 x 1080', 'Contrast': '2,500,000:1', 'Light Source': 'Laser', 'Lifespan': '20,000 hours', 'Throw Ratio': '1.32 - 2.15', 'Connectivity': 'HDMI, USB, Wi-Fi', 'Audio': 'Built-in 16W speaker' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-57', 'p-58', 'p-59'], tags: ['epson', 'laser', 'classroom', 'full-hd', 'maintenance-free']
  },
  {
    id: 'p-57', name: 'BenQ TK700STi 4K Projector', slug: 'benq-tk700sti-4k-projector', sku: 'BQ-TK700STI-057', brand: 'BenQ', brandSlug: 'benq', category: 'Projectors', categorySlug: 'projectors',
    description: 'The BenQ TK700STi is a 3000-lumen 4K UHD short throw projector with 240Hz refresh rate, 4.16ms input lag, and Android TV. Built for gaming and home theater.', shortDescription: '3000-lumen 4K short throw projector with 240Hz, Android TV.',
    images: ['https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Brightness': '3000 lumens', 'Resolution': '3840 x 2160', 'Contrast': '10,000:1', 'Refresh': '240Hz', 'Input Lag': '4.16ms', 'Throw Ratio': '0.9 - 1.08', 'Connectivity': 'HDMI, USB, Wi-Fi', 'Smart': 'Android TV' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: true, isBestSeller: false,
    relatedProducts: ['p-56', 'p-58', 'p-59'], tags: ['benq', '4k', 'gaming', 'short-throw', '240hz', 'home-theater']
  },
  {
    id: 'p-58', name: 'Epson EB-PU1006B Large Venue', slug: 'epson-eb-pu1006b-large-venue', sku: 'EP-EB-PU1006B-058', brand: 'Epson', brandSlug: 'epson', category: 'Projectors', categorySlug: 'projectors',
    description: 'The Epson EB-PU1006B is a 6000-lumen WUXGA laser projector with 4K enhancement, 20,000 hours laser life, and interchangeable lenses. For large venues and events.', shortDescription: '6000-lumen WUXGA laser projector with 4K enhancement.',
    images: ['https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Brightness': '6000 lumens', 'Resolution': '1920 x 1200 WUXGA', 'Contrast': '2,500,000:1', 'Light Source': 'Laser', 'Lifespan': '20,000 hours', 'Lens': 'Interchangeable', 'Connectivity': 'HDMI, HDBaseT, USB', 'Weight': '14.3 kg' },
    price: null, availability: 'pre-order', isFeatured: false, isNew: false, isBestSeller: false,
    relatedProducts: ['p-56', 'p-57', 'p-59'], tags: ['epson', 'large-venue', 'wuxga', 'laser', 'event', '6000-lumen']
  },
  {
    id: 'p-59', name: 'ViewSonic PA503W', slug: 'viewsonic-pa503w', sku: 'VS-PA503W-059', brand: 'ViewSonic', brandSlug: 'viewsonic', category: 'Projectors', categorySlug: 'projectors',
    description: 'The ViewSonic PA503W is an affordable 3600-lumen WXGA projector with 15,000 hours lamp life, SuperColor technology, and HDMI/VGA connectivity. Great for schools and offices.', shortDescription: '3600-lumen WXGA projector with 15,000h lamp life, SuperColor.',
    images: ['https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Brightness': '3600 lumens', 'Resolution': '1280 x 800 WXGA', 'Contrast': '22,000:1', 'Light Source': 'Lamp', 'Lifespan': '15,000 hours', 'Throw Ratio': '1.55 - 1.7', 'Connectivity': 'HDMI, VGA, USB', 'Audio': 'Built-in 2W speaker' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: true,
    relatedProducts: ['p-56', 'p-57', 'p-58'], tags: ['viewsonic', 'budget', 'wxga', 'school', 'office', 'affordable']
  },
  // Conferencing Solutions
  {
    id: 'p-60', name: 'Poly Studio X50', slug: 'poly-studio-x50', sku: 'PY-SX50-060', brand: 'Poly', brandSlug: 'poly', category: 'Conferencing Solutions', categorySlug: 'conferencing',
    description: 'The Poly Studio X50 is an all-in-one video bar with 4K camera, 120-degree FOV, and advanced noise-canceling microphone array. Native Microsoft Teams and Zoom support.', shortDescription: 'All-in-one 4K video bar with 120-degree FOV, Teams/Zoom native.',
    images: ['https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Camera': '4K with 120-degree FOV', 'Audio': 'Multi-microphone array', 'Noise Cancellation': 'Advanced', 'Platform': 'Microsoft Teams / Zoom', 'Display': 'Supports up to 4K', 'Mount': 'Wall / TV mount', 'Connectivity': 'HDMI, USB, Ethernet' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-61', 'p-62', 'p-63'], tags: ['poly', 'video-bar', '4k', 'teams', 'zoom', 'all-in-one']
  },
  {
    id: 'p-61', name: 'Jabra PanaCast 50', slug: 'jabra-panacast-50', sku: 'JB-PC50-061', brand: 'Jabra', brandSlug: 'jabra', category: 'Conferencing Solutions', categorySlug: 'conferencing',
    description: 'The Jabra PanaCast 50 is a 180-degree panoramic 4K video bar with 8 microphones, intelligent zoom, and whiteboard sharing. Certified for Teams and Zoom.', shortDescription: '180-degree panoramic 4K video bar with 8 microphones.',
    images: ['https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Camera': '180-degree panoramic 4K', 'Audio': '8 microphones + 4 speakers', 'Intelligent Zoom': 'Yes', 'Whiteboard': 'Yes', 'Platform': 'Teams / Zoom', 'Connectivity': 'USB-C, Ethernet', 'Mount': 'Wall / Table' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: true, isBestSeller: false,
    relatedProducts: ['p-60', 'p-62', 'p-63'], tags: ['jabra', 'panacast', '180-degree', 'panoramic', 'intelligent-zoom', 'premium']
  },
  {
    id: 'p-62', name: 'Yealink MeetingBar A10', slug: 'yealink-meetingbar-a10', sku: 'YK-MBA10-062', brand: 'Yealink', brandSlug: 'yealink', category: 'Conferencing Solutions', categorySlug: 'conferencing',
    description: 'The Yealink MeetingBar A10 is an Android-based all-in-one video bar with 4K camera, 10x digital zoom, and AI-powered framing. Native Teams and Zoom apps built-in.', shortDescription: 'Android-based 4K video bar with AI framing, Teams/Zoom native.',
    images: ['https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Camera': '4K with AI framing', 'Zoom': '10x digital', 'Audio': '6 microphones + 1 speaker', 'OS': 'Android', 'Platform': 'Teams / Zoom', 'Connectivity': 'HDMI, USB, Ethernet', 'Mount': 'Wall / TV mount' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: true, isBestSeller: false,
    relatedProducts: ['p-60', 'p-61', 'p-63'], tags: ['yealink', 'meetingbar', 'android', 'ai-framing', 'all-in-one', 'budget']
  },
  {
    id: 'p-63', name: 'Logitech Rally Bar', slug: 'logitech-rally-bar', sku: 'LG-RB-063', brand: 'Logitech', brandSlug: 'logitech', category: 'Conferencing Solutions', categorySlug: 'conferencing',
    description: 'The Logitech Rally Bar is a premium video bar with dual 4K cameras, AI-powered RightSight 2 auto-framing, and modular audio. Certified for Teams, Zoom, and Google Meet.', shortDescription: 'Premium dual 4K video bar with AI auto-framing, modular audio.',
    images: ['https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Camera': 'Dual 4K with AI framing', 'Audio': 'Modular microphone system', 'Framing': 'RightSight 2', 'Platform': 'Teams / Zoom / Meet', 'Connectivity': 'USB-C, HDMI, Ethernet', 'Mount': 'Wall / TV / Table', 'Weight': '7.3 kg' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: false,
    relatedProducts: ['p-60', 'p-61', 'p-62'], tags: ['logitech', 'rally', 'premium', 'dual-camera', 'modular', 'enterprise']
  },
  // Accessories
  {
    id: 'p-64', name: 'Logitech MX Keys S', slug: 'logitech-mx-keys-s', sku: 'LG-MXKS-064', brand: 'Logitech', brandSlug: 'logitech', category: 'Accessories', categorySlug: 'accessories',
    description: 'The Logitech MX Keys S is a wireless illuminated keyboard with smart illumination, perfect stroke keys, and multi-device connectivity. USB-C rechargeable with 10-day battery.', shortDescription: 'Wireless illuminated keyboard with smart illumination, multi-device.',
    images: ['https://images.pexels.com/photos/129208/pexels-photo-129208.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Type': 'Wireless', 'Illumination': 'Smart backlight', 'Keys': 'Perfect stroke', 'Connectivity': 'Logi Bolt / Bluetooth', 'Battery': '10 days (backlit), 5 months (no light)', 'Charging': 'USB-C', 'Compatibility': 'Windows, macOS, Linux, iOS, Android' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: true, isBestSeller: true,
    relatedProducts: ['p-65', 'p-66', 'p-67'], tags: ['logitech', 'mx', 'keyboard', 'wireless', 'illuminated', 'premium']
  },
  {
    id: 'p-65', name: 'Logitech MX Master 3S', slug: 'logitech-mx-master-3s', sku: 'LG-MXM3S-065', brand: 'Logitech', brandSlug: 'logitech', category: 'Accessories', categorySlug: 'accessories',
    description: 'The Logitech MX Master 3S is an advanced wireless mouse with 8000 DPI, MagSpeed electromagnetic scrolling, and Quiet Clicks. Multi-device with Logi Bolt or Bluetooth.', shortDescription: 'Advanced wireless mouse with 8000 DPI, MagSpeed scrolling.',
    images: ['https://images.pexels.com/photos/129208/pexels-photo-129208.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'DPI': '8000', 'Scroll': 'MagSpeed electromagnetic', 'Clicks': 'Quiet 90% noise reduction', 'Connectivity': 'Logi Bolt / Bluetooth', 'Battery': '70 days', 'Charging': 'USB-C (1 min = 3 hours)', 'Compatibility': 'Windows, macOS, Linux' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-64', 'p-66', 'p-67'], tags: ['logitech', 'mx', 'mouse', 'wireless', 'premium', 'productivity']
  },
  {
    id: 'p-66', name: 'Dell UltraSharp U2723QE', slug: 'dell-ultrasharp-u2723qe', sku: 'DL-US-U2723QE-066', brand: 'Dell', brandSlug: 'dell', category: 'Accessories', categorySlug: 'accessories',
    description: 'The Dell UltraSharp U2723QE is a 27" 4K USB-C monitor with IPS Black technology, 2000:1 contrast, and 98% DCI-P3. 90W USB-C power delivery and KVM switch built-in.', shortDescription: '27" 4K USB-C monitor with IPS Black, 90W PD, KVM switch.',
    images: ['https://images.pexels.com/photos/129208/pexels-photo-129208.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Display': '27" 4K UHD (3840x2160)', 'Panel': 'IPS Black', 'Contrast': '2000:1', 'Color': '98% DCI-P3', 'Connectivity': 'USB-C 90W PD, HDMI, DP, USB-A', 'KVM': 'Yes', 'Ergonomics': 'Height, tilt, swivel, pivot' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: true, isBestSeller: false,
    relatedProducts: ['p-64', 'p-65', 'p-67'], tags: ['dell', 'ultrasharp', '4k', 'usb-c', 'ips-black', 'monitor']
  },
  {
    id: 'p-67', name: 'Dell WD22TB4 Thunderbolt Dock', slug: 'dell-wd22tb4-thunderbolt-dock', sku: 'DL-WD22TB4-067', brand: 'Dell', brandSlug: 'dell', category: 'Accessories', categorySlug: 'accessories',
    description: 'The Dell WD22TB4 Thunderbolt Dock provides 180W power delivery, dual 4K@60Hz, and 12 ports including Thunderbolt 4, USB-A, HDMI, DP, and Ethernet. Future-proof connectivity.', shortDescription: 'Thunderbolt 4 dock with 180W PD, dual 4K, 12 ports.',
    images: ['https://images.pexels.com/photos/129208/pexels-photo-129208.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Ports': 'Thunderbolt 4, 3x USB-A, 2x USB-C, HDMI, DP, Ethernet, Audio', 'Power Delivery': '180W', 'Video': 'Dual 4K@60Hz', 'Data': '40 Gbps', 'Network': '1GbE', 'Audio': '3.5mm combo', 'Compatibility': 'Thunderbolt 4 / USB4' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: true,
    relatedProducts: ['p-64', 'p-65', 'p-66'], tags: ['dell', 'thunderbolt', 'dock', '180w', 'dual-4k', 'productivity']
  },
  {
    id: 'p-68', name: 'APC Back-UPS Pro BR1500G', slug: 'apc-back-ups-pro-br1500g', sku: 'AP-BR1500G-068', brand: 'APC', brandSlug: 'apc', category: 'Accessories', categorySlug: 'accessories',
    description: 'The APC Back-UPS Pro BR1500G provides 1500VA/865W battery backup, 10 outlets, AVR, and LCD display. Protects workstations and networking equipment during outages.', shortDescription: '1500VA UPS with 10 outlets, AVR, LCD display.',
    images: ['https://images.pexels.com/photos/129208/pexels-photo-129208.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Capacity': '1500VA / 865W', 'Outlets': '10 (5 battery + surge, 5 surge only)', 'AVR': 'Yes', 'Display': 'LCD', 'Runtime': 'Up to 10 min at half load', 'Battery': 'User replaceable', 'Form': 'Tower' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-69', 'p-67', 'p-64'], tags: ['apc', 'ups', 'backup', 'power-protection', 'avr', 'workstation']
  },
  {
    id: 'p-69', name: 'APC Smart-UPS SRT 3000VA', slug: 'apc-smart-ups-srt-3000va', sku: 'AP-SRT-3000-069', brand: 'APC', brandSlug: 'apc', category: 'Accessories', categorySlug: 'accessories',
    description: 'The APC Smart-UPS SRT 3000VA is an online double-conversion UPS with 3000VA/2700W, scalable runtime, and network management card. For critical servers and data centers.', shortDescription: '3000VA online double-conversion UPS with scalable runtime.',
    images: ['https://images.pexels.com/photos/129208/pexels-photo-129208.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Capacity': '3000VA / 2700W', 'Topology': 'Online double-conversion', 'Outlets': '8x IEC C13, 2x IEC C19', 'Management': 'Network card included', 'Runtime': 'Scalable with external batteries', 'Form': '2U Rack / Tower', 'Warranty': '3 years' },
    price: null, availability: 'pre-order', isFeatured: false, isNew: false, isBestSeller: false,
    relatedProducts: ['p-68', 'p-67', 'p-19'], tags: ['apc', 'smart-ups', 'online', 'datacenter', 'critical', 'enterprise']
  },
  // Software
  {
    id: 'p-70', name: 'Microsoft 365 Business Standard', slug: 'microsoft-365-business-standard', sku: 'MS-M365BS-070', brand: 'Microsoft', brandSlug: 'microsoft', category: 'Software', categorySlug: 'software',
    description: 'Microsoft 365 Business Standard includes Office apps (Word, Excel, PowerPoint, Outlook), Teams, 1TB OneDrive, and Exchange email. Annual subscription per user.', shortDescription: 'Office apps, Teams, 1TB cloud storage, Exchange email per user.',
    images: ['https://images.pexels.com/photos/177598/pexels-photo-177598.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Apps': 'Word, Excel, PowerPoint, Outlook, Teams', 'Cloud': '1TB OneDrive per user', 'Email': 'Exchange Online', 'License': 'Annual subscription', 'Users': '1-300', 'Support': 'Web and phone', 'Security': 'Advanced threat protection' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-71', 'p-72', 'p-73'], tags: ['microsoft', '365', 'office', 'teams', 'subscription', 'business']
  },
  {
    id: 'p-71', name: 'Windows Server 2022 Standard', slug: 'windows-server-2022-standard', sku: 'MS-WS-2022STD-071', brand: 'Microsoft', brandSlug: 'microsoft', category: 'Software', categorySlug: 'software',
    description: 'Windows Server 2022 Standard delivers advanced multi-layer security, Azure hybrid capabilities, and flexible application platform. Includes 16 core licenses.', shortDescription: 'Server OS with advanced security, Azure hybrid, 16 core licenses.',
    images: ['https://images.pexels.com/photos/177598/pexels-photo-177598.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Edition': 'Standard', 'Cores': '16 core licenses', 'Security': 'Secured-core server', 'Hybrid': 'Azure Arc integration', 'Containers': 'Windows / Linux containers', 'Virtualization': '2 OSEs', 'CALs': 'Not included' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: true,
    relatedProducts: ['p-70', 'p-72', 'p-73'], tags: ['microsoft', 'windows-server', '2022', 'enterprise', 'security', 'virtualization']
  },
  {
    id: 'p-72', name: 'Kaspersky Endpoint Security', slug: 'kaspersky-endpoint-security', sku: 'KS-KES-072', brand: 'Kaspersky', brandSlug: 'kaspersky', category: 'Software', categorySlug: 'software',
    description: 'Kaspersky Endpoint Security provides advanced threat protection, device control, web control, and encryption for workstations and servers. Centralized management console.', shortDescription: 'Advanced endpoint protection with centralized management.',
    images: ['https://images.pexels.com/photos/177598/pexels-photo-177598.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Protection': 'Anti-malware, anti-ransomware', 'Features': 'Device control, web control, encryption', 'Management': 'Kaspersky Security Center', 'Platforms': 'Windows, macOS, Linux', 'License': 'Annual subscription', 'Deployment': 'On-premise or cloud', 'Support': '24/7' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: false,
    relatedProducts: ['p-70', 'p-71', 'p-73'], tags: ['kaspersky', 'endpoint', 'security', 'antivirus', 'encryption', 'enterprise']
  },
  {
    id: 'p-73', name: 'Adobe Creative Cloud All Apps', slug: 'adobe-creative-cloud-all-apps', sku: 'AD-CC-AA-073', brand: 'Adobe', brandSlug: 'adobe', category: 'Software', categorySlug: 'software',
    description: 'Adobe Creative Cloud All Apps includes Photoshop, Illustrator, Premiere Pro, After Effects, and 20+ creative apps. 100GB cloud storage and Adobe Fonts included.', shortDescription: '20+ creative apps including Photoshop, Illustrator, Premiere Pro.',
    images: ['https://images.pexels.com/photos/177598/pexels-photo-177598.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Apps': 'Photoshop, Illustrator, Premiere Pro, After Effects, and 20+', 'Cloud': '100GB', 'Fonts': 'Adobe Fonts', 'License': 'Annual subscription', 'Users': 'Individual or Teams', 'Support': 'Community and direct', 'Updates': 'Always up to date' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: false,
    relatedProducts: ['p-70', 'p-71', 'p-72'], tags: ['adobe', 'creative-cloud', 'photoshop', 'design', 'video', 'subscription']
  },
  // Security
  {
    id: 'p-74', name: 'Hikvision DS-2CD2T46G2-4I', slug: 'hikvision-ds-2cd2t46g2-4i', sku: 'HK-2CD2T46-074', brand: 'Hikvision', brandSlug: 'hikvision', category: 'Security', categorySlug: 'security',
    description: 'The Hikvision DS-2CD2T46G2-4I is a 4MP AcuSense bullet camera with 80m IR, WDR, and smart detection for humans and vehicles. IP67 rated for outdoor use.', shortDescription: '4MP AcuSense bullet camera with 80m IR, human/vehicle detection.',
    images: ['https://images.pexels.com/photos/96612/pexels-photo-96612.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Resolution': '4MP (2688 x 1520)', 'Lens': '2.8mm', 'IR': '80m', 'WDR': '120dB', 'Detection': 'Human / Vehicle', 'Protection': 'IP67', 'Protocol': 'H.265+ / H.264+' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-75', 'p-76', 'p-77'], tags: ['hikvision', 'acuSense', 'bullet', '4mp', 'outdoor', 'ai-detection']
  },
  {
    id: 'p-75', name: 'Dahua IPC-HFW5442E-SE', slug: 'dahua-ipc-hfw5442e-se', sku: 'DH-HFW5442-075', brand: 'Dahua', brandSlug: 'dahua', category: 'Security', categorySlug: 'security',
    description: 'The Dahua IPC-HFW5442E-SE is a 4MP WizMind bullet camera with AI-powered perimeter protection, 50m IR, and face detection. Starlight technology for low-light performance.', shortDescription: '4MP WizMind bullet camera with AI perimeter protection, face detection.',
    images: ['https://images.pexels.com/photos/96612/pexels-photo-96612.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Resolution': '4MP (2688 x 1520)', 'Lens': '2.8mm', 'IR': '50m', 'WDR': '140dB', 'AI': 'Perimeter protection, face detection', 'Low Light': 'Starlight', 'Protection': 'IP67' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: false, isBestSeller: false,
    relatedProducts: ['p-74', 'p-76', 'p-77'], tags: ['dahua', 'wizmind', 'ai', 'starlight', 'bullet', 'perimeter']
  },
  {
    id: 'p-76', name: 'Hikvision DS-7616NI-K2 NVR', slug: 'hikvision-ds-7616ni-k2-nvr', sku: 'HK-7616NI-076', brand: 'Hikvision', brandSlug: 'hikvision', category: 'Security', categorySlug: 'security',
    description: 'The Hikvision DS-7616NI-K2 is a 16-channel 4K NVR with H.265+ decoding, 2 SATA interfaces, and up to 12MP recording. Supports up to 160 Mbps incoming bandwidth.', shortDescription: '16-channel 4K NVR with H.265+, 2 SATA, 160 Mbps bandwidth.',
    images: ['https://images.pexels.com/photos/96612/pexels-photo-96612.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Channels': '16', 'Resolution': 'Up to 12MP', 'Decoding': 'H.265+ / H.264+', 'Storage': '2x SATA (up to 8TB each)', 'Bandwidth': '160 Mbps incoming', 'Output': '4K HDMI', 'Network': '1x Gigabit' },
    price: null, availability: 'in-stock', isFeatured: true, isNew: false, isBestSeller: true,
    relatedProducts: ['p-74', 'p-75', 'p-77'], tags: ['hikvision', 'nvr', '16-channel', '4k', 'h265', 'surveillance']
  },
  {
    id: 'p-77', name: 'Dahua DHI-NVR5216-16P-I', slug: 'dahua-dhi-nvr5216-16p-i', sku: 'DH-NVR5216-077', brand: 'Dahua', brandSlug: 'dahua', category: 'Security', categorySlug: 'security',
    description: 'The Dahua DHI-NVR5216-16P-I is a 16-channel AI NVR with 16 PoE ports, 4K display, and built-in AI for face recognition and perimeter protection. Supports WizSense cameras.', shortDescription: '16-channel AI NVR with 16 PoE ports, face recognition, 4K.',
    images: ['https://images.pexels.com/photos/96612/pexels-photo-96612.jpeg?auto=compress&cs=tinysrgb&w=800'],
    specifications: { 'Channels': '16', 'PoE': '16 ports', 'Resolution': 'Up to 12MP', 'AI': 'Face recognition, perimeter', 'Storage': '2x SATA', 'Output': '4K HDMI', 'Network': '2x Gigabit' },
    price: null, availability: 'in-stock', isFeatured: false, isNew: true, isBestSeller: false,
    relatedProducts: ['p-74', 'p-75', 'p-76'], tags: ['dahua', 'nvr', 'ai', 'poe', 'face-recognition', 'wizsense']
  },
];

export const getProductBySlug = (slug: string): Product | undefined =>
  products.find((p) => p.slug === slug);

export const getProductsByCategory = (categorySlug: string): Product[] =>
  products.filter((p) => p.categorySlug === categorySlug);

export const getProductsByBrand = (brandSlug: string): Product[] =>
  products.filter((p) => p.brandSlug === brandSlug);

export const getFeaturedProducts = (): Product[] =>
  products.filter((p) => p.isFeatured);

export const getNewArrivals = (): Product[] =>
  products.filter((p) => p.isNew);

export const getBestSellers = (): Product[] =>
  products.filter((p) => p.isBestSeller);

export const searchProducts = (query: string): Product[] => {
  const q = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.tags.some((t) => t.includes(q)) ||
      p.sku.toLowerCase().includes(q)
  );
};

export const getRelatedProducts = (product: Product): Product[] => {
  const related = products.filter(
    (p) =>
      p.id !== product.id &&
      (product.relatedProducts.includes(p.id) ||
        p.categorySlug === product.categorySlug ||
        p.brandSlug === product.brandSlug)
  );
  return related.slice(0, 4);
};
