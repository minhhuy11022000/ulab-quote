import { cn } from "@/lib/utils";

const GRADIENT_CLASSES = {
  blue: "from-blue-500 to-blue-600",
  green: "from-emerald-500 to-emerald-600",
  purple: "from-violet-500 to-violet-600",
  orange: "from-orange-500 to-orange-600",
} as const;

interface Props {
  label: string;
  value: string;
  sub?: string;
  color?: keyof typeof GRADIENT_CLASSES;
}

export function StatCard({ label, value, sub, color = "blue" }: Props) {
  return (
    <div className={cn("bg-linear-to-br rounded-2xl px-4 py-3.5 text-white shadow-md", GRADIENT_CLASSES[color])}>
      <div className="text-[11px] font-medium opacity-80 mb-0.5">{label}</div>
      <div className="text-lg font-bold tracking-tight">{value}</div>
      {sub && <div className="text-[11px] opacity-70 mt-0.5">{sub}</div>}
    </div>
  );
}
