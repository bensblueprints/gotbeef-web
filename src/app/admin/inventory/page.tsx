import { FLAVORS } from "@/lib/products";

export default function AdminInventoryPage() {
  return (
    <div>
      <h1 className="font-serif font-black text-4xl tracking-tight mb-2">Inventory</h1>
      <p className="text-sm text-ink/60 mb-8">
        TODO — no Inventory model yet. This view renders the static FLAVORS catalog
        from <span className="font-mono">src/lib/products.ts</span>. Wire to a real stock
        table when fulfillment goes live.
      </p>

      <div className="border border-ink/15 bg-paper">
        <table className="w-full text-sm">
          <thead className="bg-ink text-white">
            <tr>
              <th className="p-3 text-left text-xs uppercase tracking-wider">SKU</th>
              <th className="p-3 text-left text-xs uppercase tracking-wider">Flavor</th>
              <th className="p-3 text-left text-xs uppercase tracking-wider">Heat</th>
              <th className="p-3 text-left text-xs uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {FLAVORS.map(f => (
              <tr key={f.sku} className="border-t border-ink/10">
                <td className="p-3 font-mono">{f.sku}</td>
                <td className="p-3">{f.name}</td>
                <td className="p-3 font-mono">{"•".repeat(Math.max(1, f.heat || 1))}</td>
                <td className="p-3">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-1 text-xs font-semibold uppercase tracking-wider">
                    In stock
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
