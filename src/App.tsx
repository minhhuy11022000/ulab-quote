import { useState, useCallback, useMemo, useEffect, type CSSProperties } from "react";

type CostLine = { label: string; value: number };
type Item = {
  id: number;
  name: string;
  qty: number;
  costs: CostLine[];
  margin: number;
  priceOverride: number | null;
};
type Quote = {
  id: string;
  clientName: string;
  items: Item[];
  globalMargin: number;
  nextId: number;
  createdAt: string;
};
type CalcRow = Item & {
  unitCost: number;
  totalCost: number;
  suggestedPrice: number;
  finalPrice: number;
  totalRev: number;
  profit: number;
  actualMargin: number;
  isOverridden: boolean;
};
type Totals = { totalCost: number; totalRev: number; profit: number; margin: number };

const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN") + " đ";
const fmtShort = (n: number) => Math.round(n).toLocaleString("vi-VN");
const pct = (n: number) => (n * 100).toFixed(1) + "%";
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const BULK_TIERS = [
  { label: "-50%", factor: 0.5, costDelta: 0.10 },
  { label: "-25%", factor: 0.75, costDelta: 0.05 },
  { label: "Gốc", factor: 1, costDelta: 0 },
  { label: "+25%", factor: 1.25, costDelta: -0.03 },
  { label: "+50%", factor: 1.5, costDelta: -0.05 },
  { label: "+100%", factor: 2, costDelta: -0.08 },
];

const SAMPLE_ITEMS: Item[] = [
  { id: 1, name: "Áo Khoác Team Flash", qty: 400, costs: [{ label: "Phôi", value: 42660 }, { label: "In ấn", value: 20000 }, { label: "Đóng gói", value: 10000 }], margin: 0.35, priceOverride: null },
  { id: 2, name: "Áo thun", qty: 180, costs: [{ label: "Phôi", value: 80000 }, { label: "In ấn", value: 10000 }, { label: "Đóng gói", value: 5000 }], margin: 0.35, priceOverride: null },
  { id: 3, name: "Nón", qty: 300, costs: [{ label: "Phôi", value: 25000 }, { label: "In ấn", value: 10000 }, { label: "Đóng gói", value: 5000 }], margin: 0.35, priceOverride: null },
  { id: 4, name: "Quạt", qty: 300, costs: [{ label: "Phôi", value: 25000 }, { label: "Đóng gói", value: 10000 }], margin: 0.35, priceOverride: null },
  { id: 5, name: "Pin sạc dự phòng", qty: 300, costs: [{ label: "Phôi", value: 35000 }, { label: "Đóng gói", value: 10000 }], margin: 0.35, priceOverride: null },
];

const createQuote = (clientName: string, items: Item[] | null = null): Quote => ({
  id: genId(),
  clientName,
  items: items || [{ id: 1, name: "", qty: 100, costs: [{ label: "Phôi", value: 0 }], margin: 0.35, priceOverride: null }],
  globalMargin: 35,
  nextId: items ? Math.max(...items.map(i => i.id)) + 1 : 2,
  createdAt: new Date().toISOString(),
});

const NTPMM_SUMMER_QUOTE: Quote = {
  id: "ntpmm-summer",
  clientName: "Những Thành Phố Mơ Màng Summer",
  items: [
    { id: 1, name: "Vòng tay khán giả", qty: 17000, costs: [{ label: "Phôi (0.4¥ × 3950)", value: 1580 }, { label: "Ship VN (2tr/17k)", value: 118 }], margin: 0.35, priceOverride: null },
    { id: 2, name: "Gift Pack Regular", qty: 13500, costs: [{ label: "Phong bì", value: 1500 }, { label: "Vé giấy", value: 700 }, { label: "Sticker", value: 1200 }], margin: 0.35, priceOverride: null },
    { id: 3, name: "Gift Pack VIP Combo", qty: 3000, costs: [
      { label: "Phong bì VIP", value: 2500 },
      { label: "Vé VIP", value: 1100 },
      { label: "Sticker VIP", value: 2500 },
      { label: "Mũ Bucket", value: 35000 },
      { label: "Khăn Bandana", value: 31500 },
      { label: "Thẻ cứng (0.9¥)", value: 3555 },
      { label: "Dây đeo thẻ (1.2¥)", value: 4740 },
    ], margin: 0.35, priceOverride: null },
    { id: 4, name: "Gậy cổ vũ (Lightstick)", qty: 13500, costs: [{ label: "Phôi (1.6¥ × 3950)", value: 6320 }, { label: "Ship TQ (40¥/500c)", value: 316 }, { label: "Ship VN (13.5tr/lô)", value: 1000 }], margin: 0.35, priceOverride: null },
  ],
  globalMargin: 35,
  nextId: 5,
  createdAt: new Date().toISOString(),
};

