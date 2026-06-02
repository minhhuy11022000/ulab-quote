import type { Quote, CalcRow } from "../types";
import { fmt } from "../lib/utils";

type BulkRow = {
  label: string;
  factor: number;
  costDelta: number;
  nQ: number;
  nC: number;
  nP: number;
  nTC: number;
  nTR: number;
  nPr: number;
};

interface Props {
  bulkData: BulkRow[];
  bulkItem: number;
  setBulkItem: (i: number) => void;
  activeQuote: Quote;
  calculated: CalcRow[];
}

export function BulkAnalysis({ bulkData, bulkItem, setBulkItem, activeQuote, calculated }: Props) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Phân tích cho:</span>
        <select value={bulkItem} onChange={e => setBulkItem(+e.target.value)} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 13, outline: "none" }}>
          {activeQuote.items.map((it, i) => <option key={it.id} value={i}>{it.name || `SP ${i + 1}`}</option>)}
        </select>
        {calculated[bulkItem] && <span style={{ fontSize: 11, color: "#94a3b8" }}>Target margin {activeQuote.globalMargin}%</span>}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              {(["Kịch bản", "SL mới", "Giá vốn mới", "Giá bán ĐX", "Tổng vốn", "Doanh thu", "Lợi nhuận"] as string[]).map((h, i) => (
                <th key={i} style={{ padding: "10px 12px", textAlign: i === 0 ? "left" : "right" as const, fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bulkData.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f8fafc", background: r.factor === 1 ? "#eff6ff" : "transparent", fontWeight: r.factor === 1 ? 700 : 400 }}>
                <td style={{ padding: "10px 16px" }}>
                  <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: r.factor === 1 ? "#dbeafe" : r.factor > 1 ? "#ecfdf5" : "#fef3c7", color: r.factor === 1 ? "#2563eb" : r.factor > 1 ? "#059669" : "#d97706" }}>{r.label}</span>
                  {r.costDelta !== 0 && <span style={{ marginLeft: 8, fontSize: 10, color: "#94a3b8" }}>(vốn {r.costDelta > 0 ? "+" : ""}{(r.costDelta * 100).toFixed(0)}%)</span>}
                </td>
                <td style={{ padding: "10px", textAlign: "right" }}>{r.nQ.toLocaleString("vi-VN")}</td>
                <td style={{ padding: "10px", textAlign: "right" }}>{fmt(r.nC)}</td>
                <td style={{ padding: "10px", textAlign: "right", fontWeight: 600, color: "#2563eb" }}>{fmt(r.nP)}</td>
                <td style={{ padding: "10px", textAlign: "right", color: "#64748b" }}>{fmt(r.nTC)}</td>
                <td style={{ padding: "10px", textAlign: "right" }}>{fmt(r.nTR)}</td>
                <td style={{ padding: "10px", textAlign: "right", fontWeight: 600, color: "#059669" }}>{fmt(r.nPr)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ padding: "10px 16px", background: "#f8fafc", borderTop: "1px solid #f1f5f9", fontSize: 11, color: "#94a3b8" }}>
        <strong>Giả định:</strong> Khi tăng SL, giá vốn giảm nhờ economies of scale. Tỷ lệ là ước lượng — điều chỉnh theo báo giá thực tế từ NCC.
      </div>
    </div>
  );
}
