import { auth } from "@/auth";
import { db } from "@/lib/db";
import { nextShipIsoDate } from "@/lib/shipping";

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
    return `"${s.replace(/"/g, "\"\"")}"`;
  }
  return s;
}

export async function GET() {
  const session = await auth();
  if (!(session?.user as any)?.isAdmin) return new Response("Forbidden", { status: 403 });

  const orders = await db.order.findMany({
    where: { status: { in: ["paid", "fulfilling"] } },
    orderBy: { createdAt: "asc" },
    include: { items: true, shippingAddress: true }
  });

  const lines = [
    "order_number,email,address_one_line,items,total_qty,weight_estimate"
  ];
  for (const o of orders) {
    const a = o.shippingAddress;
    const addr = a
      ? `${a.name}, ${a.line1}${a.line2 ? `, ${a.line2}` : ""}, ${a.city}, ${a.state} ${a.postalCode}, ${a.country}`
      : "";
    const items = o.items.map(i => `${i.qty}x ${i.sku}${i.isSampler ? " (sampler)" : ""}`).join(" | ");
    const totalBags = o.items.reduce((s, i) => s + (i.isSampler ? i.qty * 5 : i.qty), 0);
    const weight = `3oz × ${totalBags}`;
    lines.push([
      csvEscape(o.number),
      csvEscape(o.email),
      csvEscape(addr),
      csvEscape(items),
      csvEscape(totalBags),
      csvEscape(weight)
    ].join(","));
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="gotbeef-shipping-${nextShipIsoDate()}.csv"`
    }
  });
}
