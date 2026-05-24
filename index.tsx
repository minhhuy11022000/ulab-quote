import { useState, useCallback, useMemo, useRef } from 'react';

const fmt = (n) => Math.round(n).toLocaleString('vi-VN') + ' đ';
const fmtShort = (n) => Math.round(n).toLocaleString('vi-VN');
const pct = (n) => (n * 100).toFixed(1) + '%';

const COST_LABELS = [
  'Phôi / Nguyên liệu',
  'In ấn / Thêu',
  'Đóng gói',
  'Phụ kiện',
  'Khác',
];

const makeDefaultCosts = (total) => [
  { label: COST_LABELS[0], value: total },
  { label: COST_LABELS[1], value: 0 },
  { label: COST_LABELS[2], value: 0 },
];

const DEFAULT_ITEMS = [
  {
    id: 1,
    name: 'Áo Khoác Team Flash',
    qty: 400,
    costs: [
      { label: 'Phôi', value: 42660 },
      { label: 'In ấn', value: 20000 },
      { label: 'Đóng gói', value: 10000 },
    ],
    margin: 0.35,
    priceOverride: null,
  },
  {
    id: 2,
    name: 'Áo thun',
    qty: 180,
    costs: [
      { label: 'Phôi', value: 80000 },
      { label: 'In ấn', value: 10000 },
      { label: 'Đóng gói', value: 5000 },
    ],
    margin: 0.35,
    priceOverride: null,
  },
  {
    id: 3,
    name: 'Nón',
    qty: 300,
    costs: [
      { label: 'Phôi', value: 25000 },
      { label: 'In ấn', value: 10000 },
      { label: 'Đóng gói', value: 5000 },
    ],
    margin: 0.35,
    priceOverride: null,
  },
  {
    id: 4,
    name: 'Quạt',
    qty: 300,
    costs: [
      { label: 'Phôi', value: 25000 },
      { label: 'Đóng gói', value: 10000 },
    ],
    margin: 0.35,
    priceOverride: null,
  },
  {
    id: 5,
    name: 'Pin sạc dự phòng',
    qty: 300,
    costs: [
      { label: 'Phôi', value: 35000 },
      { label: 'Đóng gói', value: 10000 },
    ],
    margin: 0.35,
    priceOverride: null,
  },
];

const BULK_TIERS = [
  { label: '-50%', factor: 0.5, costDelta: 0.1 },
  { label: '-25%', factor: 0.75, costDelta: 0.05 },
  { label: 'Gốc', factor: 1, costDelta: 0 },
  { label: '+25%', factor: 1.25, costDelta: -0.03 },
  { label: '+50%', factor: 1.5, costDelta: -0.05 },
  { label: '+100%', factor: 2, costDelta: -0.08 },
];

function calcRow(item) {
  const unitCost = item.costs.reduce((s, c) => s + (c.value || 0), 0);
  const totalCost = item.qty * unitCost;
  const suggestedPrice =
    unitCost > 0 ? Math.ceil(unitCost / (1 - item.margin) / 1000) * 1000 : 0;
  const finalPrice =
    item.priceOverride !== null ? item.priceOverride : suggestedPrice;
  const totalRev = item.qty * finalPrice;
  const profit = totalRev - totalCost;
  const actualMargin = totalRev > 0 ? profit / totalRev : 0;
  const isOverridden =
    item.priceOverride !== null && item.priceOverride !== suggestedPrice;
  return {
    unitCost,
    totalCost,
    suggestedPrice,
    finalPrice,
    totalRev,
    profit,
    actualMargin,
    isOverridden,
  };
}

