export const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN") + " đ";
export const fmtShort = (n: number) => Math.round(n).toLocaleString("vi-VN");
export const pct = (n: number) => (n * 100).toFixed(1) + "%";
export const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const BULK_TIERS = [
  { label: "-50%", factor: 0.5, costDelta: 0.10 },
  { label: "-25%", factor: 0.75, costDelta: 0.05 },
  { label: "Gốc", factor: 1, costDelta: 0 },
  { label: "+25%", factor: 1.25, costDelta: -0.03 },
  { label: "+50%", factor: 1.5, costDelta: -0.05 },
  { label: "+100%", factor: 2, costDelta: -0.08 },
] as const;
