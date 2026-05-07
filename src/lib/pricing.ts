// Bundle pricing logic for Got Beef. Single source of truth.
// All prices in cents to avoid float math.
//
// Rules locked with the founder:
//   1 pack            $19.99
//   2 packs           save 10%   ($35.98)
//   3 packs           save 15%   ($50.97)
//   4+ packs          15% off everything
//   Sampler (5 flavors, one of each)  $75
//   Free shipping at $50 subtotal

import { SAMPLER_SKU } from "./products";

export const SINGLE_PACK_CENTS = 1999;
export const SAMPLER_CENTS = 7500;
export const FREE_SHIPPING_THRESHOLD_CENTS = 5000;

export type CartLine = {
  sku: string;
  qty: number;
  // Sampler is treated as a single, fixed-price SKU.
  isSampler?: boolean;
};

export type PricedLine = CartLine & {
  unitPriceCents: number;
  lineSubtotalCents: number;
  appliedDiscountPct: number; // 0, 10, or 15
};

export type CartTotals = {
  itemCount: number;             // total bag-equivalent units
  lines: PricedLine[];
  subtotalCents: number;         // before shipping/tax
  bundleDiscountCents: number;   // total discount granted by bundle tiers
  shippingCents: number;         // 0 if subtotalCents >= threshold, else null=TBD
  freeShippingThresholdCents: number;
  amountToFreeShippingCents: number; // 0 if already qualified
  qualifiesForFreeShipping: boolean;
};

/**
 * Discount tier for the *single-pack* bundle math.
 * Sampler is a fixed-price SKU and is excluded from this tier calc.
 */
function singlePackDiscount(qtyOfSinglePacks: number): number {
  if (qtyOfSinglePacks >= 3) return 0.15;
  if (qtyOfSinglePacks === 2) return 0.10;
  return 0;
}

export function priceCart(lines: CartLine[]): CartTotals {
  // Separate sampler lines from single-pack lines for bundle math.
  const samplerQty = lines
    .filter(l => l.isSampler || l.sku === SAMPLER_SKU)
    .reduce((s, l) => s + l.qty, 0);
  const singlePackQty = lines
    .filter(l => !l.isSampler && l.sku !== SAMPLER_SKU)
    .reduce((s, l) => s + l.qty, 0);

  const discountPct = singlePackDiscount(singlePackQty);

  const priced: PricedLine[] = lines.map(l => {
    const isSampler = !!l.isSampler || l.sku === SAMPLER_SKU;
    if (isSampler) {
      const unit = SAMPLER_CENTS;
      return {
        ...l,
        unitPriceCents: unit,
        lineSubtotalCents: unit * l.qty,
        appliedDiscountPct: 0
      };
    }
    const grossUnit = SINGLE_PACK_CENTS;
    const netUnit = Math.round(grossUnit * (1 - discountPct));
    return {
      ...l,
      unitPriceCents: netUnit,
      lineSubtotalCents: netUnit * l.qty,
      appliedDiscountPct: Math.round(discountPct * 100)
    };
  });

  const subtotalCents = priced.reduce((s, l) => s + l.lineSubtotalCents, 0);
  const grossSinglePackTotal = singlePackQty * SINGLE_PACK_CENTS;
  const netSinglePackTotal = priced
    .filter(l => !(l.isSampler || l.sku === SAMPLER_SKU))
    .reduce((s, l) => s + l.lineSubtotalCents, 0);
  const bundleDiscountCents = grossSinglePackTotal - netSinglePackTotal;

  const qualifiesForFreeShipping = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS;
  const amountToFreeShippingCents = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents);
  const shippingCents = qualifiesForFreeShipping ? 0 : 0; // V1: shipping resolved at checkout via ShipStation rate API

  return {
    itemCount: singlePackQty + samplerQty * 5,
    lines: priced,
    subtotalCents,
    bundleDiscountCents,
    shippingCents,
    freeShippingThresholdCents: FREE_SHIPPING_THRESHOLD_CENTS,
    amountToFreeShippingCents,
    qualifiesForFreeShipping
  };
}

export const formatUSD = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