function CostBreakdown({ costs, onChange, onAdd, onRemove }) {
  return (
    <tr>
      <td colSpan={11} className='px-4 py-0'>
        <div
          style={{
            background: '#f8fafc',
            borderRadius: 12,
            padding: '12px 16px',
            margin: '0 0 8px 0',
            border: '1px solid #e2e8f0',
          }}
        >
          <div className='flex items-center gap-2 mb-2'>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Chi tiết giá vốn
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {costs.map((c, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  background: '#fff',
                  borderRadius: 8,
                  padding: '4px 8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <input
                  value={c.label}
                  onChange={(e) => {
                    const n = [...costs];
                    n[i] = { ...n[i], label: e.target.value };
                    onChange(n);
                  }}
                  style={{
                    width: 100,
                    border: 'none',
                    fontSize: 12,
                    color: '#475569',
                    background: 'transparent',
                    outline: 'none',
                  }}
                  placeholder='Tên...'
                />
                <input
                  type='number'
                  value={c.value || ''}
                  onChange={(e) => {
                    const n = [...costs];
                    n[i] = { ...n[i], value: +e.target.value };
                    onChange(n);
                  }}
                  style={{
                    width: 70,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#1e293b',
                    background: 'transparent',
                    outline: 'none',
                    textAlign: 'right',
                  }}
                  placeholder='0'
                  step='1000'
                />
                <span style={{ fontSize: 10, color: '#94a3b8' }}>đ</span>
                {costs.length > 1 && (
                  <button
                    onClick={() => onRemove(i)}
                    style={{
                      color: '#ef4444',
                      fontSize: 14,
                      lineHeight: 1,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0 2px',
                      opacity: 0.5,
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={onAdd}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                background: '#fff',
                borderRadius: 8,
                padding: '4px 10px',
                border: '1px dashed #cbd5e1',
                fontSize: 12,
                color: '#3b82f6',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              + Thêm
            </button>
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              fontWeight: 600,
              color: '#1e293b',
            }}
          >
            Tổng: {fmt(costs.reduce((s, c) => s + (c.value || 0), 0))}
          </div>
        </div>
      </td>
    </tr>
  );
}

function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'linear-gradient(135deg,#3b82f6,#2563eb)',
    green: 'linear-gradient(135deg,#10b981,#059669)',
    purple: 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
    orange: 'linear-gradient(135deg,#f97316,#ea580c)',
  };
  return (
    <div
      style={{
        background: colors[color],
        borderRadius: 16,
        padding: '14px 16px',
        color: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <div
        style={{ fontSize: 11, fontWeight: 500, opacity: 0.8, marginBottom: 2 }}
      >
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{sub}</div>
      )}
    </div>
  );
}

function PrintView({ items, calculated, totals, clientName }) {
  const today = new Date().toLocaleDateString('vi-VN');
  return (
    <div
      id='print-area'
      style={{
        fontFamily: "'Inter',system-ui,sans-serif",
        padding: 40,
        maxWidth: 900,
        margin: '0 auto',
        color: '#1e293b',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 32,
          borderBottom: '3px solid #3b82f6',
          paddingBottom: 20,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 16,
              }}
            >
              U
            </div>
            <span style={{ fontSize: 24, fontWeight: 800 }}>ULAB</span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            Merchandise & Custom Apparel
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>
            BÁO GIÁ NỘI BỘ
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
            Khách hàng:{' '}
            <strong style={{ color: '#1e293b' }}>{clientName}</strong>
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Ngày: {today}</div>
        </div>
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 12,
          marginBottom: 24,
        }}
      >
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            {[
              '#',
              'Sản phẩm',
              'Chi tiết vốn',
              'SL',
              'Giá vốn',
              'Tổng vốn',
              'Margin',
              'Giá bán',
              'Doanh thu',
              'Lợi nhuận',
            ].map((h, i) => (
              <th
                key={i}
                style={{
                  padding: '10px 8px',
                  textAlign: i > 2 ? 'right' : 'left',
                  fontWeight: 600,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  color: '#64748b',
                  letterSpacing: 0.5,
                  borderBottom: '2px solid #e2e8f0',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {calculated.map((row, i) => (
            <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{i + 1}</td>
              <td style={{ padding: '10px 8px', fontWeight: 600 }}>
                {row.name}
              </td>
              <td
                style={{
                  padding: '10px 8px',
                  fontSize: 10,
                  color: '#64748b',
                  maxWidth: 160,
                }}
              >
                {row.costs.map((c, j) => (
                  <span key={j}>
                    {c.label}: {fmtShort(c.value)}đ
                    {j < row.costs.length - 1 ? ' · ' : ''}
                  </span>
                ))}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                {row.qty.toLocaleString('vi-VN')}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                {fmt(row.unitCost)}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                {fmt(row.totalCost)}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                {pct(row.actualMargin)}
              </td>
              <td
                style={{
                  padding: '10px 8px',
                  textAlign: 'right',
                  fontWeight: 700,
                  color: '#2563eb',
                }}
              >
                {fmt(row.finalPrice)}
              </td>
              <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                {fmt(row.totalRev)}
              </td>
              <td
                style={{
                  padding: '10px 8px',
                  textAlign: 'right',
                  fontWeight: 600,
                  color: '#059669',
                }}
              >
                {fmt(row.profit)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
            <td colSpan={5} style={{ padding: '12px 8px' }}>
              TỔNG CỘNG
            </td>
            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
              {fmt(totals.totalCost)}
            </td>
            <td style={{ padding: '12px 8px', textAlign: 'right' }}>
              {pct(totals.margin)}
            </td>
            <td
              style={{
                padding: '12px 8px',
                textAlign: 'right',
                color: '#2563eb',
              }}
            ></td>
            <td
              style={{
                padding: '12px 8px',
                textAlign: 'right',
                color: '#2563eb',
              }}
            >
              {fmt(totals.totalRev)}
            </td>
            <td
              style={{
                padding: '12px 8px',
                textAlign: 'right',
                color: '#059669',
              }}
            >
              {fmt(totals.profit)}
            </td>
          </tr>
        </tfoot>
      </table>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          ['Tổng chi phí', fmt(totals.totalCost), '#f97316'],
          ['Tổng doanh thu', fmt(totals.totalRev), '#3b82f6'],
          ['Lợi nhuận gộp', fmt(totals.profit), '#10b981'],
          ['Biên LN', pct(totals.margin), '#8b5cf6'],
        ].map(([l, v, c], i) => (
          <div
            key={i}
            style={{
              border: `2px solid ${c}`,
              borderRadius: 12,
              padding: '12px 14px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#64748b',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {l}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 10,
          color: '#94a3b8',
          borderTop: '1px solid #e2e8f0',
          paddingTop: 12,
          textAlign: 'center',
        }}
      >
        Tài liệu nội bộ ULAB — Không chia sẻ cho khách hàng · Công thức: Giá bán
        = Giá vốn ÷ (1 − Margin)
      </div>
    </div>
  );
}

export default function App() {
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [globalMargin, setGlobalMargin] = useState(35);
  const [clientName, setClientName] = useState('Team Flash 2026');
  const [nextId, setNextId] = useState(6);
  const [tab, setTab] = useState('quote');
  const [bulkItem, setBulkItem] = useState(0);
  const [expandedRows, setExpandedRows] = useState({});
  const [showPrint, setShowPrint] = useState(false);
  const printRef = useRef();

  const toggleExpand = (id) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  const updateItem = useCallback((id, field, val) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: val } : it)),
    );
  }, []);

  const updateCosts = useCallback((id, newCosts) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, costs: newCosts } : it)),
    );
  }, []);

  const addCostLine = useCallback((id) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, costs: [...it.costs, { label: '', value: 0 }] }
          : it,
      ),
    );
  }, []);

  const removeCostLine = useCallback((id, idx) => {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, costs: it.costs.filter((_, i) => i !== idx) }
          : it,
      ),
    );
  }, []);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: nextId,
        name: '',
        qty: 100,
        costs: makeDefaultCosts(0),
        margin: globalMargin / 100,
        priceOverride: null,
      },
    ]);
    setNextId((n) => n + 1);
  };

  const removeItem = (id) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  const applyGlobalMargin = () => {
    setItems((prev) =>
      prev.map((it) => ({
        ...it,
        margin: globalMargin / 100,
        priceOverride: null,
      })),
    );
  };

  const calculated = useMemo(
    () => items.map((it) => ({ ...it, ...calcRow(it) })),
    [items],
  );

  const totals = useMemo(() => {
    const t = { totalCost: 0, totalRev: 0, profit: 0 };
    calculated.forEach((r) => {
      t.totalCost += r.totalCost;
      t.totalRev += r.totalRev;
      t.profit += r.profit;
    });
    t.margin = t.totalRev > 0 ? t.profit / t.totalRev : 0;
    return t;
  }, [calculated]);

  const bulkData = useMemo(() => {
    if (!calculated[bulkItem]) return [];
    const base = calculated[bulkItem];
    return BULK_TIERS.map((tier) => {
      const nQ = Math.round(base.qty * tier.factor);
      const nC = Math.round(base.unitCost * (1 - tier.costDelta));
      const nP = Math.ceil(nC / (1 - base.margin) / 1000) * 1000;
      const nTC = nQ * nC;
      const nTR = nQ * nP;
      const nPr = nTR - nTC;
      return { ...tier, nQ, nC, nP, nTC, nTR, nPr };
    });
  }, [calculated, bulkItem]);

  const handlePrint = () => {
    setShowPrint(true);
    setTimeout(() => {
      const el = document.getElementById('print-area');
      if (!el) return;
      const w = window.open('', '_blank', 'width=900,height=700');
      w.document.write(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ULAB Báo Giá - ${clientName}</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');body{margin:0;font-family:'Inter',system-ui,sans-serif}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${el.innerHTML}</body></html>`,
      );
      w.document.close();
      setTimeout(() => {
        w.print();
      }, 500);
      setShowPrint(false);
    }, 100);
  };

  const thStyle = {
    textAlign: 'right',
    padding: '10px 10px',
    fontSize: 10,
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  };

  return (
    <div
      style={{
        fontFamily: "'Inter',system-ui,sans-serif",
        background: '#f8fafc',
        minHeight: '100vh',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 2,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                U
              </div>
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#1e293b',
                  margin: 0,
                }}
              >
                ULAB Báo Giá
              </h1>
            </div>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
              Công cụ tạo báo giá merchandise
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 600,
                outline: 'none',
                width: 180,
              }}
              placeholder='Tên khách hàng'
            />
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg,#10b981,#059669)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
              }}
            >
              📄 Xuất PDF
            </button>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          <StatCard
            label='Tổng chi phí'
            value={fmt(totals.totalCost)}
            color='orange'
          />
          <StatCard
            label='Tổng doanh thu'
            value={fmt(totals.totalRev)}
            color='blue'
          />
          <StatCard
            label='Lợi nhuận gộp'
            value={fmt(totals.profit)}
            color='green'
          />
          <StatCard
            label='Biên LN trung bình'
            value={pct(totals.margin)}
            sub={`Mục tiêu: ${globalMargin}%`}
            color='purple'
          />
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            background: '#f1f5f9',
            borderRadius: 12,
            padding: 4,
            width: 'fit-content',
            marginBottom: 16,
          }}
        >
          {[
            ['quote', 'Báo giá'],
            ['bulk', 'Phân tích SL'],
          ].map(([k, v]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                transition: 'all .2s',
                background: tab === k ? '#fff' : 'transparent',
                color: tab === k ? '#3b82f6' : '#64748b',
                boxShadow: tab === k ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {v}
            </button>
          ))}
        </div>

        {tab === 'quote' && (
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              border: '1px solid #f1f5f9',
              overflow: 'hidden',
            }}
          >
            {/* Global Margin */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                background: '#f8fafc',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                Target Margin:
              </span>
              {[25, 30, 35, 40, 45, 50].map((m) => (
                <button
                  key={m}
                  onClick={() => setGlobalMargin(m)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    border: globalMargin === m ? 'none' : '1px solid #e2e8f0',
                    background: globalMargin === m ? '#3b82f6' : '#fff',
                    color: globalMargin === m ? '#fff' : '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  {m}%
                </button>
              ))}
              <button
                onClick={applyGlobalMargin}
                style={{
                  marginLeft: 4,
                  padding: '4px 12px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  border: 'none',
                  background: '#eff6ff',
                  color: '#3b82f6',
                  cursor: 'pointer',
                }}
              >
                Áp dụng tất cả
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  fontSize: 13,
                  borderCollapse: 'collapse',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <th
                      style={{
                        ...thStyle,
                        textAlign: 'left',
                        width: 32,
                        paddingLeft: 16,
                      }}
                    >
                      #
                    </th>
                    <th
                      style={{ ...thStyle, textAlign: 'left', width: 36 }}
                    ></th>
                    <th
                      style={{ ...thStyle, textAlign: 'left', minWidth: 140 }}
                    >
                      Sản phẩm
                    </th>
                    <th style={{ ...thStyle, width: 60 }}>SL</th>
                    <th style={{ ...thStyle, width: 90 }}>Giá vốn</th>
                    <th style={thStyle}>Tổng vốn</th>
                    <th style={{ ...thStyle, textAlign: 'center', width: 55 }}>
                      Margin
                    </th>
                    <th style={thStyle}>Giá ĐX</th>
                    <th style={{ ...thStyle, width: 100 }}>Giá bán ✏️</th>
                    <th style={thStyle}>Doanh thu</th>
                    <th style={thStyle}>Lợi nhuận</th>
                    <th style={{ ...thStyle, textAlign: 'center', width: 65 }}>
                      Margin TT
                    </th>
                    <th style={{ ...thStyle, width: 28 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {calculated.map((row, i) => {
                    const isExp = expandedRows[row.id];
                    const marginWarning = row.actualMargin < row.margin * 0.9;
                    const marginGood = row.actualMargin >= row.margin;
                    return [
                      <tr
                        key={row.id}
                        style={{
                          borderBottom: isExp ? 'none' : '1px solid #f8fafc',
                          transition: 'background .15s',
                          cursor: 'default',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = '#fafbff')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = 'transparent')
                        }
                      >
                        <td
                          style={{
                            padding: '10px 10px 10px 16px',
                            color: '#94a3b8',
                            fontWeight: 600,
                          }}
                        >
                          {i + 1}
                        </td>
                        <td style={{ padding: '10px 4px' }}>
                          <button
                            onClick={() => toggleExpand(row.id)}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: 6,
                              border: '1px solid #e2e8f0',
                              background: isExp ? '#eff6ff' : '#fff',
                              color: isExp ? '#3b82f6' : '#94a3b8',
                              cursor: 'pointer',
                              fontSize: 12,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isExp ? '▼' : '▶'}
                          </button>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <input
                            value={row.name}
                            onChange={(e) =>
                              updateItem(row.id, 'name', e.target.value)
                            }
                            style={{
                              width: '100%',
                              border: 'none',
                              background: 'transparent',
                              fontWeight: 600,
                              color: '#1e293b',
                              outline: 'none',
                              fontSize: 13,
                            }}
                            placeholder='Tên SP...'
                          />
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <input
                            type='number'
                            value={row.qty}
                            onChange={(e) =>
                              updateItem(row.id, 'qty', +e.target.value)
                            }
                            style={{
                              width: 60,
                              textAlign: 'right',
                              border: '1px solid transparent',
                              borderRadius: 6,
                              padding: '4px 6px',
                              background: 'transparent',
                              outline: 'none',
                              fontSize: 13,
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor = '#93c5fd')
                            }
                            onBlur={(e) =>
                              (e.target.style.borderColor = 'transparent')
                            }
                            min='0'
                          />
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            textAlign: 'right',
                            color: '#475569',
                            fontWeight: 500,
                          }}
                        >
                          {fmt(row.unitCost)}
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            textAlign: 'right',
                            color: '#64748b',
                          }}
                        >
                          {fmt(row.totalCost)}
                        </td>
                        <td
                          style={{ padding: '10px 8px', textAlign: 'center' }}
                        >
                          <input
                            type='number'
                            value={Math.round(row.margin * 100)}
                            onChange={(e) =>
                              updateItem(
                                row.id,
                                'margin',
                                +e.target.value / 100,
                              )
                            }
                            style={{
                              width: 40,
                              textAlign: 'center',
                              border: '1px solid transparent',
                              borderRadius: 6,
                              padding: '4px 2px',
                              background: 'transparent',
                              outline: 'none',
                              fontSize: 12,
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor = '#93c5fd')
                            }
                            onBlur={(e) =>
                              (e.target.style.borderColor = 'transparent')
                            }
                            min='0'
                            max='90'
                          />
                          <span style={{ fontSize: 10, color: '#94a3b8' }}>
                            %
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            textAlign: 'right',
                            color: '#94a3b8',
                            fontSize: 12,
                          }}
                        >
                          {fmt(row.suggestedPrice)}
                        </td>
                        <td style={{ padding: '10px 4px' }}>
                          <input
                            type='number'
                            value={
                              row.priceOverride !== null
                                ? row.priceOverride
                                : row.suggestedPrice
                            }
                            onChange={(e) => {
                              const v = +e.target.value;
                              updateItem(
                                row.id,
                                'priceOverride',
                                v === row.suggestedPrice ? null : v,
                              );
                            }}
                            style={{
                              width: 95,
                              textAlign: 'right',
                              border: `1.5px solid ${row.isOverridden ? '#f59e0b' : '#e2e8f0'}`,
                              borderRadius: 8,
                              padding: '5px 8px',
                              background: row.isOverridden ? '#fffbeb' : '#fff',
                              outline: 'none',
                              fontSize: 13,
                              fontWeight: 700,
                              color: row.isOverridden ? '#d97706' : '#2563eb',
                            }}
                            onFocus={(e) =>
                              (e.target.style.borderColor = '#3b82f6')
                            }
                            onBlur={(e) =>
                              (e.target.style.borderColor = row.isOverridden
                                ? '#f59e0b'
                                : '#e2e8f0')
                            }
                            step='1000'
                            min='0'
                          />
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            textAlign: 'right',
                            color: '#334155',
                          }}
                        >
                          {fmt(row.totalRev)}
                        </td>
                        <td
                          style={{
                            padding: '10px 8px',
                            textAlign: 'right',
                            fontWeight: 600,
                            color: row.profit >= 0 ? '#059669' : '#ef4444',
                          }}
                        >
                          {fmt(row.profit)}
                        </td>
                        <td
                          style={{ padding: '10px 8px', textAlign: 'center' }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 600,
                              background: marginWarning
                                ? '#fef2f2'
                                : marginGood
                                  ? '#ecfdf5'
                                  : '#fffbeb',
                              color: marginWarning
                                ? '#dc2626'
                                : marginGood
                                  ? '#059669'
                                  : '#d97706',
                            }}
                          >
                            {pct(row.actualMargin)}
                          </span>
                        </td>
                        <td
                          style={{ padding: '10px 8px', textAlign: 'center' }}
                        >
                          <button
                            onClick={() => removeItem(row.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: 16,
                              opacity: 0.4,
                              lineHeight: 1,
                            }}
                            onMouseEnter={(e) => (e.target.style.opacity = 1)}
                            onMouseLeave={(e) => (e.target.style.opacity = 0.4)}
                          >
                            ×
                          </button>
                        </td>
                      </tr>,
                      isExp && (
                        <CostBreakdown
                          key={`cost-${row.id}`}
                          costs={row.costs}
                          onChange={(c) => updateCosts(row.id, c)}
                          onAdd={() => addCostLine(row.id)}
                          onRemove={(idx) => removeCostLine(row.id, idx)}
                        />
                      ),
                    ];
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                    <td
                      colSpan={5}
                      style={{ padding: '12px 16px', color: '#475569' }}
                    >
                      TỔNG CỘNG ({calculated.length} SP)
                    </td>
                    <td
                      style={{
                        padding: '12px 8px',
                        textAlign: 'right',
                        color: '#475569',
                      }}
                    >
                      {fmt(totals.totalCost)}
                    </td>
                    <td colSpan={3}></td>
                    <td
                      style={{
                        padding: '12px 8px',
                        textAlign: 'right',
                        color: '#2563eb',
                      }}
                    >
                      {fmt(totals.totalRev)}
                    </td>
                    <td
                      style={{
                        padding: '12px 8px',
                        textAlign: 'right',
                        color: '#059669',
                      }}
                    >
                      {fmt(totals.profit)}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          background: '#f3e8ff',
                          color: '#7c3aed',
                        }}
                      >
                        {pct(totals.margin)}
                      </span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div
              style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9' }}
            >
              <button
                onClick={addItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#3b82f6',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: 8,
                }}
                onMouseEnter={(e) => (e.target.style.background = '#eff6ff')}
                onMouseLeave={(e) => (e.target.style.background = 'none')}
              >
                + Thêm sản phẩm
              </button>
            </div>
          </div>
        )}

        {tab === 'bulk' && (
          <div
            style={{
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              border: '1px solid #f1f5f9',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                background: '#f8fafc',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                Phân tích cho:
              </span>
              <select
                value={bulkItem}
                onChange={(e) => setBulkItem(+e.target.value)}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                {items.map((it, i) => (
                  <option key={it.id} value={i}>
                    {it.name || `SP ${i + 1}`}
                  </option>
                ))}
              </select>
              {calculated[bulkItem] && (
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  Giữ nguyên margin {pct(calculated[bulkItem].margin)}
                </span>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  fontSize: 13,
                  borderCollapse: 'collapse',
                }}
              >
                <thead>
                  <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {[
                      'Kịch bản',
                      'SL mới',
                      'Giá vốn mới',
                      'Giá bán ĐX',
                      'Tổng vốn',
                      'Doanh thu',
                      'Lợi nhuận',
                    ].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          ...thStyle,
                          textAlign: i === 0 ? 'left' : 'right',
                          paddingLeft: i === 0 ? 16 : 10,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bulkData.map((r, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid #f8fafc',
                        background: r.factor === 1 ? '#eff6ff' : 'transparent',
                        fontWeight: r.factor === 1 ? 700 : 400,
                      }}
                    >
                      <td style={{ padding: '10px 16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background:
                              r.factor === 1
                                ? '#dbeafe'
                                : r.factor > 1
                                  ? '#ecfdf5'
                                  : '#fef3c7',
                            color:
                              r.factor === 1
                                ? '#2563eb'
                                : r.factor > 1
                                  ? '#059669'
                                  : '#d97706',
                          }}
                        >
                          {r.label}
                        </span>
                        {r.costDelta !== 0 && (
                          <span
                            style={{
                              marginLeft: 8,
                              fontSize: 10,
                              color: '#94a3b8',
                            }}
                          >
                            (vốn {r.costDelta > 0 ? '+' : ''}
                            {(r.costDelta * 100).toFixed(0)}%)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {r.nQ.toLocaleString('vi-VN')}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {fmt(r.nC)}
                      </td>
                      <td
                        style={{
                          padding: '10px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: '#2563eb',
                        }}
                      >
                        {fmt(r.nP)}
                      </td>
                      <td
                        style={{
                          padding: '10px',
                          textAlign: 'right',
                          color: '#64748b',
                        }}
                      >
                        {fmt(r.nTC)}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'right' }}>
                        {fmt(r.nTR)}
                      </td>
                      <td
                        style={{
                          padding: '10px',
                          textAlign: 'right',
                          fontWeight: 600,
                          color: '#059669',
                        }}
                      >
                        {fmt(r.nPr)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              style={{
                padding: '10px 16px',
                background: '#f8fafc',
                borderTop: '1px solid #f1f5f9',
                fontSize: 11,
                color: '#94a3b8',
              }}
            >
              <strong>Giả định:</strong> Khi tăng SL, giá vốn giảm nhờ economies
              of scale. Tỷ lệ là ước lượng — điều chỉnh theo báo giá thực tế từ
              NCC.
            </div>
          </div>
        )}

        {/* Formula */}
        <div
          style={{
            marginTop: 14,
            padding: '10px 16px',
            background: '#fff',
            borderRadius: 12,
            border: '1px solid #f1f5f9',
            fontSize: 11,
            color: '#94a3b8',
          }}
        >
          <span style={{ fontWeight: 600, color: '#64748b' }}>Công thức:</span>{' '}
          Giá ĐX = Giá vốn ÷ (1 − Margin) → Làm tròn lên 1.000đ ·{' '}
          <span style={{ color: '#3b82f6' }}>Giá bán ✏️</span> = tuỳ chỉnh tay,{' '}
          <span style={{ color: '#f59e0b' }}>viền vàng</span> = đã override
        </div>
      </div>

      {/* Hidden print view */}
      {showPrint && (
        <div style={{ position: 'fixed', left: -9999, top: 0 }}>
          <PrintView
            items={items}
            calculated={calculated}
            totals={totals}
            clientName={clientName}
          />
        </div>
      )}
    </div>
  );
}
