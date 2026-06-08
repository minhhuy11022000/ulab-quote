import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN") + " đ";
export const fmtM = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(1) + " tỷ";
  if (abs >= 1e6) return (n / 1e6).toFixed(1) + " tr";
  if (abs >= 1e3) return (n / 1e3).toFixed(0) + "k";
  return Math.round(n).toLocaleString("vi-VN");
};
export const fmtShort = (n: number) => Math.round(n).toLocaleString("vi-VN");
export const pct = (n: number) => (n * 100).toFixed(1) + "%";
export const genId = () => crypto.randomUUID();

export const BULK_TIERS = [
  { label: "-50%", factor: 0.5, costDelta: 0.10 },
  { label: "-25%", factor: 0.75, costDelta: 0.05 },
  { label: "Gốc", factor: 1, costDelta: 0 },
  { label: "+25%", factor: 1.25, costDelta: -0.03 },
  { label: "+50%", factor: 1.5, costDelta: -0.05 },
  { label: "+100%", factor: 2, costDelta: -0.08 },
] as const;
