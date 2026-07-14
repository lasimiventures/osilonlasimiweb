import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';

// ─── public types ─────────────────────────────────────────────────────────────

export interface PdfQuoteItem {
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  discount_amount: number;
  is_optional: boolean;
  item_type: string;
  notes: string | null;
}

export interface PdfQuoteData {
  quote_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company: string | null;
  position: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  status: string;
  sales_person: string | null;
  expiry_date: string | null;
  submitted_at: string;
  notes: string | null;
  discount_pct: number;
  discount_amount: number;
  vat_pct: number;
  delivery_charge: number;
  installation_charge: number;
  warranty_charge: number;
  customer_notes: string | null;
  quote_items: PdfQuoteItem[];
}

// ─── constants ────────────────────────────────────────────────────────────────

const PAGE_W = 210;
const PAGE_H = 297;
const ML = 14; // left margin
const MR = 14; // right margin
const MT = 14; // top margin
const CW = PAGE_W - ML - MR; // 182mm content width

// Table column starts (absolute x from left)
const TC = {
  hash:  ML,          // width 7
  desc:  ML + 7,      // width 82
  qty:   ML + 89,     // width 12
  price: ML + 101,    // width 27
  disc:  ML + 128,    // width 22
  net:   ML + 150,    // width 32  (= PAGE_W - MR = 196)
};
// Widths: 7+82+12+27+22+32 = 182 = CW ✓

const COLORS = {
  blue800:  '#1e40af',
  blue700:  '#1d4ed8',
  blue600:  '#2563eb',
  blue50:   '#eff6ff',
  slate900: '#0f172a',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50:  '#f8fafc',
  white:    '#ffffff',
  red500:   '#ef4444',
  amber700: '#b45309',
  amber50:  '#fffbeb',
  green700: '#15803d',
  teal600:  '#0d9488',
};

const COMPANY = {
  name:    'OSIL Ltd',
  tagline: 'Professional Technology Solutions',
  address: '1st Floor, Jethalal Chambers, Tubman Rd, Suite 103, Nairobi',
  phone:   '+254 795 030 476',
  email:   'info@osilltd.co.ke',
  website: 'www.osilltd.co.ke',
  pin:     'P051234567X',
};

