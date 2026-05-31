export type CostLine = { label: string; value: number };

export type Item = {
  id: number;
  name: string;
  qty: number;
  costs: CostLine[];
  margin: number;
  priceOverride: number | null;
};

export type Quote = {
  id: string;
  clientName: string;
  items: Item[];
  globalMargin: number;
  nextId: number;
  createdAt: string;
};

export type CalcRow = Item & {
  unitCost: number;
  totalCost: number;
  suggestedPrice: number;
  finalPrice: number;
  totalRev: number;
  profit: number;
  actualMargin: number;
  isOverridden: boolean;
};

export type Totals = { totalCost: number; totalRev: number; profit: number; margin: number };
