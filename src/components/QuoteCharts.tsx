import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie } from "recharts";
import type { CalcRow } from "../types";
import { fmtM } from "../lib/utils";

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#f97316", "#10b981", "#ef4444", "#06b6d4", "#f59e0b"];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#1e293b" }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
          <span style={{ color: "#64748b" }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: "#1e293b" }}>{fmtM(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

function PieLegend({ data }: { data: { name: string; value: number }[] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "2px 6px" }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#64748b" }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length] }} />
          {d.name}
        </div>
      ))}
    </div>
  );
}

export function QuoteCharts({ calculated }: { calculated: CalcRow[] }) {
  const barData = calculated.map(r => ({
    name: r.name.length > 12 ? r.name.slice(0, 12) + "…" : r.name,
    "Doanh thu": r.totalRev,
    "Chi phí": r.totalCost,
    "Lợi nhuận": r.profit,
  }));

  const revPieData = calculated.map((r, i) => ({
    name: r.name.length > 14 ? r.name.slice(0, 14) + "…" : r.name,
    value: r.totalRev,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const profitPieData = calculated.filter(r => r.profit > 0).map((r, i) => ({
    name: r.name.length > 14 ? r.name.slice(0, 14) + "…" : r.name,
    value: r.profit,
    fill: PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr 1fr", gap: 14, marginBottom: 16, minWidth: 0 }}>
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", padding: "14px 10px 6px", overflow: "hidden", minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, paddingLeft: 8, marginBottom: 8 }}>Doanh thu · Chi phí · Lợi nhuận</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={barData} barCategoryGap="20%">
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={fmtM} width={52} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Doanh thu" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Chi phí" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Lợi nhuận" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", padding: "14px 10px 6px", overflow: "hidden" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, paddingLeft: 8, marginBottom: 4 }}>Tỷ trọng doanh thu</div>
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie data={revPieData} dataKey="value" cx="50%" cy="50%" outerRadius={50} innerRadius={26} paddingAngle={3} strokeWidth={0} />
            <Tooltip formatter={(v) => fmtM(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
        <PieLegend data={revPieData} />
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #f1f5f9", padding: "14px 10px 6px", overflow: "hidden" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, paddingLeft: 8, marginBottom: 4 }}>Tỷ trọng lợi nhuận</div>
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie data={profitPieData} dataKey="value" cx="50%" cy="50%" outerRadius={50} innerRadius={26} paddingAngle={3} strokeWidth={0} />
            <Tooltip formatter={(v) => fmtM(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
        <PieLegend data={profitPieData} />
      </div>
    </div>
  );
}
