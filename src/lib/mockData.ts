import type { Item, Quote } from "../types";
import { createQuote } from "./calc";
import { genId } from "./utils";

const SAMPLE_ITEMS: Item[] = [
  { id: 1, name: "Áo Khoác Team Flash", qty: 400, costs: [{ label: "Phôi", value: 42660 }, { label: "In ấn", value: 20000 }, { label: "Đóng gói", value: 10000 }], margin: 0.35, priceOverride: null },
  { id: 2, name: "Áo thun", qty: 180, costs: [{ label: "Phôi", value: 80000 }, { label: "In ấn", value: 10000 }, { label: "Đóng gói", value: 5000 }], margin: 0.35, priceOverride: null },
  { id: 3, name: "Nón", qty: 300, costs: [{ label: "Phôi", value: 25000 }, { label: "In ấn", value: 10000 }, { label: "Đóng gói", value: 5000 }], margin: 0.35, priceOverride: null },
  { id: 4, name: "Quạt", qty: 300, costs: [{ label: "Phôi", value: 25000 }, { label: "Đóng gói", value: 10000 }], margin: 0.35, priceOverride: null },
  { id: 5, name: "Pin sạc dự phòng", qty: 300, costs: [{ label: "Phôi", value: 35000 }, { label: "Đóng gói", value: 10000 }], margin: 0.35, priceOverride: null },
];

const NTPMM_SUMMER_QUOTE: Quote = {
  id: genId(),
  clientName: "Những Thành Phố Mơ Màng Summer",
  items: [
    { id: 1, name: "Vòng tay khán giả", qty: 17000, costs: [{ label: "Phôi (0.4¥ × 3950)", value: 1580 }, { label: "Ship VN (2tr/17k)", value: 118 }], margin: 0.35, priceOverride: null },
    { id: 2, name: "Gift Pack Regular", qty: 13500, costs: [{ label: "Phong bì", value: 1500 }, { label: "Vé giấy", value: 700 }, { label: "Sticker", value: 1200 }], margin: 0.35, priceOverride: null },
    { id: 3, name: "Gift Pack VIP Combo", qty: 3000, costs: [
      { label: "Phong bì VIP", value: 2500 },
      { label: "Vé VIP", value: 1100 },
      { label: "Sticker VIP", value: 2500 },
      { label: "Mũ Bucket", value: 35000 },
      { label: "Khăn Bandana", value: 31500 },
      { label: "Thẻ cứng (0.9¥)", value: 3555 },
      { label: "Dây đeo thẻ (1.2¥)", value: 4740 },
    ], margin: 0.35, priceOverride: null },
    { id: 4, name: "Gậy cổ vũ (Lightstick)", qty: 13500, costs: [{ label: "Phôi (1.6¥ × 3950)", value: 6320 }, { label: "Ship TQ (40¥/500c)", value: 316 }, { label: "Ship VN (13.5tr/lô)", value: 1000 }], margin: 0.35, priceOverride: null },
  ],
  globalMargin: 35,
  nextId: 5,
  createdAt: new Date().toISOString(),
};

export const INITIAL_QUOTES: Quote[] = [
  createQuote("Team Flash 2026", SAMPLE_ITEMS),
  NTPMM_SUMMER_QUOTE,
];