const DEFAULT_TERMS: Array<{ title: string; body: string }> = [
  {
    title: 'Payment Terms',
    body: 'Payment is due within 30 days of invoice date. A late-payment charge of 2% per month will apply to overdue balances. Bank transfer details will be provided with the invoice.',
  },
  {
    title: 'Delivery',
    body: 'Delivery lead times are indicative and subject to stock availability. OSIL Ltd will notify the customer promptly of any delays. Delivery charges are as quoted above unless otherwise agreed in writing.',
  },
  {
    title: 'Warranty',
    body: "All products carry the manufacturer's standard warranty unless an extended warranty is explicitly listed in this quotation. Warranty does not cover damage resulting from misuse, improper installation, power surges, or unauthorised modifications.",
  },
  {
    title: 'Validity & Pricing',
    body: 'This quotation is valid for 30 days from the date of issue unless an alternative validity period is stated above. Prices are subject to change upon expiry. Foreign-currency items may be re-priced on prevailing exchange rates at time of invoicing.',
  },
  {
    title: 'Returns & Cancellations',
    body: 'Returns are accepted within 14 days for undamaged, unopened items in original packaging. A 15% restocking fee may apply. Software licences, custom-configured equipment, and consumables are non-returnable.',
  },
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtKES(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function lineNet(i: PdfQuoteItem): number {
  const gross = (i.quantity ?? 0) * (i.unit_price ?? 0);
  const d = Math.max(0, Math.min(100, i.discount_pct ?? 0));
  return Math.max(0, gross - (d / 100 * gross) - (i.discount_amount ?? 0));
}

function statusColor(s: string): string {
  return ({
    draft: COLORS.slate500,
    submitted: '#d97706',
    under_review: COLORS.blue600,
    quoted: '#0284c7',
    awaiting_customer: '#ea580c',
    accepted: COLORS.green700,
    rejected: COLORS.red500,
    expired: COLORS.slate400,
    converted_to_order: COLORS.teal600,
  } as Record<string, string>)[s] ?? COLORS.slate500;
}

function statusLabel(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function loadImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise(resolve => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function makeQR(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 150, margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
    });
  } catch {
    return '';
  }
}

// ─── document helpers ─────────────────────────────────────────────────────────

function sf(doc: jsPDF, size: number, weight: 'normal' | 'bold' | 'italic' = 'normal', color = COLORS.slate900) {
  doc.setFont('helvetica', weight);
  doc.setFontSize(size);
  doc.setTextColor(color);
}

function fillRect(doc: jsPDF, x: number, y: number, w: number, h: number, fill: string, stroke?: string, lw = 0.3) {
  doc.setFillColor(fill);
  if (stroke) {
    doc.setDrawColor(stroke);
    doc.setLineWidth(lw);
    doc.rect(x, y, w, h, 'FD');
  } else {
    doc.rect(x, y, w, h, 'F');
  }
}

function hline(doc: jsPDF, y: number, color = COLORS.slate200, lw = 0.3, x1 = ML, x2 = PAGE_W - MR) {
  doc.setDrawColor(color);
  doc.setLineWidth(lw);
  doc.line(x1, y, x2, y);
}

// ─── main export ──────────────────────────────────────────────────────────────

export async function generateQuotePdf(quote: PdfQuoteData): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const [logoUrl, qrUrl] = await Promise.all([
    loadImage('/Osil_Logo.jpg'),
    makeQR(quote.quote_number),
  ]);

  // ── Compute pricing ──────────────────────────────────────
  const required = quote.quote_items.filter(i => !i.is_optional);
  const optional  = quote.quote_items.filter(i => i.is_optional);

  const reqNets = required.map(lineNet);
  const subtotal = reqNets.reduce((a, b) => a + b, 0);
  const lineDicsTotal = required.reduce((acc, i, idx) => {
    const gross = (i.quantity ?? 0) * (i.unit_price ?? 0);
    return acc + (gross - reqNets[idx]);
  }, 0);
  const quotePctDisc  = (quote.discount_pct  / 100) * subtotal;
  const totalQDisc    = quotePctDisc + (quote.discount_amount ?? 0);
  const discSubtotal  = Math.max(0, subtotal - totalQDisc);
  const charges       = (quote.delivery_charge ?? 0) + (quote.installation_charge ?? 0) + (quote.warranty_charge ?? 0);
  const preVat        = discSubtotal + charges;
  const vatAmt        = (quote.vat_pct / 100) * preVat;
  const grandTotal    = preVat + vatAmt;

  // ── Draw content ─────────────────────────────────────────
  let y = MT;

  y = drawHeader(doc, logoUrl, quote, y);
  y += 4;

  y = drawBillTo(doc, quote, y);
  y += 6;

  y = drawTable(doc, required, optional, y);
  y += 4;

  y = drawTotals(doc, {
    subtotal, lineDicsTotal, quotePctDisc,
    totalQDisc, discSubtotal, charges, preVat, vatAmt, grandTotal,
    delivery: quote.delivery_charge ?? 0,
    installation: quote.installation_charge ?? 0,
    warranty: quote.warranty_charge ?? 0,
    vatPct: quote.vat_pct,
    discPct: quote.discount_pct,
  }, y);
  y += 6;

  if (quote.customer_notes?.trim()) {
    y = ensureSpace(doc, y, 30);
    y = drawNotesBlock(doc, quote.customer_notes, y);
    y += 6;
  }

  y = ensureSpace(doc, y, 55);
  y = drawTerms(doc, y);
  y += 6;

  y = ensureSpace(doc, y, 52);
  drawSignature(doc, qrUrl, quote.quote_number, y);

  // ── Footers on all pages ──────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    drawFooter(doc, quote.quote_number, p, total);
  }

  doc.save(`Quote-${quote.quote_number}.pdf`);
}

// ─── header ───────────────────────────────────────────────────────────────────

