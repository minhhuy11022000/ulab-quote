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
import { DeleteToast } from "./components/DeleteToast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    pendingDelete, undoDelete, dismissDelete,
    handleExport, saveStatus, loaded,
  } = useQuotes();

  if (!loaded) return (
    <div className="flex items-center justify-center min-h-svh text-muted-foreground text-sm">
      Đang tải dữ liệu...
    </div>
  );

  if (!activeQuote) return null;

  const sideW = sidebarOpen ? `calc(${SIDEBAR_PCT} + 20px)` : "20px";

  return (
    <div className="bg-slate-50 min-h-svh font-sans">
      <Sidebar
        quotes={quotes} activeId={activeId} view={view}
        sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onSwitch={switchQuote} onAdd={addQuote} onDelete={deleteQuote}
        onDuplicate={duplicateQuote} onOverview={() => setView("overview")}
      />

      <div style={{ marginLeft: sideW, transition: "margin-left 0.25s cubic-bezier(.4,0,.2,1)" }} className="px-5 py-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 m-0">
              {view === "overview" ? "📊 Tổng quan" : activeQuote.clientName || "Báo giá"}
            </h1>
            <p className="text-xs text-muted-foreground m-0">
              {view === "overview"
                ? "So sánh tất cả khách hàng"
                : `${activeQuote.items.length} sản phẩm · Tạo: ${new Date(activeQuote.createdAt).toLocaleDateString("vi-VN")}`}
            </p>
          </div>
          {view === "detail" && (
            <div className="flex items-center gap-2">
              {saveStatus !== "idle" && (
                <span className={`text-xs font-semibold ${saveStatus === "saving" ? "text-muted-foreground" : "text-emerald-500"}`}>
                  {saveStatus === "saving" ? "Đang lưu..." : "✅ Đã lưu"}
                </span>
              )}
              <Button onClick={() => handleExport("print")} className="bg-linear-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-[0_2px_8px_rgba(16,185,129,0.3)]">
                📄 In / PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport("download")} title="Tải file HTML (mở trong browser để in ra PDF)">
                💾 Tải HTML
              </Button>
            </div>
          )}
        </div>

        {view === "overview" ? (
          <OverviewView quotes={quotes} onSwitch={switchQuote} />
        ) : (
          <>
            {/* Client name */}
            <div className="flex flex-wrap items-center gap-2.5 mb-3.5 px-3.5 py-2.5 bg-card rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-semibold">Khách hàng:</span>
              <Input
                value={activeQuote.clientName}
                onChange={e => setClientName(e.target.value)}
                className="flex-1 min-w-44 text-sm font-bold text-slate-900 border-slate-200"
                placeholder="Tên khách hàng..."
              />
            </div>

            {/* Stat cards */}
            <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
              <StatCard label="Tổng doanh thu" value={fmt(totals.totalRev)} color="blue" />
              <StatCard label="Tổng chi phí" value={fmt(totals.totalCost)} color="orange" />
              <StatCard label="Lợi nhuận gộp" value={fmt(totals.profit)} color="green" />
              <StatCard label="Biên LN trung bình" value={pct(totals.margin)} sub={`Target: ${activeQuote.globalMargin}%`} color="purple" />
            </div>

            <QuoteCharts calculated={calculated} />

            {/* Sub-tabs */}
            <Tabs value={subTab} onValueChange={setSubTab} className="mb-4">
              <TabsList>
                <TabsTrigger value="quote">Báo giá</TabsTrigger>
                <TabsTrigger value="bulk">Phân tích SL</TabsTrigger>
              </TabsList>
              <TabsContent value="quote">
                <QuoteTable
                  calculated={calculated} expandedRows={expandedRows} gm={gm}
                  activeQuote={activeQuote} totals={totals} setGlobalMargin={setGlobalMargin}
                  updateItem={updateItem} updateCosts={updateCosts}
                  addCostLine={addCostLine} removeCostLine={removeCostLine}
                  removeItem={removeItem} toggleExpand={toggleExpand} addItem={addItem}
                />
              </TabsContent>
              <TabsContent value="bulk">
                <BulkAnalysis
                  bulkData={bulkData} bulkItem={bulkItem} setBulkItem={setBulkItem}
                  activeQuote={activeQuote} calculated={calculated}
                />
              </TabsContent>
            </Tabs>

            <div className="px-4 py-2.5 bg-card rounded-xl border border-slate-100 text-[11px] text-muted-foreground">
              <span className="font-semibold text-slate-500">Công thức:</span> Giá ĐX = Giá vốn ÷ (1 − Target Margin) → Làm tròn lên 100đ · <span className="text-blue-500">Giá bán ✏️</span> = tuỳ chỉnh tay, <span className="text-amber-500">viền vàng</span> = đã override · 💾 Dữ liệu tự động lưu
            </div>
          </>
        )}
      </div>

      {showPrint && (
        <div className="fixed top-0" style={{ left: -9999 }}>
          <PrintView calculated={calculated} totals={totals} clientName={activeQuote.clientName} />
        </div>
      )}

      {pendingDelete && (
        <DeleteToast
          name={pendingDelete.quote.clientName}
          onUndo={undoDelete}
          onDismiss={dismissDelete}
        />
      )}
    </div>
  );
}
