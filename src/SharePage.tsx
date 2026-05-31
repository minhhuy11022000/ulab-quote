import { useEffect, useState } from 'react'
import { supabase } from './supabase'

type CostLine = { label: string; value: number }
type Item = {
  id: number; name: string; qty: number
  costs: CostLine[]; margin: number; priceOverride: number | null
}
type Quote = {
  id: string; clientName: string; items: Item[]
  globalMargin: number; nextId: number; createdAt: string
}
type CalcRow = Item & {
  unitCost: number; totalCost: number; suggestedPrice: number
  finalPrice: number; totalRev: number; profit: number
  actualMargin: number; isOverridden: boolean
}
type Totals = { totalCost: number; totalRev: number; profit: number; margin: number }

const fmt = (n: number) => Math.round(n).toLocaleString('vi-VN') + ' đ'
const fmtShort = (n: number) => Math.round(n).toLocaleString('vi-VN')
const pct = (n: number) => (n * 100).toFixed(1) + '%'

function calcRow(item: Item): Omit<CalcRow, keyof Item> {
  const unitCost = item.costs.reduce((s, c) => s + (c.value || 0), 0)
  const totalCost = item.qty * unitCost
  const suggestedPrice = unitCost > 0 ? Math.ceil(unitCost / (1 - item.margin) / 100) * 100 : 0
  const finalPrice = item.priceOverride !== null ? item.priceOverride : suggestedPrice
  const totalRev = item.qty * finalPrice
  const profit = totalRev - totalCost
  const actualMargin = totalRev > 0 ? profit / totalRev : 0
  const isOverridden = item.priceOverride !== null && item.priceOverride !== suggestedPrice
  return { unitCost, totalCost, suggestedPrice, finalPrice, totalRev, profit, actualMargin, isOverridden }
}

function calcTotals(quote: Quote): Totals {
  const t = { totalCost: 0, totalRev: 0, profit: 0, margin: 0 }
  quote.items.forEach(it => {
    const r = calcRow(it)
    t.totalCost += r.totalCost; t.totalRev += r.totalRev; t.profit += r.profit
  })
  t.margin = t.totalRev > 0 ? t.profit / t.totalRev : 0
  return t
}

export default function SharePage({ quoteId }: { quoteId: string }) {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    supabase
      .from('shared_quotes')
      .select('quote_data')
      .eq('id', quoteId)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true)
        else setQuote(data.quote_data as Quote)
        setLoading(false)
      })
  }, [quoteId])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: '#64748b' }}>
      Đang tải báo giá...
    </div>
  )

  if (notFound || !quote) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", gap: 8 }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Không tìm thấy báo giá</div>
      <div style={{ fontSize: 13, color: '#94a3b8' }}>Link có thể đã hết hạn hoặc không hợp lệ.</div>
    </div>
  )

  const calculated: CalcRow[] = quote.items.map(it => ({ ...it, ...calcRow(it) }))
  const totals = calcTotals(quote)
  const today = new Date().toLocaleDateString('vi-VN')

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", background: '#f8fafc', minHeight: '100vh' }}>
      {/* Toolbar — hidden when printing */}
      <div className="no-print" style={{ background: '#1e293b', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12 }}>U</div>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>ULAB Báo Giá</span>
          <span style={{ color: '#64748b', fontSize: 13 }}>— Chỉ xem</span>
        </div>
        <button onClick={() => window.print()} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          📄 In / Lưu PDF
        </button>
      </div>

      {/* Print content */}
      <div style={{ maxWidth: 900, margin: '32px auto', padding: '0 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, borderBottom: '3px solid #3b82f6', paddingBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>U</div>
              <span style={{ fontSize: 24, fontWeight: 800 }}>ULAB</span>
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Merchandise & Custom Apparel</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>BÁO GIÁ NỘI BỘ</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Khách hàng: <strong style={{ color: '#1e293b' }}>{quote.clientName}</strong></div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Ngày: {today}</div>
          </div>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
          {([
            ['Tổng chi phí', fmt(totals.totalCost), '#f97316'],
            ['Tổng doanh thu', fmt(totals.totalRev), '#3b82f6'],
            ['Lợi nhuận gộp', fmt(totals.profit), '#10b981'],
            ['Biên LN', pct(totals.margin), '#8b5cf6'],
          ] as [string, string, string][]).map(([l, v, c], i) => (
            <div key={i} style={{ border: `2px solid ${c}`, borderRadius: 12, padding: '12px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 24, background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <thead>
            <tr style={{ background: '#f1f5f9' }}>
              {['#', 'Sản phẩm', 'Chi tiết vốn', 'SL', 'Giá vốn', 'Tổng vốn', 'Margin', 'Giá bán', 'Doanh thu', 'Lợi nhuận'].map((h, i) => (
                <th key={i} style={{ padding: '10px 8px', textAlign: i > 2 ? 'right' : 'left', fontWeight: 600, fontSize: 10, textTransform: 'uppercase', color: '#64748b', letterSpacing: 0.5, borderBottom: '2px solid #e2e8f0' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calculated.map((row, i) => (
              <tr key={row.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px 8px', color: '#94a3b8' }}>{i + 1}</td>
                <td style={{ padding: '10px 8px', fontWeight: 600 }}>{row.name}</td>
                <td style={{ padding: '10px 8px', fontSize: 10, color: '#64748b', maxWidth: 160 }}>
                  {row.costs.map((c, j) => <span key={j}>{c.label}: {fmtShort(c.value)}đ{j < row.costs.length - 1 ? ' · ' : ''}</span>)}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>{row.qty.toLocaleString('vi-VN')}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>{fmt(row.unitCost)}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>{fmt(row.totalCost)}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>{pct(row.actualMargin)}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 700, color: '#2563eb' }}>{fmt(row.finalPrice)}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>{fmt(row.totalRev)}</td>
                <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 600, color: '#059669' }}>{fmt(row.profit)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
              <td colSpan={5} style={{ padding: '12px 8px' }}>TỔNG CỘNG</td>
              <td style={{ padding: '12px 8px', textAlign: 'right' }}>{fmt(totals.totalCost)}</td>
              <td style={{ padding: '12px 8px', textAlign: 'right' }}>{pct(totals.margin)}</td>
              <td></td>
              <td style={{ padding: '12px 8px', textAlign: 'right', color: '#2563eb' }}>{fmt(totals.totalRev)}</td>
              <td style={{ padding: '12px 8px', textAlign: 'right', color: '#059669' }}>{fmt(totals.profit)}</td>
            </tr>
          </tfoot>
        </table>

        <div style={{ fontSize: 10, color: '#94a3b8', borderTop: '1px solid #e2e8f0', paddingTop: 12, textAlign: 'center' }}>
          Tài liệu nội bộ ULAB — Không chia sẻ cho khách hàng · Công thức: Giá bán = Giá vốn ÷ (1 − Margin)
        </div>
      </div>

      <style>{`@media print { .no-print { display: none !important; } }`}</style>
    </div>
  )
}