const INITIAL_QUOTES: Quote[] = [{ ...createQuote("Team Flash 2026", SAMPLE_ITEMS), id: "demo-flash" }, NTPMM_SUMMER_QUOTE];

function calcRow(item: Item): Omit<CalcRow, keyof Item> {
  const unitCost = item.costs.reduce((s, c) => s + (c.value || 0), 0);
  const totalCost = item.qty * unitCost;
  const suggestedPrice = unitCost > 0 ? Math.ceil(unitCost / (1 - item.margin) / 100) * 100 : 0;
  const finalPrice = item.priceOverride !== null ? item.priceOverride : suggestedPrice;
  const totalRev = item.qty * finalPrice;
  const profit = totalRev - totalCost;
  const actualMargin = totalRev > 0 ? profit / totalRev : 0;
  const isOverridden = item.priceOverride !== null && item.priceOverride !== suggestedPrice;
  return { unitCost, totalCost, suggestedPrice, finalPrice, totalRev, profit, actualMargin, isOverridden };
}

function calcQuoteTotals(quote: Quote): Totals {
  const t = { totalCost: 0, totalRev: 0, profit: 0, margin: 0 };
  quote.items.forEach(it => { const r = calcRow(it); t.totalCost += r.totalCost; t.totalRev += r.totalRev; t.profit += r.profit; });
  t.margin = t.totalRev > 0 ? t.profit / t.totalRev : 0;
  return t;
}

function CostBreakdown({ costs, onChange, onAdd, onRemove }: {
  costs: CostLine[];
  onChange: (costs: CostLine[]) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <tr>
      <td colSpan={12} style={{ padding: 0 }}>
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 16px", margin: "0 0 8px 0", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Chi tiết giá vốn</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {costs.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", borderRadius: 8, padding: "4px 8px", border: "1px solid #e2e8f0" }}>
                <input value={c.label} onChange={e => { const n = [...costs]; n[i] = { ...n[i], label: e.target.value }; onChange(n); }}
                  style={{ width: 130, border: "none", fontSize: 12, color: "#475569", background: "transparent", outline: "none" }} placeholder="Tên..." />
                <input type="number" value={c.value || ""} onChange={e => { const n = [...costs]; n[i] = { ...n[i], value: +e.target.value }; onChange(n); }}
                  style={{ width: 80, border: "none", fontSize: 12, fontWeight: 600, color: "#1e293b", background: "transparent", outline: "none", textAlign: "right" }} placeholder="0" step="100" />
                <span style={{ fontSize: 10, color: "#94a3b8" }}>đ</span>
                {costs.length > 1 && <button onClick={() => onRemove(i)} style={{ color: "#ef4444", fontSize: 14, lineHeight: 1, background: "none", border: "none", cursor: "pointer", padding: "0 2px", opacity: 0.5 }}>×</button>}
              </div>
            ))}
            <button onClick={onAdd} style={{ background: "#fff", borderRadius: 8, padding: "4px 10px", border: "1px dashed #cbd5e1", fontSize: 12, color: "#3b82f6", cursor: "pointer", fontWeight: 500 }}>+ Thêm</button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "#1e293b" }}>Tổng: {fmt(costs.reduce((s, c) => s + (c.value || 0), 0))}</div>
        </div>
      </td>
    </tr>
  );
}

