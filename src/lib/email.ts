// Transactional email via Brevo (api.brevo.com/v3/smtp/email).
// Requires BREVO_API_KEY env var.

const FROM_EMAIL = "orders@gotbeef.us";
const FROM_NAME = "Got Beef";

async function send(opts: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error("BREVO_API_KEY is not set");

  const body: Record<string, unknown> = {
    sender: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email: opts.to }],
    subject: opts.subject,
    htmlContent: opts.html,
  };
  if (opts.replyTo) body.replyTo = { email: opts.replyTo };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Brevo send failed (${res.status}): ${err}`);
  }
  return res.json();
}

export async function sendOrderConfirmation(opts: {
  to: string; orderNumber: string; totalCents: number; items: { name: string; qty: number }[];
}) {
  const itemsHtml = opts.items.map(i => `<li>${i.qty} × ${i.name}</li>`).join("");
  return send({
    to: opts.to,
    subject: `Got Beef — order ${opts.orderNumber} confirmed`,
    html: brandedEmail(`
      <h1 style="font-family:Georgia,serif;font-weight:900;letter-spacing:-0.02em;font-size:32px;margin:0 0 8px;">Order ${opts.orderNumber}</h1>
      <p>Thanks for your order. We'll send tracking when it ships.</p>
      <ul style="padding-left:20px">${itemsHtml}</ul>
      <p style="margin-top:24px"><strong>Total: $${(opts.totalCents / 100).toFixed(2)}</strong></p>
    `),
  });
}

export async function sendShipmentNotification(opts: {
  to: string; orderNumber: string; tracking: string; carrier: string;
}) {
  return send({
    to: opts.to,
    subject: `Got Beef — your order ${opts.orderNumber} has shipped`,
    html: brandedEmail(`
      <h1 style="font-family:Georgia,serif;font-weight:900;letter-spacing:-0.02em;font-size:32px;margin:0 0 8px;">It's on the way.</h1>
      <p>Order ${opts.orderNumber} just shipped via ${opts.carrier}.</p>
      <p><strong>Tracking #:</strong> ${opts.tracking}</p>
    `),
  });
}

export async function sendContactMessage(opts: {
  name: string; email: string; message: string;
}) {
  return send({
    to: "ben@advancedmarketing.co",
    replyTo: opts.email,
    subject: `Got Beef — contact from ${opts.name}`,
    html: brandedEmail(`
      <h1 style="font-family:Georgia,serif;font-weight:900;letter-spacing:-0.02em;font-size:28px;margin:0 0 8px;">New contact message</h1>
      <p><strong>Name:</strong> ${escapeHtml(opts.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(opts.email)}</p>
      <p style="margin-top:16px;white-space:pre-wrap">${escapeHtml(opts.message)}</p>
    `),
  });
}

export async function sendMagicLink(opts: {
  to: string; url: string;
}) {
  return send({
    to: opts.to,
    subject: "Sign in to Got Beef",
    html: brandedEmail(`
      <h1 style="font-family:Georgia,serif;font-weight:900;letter-spacing:-0.02em;font-size:32px;margin:0 0 8px;">Sign in.</h1>
      <p>Click the button below to sign in to your Got Beef account. Link expires in 24 hours.</p>
      <p style="margin-top:24px">
        <a href="${opts.url}" style="display:inline-block;background:#0a0a0a;color:#fff;padding:14px 28px;font-weight:700;font-size:14px;letter-spacing:0.1em;text-decoration:none;text-transform:uppercase;">Sign in</a>
      </p>
      <p style="margin-top:16px;font-size:12px;color:#666">Or copy this link: <a href="${opts.url}" style="color:#666">${opts.url}</a></p>
    `),
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
