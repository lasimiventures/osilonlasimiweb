import { SEO } from '../components/SEO';

export function PrivacyPolicy() {
  return (
    <>
      <SEO meta={{
        title: 'Privacy Policy | OSIL Ltd Kenya',
        description: 'OSIL Ltd privacy policy. Learn how we collect, use, and protect your personal information.',
      }} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-slate-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 leading-relaxed mb-4">OSIL Ltd ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">1. Information We Collect</h2>
          <p className="text-slate-600 leading-relaxed mb-4">We may collect personal information that you voluntarily provide to us, including but not limited to your name, email address, phone number, company name, and billing information. We also collect information automatically through cookies and similar technologies, such as IP address, browser type, and browsing behavior.</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">2. How We Use Your Information</h2>
          <p className="text-slate-600 leading-relaxed mb-4">We use your information to provide and improve our services, process transactions, respond to inquiries, send marketing communications (with your consent), and comply with legal obligations. We may also use aggregated data for analytics and business intelligence purposes.</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">3. Information Sharing</h2>
          <p className="text-slate-600 leading-relaxed mb-4">We do not sell your personal information to third parties. We may share information with trusted service providers who assist us in operating our business, provided they agree to keep this information confidential. We may also disclose information when required by law or to protect our rights.</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">4. Data Security</h2>
          <p className="text-slate-600 leading-relaxed mb-4">We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">5. Your Rights</h2>
          <p className="text-slate-600 leading-relaxed mb-4">You have the right to access, correct, or delete your personal information. You may also object to or restrict certain processing activities. To exercise these rights, please contact us at info@osilltd.co.ke.</p>
          <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-3">6. Contact Us</h2>
          <p className="text-slate-600 leading-relaxed">If you have any questions about this Privacy Policy, please contact us at info@osilltd.co.ke or by phone at +254 795 030 476.</p>
        </div>
      </div>
    </>
  );
}
