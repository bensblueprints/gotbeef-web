// Transactional email via Resend.
// Templates live inline as TSX strings — keep them simple, brand-on.
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "Got Beef <orders@gotbeef.us>";

export async function sendOrderConfirmation(opts: {
  to: string; orderNumber: string; totalCents: number; items: { name: string; qty: number }[];
}) {
  const itemsHtml = opts.items.map(i => `<li>${i.qty} × ${i.name}</li>`).join("");
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Got Beef — order ${opts.orderNumber} confirmed`,
    html: brandedEmail(`
      <h1 style="font-family:Georgia,serif;font-weight:900;letter-spacing:-0.02em;font-size:32px;margin:0 0 8px;">Order ${opts.orderNumber}</h1>
      <p>Thanks for your order. We'll send tracking when it ships.</p>
      <ul style="padding-left:20px">${itemsHtml}</ul>
      <p style="margin-top:24px"><strong>Total: $${(opts.totalCents/100).toFixed(2)}</strong></p>
    `)
  });
}

export async function sendShipmentNotification(opts: {
  to: string; orderNumber: string; tracking: string; carrier: string;
}) {
  return resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Got Beef — your order ${opts.orderNumber} has shipped`,
    html: brandedEmail(`
      <h1 style="font-family:Georgia,serif;font-weight:900;letter-spacing:-0.02em;font-size:32px;margin:0 0 8px;">It's on the way.</h1>
      <p>Order ${opts.orderNumber} just shipped via ${opts.carrier}.</p>
      <p><strong>Tracking #:</strong> ${opts.tracking}</p>
    `)
  });
}

function brandedEmail(inner: string) {
  return `
    <div style="background:#f5f3ee;padding:32px;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0a0a0a">
      <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e6e2d6;padding:32px">
        <div style="background:#0a0a0a;color:#fff;padding:18px;text-align:center;font-family:Georgia,serif;font-weight:900;font-size:36px;letter-spacing:-0.02em;">got beef?</div>
        <div style="padding:24px 0">${inner}</div>
        <div style="border-top:1px solid #e6e2d6;padding-top:16px;font-size:12px;color:#666;text-align:center">gotbeef.us · Made in the USA</div>
      </div>
    </div>`;
}
