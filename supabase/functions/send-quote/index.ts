import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface QuoteItem {
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  discount_amount: number;
  is_optional: boolean;
  notes: string | null;
}

interface QuoteData {
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
  discount_pct: number;
  discount_amount: number;
  vat_pct: number;
  delivery_charge: number;
  installation_charge: number;
  warranty_charge: number;
  customer_notes: string | null;
  quote_items: QuoteItem[];
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function fmtKES(n: number): string {
  return `KES ${n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function lineNet(i: QuoteItem): number {
  const gross = (i.quantity ?? 0) * (i.unit_price ?? 0);
  const d = Math.max(0, Math.min(100, i.discount_pct ?? 0));
  return Math.max(0, gross - (d / 100 * gross) - (i.discount_amount ?? 0));
}

function buildEmailHtml(quote: QuoteData, coverMessage: string): string {
  const required = quote.quote_items.filter(i => !i.is_optional);
  const optional = quote.quote_items.filter(i => i.is_optional);

  const reqNets = required.map(lineNet);
  const subtotal = reqNets.reduce((a, b) => a + b, 0);
  const lineDiscTotal = required.reduce((acc, i, idx) => {
    const gross = i.quantity * i.unit_price;
    return acc + (gross - reqNets[idx]);
  }, 0);
  const quotePctDisc = (quote.discount_pct / 100) * subtotal;
  const totalQDisc = quotePctDisc + (quote.discount_amount ?? 0);
  const discSubtotal = Math.max(0, subtotal - totalQDisc);
  const charges = (quote.delivery_charge ?? 0) + (quote.installation_charge ?? 0) + (quote.warranty_charge ?? 0);
  const preVat = discSubtotal + charges;
  const vatAmt = (quote.vat_pct / 100) * preVat;
  const grandTotal = preVat + vatAmt;

  const itemRows = required.map((item, i) => {
    const net = reqNets[i];
    const hasDisc = item.discount_pct > 0 || item.discount_amount > 0;
    const discStr = hasDisc
      ? (item.discount_pct > 0 ? `${item.discount_pct}%` : fmtKES(item.discount_amount))
      : "—";
    return `
      <tr style="background:${i % 2 === 0 ? "#ffffff" : "#f8fafc"}">
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:600;">${item.product_name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;color:#64748b;">${item.product_sku ?? "—"}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;text-align:right;">${fmtKES(item.unit_price)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:${hasDisc ? "#ef4444" : "#94a3b8"};text-align:right;">${discStr}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#0f172a;font-weight:700;text-align:right;">${fmtKES(net)}</td>
      </tr>
    `;
  }).join("");

  const optionalRows = optional.length > 0 ? `
    <tr>
      <td colspan="6" style="padding:8px 12px;background:#fffbeb;font-size:11px;font-weight:700;color:#b45309;text-transform:uppercase;letter-spacing:0.05em;">
        Optional Items — listed for reference, excluded from totals
      </td>
    </tr>
    ${optional.map(item => `
      <tr style="background:#fffbeb;">
        <td style="padding:10px 12px;border-bottom:1px solid #fde68a;font-size:13px;color:#b45309;font-weight:600;">${item.product_name} <span style="font-weight:400;font-size:11px;">(optional)</span></td>
        <td style="padding:10px 12px;border-bottom:1px solid #fde68a;font-size:12px;color:#b45309;">${item.product_sku ?? "—"}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #fde68a;font-size:13px;color:#b45309;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #fde68a;font-size:13px;color:#b45309;text-align:right;">${fmtKES(item.unit_price)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #fde68a;font-size:13px;text-align:right;color:#b45309;">—</td>
        <td style="padding:10px 12px;border-bottom:1px solid #fde68a;font-size:13px;color:#b45309;font-weight:700;text-align:right;">${fmtKES(lineNet(item))}</td>
      </tr>
    `).join("")}
  ` : "";

  const totalRows: string[] = [];
  totalRows.push(`<tr><td style="padding:7px 12px;font-size:13px;color:#64748b;">Items Subtotal</td><td style="padding:7px 12px;font-size:13px;color:#0f172a;font-weight:600;text-align:right;">${fmtKES(subtotal)}</td></tr>`);
  if (lineDiscTotal > 0) totalRows.push(`<tr><td style="padding:7px 12px;font-size:13px;color:#ef4444;">Line Discounts</td><td style="padding:7px 12px;font-size:13px;color:#ef4444;text-align:right;">−${fmtKES(lineDiscTotal)}</td></tr>`);
  if (totalQDisc > 0) totalRows.push(`<tr><td style="padding:7px 12px;font-size:13px;color:#ef4444;">Quote Discount${quote.discount_pct > 0 ? ` (${quote.discount_pct}%)` : ""}</td><td style="padding:7px 12px;font-size:13px;color:#ef4444;text-align:right;">−${fmtKES(totalQDisc)}</td></tr>`);
  if (quote.delivery_charge > 0) totalRows.push(`<tr><td style="padding:7px 12px;font-size:13px;color:#64748b;">Delivery Charge</td><td style="padding:7px 12px;font-size:13px;color:#0f172a;text-align:right;">${fmtKES(quote.delivery_charge)}</td></tr>`);
  if (quote.installation_charge > 0) totalRows.push(`<tr><td style="padding:7px 12px;font-size:13px;color:#64748b;">Installation Charge</td><td style="padding:7px 12px;font-size:13px;color:#0f172a;text-align:right;">${fmtKES(quote.installation_charge)}</td></tr>`);
  if (quote.warranty_charge > 0) totalRows.push(`<tr><td style="padding:7px 12px;font-size:13px;color:#64748b;">Warranty Extension</td><td style="padding:7px 12px;font-size:13px;color:#0f172a;text-align:right;">${fmtKES(quote.warranty_charge)}</td></tr>`);
  totalRows.push(`<tr><td style="padding:7px 12px;font-size:13px;color:#64748b;border-top:1px solid #e2e8f0;">VAT (${quote.vat_pct}%)</td><td style="padding:7px 12px;font-size:13px;color:#0f172a;border-top:1px solid #e2e8f0;text-align:right;">${fmtKES(vatAmt)}</td></tr>`);
  totalRows.push(`<tr style="background:#eff6ff;"><td style="padding:11px 12px;font-size:15px;color:#1d4ed8;font-weight:800;border-top:2px solid #bfdbfe;">GRAND TOTAL</td><td style="padding:11px 12px;font-size:15px;color:#1d4ed8;font-weight:800;border-top:2px solid #bfdbfe;text-align:right;">${fmtKES(grandTotal)}</td></tr>`);

  const addressParts = [quote.address, quote.city, quote.country].filter(Boolean).join(", ");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#f1f5f9;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#1e40af 0%,#1d4ed8 100%);padding:28px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">OSIL Ltd</div>
            <div style="font-size:12px;color:#bfdbfe;margin-top:2px;">Professional Technology Solutions</div>
          </td>
          <td align="right">
            <div style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">QUOTATION</div>
            <div style="font-size:14px;font-weight:700;color:#93c5fd;margin-top:2px;">${quote.quote_number}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Meta bar -->
  <tr>
    <td style="background:#eff6ff;border-bottom:1px solid #bfdbfe;padding:14px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:12px;color:#3b82f6;"><strong>Date:</strong> ${fmtDate(quote.submitted_at)}</td>
          <td align="center" style="font-size:12px;color:#3b82f6;">${quote.expiry_date ? `<strong>Valid Until:</strong> ${fmtDate(quote.expiry_date)}` : ""}</td>
          <td align="right" style="font-size:12px;color:#3b82f6;">${quote.sales_person ? `<strong>Sales Rep:</strong> ${quote.sales_person}` : ""}</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Cover message -->
  <tr>
    <td style="padding:28px 32px 0;">
      <p style="font-size:15px;color:#0f172a;margin:0 0 6px;">Dear ${quote.customer_name},</p>
      <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 4px;">${coverMessage.replace(/\n/g, "<br>")}</p>
    </td>
  </tr>

  <!-- Bill to -->
  <tr>
    <td style="padding:20px 32px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;vertical-align:top;width:50%;">
            <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Bill To</div>
            <div style="font-size:14px;font-weight:700;color:#0f172a;">${quote.customer_name}</div>
            ${quote.company ? `<div style="font-size:13px;color:#334155;">${quote.company}</div>` : ""}
            ${quote.position ? `<div style="font-size:12px;color:#64748b;">${quote.position}</div>` : ""}
            <div style="font-size:12px;color:#64748b;margin-top:4px;">${quote.customer_email}</div>
            <div style="font-size:12px;color:#64748b;">${quote.customer_phone}</div>
            ${addressParts ? `<div style="font-size:12px;color:#64748b;margin-top:4px;">${addressParts}</div>` : ""}
          </td>
          <td style="width:16px;"></td>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;vertical-align:top;">
            <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Quote Details</div>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="font-size:12px;color:#64748b;padding-bottom:4px;">Quote No</td><td align="right" style="font-size:12px;color:#0f172a;font-weight:700;">${quote.quote_number}</td></tr>
              <tr><td style="font-size:12px;color:#64748b;padding-bottom:4px;">Issue Date</td><td align="right" style="font-size:12px;color:#0f172a;">${fmtDate(quote.submitted_at)}</td></tr>
              ${quote.expiry_date ? `<tr><td style="font-size:12px;color:#64748b;padding-bottom:4px;">Valid Until</td><td align="right" style="font-size:12px;color:#0f172a;">${fmtDate(quote.expiry_date)}</td></tr>` : ""}
              <tr><td style="font-size:12px;color:#64748b;">VAT Rate</td><td align="right" style="font-size:12px;color:#0f172a;">${quote.vat_pct}%</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- Items table -->
  <tr>
    <td style="padding:24px 32px 0;">
      <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Items</div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#1e40af;">
            <th style="padding:10px 12px;font-size:11px;color:#ffffff;font-weight:700;text-align:left;text-transform:uppercase;letter-spacing:0.05em;">Description</th>
            <th style="padding:10px 12px;font-size:11px;color:#ffffff;font-weight:700;text-align:left;text-transform:uppercase;letter-spacing:0.05em;">SKU</th>
            <th style="padding:10px 12px;font-size:11px;color:#ffffff;font-weight:700;text-align:center;text-transform:uppercase;letter-spacing:0.05em;">Qty</th>
            <th style="padding:10px 12px;font-size:11px;color:#ffffff;font-weight:700;text-align:right;text-transform:uppercase;letter-spacing:0.05em;">Unit Price</th>
            <th style="padding:10px 12px;font-size:11px;color:#ffffff;font-weight:700;text-align:right;text-transform:uppercase;letter-spacing:0.05em;">Discount</th>
            <th style="padding:10px 12px;font-size:11px;color:#ffffff;font-weight:700;text-align:right;text-transform:uppercase;letter-spacing:0.05em;">Net Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
          ${optionalRows}
        </tbody>
      </table>
    </td>
  </tr>

  <!-- Totals -->
  <tr>
    <td style="padding:16px 32px 0;">
      <table cellpadding="0" cellspacing="0" style="margin-left:auto;min-width:280px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        ${totalRows.join("")}
      </table>
    </td>
  </tr>

  ${quote.customer_notes ? `
  <!-- Notes -->
  <tr>
    <td style="padding:20px 32px 0;">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Notes & Special Conditions</div>
        <p style="font-size:13px;color:#334155;line-height:1.6;margin:0;">${quote.customer_notes.replace(/\n/g, "<br>")}</p>
      </div>
    </td>
  </tr>
  ` : ""}

  <!-- Terms summary -->
  <tr>
    <td style="padding:20px 32px 0;">
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px 16px;">
        <div style="font-size:10px;font-weight:700;color:#3b82f6;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:10px;">Key Terms</div>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:12px;color:#1d4ed8;font-weight:600;padding-bottom:5px;">Payment</td>
            <td style="font-size:12px;color:#334155;padding-bottom:5px;">Due within 30 days of invoice date.</td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#1d4ed8;font-weight:600;padding-bottom:5px;">Warranty</td>
            <td style="font-size:12px;color:#334155;padding-bottom:5px;">Manufacturer's standard warranty unless extended warranty is listed above.</td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#1d4ed8;font-weight:600;padding-bottom:5px;">Returns</td>
            <td style="font-size:12px;color:#334155;padding-bottom:5px;">Accepted within 14 days for undamaged, unopened items in original packaging.</td>
          </tr>
          <tr>
            <td style="font-size:12px;color:#1d4ed8;font-weight:600;">Validity</td>
            <td style="font-size:12px;color:#334155;">This quotation is valid for 30 days from the date of issue.</td>
          </tr>
        </table>
      </div>
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="padding:28px 32px;border-top:1px solid #e2e8f0;margin-top:24px;">
      <p style="font-size:14px;color:#334155;margin:0 0 16px;">To accept this quotation or for any queries, please contact us:</p>
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right:24px;font-size:12px;color:#64748b;">📞 +254 795 030 476</td>
          <td style="padding-right:24px;font-size:12px;color:#64748b;">✉️ info@osilltd.co.ke</td>
          <td style="font-size:12px;color:#64748b;">🌐 www.osilltd.co.ke</td>
        </tr>
      </table>
    </td>
  </tr>

  <tr>
    <td style="background:#0f172a;padding:16px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:12px;color:#94a3b8;">OSIL Ltd · 1st Floor, Jethalal Chambers, Tubman Rd, Suite 103, Nairobi · PIN: P051234567X</td>
          <td align="right" style="font-size:11px;color:#475569;">${quote.quote_number}</td>
        </tr>
      </table>
    </td>
  </tr>

</table>
</td></tr>
</table>

</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { quote, recipientEmail, coverMessage } = await req.json() as {
      quote: QuoteData;
      recipientEmail: string;
      coverMessage: string;
    };

    if (!quote || !recipientEmail) {
      return Response.json(
        { error: "Missing required fields: quote, recipientEmail" },
        { status: 400, headers: corsHeaders }
      );
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "OSIL Quotes <onboarding@resend.dev>";

    if (!RESEND_API_KEY) {
      return Response.json(
        { error: "Email service not configured. Please add RESEND_API_KEY to edge function secrets." },
        { status: 503, headers: corsHeaders }
      );
    }

    const html = buildEmailHtml(quote, coverMessage);

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [recipientEmail],
        subject: `Quotation ${quote.quote_number} from OSIL Ltd`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errBody = await resendRes.json().catch(() => ({}));
      return Response.json(
        { error: (errBody as { message?: string }).message ?? "Failed to send email via Resend." },
        { status: resendRes.status, headers: corsHeaders }
      );
    }

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500, headers: corsHeaders }
    );
  }
});
