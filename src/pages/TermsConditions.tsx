import { SEO } from '../components/SEO';

export function TermsConditions() {
  return (
    <>
      <SEO meta={{
        title: 'Terms & Conditions | OSIL Ltd',
        description: 'OSIL Ltd terms and conditions of use, sale, and service.',
      }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Terms & Conditions</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 leading-relaxed mb-4">These Terms and Conditions ("Terms") govern your access to and use of the OSIL Ltd website and services. By accessing or using our website, you agree to be bound by these Terms. If you do not agree, please do not use our services.</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">1. General</h2>
          <p className="text-slate-600 leading-relaxed mb-4">OSIL Ltd reserves the right to modify these Terms at any time without prior notice. Changes will be effective immediately upon posting. Your continued use of the website constitutes acceptance of the updated Terms.</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">2. Quotations and Pricing</h2>
          <p className="text-slate-600 leading-relaxed mb-4">All quotations provided through our website are subject to availability and valid for a specified period. Prices are subject to change without notice. Quotations do not constitute a binding contract until confirmed by both parties in writing.</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">3. Orders and Payment</h2>
          <p className="text-slate-600 leading-relaxed mb-4">Orders are subject to acceptance and confirmation by OSIL Ltd. Payment terms will be specified in the quotation or invoice. We accept bank transfers, mobile money, and corporate purchase orders for approved clients. All prices are quoted in Kenyan Shillings unless otherwise stated.</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">4. Delivery and Returns</h2>
          <p className="text-slate-600 leading-relaxed mb-4">Delivery times are estimates and not guaranteed. Risk of loss passes to the buyer upon delivery. Returns are accepted only for defective products within the warranty period and subject to the manufacturer's return policy. Custom orders and software licenses are non-returnable.</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">5. Warranties</h2>
          <p className="text-slate-600 leading-relaxed mb-4">Products are covered by the manufacturer's warranty. OSIL Ltd does not provide additional warranties beyond those offered by the manufacturer unless explicitly stated. Services are provided with the warranties and service level agreements specified in the contract.</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">6. Limitation of Liability</h2>
          <p className="text-slate-600 leading-relaxed mb-4">OSIL Ltd shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services. Our total liability shall not exceed the amount paid for the specific product or service giving rise to the claim.</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">7. Governing Law</h2>
          <p className="text-slate-600 leading-relaxed">These Terms shall be governed by and construed in accordance with the laws of the Republic of Kenya. Any disputes arising shall be subject to the exclusive jurisdiction of the courts of Kenya.</p>
        </div>
      </div>
    </>
  );
}
