import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Facebook, Linkedin, Instagram, ArrowRight } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { services } from '../data/services';

export function Footer() {
  const { categories } = useCatalog();
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <img src="/Osil_Logo.jpg" alt="OSIL Ltd" className="h-10 w-auto" />
              <span className="text-xl font-bold text-white tracking-tight">OSIL Ltd</span>
            </Link>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              OSIL Ltd is a leading ICT solutions provider in Kenya, delivering technology products, services, and solutions to enterprises, governments, and consumers.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                <span>1st Floor, Jethalal Chambers, Tubman Rd, Suite 103, Nairobi, Kenya</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                <span>+254 795 030 476</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                <span>info@osilltd.co.ke</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                <span>osilltd@gmail.com</span>
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

          {/* Quick Links & Social */}
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
              <a href="https://www.facebook.com/osilltd" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/osilltd" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-pink-600 hover:text-white transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://ke.linkedin.com/company/osil-limited-ke" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-700 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://wa.me/254795030476" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-green-500 hover:text-white transition-colors" aria-label="WhatsApp">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
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
