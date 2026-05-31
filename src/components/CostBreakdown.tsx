import type { CostLine } from "../types";
import { fmt } from "../lib/utils";

interface Props {
  costs: CostLine[];
  onChange: (costs: CostLine[]) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}

export function CostBreakdown({ costs, onChange, onAdd, onRemove }: Props) {
  return (
    <tr>
      <td colSpan={12} style={{ padding: 0 }}>
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "12px 16px", margin: "0 0 8px 0", border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Chi tiết giá vốn</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {costs.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, background: "#fff", borderRadius: 8, padding: "4px 8px", border: "1px solid #e2e8f0" }}>
                <input
                  value={c.label}
                  onChange={e => { const n = [...costs]; n[i] = { ...n[i], label: e.target.value }; onChange(n); }}
                  style={{ width: 130, border: "none", fontSize: 12, color: "#475569", background: "transparent", outline: "none" }}
                  placeholder="Tên..."
                />
                <input
                  type="number"
                  value={c.value || ""}
                  onChange={e => { const n = [...costs]; n[i] = { ...n[i], value: +e.target.value }; onChange(n); }}
                  style={{ width: 80, border: "none", fontSize: 12, fontWeight: 600, color: "#1e293b", background: "transparent", outline: "none", textAlign: "right" }}
                  placeholder="0"
                  step="100"
                />
                <span style={{ fontSize: 10, color: "#94a3b8" }}>đ</span>
                {costs.length > 1 && (
                  <button onClick={() => onRemove(i)} style={{ color: "#ef4444", fontSize: 14, lineHeight: 1, background: "none", border: "none", cursor: "pointer", padding: "0 2px", opacity: 0.5 }}>×</button>
                )}
              </div>
            ))}
            <button onClick={onAdd} style={{ background: "#fff", borderRadius: 8, padding: "4px 10px", border: "1px dashed #cbd5e1", fontSize: 12, color: "#3b82f6", cursor: "pointer", fontWeight: 500 }}>+ Thêm</button>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "#1e293b" }}>
            Tổng: {fmt(costs.reduce((s, c) => s + (c.value || 0), 0))}
          </div>
        </div>
      </td>
    </tr>
  );
}
