import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminRoute } from '../components/admin/AdminRoute';
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
import { ShoppingCart } from '../pages/ShoppingCart';
import { Checkout } from '../pages/Checkout';
import { OrderConfirmation } from '../pages/OrderConfirmation';
import { PrivacyPolicy } from '../pages/PrivacyPolicy';
import { TermsConditions } from '../pages/TermsConditions';
import { NotFound } from '../pages/NotFound';
import { AdminLogin } from '../pages/admin/Login';
import { AdminDashboard } from '../pages/admin/Dashboard';
import { AdminOrders } from '../pages/admin/Orders';
import { AdminProducts } from '../pages/admin/Products';
import { AdminProductForm } from '../pages/admin/ProductForm';
import { AdminCategories } from '../pages/admin/Categories';
import { AdminCategoryForm } from '../pages/admin/CategoryForm';
import { AdminBrands } from '../pages/admin/Brands';
import { AdminBrandForm } from '../pages/admin/BrandForm';
import { AdminMedia } from '../pages/admin/Media';
import { AdminQuotes } from '../pages/admin/Quotes';
import { AdminQuoteBuilder } from '../pages/admin/QuoteBuilder';
import { AdminNotFound } from '../pages/admin/NotFound';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public storefront */}
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
        <Route path="/cart" element={<ShoppingCart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmation />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsConditions />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin — unauthenticated */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Admin — authenticated */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<AdminProductForm />} />
          <Route path="/admin/products/:id/edit" element={<AdminProductForm />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/categories/new" element={<AdminCategoryForm />} />
          <Route path="/admin/categories/:id/edit" element={<AdminCategoryForm />} />
          <Route path="/admin/brands" element={<AdminBrands />} />
          <Route path="/admin/brands/new" element={<AdminBrandForm />} />
          <Route path="/admin/brands/:id/edit" element={<AdminBrandForm />} />
          <Route path="/admin/media" element={<AdminMedia />} />
          <Route path="/admin/quotes" element={<AdminQuotes />} />
          <Route path="/admin/quotes/:id/build" element={<AdminQuoteBuilder />} />
          {/* Further admin routes added in later milestones */}
          <Route path="/admin/*" element={<AdminNotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
