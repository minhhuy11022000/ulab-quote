const GRADIENTS = {
  blue: "linear-gradient(135deg,#3b82f6,#2563eb)",
  green: "linear-gradient(135deg,#10b981,#059669)",
  purple: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  orange: "linear-gradient(135deg,#f97316,#ea580c)",
} as const;

interface Props {
  label: string;
  value: string;
  sub?: string;
  color?: keyof typeof GRADIENTS;
}

export function StatCard({ label, value, sub, color = "blue" }: Props) {
  return (
    <div style={{ background: GRADIENTS[color], borderRadius: 16, padding: "14px 16px", color: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.8, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
