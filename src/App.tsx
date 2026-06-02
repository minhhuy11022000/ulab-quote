import { useState } from "react";
import { useQuotes } from "./hooks/useQuotes";
import { fmt, pct } from "./lib/utils";
import { Sidebar, SIDEBAR_PCT } from "./components/Sidebar";
import { StatCard } from "./components/StatCard";
import { OverviewView } from "./components/OverviewView";
import { PrintView } from "./components/PrintView";
import { QuoteTable } from "./components/QuoteTable";
import { BulkAnalysis } from "./components/BulkAnalysis";
import { QuoteCharts } from "./components/QuoteCharts";

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
            {/* Client name */}
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

            <QuoteCharts calculated={calculated} />

            {/* Sub-tabs */}
            <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 12, padding: 4, width: "fit-content", marginBottom: 16 }}>
              {([["quote", "Báo giá"], ["bulk", "Phân tích SL"]] as [string, string][]).map(([k, v]) => (
                <button key={k} onClick={() => setSubTab(k)} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: subTab === k ? "#fff" : "transparent", color: subTab === k ? "#3b82f6" : "#64748b", boxShadow: subTab === k ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>{v}</button>
              ))}
            </div>

            {subTab === "quote" && (
              <QuoteTable
                calculated={calculated} expandedRows={expandedRows} gm={gm}
                activeQuote={activeQuote} totals={totals} setGlobalMargin={setGlobalMargin}
                updateItem={updateItem} updateCosts={updateCosts}
                addCostLine={addCostLine} removeCostLine={removeCostLine}
                removeItem={removeItem} toggleExpand={toggleExpand} addItem={addItem}
              />
            )}

            {subTab === "bulk" && (
              <BulkAnalysis
                bulkData={bulkData} bulkItem={bulkItem} setBulkItem={setBulkItem}
                activeQuote={activeQuote} calculated={calculated}
              />
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
