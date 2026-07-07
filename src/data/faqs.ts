import type { FAQ } from '../types';

export const faqs: FAQ[] = [
  // Products & Warranty
  {
    id: 'faq-p1',
    question: 'Are all products sold by OSIL Ltd genuine?',
    answer: 'Yes. OSIL Ltd is an authorized dealer for every brand we carry — including Dell, HP, Lenovo, Cisco, Samsung, Apple, Hikvision, and more. Every product ships with an official manufacturer warranty card and an OSIL Ltd purchase receipt. We do not stock grey-market, refurbished (unless clearly stated), or counterfeit goods.',
    category: 'products',
  },
  {
    id: 'faq-p2',
    question: 'What warranty do products carry?',
    answer: 'All products carry the manufacturer\'s official warranty honored in Kenya — typically 1 year for consumer electronics, and 1–3 years for business and enterprise equipment. OSIL Ltd\'s in-house technical team facilitates warranty claims and repairs, so you deal with us directly rather than an overseas support line.',
    category: 'warranty',
  },
  {
    id: 'faq-p3',
    question: 'Can I order a product not listed on the website?',
    answer: 'Absolutely. Our online catalogue is a curated selection. We can procure virtually any ICT product through our authorized supply chain — simply share the model, part number, or specification and our team will confirm availability and pricing within 24 business hours.',
    category: 'products',
  },
  {
    id: 'faq-p4',
    question: 'Do you offer trade-in for old equipment?',
    answer: 'Yes. We run a device refresh programme where our technicians assess your existing equipment and apply a trade-in credit toward new purchases. This is particularly popular with corporate clients upgrading a laptop fleet or replacing ageing server infrastructure. Contact sales for a trade-in assessment.',
    category: 'products',
  },
  {
    id: 'faq-p5',
    question: 'Can I see or test a product before buying?',
    answer: 'Yes. You are welcome to visit our showroom at 1st Floor, Jethalal Chambers, Tubman Road, Suite 103, Nairobi. We have demonstration units for popular laptops, phones, printers, and networking equipment. Please call ahead on +254 795 030 476 to confirm availability of the specific model you want to view.',
    category: 'products',
  },

  // Quotations & Ordering
  {
    id: 'faq-q1',
    question: 'How do I request a quotation?',
    answer: 'Add the products you need to your Quote Cart using the "Add to Quote" button on any product page, then click "Request Quote". Complete the short form with your name, company, and contact details. Our sales team will email a formal quotation — itemised with pricing, VAT, and any delivery costs — within 4–8 business hours.',
    category: 'quotations',
  },
  {
    id: 'faq-q2',
    question: 'How long is a quotation valid?',
    answer: 'Standard quotations are valid for 14 calendar days from the issue date. ICT product pricing in Kenya can shift due to forex fluctuations, so we recommend confirming your order within that window to secure the quoted price.',
    category: 'quotations',
  },
  {
    id: 'faq-q3',
    question: 'Can I get a discount for bulk orders?',
    answer: 'Yes. We offer structured volume discounts for orders of 5 units and above on most product lines, and project pricing for large-scale infrastructure deployments. Use the "Request Bulk Pricing" button on any product page, or contact our enterprise sales team directly to discuss your requirements.',
    category: 'quotations',
  },
  {
    id: 'faq-q4',
    question: 'What payment methods do you accept?',
    answer: 'We accept M-Pesa (Paybill), bank transfer (RTGS/EFT to our KCB or Equity account), bank cheque, and corporate LPO for pre-approved accounts. Card payments can be processed in person at our Nairobi office. We do not currently support online card payments.',
    category: 'quotations',
  },
  {
    id: 'faq-q5',
    question: 'Is asset financing or leasing available?',
    answer: 'Yes. In partnership with select Kenyan financial institutions, we offer asset financing and operating lease options for qualifying business customers. This is especially suited to large server, workstation, or network infrastructure rollouts. Ask our sales team for a financing illustration.',
    category: 'quotations',
  },

  // Services
  {
    id: 'faq-s1',
    question: 'Do you offer on-site installation and setup?',
    answer: 'Yes. Hardware sales can be paired with professional on-site delivery, installation, configuration, and user induction. This is available across Nairobi and major towns throughout Kenya. Installation costs are quoted separately based on scope and location.',
    category: 'services',
  },
  {
    id: 'faq-s2',
    question: 'What does a managed IT services contract cover?',
    answer: 'Our managed IT packages include 24/7 remote monitoring, a dedicated help desk (phone, email, and remote desktop), proactive patch and update management, antivirus management, monthly health reports, and at least one on-site preventive maintenance visit per quarter. SLAs are tailored per contract.',
    category: 'services',
  },
  {
    id: 'faq-s3',
    question: 'Can you migrate our business to Microsoft 365 or Azure?',
    answer: 'Yes. Our cloud practice covers Microsoft 365, Azure, and hybrid deployments. We handle the full lifecycle: readiness assessment, migration planning, data migration, user account setup, training, and post-migration hypercare support. We are a Microsoft Cloud Solutions Partner.',
    category: 'services',
  },

  // Delivery
  {
    id: 'faq-d1',
    question: 'How long does delivery take?',
    answer: 'In-stock items are typically delivered within 1–3 business days within Nairobi and 3–7 business days to other Kenyan counties. Special-procurement items (ordered from manufacturer) may take 2–4 weeks. We\'ll confirm an estimated delivery date in your quotation.',
    category: 'delivery',
  },
  {
    id: 'faq-d2',
    question: 'Do you deliver outside Nairobi?',
    answer: 'Yes. We deliver to all 47 Kenyan counties via trusted courier partners. For bulky or high-value items — such as servers, UPS systems, or printers — we can arrange supervised delivery and on-site installation by our field engineers.',
    category: 'delivery',
  },
];

export const productFaqs = faqs.filter(f => ['products', 'warranty', 'delivery'].includes(f.category));
export const serviceFaqs = faqs.filter(f => ['services', 'delivery'].includes(f.category));
export const quotationFaqs = faqs.filter(f => ['quotations', 'delivery'].includes(f.category));