function drawHeader(doc: jsPDF, logoUrl: string | null, quote: PdfQuoteData, y: number): number {
  // Blue header banner
  fillRect(doc, 0, 0, PAGE_W, 38, COLORS.blue800);

  // Logo — white background pill so it pops on the dark banner
  if (logoUrl) {
    try {
      // white backing card
      fillRect(doc, ML, y + 1, 32, 24, COLORS.white);
      doc.addImage(logoUrl, 'JPEG', ML + 1, y + 2, 30, 22);
    } catch { /* skip */ }
  }

  // Company name + tagline (right of logo)
  const cx = logoUrl ? ML + 36 : ML;
  sf(doc, 13, 'bold', COLORS.white);
  doc.text(COMPANY.name, cx, y + 9);

  sf(doc, 8, 'normal', '#bfdbfe'); // blue-200
  doc.text(COMPANY.tagline, cx, y + 14);

  sf(doc, 7.5, 'normal', '#93c5fd'); // blue-300
  doc.text(COMPANY.address, cx, y + 19);
  doc.text(`${COMPANY.phone}  |  ${COMPANY.email}`, cx, y + 23.5);

  // QUOTATION block — right side of banner
  const rx = PAGE_W - MR;
  sf(doc, 22, 'bold', COLORS.white);
  doc.text('QUOTATION', rx, y + 10, { align: 'right' });

  sf(doc, 10, 'bold', '#bfdbfe');
  doc.text(quote.quote_number, rx, y + 17, { align: 'right' });

  sf(doc, 8, 'normal', '#93c5fd');
  doc.text(`Date: ${fmtDate(quote.submitted_at)}`, rx, y + 22.5, { align: 'right' });
  if (quote.expiry_date) {
    doc.text(`Valid Until: ${fmtDate(quote.expiry_date)}`, rx, y + 27, { align: 'right' });
  }

  // Status pill — small badge bottom-right of banner
  const sLabel = statusLabel(quote.status);
  const sColor = statusColor(quote.status);
  const pillW  = doc.getTextWidth(sLabel) + 6;
  fillRect(doc, rx - pillW, y + 29, pillW, 5.5, '#1e3a8a'); // darker pill bg
  sf(doc, 7.5, 'bold', sColor);
  doc.text(sLabel, rx - pillW / 2, y + 33, { align: 'center' });

  return y + 44; // below banner + breathing room
}

// ─── bill-to / quote details ──────────────────────────────────────────────────

function drawBillTo(doc: jsPDF, quote: PdfQuoteData, y: number): number {
  const rightColX = ML + CW * 0.55;

  // Section labels
  sf(doc, 7, 'bold', COLORS.slate400);
  doc.text('BILL TO', ML, y);
  doc.text('QUOTE DETAILS', rightColX, y);
  y += 4;

  // Customer name
  sf(doc, 11, 'bold', COLORS.slate900);
  doc.text(quote.customer_name, ML, y);
  y += 5;

  // Customer detail lines
  const leftLines: string[] = [];
  if (quote.company)  leftLines.push(quote.company);
  if (quote.position) leftLines.push(quote.position);
  leftLines.push(quote.customer_email);
  leftLines.push(quote.customer_phone);
  const addrParts = [quote.address, quote.city, quote.country].filter(Boolean);
  if (addrParts.length) leftLines.push(addrParts.join(', '));

  sf(doc, 9, 'normal', COLORS.slate700);
  let ly = y;
  for (const line of leftLines) {
    doc.text(line, ML, ly);
    ly += 4.5;
  }

  // Right column: quote details
  const pairs: [string, string][] = [
    ['Quote No:', quote.quote_number],
    ['Issue Date:', fmtDate(quote.submitted_at)],
  ];
  if (quote.expiry_date)   pairs.push(['Expiry Date:', fmtDate(quote.expiry_date)]);
  if (quote.sales_person)  pairs.push(['Sales Rep:', quote.sales_person]);
  pairs.push(['VAT Rate:', `${quote.vat_pct}%`]);

  let ry = y;
  const valX = PAGE_W - MR;
  for (const [label, val] of pairs) {
    sf(doc, 8.5, 'bold', COLORS.slate500);
    doc.text(label, rightColX, ry);
    sf(doc, 8.5, 'normal', COLORS.slate900);
    doc.text(val, valX, ry, { align: 'right' });
    ry += 5;
  }

  return Math.max(ly, ry);
}

// ─── items table ──────────────────────────────────────────────────────────────