function StatCard({ label, value, sub, color = "blue" }: {
  label: string;
  value: string;
  sub?: string;
  color?: "blue" | "green" | "purple" | "orange";
}) {
  const colors = { blue: "linear-gradient(135deg,#3b82f6,#2563eb)", green: "linear-gradient(135deg,#10b981,#059669)", purple: "linear-gradient(135deg,#8b5cf6,#7c3aed)", orange: "linear-gradient(135deg,#f97316,#ea580c)" };
  return (
    <div style={{ background: colors[color], borderRadius: 16, padding: "14px 16px", color: "#fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <div style={{ fontSize: 11, fontWeight: 500, opacity: 0.8, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function TabBar({ quotes, activeId, view, onSwitch, onAdd, onDelete, onDuplicate, onOverview }: {
  quotes: Quote[];
  activeId: string;
  view: string;
  onSwitch: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onOverview: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16, overflowX: "auto", padding: "2px 0" }}>
      <button onClick={onOverview} style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 10, border: view === "overview" ? "none" : "1px solid #e2e8f0", background: view === "overview" ? "linear-gradient(135deg,#1e293b,#334155)" : "#fff", color: view === "overview" ? "#fff" : "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
        <span>📊</span> Tổng quan
      </button>
      <div style={{ width: 1, height: 24, background: "#e2e8f0", margin: "0 6px", flexShrink: 0 }} />
      {quotes.map(q => {
        const active = q.id === activeId && view === "detail";
        return (
          <div key={q.id} style={{ display: "flex", alignItems: "center", background: active ? "linear-gradient(135deg,#3b82f6,#2563eb)" : "#fff", borderRadius: 10, border: active ? "none" : "1px solid #e2e8f0", overflow: "hidden", flexShrink: 0, boxShadow: active ? "0 2px 8px rgba(59,130,246,0.3)" : "none" }}>
            <button onClick={() => onSwitch(q.id)} style={{ padding: "7px 6px 7px 12px", background: "transparent", border: "none", color: active ? "#fff" : "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={q.clientName}>
              {q.clientName || "Không tên"}
            </button>
            <button onClick={() => onDuplicate(q.id)} title="Nhân bản" style={{ padding: "4px 4px", background: "transparent", border: "none", color: active ? "rgba(255,255,255,0.7)" : "#94a3b8", cursor: "pointer", fontSize: 12, opacity: 0.7 }}>⎘</button>
            {quotes.length > 1 && <button onClick={() => onDelete(q.id)} title="Xoá" style={{ padding: "4px 8px 4px 2px", background: "transparent", border: "none", color: active ? "rgba(255,255,255,0.8)" : "#94a3b8", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>}
          </div>
        );
      })}
      <button onClick={onAdd} style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 10, border: "1px dashed #cbd5e1", background: "transparent", color: "#3b82f6", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>+ Khách hàng mới</button>
    </div>
  );
}

function OverviewView({ quotes, onSwitch }: { quotes: Quote[]; onSwitch: (id: string) => void }) {
  const data = useMemo(() => quotes.map(q => ({ ...q, totals: calcQuoteTotals(q) })), [quotes]);
  const grand = useMemo(() => {
    const t = data.reduce((a, q) => ({ totalCost: a.totalCost + q.totals.totalCost, totalRev: a.totalRev + q.totals.totalRev, profit: a.profit + q.totals.profit, items: a.items + q.items.length }), { totalCost: 0, totalRev: 0, profit: 0, items: 0 });
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
                  onMouseEnter={e => e.currentTarget.style.background = "#fafbff"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
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

function PrintView({ calculated, totals, clientName }: {
  calculated: CalcRow[];
  totals: Totals;
  clientName: string;
}) {
  const today = new Date().toLocaleDateString("vi-VN");
  return (
    <div id="print-area" style={{ fontFamily: "'Inter',system-ui,sans-serif", padding: 40, maxWidth: 900, margin: "0 auto", color: "#1e293b" }}>
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

export default function App() {
  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [activeId, setActiveId] = useState(INITIAL_QUOTES[0].id);
  const [view, setView] = useState("detail");
  const [loaded, setLoaded] = useState(false);
  const [subTab, setSubTab] = useState("quote");
  const [bulkItem, setBulkItem] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ulab:quotes");
      if (raw) {
        const parsed: Quote[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          setQuotes(parsed);
          const a = localStorage.getItem("ulab:active");
          if (a && parsed.find(q => q.id === a)) setActiveId(a);
          else setActiveId(parsed[0].id);
        }
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (localStorage.getItem("ulab:ntpmm-added-v2")) return;
    setQuotes(prev => {
      const idx = prev.findIndex(q => q.id === "ntpmm-summer");
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = NTPMM_SUMMER_QUOTE;
        return next;
      }
      return [...prev, NTPMM_SUMMER_QUOTE];
    });
    setActiveId("ntpmm-summer");
    setView("detail");
    localStorage.setItem("ulab:ntpmm-added-v2", "1");
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem("ulab:quotes", JSON.stringify(quotes));
        localStorage.setItem("ulab:active", activeId || "");
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [quotes, activeId, loaded]);

  useEffect(() => { setBulkItem(0); setExpandedRows({}); }, [activeId]);

  const activeQuote = useMemo(() => quotes.find(q => q.id === activeId) || quotes[0], [quotes, activeId]);

  const updateActiveQuote = useCallback((updater: (q: Quote) => Quote) => {
    setQuotes(prev => prev.map(q => q.id === activeId ? updater(q) : q));
  }, [activeId]);

  const setClientName = (name: string) => updateActiveQuote(q => ({ ...q, clientName: name }));
  const setGlobalMargin = (m: number) => updateActiveQuote(q => ({ ...q, globalMargin: m }));

  const updateItem = useCallback((itemId: number, field: keyof Item, val: Item[keyof Item]) => {
    updateActiveQuote(q => ({ ...q, items: q.items.map(it => it.id === itemId ? { ...it, [field]: val } : it) }));
  }, [updateActiveQuote]);

  const updateCosts = useCallback((itemId: number, newCosts: CostLine[]) => {
    updateActiveQuote(q => ({ ...q, items: q.items.map(it => it.id === itemId ? { ...it, costs: newCosts } : it) }));
  }, [updateActiveQuote]);

  const addCostLine = useCallback((itemId: number) => {
    updateActiveQuote(q => ({ ...q, items: q.items.map(it => it.id === itemId ? { ...it, costs: [...it.costs, { label: "", value: 0 }] } : it) }));
  }, [updateActiveQuote]);

  const removeCostLine = useCallback((itemId: number, idx: number) => {
    updateActiveQuote(q => ({ ...q, items: q.items.map(it => it.id === itemId ? { ...it, costs: it.costs.filter((_, i) => i !== idx) } : it) }));
  }, [updateActiveQuote]);

  const addItem = () => {
    updateActiveQuote(q => ({ ...q, items: [...q.items, { id: q.nextId, name: "", qty: 100, costs: [{ label: "Phôi", value: 0 }], margin: q.globalMargin / 100, priceOverride: null }], nextId: q.nextId + 1 }));
  };

  const removeItem = (itemId: number) => updateActiveQuote(q => ({ ...q, items: q.items.filter(it => it.id !== itemId) }));

  const applyGlobalMargin = () => updateActiveQuote(q => ({ ...q, items: q.items.map(it => ({ ...it, margin: q.globalMargin / 100, priceOverride: null })) }));

  const toggleExpand = (id: number) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  const addQuote = () => {
    const newQ = createQuote(`Khách hàng ${quotes.length + 1}`);
    setQuotes(prev => [...prev, newQ]);
    setActiveId(newQ.id);
    setView("detail");
  };

  const deleteQuote = (id: string) => {
    const q = quotes.find(x => x.id === id);
    if (!q) return;
    if (!confirm(`Xoá khách hàng "${q.clientName}"? Hành động này không thể hoàn tác.`)) return;
    setQuotes(prev => {
      const next = prev.filter(x => x.id !== id);
      if (id === activeId && next.length) setActiveId(next[0].id);
      return next;
    });
  };

  const duplicateQuote = (id: string) => {
    const q = quotes.find(x => x.id === id);
    if (!q) return;
    const copy: Quote = { ...q, id: genId(), clientName: q.clientName + " (copy)", createdAt: new Date().toISOString() };
    setQuotes(prev => {
      const idx = prev.findIndex(x => x.id === id);
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
    setActiveId(copy.id);
    setView("detail");
  };

  const switchQuote = (id: string) => { setActiveId(id); setView("detail"); };

  const calculated = useMemo<CalcRow[]>(() => activeQuote ? activeQuote.items.map(it => ({ ...it, ...calcRow(it) })) : [], [activeQuote]);
  const totals = useMemo<Totals>(() => activeQuote ? calcQuoteTotals(activeQuote) : { totalCost: 0, totalRev: 0, profit: 0, margin: 0 }, [activeQuote]);

  const bulkData = useMemo(() => {
    if (!calculated[bulkItem]) return [];
    const base = calculated[bulkItem];
    return BULK_TIERS.map(tier => {
      const nQ = Math.round(base.qty * tier.factor);
      const nC = Math.round(base.unitCost * (1 - tier.costDelta));
      const nP = Math.ceil(nC / (1 - base.margin) / 100) * 100;
      return { ...tier, nQ, nC, nP, nTC: nQ * nC, nTR: nQ * nP, nPr: nQ * nP - nQ * nC };
    });
  }, [calculated, bulkItem]);

  const handleExport = (mode = "print") => {
    setShowPrint(true);
    setTimeout(() => {
      const el = document.getElementById("print-area");
      if (!el) { setShowPrint(false); return; }
      const safeName = (activeQuote.clientName || "BaoGia").replace(/[^\wÀ-ỹ\s-]/g, "").trim();
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ULAB Báo Giá - ${safeName}</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');body{margin:0;font-family:'Inter',system-ui,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}@media print{@page{margin:10mm}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${el.innerHTML}</body></html>`;

      if (mode === "download") {
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ULAB-BaoGia-${safeName}-${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowPrint(false);
        return;
      }

      const existing = document.getElementById("ulab-print-iframe");
      if (existing) existing.remove();
      const iframe = document.createElement("iframe") as HTMLIFrameElement;
      iframe.id = "ulab-print-iframe";
      iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (err) {
            console.error("Print failed, falling back to download:", err);
            handleExport("download");
          }
          setShowPrint(false);
        }, 500);
      };
      document.body.appendChild(iframe);
      iframe.srcdoc = html;
    }, 100);
  };

  const thStyle: CSSProperties = { textAlign: "right", padding: "10px 10px", fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 };

  if (!activeQuote) return null;

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 14 }}>U</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>ULAB Báo Giá</h1>
              <span style={{ fontSize: 11, color: "#94a3b8", background: "#f1f5f9", padding: "2px 8px", borderRadius: 6, fontWeight: 600 }}>Multi-client</span>
            </div>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>Quản lý báo giá merchandise cho nhiều khách hàng</p>
          </div>
          {view === "detail" && (
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => handleExport("print")} style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(16,185,129,0.3)" }}>
                📄 In / PDF
              </button>
              <button onClick={() => handleExport("download")} title="Tải file HTML (mở trong browser để in ra PDF)" style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                💾 Tải HTML
              </button>
            </div>
          )}
        </div>

        <TabBar quotes={quotes} activeId={activeId} view={view} onSwitch={switchQuote} onAdd={addQuote} onDelete={deleteQuote} onDuplicate={duplicateQuote} onOverview={() => setView("overview")} />

        {view === "overview" ? (
          <OverviewView quotes={quotes} onSwitch={switchQuote} />
        ) : (
          <>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 14, padding: "10px 14px", background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Khách hàng:</span>
              <input value={activeQuote.clientName} onChange={e => setClientName(e.target.value)}
                style={{ flex: 1, minWidth: 200, border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 14, fontWeight: 700, color: "#1e293b", outline: "none" }} placeholder="Tên khách hàng..." />
              <span style={{ fontSize: 11, color: "#94a3b8" }}>Tạo: {new Date(activeQuote.createdAt).toLocaleDateString("vi-VN")}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 16 }}>
              <StatCard label="Tổng chi phí" value={fmt(totals.totalCost)} color="orange" />
              <StatCard label="Tổng doanh thu" value={fmt(totals.totalRev)} color="blue" />
              <StatCard label="Lợi nhuận gộp" value={fmt(totals.profit)} color="green" />
              <StatCard label="Biên LN trung bình" value={pct(totals.margin)} sub={`Mục tiêu: ${activeQuote.globalMargin}%`} color="purple" />
            </div>

            <div style={{ display: "flex", gap: 4, background: "#f1f5f9", borderRadius: 12, padding: 4, width: "fit-content", marginBottom: 16 }}>
              {([["quote", "Báo giá"], ["bulk", "Phân tích SL"]] as [string, string][]).map(([k, v]) => (
                <button key={k} onClick={() => setSubTab(k)} style={{ padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: subTab === k ? "#fff" : "transparent", color: subTab === k ? "#3b82f6" : "#64748b", boxShadow: subTab === k ? "0 1px 4px rgba(0,0,0,0.08)" : "none" }}>{v}</button>
              ))}
            </div>

            {subTab === "quote" && (
              <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Target Margin:</span>
                  {[25, 30, 35, 40, 45, 50].map(m => (
                    <button key={m} onClick={() => setGlobalMargin(m)} style={{ padding: "4px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: activeQuote.globalMargin === m ? "none" : "1px solid #e2e8f0", background: activeQuote.globalMargin === m ? "#3b82f6" : "#fff", color: activeQuote.globalMargin === m ? "#fff" : "#64748b", cursor: "pointer" }}>{m}%</button>
                  ))}
                  <button onClick={applyGlobalMargin} style={{ marginLeft: 4, padding: "4px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, border: "none", background: "#eff6ff", color: "#3b82f6", cursor: "pointer" }}>Áp dụng tất cả</button>
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
                        <th style={thStyle}>Giá ĐX</th>
                        <th style={{ ...thStyle, width: 100 }}>Giá bán ✏️</th>
                        <th style={thStyle}>Doanh thu</th>
                        <th style={thStyle}>Lợi nhuận</th>
                        <th style={{ ...thStyle, textAlign: "center", width: 65 }}>Margin TT</th>
                        <th style={{ ...thStyle, width: 28 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculated.map((row, i) => {
                        const isExp = expandedRows[row.id];
                        const marginWarning = row.actualMargin < row.margin * 0.9;
                        const marginGood = row.actualMargin >= row.margin;
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
                              <input type="number" value={row.priceOverride !== null ? row.priceOverride : row.suggestedPrice}
                                onChange={e => { const v = +e.target.value; updateItem(row.id, "priceOverride", v === row.suggestedPrice ? null : v); }}
                                style={{ width: 95, textAlign: "right", border: `1.5px solid ${row.isOverridden ? "#f59e0b" : "#e2e8f0"}`, borderRadius: 8, padding: "5px 8px", background: row.isOverridden ? "#fffbeb" : "#fff", outline: "none", fontSize: 13, fontWeight: 700, color: row.isOverridden ? "#d97706" : "#2563eb" }}
                                onFocus={e => e.currentTarget.style.borderColor = "#3b82f6"} onBlur={e => e.currentTarget.style.borderColor = row.isOverridden ? "#f59e0b" : "#e2e8f0"}
                                step="100" min="0" />
                            </td>
                            <td style={{ padding: "10px 8px", textAlign: "right", color: "#334155" }}>{fmt(row.totalRev)}</td>
                            <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 600, color: row.profit >= 0 ? "#059669" : "#ef4444" }}>{fmt(row.profit)}</td>
                            <td style={{ padding: "10px 8px", textAlign: "center" }}>
                              <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: marginWarning ? "#fef2f2" : marginGood ? "#ecfdf5" : "#fffbeb", color: marginWarning ? "#dc2626" : marginGood ? "#059669" : "#d97706" }}>{pct(row.actualMargin)}</span>
                            </td>
                            <td style={{ padding: "10px 8px", textAlign: "center" }}>
                              <button onClick={() => removeItem(row.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16, opacity: 0.4, lineHeight: 1 }}
                                onMouseEnter={e => e.currentTarget.style.opacity = "1"} onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}>×</button>
                            </td>
                          </tr>,
                          isExp && <CostBreakdown key={`cost-${row.id}`} costs={row.costs} onChange={c => updateCosts(row.id, c)} onAdd={() => addCostLine(row.id)} onRemove={idx => removeCostLine(row.id, idx)} />
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

            {subTab === "bulk" && (
              <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.04)", border: "1px solid #f1f5f9", overflow: "hidden" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Phân tích cho:</span>
                  <select value={bulkItem} onChange={e => setBulkItem(+e.target.value)} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", fontSize: 13, outline: "none" }}>
                    {activeQuote.items.map((it, i) => <option key={it.id} value={i}>{it.name || `SP ${i + 1}`}</option>)}
                  </select>
                  {calculated[bulkItem] && <span style={{ fontSize: 11, color: "#94a3b8" }}>Giữ nguyên margin {pct(calculated[bulkItem].margin)}</span>}
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
              <span style={{ fontWeight: 600, color: "#64748b" }}>Công thức:</span> Giá ĐX = Giá vốn ÷ (1 − Margin) → Làm tròn lên 100đ · <span style={{ color: "#3b82f6" }}>Giá bán ✏️</span> = tuỳ chỉnh tay, <span style={{ color: "#f59e0b" }}>viền vàng</span> = đã override · 💾 Dữ liệu tự động lưu
            </div>
          </>
        )}
      </div>

      {showPrint && <div style={{ position: "fixed", left: -9999, top: 0 }}><PrintView calculated={calculated} totals={totals} clientName={activeQuote.clientName} /></div>}
    </div>
  );
}
