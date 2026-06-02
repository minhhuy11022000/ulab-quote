import type { CSSProperties } from "react";
import type { Quote, Item, CostLine, CalcRow, Totals } from "../types";
import { fmt, pct } from "../lib/utils";
import { MARGIN_OPTIONS } from "../lib/constants";
import { CostBreakdown } from "./CostBreakdown";

const thStyle: CSSProperties = {
  textAlign: "right",
  padding: "10px 10px",
  fontSize: 10,
  fontWeight: 600,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

interface Props {
  calculated: CalcRow[];
  expandedRows: Record<number, boolean>;
  gm: number;
  activeQuote: Quote;
  totals: Totals;
  setGlobalMargin: (m: number) => void;
  updateItem: (itemId: number, field: keyof Item, val: Item[keyof Item]) => void;
  updateCosts: (itemId: number, newCosts: CostLine[]) => void;
  addCostLine: (itemId: number) => void;
  removeCostLine: (itemId: number, idx: number) => void;
  removeItem: (itemId: number) => void;
  toggleExpand: (id: number) => void;
  addItem: () => void;
}

export function QuoteTable({
  calculated, expandedRows, gm, activeQuote, totals,
  setGlobalMargin, updateItem, updateCosts, addCostLine,
  removeCostLine, removeItem, toggleExpand, addItem,
}: Props) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
        <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Target Margin (giá ĐX):</span>
        {MARGIN_OPTIONS.map(m => (
          <button key={m} onClick={() => setGlobalMargin(m)} style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: activeQuote.globalMargin === m ? "none" : "1px solid #e2e8f0", background: activeQuote.globalMargin === m ? "#3b82f6" : "#fff", color: activeQuote.globalMargin === m ? "#fff" : "#64748b", cursor: "pointer" }}>{m}%</button>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
              <th style={{ ...thStyle, textAlign: "left", width: 32, paddingLeft: 16 }}>#</th>
              <th style={{ ...thStyle, textAlign: "left", width: 36 }}></th>
              <th style={{ ...thStyle, textAlign: "left", minWidth: 140 }}>Sản phẩm</th>
              <th style={{ ...thStyle, width: 60 }}>SL</th>
              <th style={{ ...thStyle, width: 90 }}>Giá vốn</th>
              <th style={thStyle}>Tổng vốn</th>
              <th style={thStyle}>Giá ĐX ({activeQuote.globalMargin}%)</th>
              <th style={{ ...thStyle, width: 100 }}>Giá bán ✏️</th>
              <th style={thStyle}>Doanh thu</th>
              <th style={thStyle}>Lợi nhuận</th>
              <th style={{ ...thStyle, textAlign: "center", width: 65 }}>Margin</th>
              <th style={{ ...thStyle, width: 28 }}></th>
            </tr>
          </thead>
          <tbody>
            {calculated.map((row, i) => {
              const isExp = expandedRows[row.id];
              const marginOk = row.actualMargin >= gm;
              const marginLow = row.actualMargin < gm * 0.8;
              return [
                <tr key={row.id} style={{ borderBottom: isExp ? "none" : "1px solid #f8fafc" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#fafbff"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "10px 10px 10px 16px", color: "#94a3b8", fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: "10px 4px" }}>
                    <button onClick={() => toggleExpand(row.id)} style={{ width: 26, height: 26, borderRadius: 6, border: "1px solid #e2e8f0", background: isExp ? "#eff6ff" : "#fff", color: isExp ? "#3b82f6" : "#94a3b8", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{isExp ? "▼" : "▶"}</button>
                  </td>
                  <td style={{ padding: "10px 8px" }}>
                    <input value={row.name} onChange={e => updateItem(row.id, "name", e.target.value)} style={{ width: "100%", border: "none", background: "transparent", fontWeight: 600, color: "#1e293b", outline: "none", fontSize: 13 }} placeholder="Tên SP..." />
                  </td>
                  <td style={{ padding: "10px 8px" }}>
                    <input type="number" value={row.qty} onChange={e => updateItem(row.id, "qty", +e.target.value)} style={{ width: 60, textAlign: "right", border: "1px solid transparent", borderRadius: 6, padding: "4px 6px", background: "transparent", outline: "none", fontSize: 13 }}
                      onFocus={e => e.currentTarget.style.borderColor = "#93c5fd"} onBlur={e => e.currentTarget.style.borderColor = "transparent"} min="0" />
                  </td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: "#475569", fontWeight: 500 }}>{fmt(row.unitCost)}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: "#64748b" }}>{fmt(row.totalCost)}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: "#94a3b8", fontSize: 12 }}>{fmt(row.suggestedPrice)}</td>
                  <td style={{ padding: "10px 4px" }}>
                    <input type="number"
                      value={row.priceOverride !== null ? row.priceOverride : row.suggestedPrice}
                      onChange={e => { const v = +e.target.value; updateItem(row.id, "priceOverride", v === row.suggestedPrice ? null : v); }}
                      style={{ width: 95, textAlign: "right", border: `1.5px solid ${row.isOverridden ? "#f59e0b" : "#e2e8f0"}`, borderRadius: 8, padding: "5px 8px", background: row.isOverridden ? "#fffbeb" : "#fff", outline: "none", fontSize: 13, fontWeight: 700, color: row.isOverridden ? "#d97706" : "#2563eb" }}
                      onFocus={e => e.currentTarget.style.borderColor = "#3b82f6"}
                      onBlur={e => e.currentTarget.style.borderColor = row.isOverridden ? "#f59e0b" : "#e2e8f0"}
                      step="100" min="0"
                    />
                  </td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: "#334155" }}>{fmt(row.totalRev)}</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600, color: row.profit >= 0 ? "#059669" : "#ef4444" }}>{fmt(row.profit)}</td>
                  <td style={{ padding: "10px 8px", textAlign: "center" }}>
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: marginLow ? "#fef2f2" : marginOk ? "#ecfdf5" : "#fffbeb", color: marginLow ? "#dc2626" : marginOk ? "#059669" : "#d97706" }}>{pct(row.actualMargin)}</span>
                  </td>
                  <td style={{ padding: "10px 8px", textAlign: "center" }}>
                    <button onClick={() => removeItem(row.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, opacity: 0.4, lineHeight: 1 }}
                      onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}>×</button>
                  </td>
                </tr>,
                isExp && <CostBreakdown key={`cost-${row.id}`} costs={row.costs} onChange={c => updateCosts(row.id, c)} onAdd={() => addCostLine(row.id)} onRemove={idx => removeCostLine(row.id, idx)} />,
              ];
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
              <td colSpan={5} style={{ padding: "12px 16px", color: "#475569" }}>TỔNG CỘNG ({calculated.length} SP)</td>
              <td style={{ padding: "12px 8px", textAlign: "right", color: "#475569" }}>{fmt(totals.totalCost)}</td>
              <td colSpan={2}></td>
              <td style={{ padding: "12px 8px", textAlign: "right", color: "#2563eb" }}>{fmt(totals.totalRev)}</td>
              <td style={{ padding: "12px 8px", textAlign: "right", color: "#059669" }}>{fmt(totals.profit)}</td>
              <td style={{ padding: "12px 8px", textAlign: "center" }}>
                <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: "#f3e8ff", color: "#7c3aed" }}>{pct(totals.margin)}</span>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style={{ padding: "10px 16px", borderTop: "1px solid #f1f5f9" }}>
        <button onClick={addItem} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, fontWeight: 600, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", borderRadius: 8 }}
          onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"} onMouseLeave={e => e.currentTarget.style.background = "none"}>+ Thêm sản phẩm</button>
      </div>
    </div>
  );
}
