import { BrowserRouter } from 'react-router-dom';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppRoutes } from './routes';
import { QuoteProvider } from './context/QuoteContext';
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
      <QuoteProvider>
        <PageTracker />
        <AppRoutes />
      </QuoteProvider>
    </BrowserRouter>
  );
}

export default App;