function drawTable(doc: jsPDF, required: PdfQuoteItem[], optional: PdfQuoteItem[], startY: number): number {
  let y = startY;

  const drawTableHeader = () => {
    fillRect(doc, ML, y, CW, 8, COLORS.blue800);
    sf(doc, 8, 'bold', COLORS.white);
    doc.text('#',           TC.hash  + 5,        y + 5.2, { align: 'right' });
    doc.text('Description', TC.desc  + 2,        y + 5.2);
    doc.text('Qty',         TC.qty   + 12 - 2,   y + 5.2, { align: 'right' });
    doc.text('Unit Price',  TC.price + 27 - 2,   y + 5.2, { align: 'right' });
    doc.text('Discount',    TC.disc  + 22 - 2,   y + 5.2, { align: 'right' });
    doc.text('Net Total',   TC.net   + 32 - 2,   y + 5.2, { align: 'right' });
    y += 8;
  };

  drawTableHeader();

  const drawRow = (item: PdfQuoteItem, idx: number, isOptional: boolean) => {
    const nameLines = doc.splitTextToSize(item.product_name || '(No name)', 78);
    const hasSKU    = !!item.product_sku;
    const hasNote   = !!item.notes;
    const innerH    = (nameLines.length * 4.2) + (hasSKU ? 3.8 : 0) + (hasNote ? 3.8 : 0) + 3;
    const rowH      = Math.max(9, innerH);

    // Page break
    if (y + rowH > PAGE_H - 30) {
      doc.addPage();
      y = MT;
      drawTableHeader();
    }

    // Row background
    const bg = isOptional ? COLORS.amber50 : (idx % 2 === 0 ? COLORS.white : COLORS.slate50);
    fillRect(doc, ML, y, CW, rowH, bg);

    // Bottom border
    hline(doc, y + rowH, COLORS.slate200, 0.2);

    const ty = y + 4.8;

    // # column
    sf(doc, 8.5, 'normal', COLORS.slate500);
    doc.text(`${idx + 1}`, TC.hash + 5, ty, { align: 'right' });

    // Description
    sf(doc, 9, 'bold', isOptional ? COLORS.amber700 : COLORS.slate900);
    doc.text(nameLines, TC.desc + 2, ty);

    let dy = ty + nameLines.length * 4.2;

    if (hasSKU) {
      sf(doc, 7.5, 'normal', COLORS.slate400);
      doc.text(`SKU: ${item.product_sku}`, TC.desc + 2, dy);
      dy += 3.8;
    }

    if (hasNote) {
      sf(doc, 7.5, 'italic', COLORS.slate500);
      const noteLines = doc.splitTextToSize(item.notes!, 78);
      doc.text(noteLines, TC.desc + 2, dy);
    }

    if (isOptional) {
      sf(doc, 7, 'bold', COLORS.amber700);
      doc.text('(Optional — not included in total)', TC.desc + 2, ty + rowH - 3.5);
    }

    // Qty
    sf(doc, 9, 'normal', COLORS.slate900);
    doc.text(String(item.quantity), TC.qty + 12 - 2, ty, { align: 'right' });

    // Unit Price
    const unitFmt = (item.unit_price ?? 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    doc.text(unitFmt, TC.price + 27 - 2, ty, { align: 'right' });

    // Discount
    const hasDisc = (item.discount_pct > 0 || item.discount_amount > 0);
    if (hasDisc) {
      sf(doc, 9, 'normal', COLORS.red500);
      const discStr = item.discount_pct > 0
        ? `${item.discount_pct}%`
        : `-${item.discount_amount.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
      doc.text(discStr, TC.disc + 22 - 2, ty, { align: 'right' });
    } else {
      sf(doc, 9, 'normal', COLORS.slate400);
      doc.text('—', TC.disc + 22 - 2, ty, { align: 'right' });
    }

    // Net total
    const net = lineNet(item);
    sf(doc, 9, 'bold', isOptional ? COLORS.amber700 : COLORS.slate900);
    doc.text(
      net.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      TC.net + 32 - 2, ty, { align: 'right' }
    );

    y += rowH;
  };

  required.forEach((item, i) => drawRow(item, i, false));

  if (optional.length > 0) {
    // Optional items separator
    fillRect(doc, ML, y, CW, 6.5, COLORS.amber50);
    sf(doc, 7.5, 'bold', COLORS.amber700);
    doc.text('OPTIONAL ITEMS — listed for reference, excluded from totals', ML + 3, y + 4.3);
    y += 6.5;

    optional.forEach((item, i) => drawRow(item, required.length + i, true));
  }

  // Table outer border
  doc.setDrawColor(COLORS.slate300);
  doc.setLineWidth(0.3);
  doc.rect(ML, startY, CW, y - startY, 'S');

  return y;
}

// ─── totals ───────────────────────────────────────────────────────────────────

function drawTotals(
  doc: jsPDF,
  p: {
    subtotal: number; lineDicsTotal: number; quotePctDisc: number;
    totalQDisc: number; discSubtotal: number; charges: number;
    preVat: number; vatAmt: number; grandTotal: number;
    delivery: number; installation: number; warranty: number;
    vatPct: number; discPct: number;
  },
  startY: number
): number {
  const labelX = ML + CW * 0.5 + 3;
  const valueX = PAGE_W - MR - 2;
  const boxW   = PAGE_W - MR - (ML + CW * 0.5);

  type Row = { label: string; value: string; bold?: boolean; negative?: boolean; big?: boolean; sep?: boolean };
  const rows: Row[] = [];

  rows.push({ label: `Items Subtotal (${p.subtotal > 0 ? '' : ''}${p.lineDicsTotal > 0 ? 'before line discounts' : ''})`.trim() || 'Items Subtotal', value: fmtKES(p.subtotal) });

  if (p.lineDicsTotal > 0) {
    rows.push({ label: 'Line Discounts Applied', value: fmtKES(p.lineDicsTotal), negative: true });
  }
  if (p.totalQDisc > 0) {
    const ql = p.discPct > 0 ? `Quote Discount (${p.discPct}%)` : 'Quote Discount (Fixed)';
    rows.push({ label: ql, value: fmtKES(p.totalQDisc), negative: true });
  }
  if (p.lineDicsTotal > 0 || p.totalQDisc > 0) {
    rows.push({ label: 'Net Amount', value: fmtKES(p.discSubtotal), bold: true, sep: true });
  }
  if (p.delivery > 0)      rows.push({ label: 'Delivery Charge',      value: fmtKES(p.delivery) });
  if (p.installation > 0)  rows.push({ label: 'Installation Charge',  value: fmtKES(p.installation) });
  if (p.warranty > 0)      rows.push({ label: 'Warranty Extension',   value: fmtKES(p.warranty) });

  rows.push({ label: `VAT (${p.vatPct}%)`, value: fmtKES(p.vatAmt), sep: true });
  rows.push({ label: 'GRAND TOTAL', value: fmtKES(p.grandTotal), bold: true, big: true, sep: true });

  const rowH = 6;
  const bigH = 9;
  const totalH = rows.reduce((acc, r) => acc + (r.big ? bigH : rowH) + (r.sep ? 1 : 0), 0) + 6;

  fillRect(doc, ML + CW * 0.5, startY, boxW, totalH, COLORS.slate50, COLORS.slate200);

  let y = startY + 4;

  for (const row of rows) {
    if (row.sep) {
      hline(doc, y - 1, COLORS.slate300, 0.3, labelX - 1, valueX);
    }

    const fSize = row.big ? 11 : 9;
    const color = row.big
      ? COLORS.blue700
      : row.negative ? COLORS.red500 : (row.bold ? COLORS.slate900 : COLORS.slate600);
    sf(doc, fSize, (row.bold || row.big) ? 'bold' : 'normal', color);

    doc.text(row.label, labelX, y);
    doc.text(row.negative ? `-${row.value}` : row.value, valueX, y, { align: 'right' });

    y += (row.big ? bigH : rowH) + (row.sep ? 1 : 0);
  }

  return startY + totalH + 2;
}

// ─── customer notes ───────────────────────────────────────────────────────────

function drawNotesBlock(doc: jsPDF, notes: string, y: number): number {
  fillRect(doc, ML, y, CW, 7, COLORS.slate100);
  sf(doc, 7.5, 'bold', COLORS.slate600);
  doc.text('NOTES & SPECIAL CONDITIONS', ML + 3, y + 4.5);
  y += 9;

  sf(doc, 8.5, 'normal', COLORS.slate700);
  const lines = doc.splitTextToSize(notes, CW - 6);
  doc.text(lines, ML + 3, y);

  return y + lines.length * 4.5 + 3;
}

// ─── terms & conditions ───────────────────────────────────────────────────────

function drawTerms(doc: jsPDF, y: number): number {
  fillRect(doc, ML, y, CW, 7.5, COLORS.blue800);
  sf(doc, 8, 'bold', COLORS.white);
  doc.text('TERMS & CONDITIONS', ML + 3, y + 5);
  y += 9;

  for (const { title, body } of DEFAULT_TERMS) {
    if (y > PAGE_H - 45) {
      doc.addPage();
      y = MT;
    }

    sf(doc, 8.5, 'bold', COLORS.slate900);
    doc.text(title, ML + 3, y);
    y += 4.5;

    sf(doc, 8, 'normal', COLORS.slate600);
    const lines = doc.splitTextToSize(body, CW - 6);
    doc.text(lines, ML + 3, y);
    y += lines.length * 4.2 + 5;
  }

  return y;
}

// ─── signature + QR ──────────────────────────────────────────────────────────

function drawSignature(doc: jsPDF, qrUrl: string, quoteNumber: string, y: number): void {
  fillRect(doc, ML, y, CW, 7, COLORS.slate100);
  sf(doc, 7.5, 'bold', COLORS.slate600);
  doc.text('AUTHORISATION & VERIFICATION', ML + 3, y + 4.5);
  y += 10;

  const splitAt = ML + CW * 0.60;
  const qrSize  = 36;
  const qrX     = splitAt + (CW * 0.40 - qrSize) / 2 + ML;

  // Signature fields
  const fields = [
    'Authorised Signature',
    'Name',
    'Designation / Title',
    'Date',
    'Company Stamp',
  ];

  sf(doc, 8.5, 'normal', COLORS.slate600);
  fields.forEach((label, i) => {
    const fy = y + i * 9 + (i === 0 ? 0 : i >= 1 ? 1 : 0);
    doc.text(`${label}:`, ML + 3, fy);
    doc.setDrawColor(COLORS.slate300);
    doc.setLineWidth(0.3);
    doc.line(ML + doc.getTextWidth(`${label}:`) + 5, fy, splitAt - 8, fy);
  });

  // Company stamp box
  const stampY = y + fields.length * 9 + 2;
  doc.setDrawColor(COLORS.slate300);
  doc.setLineWidth(0.4);
  doc.setLineDashPattern([1, 1], 0);
  doc.rect(ML + 3, y + 4 * 9 + 2, 38, 18, 'S');
  doc.setLineDashPattern([], 0);
  sf(doc, 7, 'normal', COLORS.slate400);
  doc.text('Official Stamp', ML + 3 + 19, y + 4 * 9 + 13, { align: 'center' });

  // OSIL footer text in signature block
  sf(doc, 7.5, 'bold', COLORS.slate900);
  doc.text(COMPANY.name, ML + 3, stampY + 24);
  sf(doc, 7, 'normal', COLORS.slate500);
  doc.text(`${COMPANY.address}`, ML + 3, stampY + 28);
  sf(doc, 7, 'normal', COLORS.slate500);
  doc.text(`${COMPANY.phone}  |  ${COMPANY.email}  |  ${COMPANY.website}`, ML + 3, stampY + 32.5);

  // QR code
  if (qrUrl) {
    try {
      doc.addImage(qrUrl, 'PNG', qrX, y - 2, qrSize, qrSize);
    } catch { /* skip */ }
    sf(doc, 7.5, 'bold', COLORS.slate900);
    doc.text('Scan to Verify', qrX + qrSize / 2, y + qrSize + 1.5, { align: 'center' });
    sf(doc, 7, 'normal', COLORS.blue600);
    doc.text(quoteNumber, qrX + qrSize / 2, y + qrSize + 5.5, { align: 'center' });
    sf(doc, 6.5, 'normal', COLORS.slate400);
    doc.text('OSIL Ltd — Official Quotation', qrX + qrSize / 2, y + qrSize + 9, { align: 'center' });
  }
}

// ─── page footer ─────────────────────────────────────────────────────────────

function drawFooter(doc: jsPDF, quoteNumber: string, page: number, total: number): void {
  const fy = PAGE_H - 10;
  fillRect(doc, 0, PAGE_H - 14, PAGE_W, 14, COLORS.blue800);
  sf(doc, 6.5, 'normal', '#93c5fd');
  doc.text(
    `${COMPANY.name}  |  ${COMPANY.address}  |  ${COMPANY.phone}`,
    ML, fy
  );
  doc.text(
    `${quoteNumber}  |  Page ${page} of ${total}`,
    PAGE_W - MR, fy, { align: 'right' }
  );
}

// ─── page break helper ────────────────────────────────────────────────────────

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_H - 20) {
    doc.addPage();
    return MT;
  }
  return y;
}
