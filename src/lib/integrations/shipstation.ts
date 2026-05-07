// ShipStation V1 REST integration.
// Push paid orders to SS, listen for tracking webhooks.
const BASE = "https://ssapi.shipstation.com";

function authHeader() {
  const key = process.env.SHIPSTATION_API_KEY ?? "";
  const secret = process.env.SHIPSTATION_API_SECRET ?? "";
  return "Basic " + Buffer.from(`${key}:${secret}`).toString("base64");
}

type Item = { sku: string; name: string; quantity: number; unitPriceCents: number };
type ShipTo = {
  name: string; line1: string; line2?: string; city: string; state: string;
  postalCode: string; country?: string; phone?: string;
};

export async function createOrder(input: {
  orderNumber: string; orderDate: string; email: string;
  items: Item[]; shipTo: ShipTo; subtotalCents: number; shippingCents: number; taxCents: number;
}) {
  const body = {
    orderNumber: input.orderNumber,
    orderDate: input.orderDate,
    orderStatus: "awaiting_shipment",
    customerEmail: input.email,
    billTo: { name: input.shipTo.name },
    shipTo: {
      name: input.shipTo.name,
      street1: input.shipTo.line1, street2: input.shipTo.line2,
      city: input.shipTo.city, state: input.shipTo.state,
      postalCode: input.shipTo.postalCode, country: input.shipTo.country ?? "US",
      phone: input.shipTo.phone
    },
    items: input.items.map(i => ({
      sku: i.sku, name: i.name, quantity: i.quantity, unitPrice: i.unitPriceCents / 100
    })),
    amountPaid: (input.subtotalCents + input.shippingCents + input.taxCents) / 100,
    shippingAmount: input.shippingCents / 100,
    taxAmount: input.taxCents / 100
  };
  const res = await fetch(`${BASE}/orders/createorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader() },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`ShipStation createOrder failed: ${res.status}`);
  return res.json() as Promise<{ orderId: number }>;
}

export async function getRates(input: {
  carrierCode: string; fromPostalCode: string; toState: string; toPostalCode: string;
  toCountry?: string; weightOz: number;
}) {
  const res = await fetch(`${BASE}/shipments/getrates`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader() },
    body: JSON.stringify({
      carrierCode: input.carrierCode,
      fromPostalCode: input.fromPostalCode,
      toState: input.toState,
      toPostalCode: input.toPostalCode,
      toCountry: input.toCountry ?? "US",
      weight: { value: input.weightOz, units: "ounces" }
    })
  });
  if (!res.ok) throw new Error(`ShipStation rates failed: ${res.status}`);
  return res.json();
}
