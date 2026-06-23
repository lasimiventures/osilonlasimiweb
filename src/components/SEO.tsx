import { useEffect } from 'react';
import type { SeoMeta } from '../types';

interface SEOProps {
  meta: SeoMeta;
}

export function SEO({ meta }: SEOProps) {
  useEffect(() => {
    document.title = meta.title;
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', meta.description);
    } else {
      const metaEl = document.createElement('meta');
      metaEl.name = 'description';
      metaEl.content = meta.description;
      document.head.appendChild(metaEl);
    }
    if (meta.keywords) {
      const keywordsMeta = document.querySelector('meta[name="keywords"]');
      if (keywordsMeta) {
        keywordsMeta.setAttribute('content', meta.keywords.join(', '));
      } else {
        const metaEl = document.createElement('meta');
        metaEl.name = 'keywords';
        metaEl.content = meta.keywords.join(', ');
        document.head.appendChild(metaEl);
      }
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', meta.title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', meta.description);
    if (meta.ogImage) {
      const ogImg = document.querySelector('meta[property="og:image"]');
      if (ogImg) ogImg.setAttribute('content', meta.ogImage);
    }
    const ogType = document.querySelector('meta[property="og:type"]');
    if (ogType) ogType.setAttribute('content', meta.ogType || 'website');
  }, [meta]);

  return null;
}
