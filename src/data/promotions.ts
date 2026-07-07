import type { Promotion } from '../types';

export const promotions: Promotion[] = [
  {
    id: 'promo-1',
    title: 'Business Laptop Bundles',
    subtitle: 'Dell Latitude, HP EliteBook & Lenovo ThinkPad for your team. Volume pricing from 5 units.',
    badge: 'Volume Deals',
    ctaLabel: 'Shop Laptops',
    ctaPath: '/category/laptops',
    image: 'https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800',
    highlight: 'From 5 Units',
  },
  {
    id: 'promo-2',
    title: 'Enterprise Networking',
    subtitle: 'Complete your office with Cisco switches, routers & UniFi wireless access points.',
    badge: 'Enterprise Ready',
    ctaLabel: 'View Networking',
    ctaPath: '/category/networking',
    image: 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=800',
    highlight: 'Cisco Authorized',
  },
  {
    id: 'promo-3',
    title: 'Security Camera Systems',
    subtitle: 'Hikvision & Dahua CCTV — full supply and professional installation in Nairobi.',
    badge: 'New Arrivals',
    ctaLabel: 'View Security',
    ctaPath: '/category/security',
    image: 'https://images.pexels.com/photos/96612/pexels-photo-96612.jpeg?auto=compress&cs=tinysrgb&w=800',
    highlight: 'Installed & Configured',
  },
];
