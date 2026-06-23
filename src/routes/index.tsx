import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { Home } from '../pages/Home';
import { About } from '../pages/About';
import { Products } from '../pages/Products';
import { ProductDetail } from '../pages/ProductDetail';
import { CategoryPage } from '../pages/CategoryPage';
import { BrandPage } from '../pages/BrandPage';
import { Brands } from '../pages/Brands';
import { Services } from '../pages/Services';
import { Solutions } from '../pages/Solutions';
import { Contact } from '../pages/Contact';
import { QuoteCart } from '../pages/QuoteCart';
import { RequestQuote } from '../pages/RequestQuote';
import { PrivacyPolicy } from '../pages/PrivacyPolicy';
import { TermsConditions } from '../pages/TermsConditions';
import { NotFound } from '../pages/NotFound';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/brand/:slug" element={<BrandPage />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/services" element={<Services />} />
        <Route path="/solutions" element={<Solutions />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/quote-cart" element={<QuoteCart />} />
        <Route path="/request-quote" element={<RequestQuote />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsConditions />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
