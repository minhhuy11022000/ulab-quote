import type { CalcRow, Totals } from "../types";
import { fmt, fmtShort, pct } from "../lib/utils";
import { PRINT_AREA_ID } from "../lib/constants";

interface Props {
  calculated: CalcRow[];
  totals: Totals;
  clientName: string;
}

export function PrintView({ calculated, totals, clientName }: Props) {
  const today = new Date().toLocaleDateString("vi-VN");
  return (
    <div id={PRINT_AREA_ID} style={{ fontFamily: "'Inter',system-ui,sans-serif", padding: 40, maxWidth: 900, margin: "0 auto", color: "#1e293b" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32, borderBottom: "3px solid #3b82f6", paddingBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>U</div>
            <span style={{ fontSize: 24, fontWeight: 800 }}>ULAB</span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Merchandise & Custom Apparel</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#3b82f6" }}>BÁO GIÁ NỘI BỘ</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Khách hàng: <strong style={{ color: "#1e293b" }}>{clientName}</strong></div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Ngày: {today}</div>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 24 }}>
        <thead>
          <tr style={{ background: "#f1f5f9" }}>
            {["#", "Sản phẩm", "Chi tiết vốn", "SL", "Giá vốn", "Tổng vốn", "Margin", "Giá bán", "Doanh thu", "Lợi nhuận"].map((h, i) => (
              <th key={i} style={{ padding: "10px 8px", textAlign: i > 2 ? "right" : "left", fontWeight: 600, fontSize: 10, textTransform: "uppercase", color: "#64748b", letterSpacing: 0.5, borderBottom: "2px solid #e2e8f0" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calculated.map((row, i) => (
            <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "10px 8px", color: "#94a3b8" }}>{i + 1}</td>
              <td style={{ padding: "10px 8px", fontWeight: 600 }}>{row.name}</td>
              <td style={{ padding: "10px 8px", fontSize: 10, color: "#64748b", maxWidth: 160 }}>
                {row.costs.map((c, j) => <span key={j}>{c.label}: {fmtShort(c.value)}đ{j < row.costs.length - 1 ? " · " : ""}</span>)}
              </td>
              <td style={{ padding: "10px 8px", textAlign: "right" }}>{row.qty.toLocaleString("vi-VN")}</td>
              <td style={{ padding: "10px 8px", textAlign: "right" }}>{fmt(row.unitCost)}</td>
              <td style={{ padding: "10px 8px", textAlign: "right" }}>{fmt(row.totalCost)}</td>
              <td style={{ padding: "10px 8px", textAlign: "right" }}>{pct(row.actualMargin)}</td>
              <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700, color: "#2563eb" }}>{fmt(row.finalPrice)}</td>
              <td style={{ padding: "10px 8px", textAlign: "right" }}>{fmt(row.totalRev)}</td>
              <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600, color: "#059669" }}>{fmt(row.profit)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
            <td colSpan={5} style={{ padding: "12px 8px" }}>TỔNG CỘNG</td>
            <td style={{ padding: "12px 8px", textAlign: "right" }}>{fmt(totals.totalCost)}</td>
            <td style={{ padding: "12px 8px", textAlign: "right" }}>{pct(totals.margin)}</td>
            <td></td>
            <td style={{ padding: "12px 8px", textAlign: "right", color: "#2563eb" }}>{fmt(totals.totalRev)}</td>
            <td style={{ padding: "12px 8px", textAlign: "right", color: "#059669" }}>{fmt(totals.profit)}</td>
          </tr>
        </tfoot>
      </table>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
        {([["Tổng chi phí", fmt(totals.totalCost), "#f97316"], ["Tổng doanh thu", fmt(totals.totalRev), "#3b82f6"], ["Lợi nhuận gộp", fmt(totals.profit), "#10b981"], ["Biên LN", pct(totals.margin), "#8b5cf6"]] as [string, string, string][]).map(([l, v, c], i) => (
          <div key={i} style={{ border: `2px solid ${c}`, borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 10, color: "#94a3b8", borderTop: "1px solid #e2e8f0", paddingTop: 12, textAlign: "center" }}>
        Tài liệu nội bộ ULAB — Không chia sẻ cho khách hàng · Công thức: Giá bán = Giá vốn ÷ (1 − Margin)
      </div>
    </div>
  );
}
