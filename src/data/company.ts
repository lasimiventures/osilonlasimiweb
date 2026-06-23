import type { TeamMember, CompanyStat, ClientLogo, Industry } from '../types';

export const companyStats: CompanyStat[] = [
  { id: 'stat-1', label: 'Years of Experience', value: '15', suffix: '+' },
  { id: 'stat-2', label: 'Products Delivered', value: '50000', suffix: '+' },
  { id: 'stat-3', label: 'Enterprise Clients', value: '1200', suffix: '+' },
  { id: 'stat-4', label: 'Brand Partners', value: '50', suffix: '+' },
  { id: 'stat-5', label: 'Technical Certifications', value: '200', suffix: '+' },
  { id: 'stat-6', label: 'Countries Served', value: '8', suffix: '' },
];

export const teamMembers: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'John Omondi',
    role: 'Chief Executive Officer',
    bio: 'John founded OSIL in 2009 with a vision to bring world-class technology to East African businesses. With over 20 years in IT distribution, he has built OSIL into a leading ICT solutions provider.',
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=400',
    linkedin: 'https://linkedin.com',
    email: 'john.omondi@osilltd.co.ke',
  },
  {
    id: 'tm-2',
    name: 'Wanjiku Muriuki',
    role: 'Chief Technology Officer',
    bio: 'Wanjiku leads OSIL\'s technical strategy and solution architecture. She holds certifications from Cisco, Microsoft, and AWS, and drives the company\'s cloud and cybersecurity practice.',
    image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=400',
    linkedin: 'https://linkedin.com',
    email: 'wanjiku@osilltd.co.ke',
  },
  {
    id: 'tm-3',
    name: 'David Njoroge',
    role: 'Head of Sales',
    bio: 'David manages OSIL\'s sales organization across B2B and B2C channels. He has deep expertise in enterprise procurement, government tenders, and retail distribution.',
    image: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=400',
    linkedin: 'https://linkedin.com',
    email: 'david@osilltd.co.ke',
  },
  {
    id: 'tm-4',
    name: 'Grace Achieng',
    role: 'Head of Operations',
    bio: 'Grace oversees logistics, warehousing, and service delivery. Her operational excellence ensures that products reach customers on time and support tickets are resolved quickly.',
    image: 'https://images.pexels.com/photos/1181695/pexels-photo-1181695.jpeg?auto=compress&cs=tinysrgb&w=400',
    linkedin: 'https://linkedin.com',
    email: 'grace@osilltd.co.ke',
  },
];

export const clientLogos: ClientLogo[] = [
  { id: 'cl-1', name: 'Kenya Commercial Bank', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200', industry: 'Banking' },
  { id: 'cl-2', name: 'Safaricom', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200', industry: 'Telecom' },
  { id: 'cl-3', name: 'Nairobi University', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200', industry: 'Education' },
  { id: 'cl-4', name: 'UNICEF Kenya', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200', industry: 'NGO' },
  { id: 'cl-5', name: 'Ministry of Health', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200', industry: 'Government' },
  { id: 'cl-6', name: 'East African Breweries', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200', industry: 'Manufacturing' },
  { id: 'cl-7', name: 'Kenyatta National Hospital', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200', industry: 'Healthcare' },
  { id: 'cl-8', name: 'World Vision', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200', industry: 'NGO' },
  { id: 'cl-9', name: 'Equity Bank', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200', industry: 'Banking' },
  { id: 'cl-10', name: 'Strathmore University', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200', industry: 'Education' },
];

export const industries: Industry[] = [
  { id: 'ind-1', name: 'Banking & Finance', icon: 'Landmark', description: 'Secure IT infrastructure for financial institutions' },
  { id: 'ind-2', name: 'Education', icon: 'GraduationCap', description: 'Technology solutions for schools and universities' },
  { id: 'ind-3', name: 'Healthcare', icon: 'Heart', description: 'Reliable systems for hospitals and clinics' },
  { id: 'ind-4', name: 'Government', icon: 'Building2', description: 'Compliant solutions for public institutions' },
  { id: 'ind-5', name: 'Manufacturing', icon: 'Factory', description: 'Industrial-grade technology and automation' },
  { id: 'ind-6', name: 'Telecommunications', icon: 'Radio', description: 'Network and communication infrastructure' },
  { id: 'ind-7', name: 'NGOs & Non-Profits', icon: 'Globe', description: 'Cost-effective tech for humanitarian organizations' },
  { id: 'ind-8', name: 'Retail & E-commerce', icon: 'Store', description: 'POS systems and digital retail solutions' },
  { id: 'ind-9', name: 'Hospitality', icon: 'Coffee', description: 'Guest-facing technology and back-office systems' },
  { id: 'ind-10', name: 'Real Estate', icon: 'Home', description: 'Smart building and property management tech' },
  { id: 'ind-11', name: 'Transportation', icon: 'Truck', description: 'Fleet management and logistics technology' },
  { id: 'ind-12', name: 'Energy', icon: 'Zap', description: 'Power and utility infrastructure solutions' },
];

export const techPartners: { id: string; name: string; logo: string }[] = [
  { id: 'tp-1', name: 'Dell', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200' },
  { id: 'tp-2', name: 'HP', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200' },
  { id: 'tp-3', name: 'Lenovo', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200' },
  { id: 'tp-4', name: 'Cisco', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200' },
  { id: 'tp-5', name: 'Microsoft', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200' },
  { id: 'tp-6', name: 'Samsung', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200' },
  { id: 'tp-7', name: 'Apple', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200' },
  { id: 'tp-8', name: 'Fortinet', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200' },
  { id: 'tp-9', name: 'Hikvision', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200' },
  { id: 'tp-10', name: 'Epson', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200' },
  { id: 'tp-11', name: 'Logitech', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200' },
  { id: 'tp-12', name: 'APC', logo: 'https://images.pexels.com/photos/164501/pexels-photo-164501.jpeg?auto=compress&cs=tinysrgb&w=200' },
];
