import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface AnalyticsConfig {
  googleAnalyticsId?: string;
  googleTagManagerId?: string;
  clarityProjectId?: string;
  metaPixelId?: string;
}

interface PageViewEvent {
  page_path: string;
  page_title: string;
  page_location: string;
}

interface CustomEvent {
  event_name: string;
  event_category?: string;
  event_label?: string;
  value?: number;
  [key: string]: string | number | undefined;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    clarity?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    _clarity?: unknown[];
  }
}

const config: AnalyticsConfig = {
  googleAnalyticsId: undefined,
  googleTagManagerId: undefined,
  clarityProjectId: undefined,
  metaPixelId: undefined,
};

export function initAnalytics(analyticsConfig: AnalyticsConfig): void {
  Object.assign(config, analyticsConfig);

  if (config.googleAnalyticsId) {
    loadGoogleAnalytics(config.googleAnalyticsId);
  }

  if (config.clarityProjectId) {
    loadMicrosoftClarity(config.clarityProjectId);
  }

  if (config.metaPixelId) {
    loadMetaPixel(config.metaPixelId);
  }
}

function loadGoogleAnalytics(measurementId: string): void {
  if (typeof window === 'undefined') return;

  const script = document.createElement('script');
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.async = true;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
  });
}

function loadMicrosoftClarity(projectId: string): void {
  if (typeof window === 'undefined') return;

  window._clarity = window._clarity || [];
  const clarity = window.clarity || function (...args: unknown[]) {
    window._clarity?.push(args);
  };
  window.clarity = clarity;

  const script = document.createElement('script');
  script.src = `https://www.clarity.ms/tag/${projectId}`;
  script.async = true;
  document.head.appendChild(script);
}

function loadMetaPixel(pixelId: string): void {
  if (typeof window === 'undefined') return;

  window.fbq = function fbq(...args: unknown[]) {
    window.fbq?.callMethod ? window.fbq.callMethod(args) : (window.fbq as unknown[]).push(args);
  };
  (window.fbq as unknown[]) = (window.fbq as unknown[]) || [];
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');

  const script = document.createElement('script');
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  script.async = true;
  document.head.appendChild(script);
}

export function trackPageView(pageView?: Partial<PageViewEvent>): void {
  const pagePath = pageView?.page_path || window.location.pathname;
  const pageTitle = pageView?.page_title || document.title;
  const pageLocation = pageView?.page_location || window.location.href;

  if (window.gtag) {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
      page_location: pageLocation,
    });
  }

  if (window.fbq) {
    window.fbq('track', 'PageView');
  }
}

export function trackEvent(event: CustomEvent): void {
  if (window.gtag) {
    window.gtag('event', event.event_name, {
      event_category: event.event_category,
      event_label: event.event_label,
      value: event.value,
    });
  }
}

export function trackProductView(productId: string, productName: string, category: string, brand: string, price?: number): void {
  trackEvent({
    event_name: 'view_item',
    event_category: 'engagement',
    event_label: productName,
  });

  if (window.gtag) {
    window.gtag('event', 'view_item', {
      items: [{
        item_id: productId,
        item_name: productName,
        category,
        brand,
        price,
      }],
    });
  }
}

export function trackAddToQuote(productId: string, productName: string, category: string, brand: string, quantity: number, price?: number): void {
  trackEvent({
    event_name: 'add_to_cart',
    event_category: 'engagement',
    event_label: productName,
  });

  if (window.gtag) {
    window.gtag('event', 'add_to_cart', {
      items: [{
        item_id: productId,
        item_name: productName,
        category,
        brand,
        quantity,
        price,
      }],
    });
  }

  if (window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: [productId],
      content_name: productName,
      content_type: 'product',
    });
  }
}

export function trackQuoteRequest(totalItems: number, productIds: string[]): void {
  trackEvent({
    event_name: 'begin_checkout',
    event_category: 'engagement',
  });

  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      items: productIds.map(id => ({ item_id: id })),
    });
  }

  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      num_items: totalItems,
      content_ids: productIds,
    });
  }
}

export function trackContactForm(reason: string): void {
  trackEvent({
    event_name: 'generate_lead',
    event_category: 'engagement',
    event_label: reason,
  });

  if (window.fbq) {
    window.fbq('track', 'Lead');
  }
}

export function trackSearch(searchTerm: string, resultsCount?: number): void {
  trackEvent({
    event_name: 'search',
    event_category: 'engagement',
    event_label: searchTerm,
    value: resultsCount,
  });
}

export function usePageTracking(): void {
  const location = useLocation();

  useEffect(() => {
    trackPageView();
  }, [location.pathname]);
}

export function useAnalytics(): {
  trackPageView: typeof trackPageView;
  trackEvent: typeof trackEvent;
  trackProductView: typeof trackProductView;
  trackAddToQuote: typeof trackAddToQuote;
  trackQuoteRequest: typeof trackQuoteRequest;
  trackContactForm: typeof trackContactForm;
  trackSearch: typeof trackSearch;
} {
  return {
    trackPageView,
    trackEvent,
    trackProductView,
    trackAddToQuote,
    trackQuoteRequest,
    trackContactForm,
    trackSearch,
  };
}
