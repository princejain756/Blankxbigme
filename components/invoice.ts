import { AdminOrder, PublicOrder } from '../types';
import { SITE_DETAILS } from '../constants';

type InvoiceOrder = AdminOrder | PublicOrder;

const safe = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatPrice = (price: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

const formatDate = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const buildInvoiceHtml = (order: InvoiceOrder) => {
  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td>${safe(item.name)}</td>
        <td>${safe(item.quantity)}</td>
        <td>${safe(formatPrice(item.price))}</td>
        <td>${safe(formatPrice(item.price * item.quantity))}</td>
      </tr>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice ${safe(order.id)}</title>
    <style>
      :root {
        --deadpool-red: #b3001b;
        --deadpool-black: #121212;
        --deadpool-ink: #2f2f2f;
        --deadpool-bg: #f7f4f2;
      }
      body {
        margin: 0;
        padding: 32px;
        background: var(--deadpool-bg);
        color: var(--deadpool-ink);
        font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
      }
      .invoice {
        max-width: 920px;
        margin: 0 auto;
        background: #fff;
        border: 4px solid var(--deadpool-black);
        border-radius: 20px;
        overflow: hidden;
      }
      .header {
        background: linear-gradient(135deg, var(--deadpool-black), var(--deadpool-red));
        color: #fff;
        padding: 28px;
      }
      .brand {
        font-size: 40px;
        font-weight: 900;
        letter-spacing: 1px;
      }
      .subtitle {
        margin-top: 8px;
        opacity: 0.92;
      }
      .section {
        padding: 22px 28px;
        border-top: 1px solid #ece6e3;
      }
      .two-col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      .label {
        color: #7b7b7b;
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }
      .value {
        margin-top: 4px;
        font-size: 15px;
        line-height: 1.5;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th {
        background: #1a1a1a;
        color: #fff;
        text-align: left;
        padding: 12px;
        font-size: 13px;
      }
      td {
        border-bottom: 1px solid #efe9e7;
        padding: 12px;
        font-size: 14px;
      }
      .totals {
        margin-top: 14px;
        margin-left: auto;
        max-width: 340px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
      }
      .grand {
        margin-top: 8px;
        padding-top: 10px;
        border-top: 2px solid #ddd;
        font-weight: 800;
        color: var(--deadpool-red);
        font-size: 18px;
      }
      .foot {
        background: #191919;
        color: #fff;
        padding: 18px 28px;
        font-size: 13px;
      }
      @media print {
        body { padding: 0; background: #fff; }
        .invoice { border-radius: 0; border: none; }
      }
    </style>
  </head>
  <body>
    <div class="invoice">
      <div class="header">
        <div class="brand">BLANK</div>
        <div class="subtitle">Tax Invoice • Deadpool Edition</div>
      </div>

      <div class="section two-col">
        <div>
          <div class="label">Seller</div>
          <div class="value">
            BLANK<br/>
            ${safe(SITE_DETAILS.email)}<br/>
            ${safe(SITE_DETAILS.phone)}<br/>
            FSSAI: ${safe(SITE_DETAILS.fssaiLicense)}
          </div>
        </div>
        <div>
          <div class="label">Customer</div>
          <div class="value">
            ${safe(order.customer.name)}<br/>
            ${safe(order.customer.email || '-')}<br/>
            ${safe(order.customer.phone || '-')}<br/>
            ${safe(order.customer.address || '-')}
          </div>
        </div>
      </div>

      <div class="section two-col">
        <div>
          <div class="label">Order ID</div>
          <div class="value">${safe(order.id)}</div>
        </div>
        <div>
          <div class="label">Order Date</div>
          <div class="value">${safe(formatDate(order.createdAt))}</div>
        </div>
        <div>
          <div class="label">Status</div>
          <div class="value">${safe(order.status)}</div>
        </div>
        <div>
          <div class="label">Payment</div>
          <div class="value">${safe(order.payment.method)}${order.payment.paymentId ? ` • ${safe(order.payment.paymentId)}` : ''}</div>
        </div>
      </div>

      <div class="section">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Line Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div class="totals">
          <div class="row"><span>Subtotal</span><span>${safe(formatPrice(order.totals.subtotal))}</span></div>
          <div class="row"><span>Shipping</span><span>${safe(formatPrice(order.totals.shipping))}</span></div>
          <div class="row grand"><span>Grand Total</span><span>${safe(formatPrice(order.totals.total))}</span></div>
        </div>
      </div>

      <div class="foot">
        This is a system-generated invoice from BLANK. For support contact ${safe(SITE_DETAILS.email)}.
      </div>
    </div>
  </body>
</html>`;
};

export const downloadInvoice = (order: InvoiceOrder) => {
  const html = buildInvoiceHtml(order);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${order.id}-invoice.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
