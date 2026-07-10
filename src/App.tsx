import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppRoutes } from './routes';
import { QuoteProvider } from './context/QuoteContext';
import { RecentlyViewedProvider } from './context/RecentlyViewedContext';
import { CompareProvider } from './context/CompareContext';
import { CatalogProvider } from './context/CatalogContext';
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
      <CatalogProvider>
      <QuoteProvider>
        <RecentlyViewedProvider>
          <CompareProvider>
            <PageTracker />
            <AppRoutes />
          </CompareProvider>
        </RecentlyViewedProvider>
      </QuoteProvider>
      </CatalogProvider>
    </BrowserRouter>
  );
}

export default App;
