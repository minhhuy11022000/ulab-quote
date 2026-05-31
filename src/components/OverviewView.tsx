import { useMemo } from "react";
import type { Quote } from "../types";
import { fmt, pct } from "../lib/utils";
import { calcQuoteTotals } from "../lib/calc";
import { StatCard } from "./StatCard";

interface Props {
  quotes: Quote[];
  onSwitch: (id: string) => void;
}

export function OverviewView({ quotes, onSwitch }: Props) {
  const data = useMemo(() => quotes.map(q => ({ ...q, totals: calcQuoteTotals(q) })), [quotes]);

  const grand = useMemo(() => {
    const t = data.reduce(
      (a, q) => ({ totalCost: a.totalCost + q.totals.totalCost, totalRev: a.totalRev + q.totals.totalRev, profit: a.profit + q.totals.profit, items: a.items + q.items.length }),
      { totalCost: 0, totalRev: 0, profit: 0, items: 0 }
    );
    return { ...t, margin: t.totalRev > 0 ? t.profit / t.totalRev : 0 };
  }, [data]);

  const sorted = [...data].sort((a, b) => b.totals.totalRev - a.totals.totalRev);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        <StatCard label="Tổng chi phí" value={fmt(grand.totalCost)} sub={`${quotes.length} khách hàng`} color="orange" />
        <StatCard label="Tổng doanh thu" value={fmt(grand.totalRev)} color="blue" />
        <StatCard label="Tổng lợi nhuận" value={fmt(grand.profit)} color="green" />
        <StatCard label="Biên LN trung bình" value={pct(grand.margin)} sub={`${grand.items} sản phẩm`} color="purple" />
      </div>

      <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", fontSize: 13, fontWeight: 700, color: "#1e293b" }}>
          So sánh các khách hàng <span style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", marginLeft: 6 }}>(sắp xếp theo doanh thu)</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                {["#", "Khách hàng", "Số SP", "Tổng vốn", "Doanh thu", "Lợi nhuận", "Biên LN", ""].map((h, i) => (
                  <th key={i} style={{ padding: "10px 12px", textAlign: i > 1 ? "right" : "left" as const, fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((q, i) => (
                <tr key={q.id} onClick={() => onSwitch(q.id)} style={{ cursor: "pointer", borderBottom: "1px solid #f8fafc", transition: "background .15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafbff"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px", color: "#94a3b8", fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: "12px", fontWeight: 600, color: "#1e293b" }}>{q.clientName || "Không tên"}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#64748b" }}>{q.items.length}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#64748b" }}>{fmt(q.totals.totalCost)}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#2563eb", fontWeight: 600 }}>{fmt(q.totals.totalRev)}</td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#059669", fontWeight: 600 }}>{fmt(q.totals.profit)}</td>
                  <td style={{ padding: "12px", textAlign: "right" }}>
                    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: q.totals.margin >= q.globalMargin / 100 ? "#ecfdf5" : "#fffbeb", color: q.totals.margin >= q.globalMargin / 100 ? "#059669" : "#d97706" }}>{pct(q.totals.margin)}</span>
                  </td>
                  <td style={{ padding: "12px", textAlign: "right", color: "#94a3b8", fontSize: 16 }}>›</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                <td colSpan={2} style={{ padding: "14px 12px", color: "#1e293b" }}>TỔNG ({quotes.length} khách hàng)</td>
                <td style={{ padding: "14px 12px", textAlign: "right", color: "#475569" }}>{grand.items}</td>
                <td style={{ padding: "14px 12px", textAlign: "right", color: "#475569" }}>{fmt(grand.totalCost)}</td>
                <td style={{ padding: "14px 12px", textAlign: "right", color: "#2563eb" }}>{fmt(grand.totalRev)}</td>
                <td style={{ padding: "14px 12px", textAlign: "right", color: "#059669" }}>{fmt(grand.profit)}</td>
                <td style={{ padding: "14px 12px", textAlign: "right" }}>
                  <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "#f3e8ff", color: "#7c3aed" }}>{pct(grand.margin)}</span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div style={{ marginTop: 14, padding: "12px 16px", background: "#eff6ff", borderRadius: 12, border: "1px solid #dbeafe", fontSize: 12, color: "#1e40af" }}>
        💡 Click vào dòng bất kỳ để mở chi tiết báo giá của khách hàng đó
      </div>
    </div>
  );
}
