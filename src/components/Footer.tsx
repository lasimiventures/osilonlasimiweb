import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Twitter, Linkedin, Instagram, Youtube, ArrowRight } from 'lucide-react';
import { categories } from '../data/categories';
import { services } from '../data/services';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">O</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">OSIL Ltd</span>
            </Link>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              OSIL Ltd is a leading ICT solutions provider in East Africa, delivering technology products, services, and solutions to enterprises, governments, and consumers.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                <span>Ring Road, Westlands, Nairobi, Kenya</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                <span>+254 795 030 476</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                <span>info@osilltd.co.ke</span>
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Products</h3>
            <ul className="space-y-2">
              {categories.slice(0, 7).map((cat) => (
                <li key={cat.id}>
                  <Link to={`/category/${cat.slug}`} className="text-sm text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" /> {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/products" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                  View All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Services</h3>
            <ul className="space-y-2">
              {services.slice(0, 6).map((svc) => (
                <li key={svc.id}>
                  <Link to="/services" className="text-sm text-slate-400 hover:text-blue-400 transition-colors flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" /> {svc.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/services" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                  View All Services
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links & Newsletter */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2 mb-6">
              <li><Link to="/about" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link to="/solutions" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">Solutions</Link></li>
              <li><Link to="/brands" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">Brands</Link></li>
              <li><Link to="/contact" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">Contact Us</Link></li>
              <li><Link to="/request-quote" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">Request a Quote</Link></li>
              <li><Link to="/privacy-policy" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-and-conditions" className="text-sm text-slate-400 hover:text-blue-400 transition-colors">Terms & Conditions</Link></li>
            </ul>

            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">Follow Us</h3>
            <div className="flex items-center gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-colors" aria-label="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} OSIL Ltd. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link to="/privacy-policy" className="hover:text-slate-300 transition-colors">Privacy</Link>
            <Link to="/terms-and-conditions" className="hover:text-slate-300 transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-slate-300 transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
