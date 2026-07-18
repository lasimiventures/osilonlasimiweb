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
import { BulkQuote } from '../pages/BulkQuote';
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
import { AdminBanners } from '../pages/admin/Banners';
import { AdminBannerForm } from '../pages/admin/BannerForm';
import { AdminCustomers } from '../pages/admin/Customers';
import { AdminCustomerDetail } from '../pages/admin/CustomerDetail';
import { AdminRFQs } from '../pages/admin/RFQs';
import { AdminRFQDetail } from '../pages/admin/RFQDetail';
import { AdminCRM } from '../pages/admin/CRM';
import { AdminInventory } from '../pages/admin/Inventory';
import { AdminWarehouses } from '../pages/admin/Warehouses';
import { AdminWarehouseForm } from '../pages/admin/WarehouseForm';
import { AdminStockTransfers } from '../pages/admin/StockTransfers';
import { AdminSuppliers } from '../pages/admin/Suppliers';
import { AdminSupplierForm } from '../pages/admin/SupplierForm';
import { AdminProcurement } from '../pages/admin/Procurement';
import { AdminPurchaseOrderForm } from '../pages/admin/PurchaseOrderForm';
import { AdminPurchaseOrderDetail } from '../pages/admin/PurchaseOrderDetail';
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
        <Route path="/bulk-quote" element={<BulkQuote />} />
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
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/warehouses" element={<AdminWarehouses />} />
          <Route path="/admin/warehouses/new" element={<AdminWarehouseForm />} />
          <Route path="/admin/warehouses/:id/edit" element={<AdminWarehouseForm />} />
          <Route path="/admin/transfers" element={<AdminStockTransfers />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/categories/new" element={<AdminCategoryForm />} />
          <Route path="/admin/categories/:id/edit" element={<AdminCategoryForm />} />
          <Route path="/admin/brands" element={<AdminBrands />} />
          <Route path="/admin/brands/new" element={<AdminBrandForm />} />
          <Route path="/admin/brands/:id/edit" element={<AdminBrandForm />} />
          <Route path="/admin/media" element={<AdminMedia />} />
          <Route path="/admin/quotes" element={<AdminQuotes />} />
          <Route path="/admin/quotes/:id/build" element={<AdminQuoteBuilder />} />
          <Route path="/admin/banners" element={<AdminBanners />} />
          <Route path="/admin/banners/new" element={<AdminBannerForm />} />
          <Route path="/admin/banners/:id/edit" element={<AdminBannerForm />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/customers/:email" element={<AdminCustomerDetail />} />
          <Route path="/admin/rfqs" element={<AdminRFQs />} />
          <Route path="/admin/rfqs/:id" element={<AdminRFQDetail />} />
          <Route path="/admin/crm" element={<AdminCRM />} />
          <Route path="/admin/suppliers" element={<AdminSuppliers />} />
          <Route path="/admin/suppliers/new" element={<AdminSupplierForm />} />
          <Route path="/admin/suppliers/:id/edit" element={<AdminSupplierForm />} />
          <Route path="/admin/procurement" element={<AdminProcurement />} />
          <Route path="/admin/procurement/new" element={<AdminPurchaseOrderForm />} />
          <Route path="/admin/procurement/:id" element={<AdminPurchaseOrderDetail />} />
          <Route path="/admin/procurement/:id/edit" element={<AdminPurchaseOrderForm />} />
          <Route path="/admin/*" element={<AdminNotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
