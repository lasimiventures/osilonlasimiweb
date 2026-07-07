import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FAQ } from '../types';

interface FAQAccordionProps {
  faqs: FAQ[];
  title?: string;
}

export function FAQAccordion({ faqs, title = 'Frequently Asked Questions' }: FAQAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => setOpenId(prev => (prev === id ? null : id));

  return (
    <div>
      {title && (
        <h2 className="text-xl font-bold text-slate-900 mb-5">{title}</h2>
      )}
      <div className="space-y-2">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div
              key={faq.id}
              className={`border rounded-xl overflow-hidden transition-colors duration-200 ${isOpen ? 'border-blue-200 bg-blue-50/30' : 'border-slate-100 bg-white'}`}
            >
              <button
                onClick={() => toggle(faq.id)}
                className="w-full flex items-start justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50/80 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-semibold text-slate-900 leading-snug pr-2">{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 mt-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-500' : ''}`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
