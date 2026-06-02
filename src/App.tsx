import { useState, type CSSProperties } from "react";
import { useQuotes } from "./hooks/useQuotes";
import { fmt, pct } from "./lib/utils";
import { Sidebar, SIDEBAR_PCT } from "./components/Sidebar";
import { StatCard } from "./components/StatCard";
import { OverviewView } from "./components/OverviewView";
import { PrintView } from "./components/PrintView";
import { CostBreakdown } from "./components/CostBreakdown";
import { QuoteCharts } from "./components/QuoteCharts";

const thStyle: CSSProperties = {
  textAlign: "right",
  padding: "10px 10px",
  fontSize: 10,
  fontWeight: 600,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const {
    quotes, activeId, view, setView, subTab, setSubTab,
    bulkItem, setBulkItem, expandedRows, showPrint,
    activeQuote, calculated, totals, bulkData, gm,
    setClientName, setGlobalMargin,
    updateItem, updateCosts, addCostLine, removeCostLine,
    addItem, removeItem, toggleExpand,
    addQuote, deleteQuote, duplicateQuote, switchQuote,
    handleExport, saveStatus, loaded,
  } = useQuotes();

  if (!loaded) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "'Inter',system-ui,sans-serif", color: "#64748b", fontSize: 14 }}>
      Đang tải dữ liệu...
    </div>
  );

  if (!activeQuote) return null;

  const sideW = sidebarOpen ? `calc(${SIDEBAR_PCT} + 20px)` : "20px";

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <Sidebar
        quotes={quotes} activeId={activeId} view={view}
        sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onSwitch={switchQuote} onAdd={addQuote} onDelete={deleteQuote}
        onDuplicate={duplicateQuote} onOverview={() => setView("overview")}
      />

      <div style={{ marginLeft: sideW, transition: "margin-left 0.25s cubic-bezier(.4,0,.2,1)", padding: "24px 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", margin: 0 }}>
              {view === "overview" ? "📊 Tổng quan" : activeQuote.clientName || "Báo giá"}
            </h1>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
              {view === "overview" ? "So sánh tất cả khách hàng" : `${activeQuote.items.length} sản phẩm · Tạo: ${new Date(activeQuote.createdAt).toLocaleDateString("vi-VN")}`}
            </p>
          </div>
          {view === "detail" && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {saveStatus !== "idle" && (
                <span style={{ fontSize: 12, fontWeight: 600, color: saveStatus === "saving" ? "#94a3b8" : "#10b981" }}>
                  {saveStatus === "saving" ? "Đang lưu..." : "✅ Đã lưu"}
                </span>
              )}
              <button onClick={() => handleExport("print")} style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(16,185,129,0.3)" }}>
                📄 In / PDF
              </button>
              <button onClick={() => handleExport("download")} title="Tải file HTML (mở trong browser để in ra PDF)" style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                💾 Tải HTML
              </button>
            </div>
          )}
        </div>

        {view === "overview" ? (
          <OverviewView quotes={quotes} onSwitch={switchQuote} />
        ) : (
          <>
            {/* Client name bar */}
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 14, padding: "10px 14px", background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Khách hàng:</span>
              <input
                value={activeQuote.clientName}
                onChange={e => setClientName(e.target.value)}
                style={{ flex: 1, minWidth: 180, border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#1e293b", outline: "none" }}
                placeholder="Tên khách hàng..."
              />
            </div>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
              <StatCard label="Tổng doanh thu" value={fmt(totals.totalRev)} color="blue" />
              <StatCard label="Tổng chi phí" value={fmt(totals.totalCost)} color="orange" />
              <StatCard label="Lợi nhuận gộp" value={fmt(totals.profit)} color="green" />
              <StatCard label="Biên LN trung bình" value={pct(totals.margin)} sub={`Target: ${activeQuote.globalMargin}%`} color="purple" />
            </div>

            {/* Charts */}
            <QuoteCharts calculated={calculated} />

            {/* Sub-tab switcher */}
            <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 12, padding: 4, width: "fit-content", marginBottom: 16 }}>
              {([["quote", "Báo giá"], ["bulk", "Phân tích SL"]] as [string, string][]).map(([k, v]) => (
                <button key={k} onClick={() => setSubTab(k)} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: subTab === k ? "#fff" : "transparent", color: subTab === k ? "#3b82f6" : "#64748b", boxShadow: subTab === k ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>{v}</button>
              ))}
            </div>

            {/* Quote table */}
            {subTab === "quote" && (
              <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Target Margin (giá ĐX):</span>
                  {[25, 30, 35, 40, 45, 50].map(m => (
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
            )}

            {/* Bulk analysis */}
            {subTab === "bulk" && (
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
                          <th key={i} style={{ ...thStyle, textAlign: i === 0 ? "left" : "right", paddingLeft: i === 0 ? 16 : 10 }}>{h}</th>
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
            )}

            <div style={{ marginTop: 14, padding: "10px 16px", background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 11, color: "#94a3b8" }}>
              <span style={{ fontWeight: 600, color: "#64748b" }}>Công thức:</span> Giá ĐX = Giá vốn ÷ (1 − Target Margin) → Làm tròn lên 100đ · <span style={{ color: "#3b82f6" }}>Giá bán ✏️</span> = tuỳ chỉnh tay, <span style={{ color: "#f59e0b" }}>viền vàng</span> = đã override · 💾 Dữ liệu tự động lưu
            </div>
          </>
        )}
      </div>

      {showPrint && (
        <div style={{ position: "fixed", left: -9999, top: 0 }}>
          <PrintView calculated={calculated} totals={totals} clientName={activeQuote.clientName} />
        </div>
      )}
    </div>
  );
}
