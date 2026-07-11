import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppRoutes } from './routes';
import { QuoteProvider } from './context/QuoteContext';
import { RecentlyViewedProvider } from './context/RecentlyViewedContext';
import { CompareProvider } from './context/CompareContext';
import { CatalogProvider } from './context/CatalogContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ShoppingCartProvider } from './context/ShoppingCartContext';
import { trackPageView, trackEvent } from './utils/analytics';

function PageTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView();
    trackEvent({ event_name: 'page_view', event_category: 'navigation' });
  }, [location.pathname]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <CatalogProvider>
          <ShoppingCartProvider>
            <QuoteProvider>
              <RecentlyViewedProvider>
                <CompareProvider>
                  <PageTracker />
                  <AppRoutes />
                </CompareProvider>
              </RecentlyViewedProvider>
            </QuoteProvider>
          </ShoppingCartProvider>
        </CatalogProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
