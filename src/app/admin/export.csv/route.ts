import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!(session?.user as any)?.isAdmin) return new Response("Forbidden", { status: 403 });

  const orders = await db.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, shippingAddress: true }
  });
  const lines = ["order_number,email,status,total_cents,created_at,tracking,items"];
  for (const o of orders) {
    const items = o.items.map(i => `${i.qty}x ${i.sku}`).join(" | ");
    lines.push([
      o.number, o.email, o.status, o.totalCents, o.createdAt.toISOString(),
      o.trackingNumber ?? "", `"${items}"`
    ].join(","));
  }
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="gotbeef-orders-${new Date().toISOString().slice(0,10)}.csv"`
    }
  });
}
