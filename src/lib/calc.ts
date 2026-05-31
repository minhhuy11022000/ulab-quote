import type { Item, Quote, CalcRow, Totals } from "../types";
import { genId } from "./utils";

export function calcRow(item: Item): Omit<CalcRow, keyof Item> {
  const unitCost = item.costs.reduce((s, c) => s + (c.value || 0), 0);
  const totalCost = item.qty * unitCost;
  const suggestedPrice = unitCost > 0 ? Math.ceil(unitCost / (1 - item.margin) / 100) * 100 : 0;
  const finalPrice = item.priceOverride !== null ? item.priceOverride : suggestedPrice;
  const totalRev = item.qty * finalPrice;
  const profit = totalRev - totalCost;
  const actualMargin = totalRev > 0 ? profit / totalRev : 0;
  const isOverridden = item.priceOverride !== null && item.priceOverride !== suggestedPrice;
  return { unitCost, totalCost, suggestedPrice, finalPrice, totalRev, profit, actualMargin, isOverridden };
}

export function calcQuoteTotals(quote: Quote): Totals {
  const t = { totalCost: 0, totalRev: 0, profit: 0, margin: 0 };
  quote.items.forEach(it => {
    const r = calcRow(it);
    t.totalCost += r.totalCost;
    t.totalRev += r.totalRev;
    t.profit += r.profit;
  });
  t.margin = t.totalRev > 0 ? t.profit / t.totalRev : 0;
  return t;
}

export const createQuote = (clientName: string, items: Item[] | null = null): Quote => ({
  id: genId(),
  clientName,
  items: items ?? [{ id: 1, name: "", qty: 100, costs: [{ label: "Phôi", value: 0 }], margin: 0.35, priceOverride: null }],
  globalMargin: 35,
  nextId: items ? Math.max(...items.map(i => i.id)) + 1 : 2,
  createdAt: new Date().toISOString(),
});
