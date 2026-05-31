import type { Quote } from "../types";

interface Props {
  quotes: Quote[];
  activeId: string;
  view: string;
  onSwitch: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onOverview: () => void;
}

export function TabBar({ quotes, activeId, view, onSwitch, onAdd, onDelete, onDuplicate, onOverview }: Props) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16, overflowX: "auto", padding: "2px 0" }}>
      <button
        onClick={onOverview}
        style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 10, border: view === "overview" ? "none" : "1px solid #e2e8f0", background: view === "overview" ? "linear-gradient(135deg,#1e293b,#334155)" : "#fff", color: view === "overview" ? "#fff" : "#475569", fontWeight: 600, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
      >
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
            {quotes.length > 1 && (
              <button onClick={() => onDelete(q.id)} title="Xoá" style={{ padding: "4px 8px 4px 2px", background: "transparent", border: "none", color: active ? "rgba(255,255,255,0.8)" : "#94a3b8", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            )}
          </div>
        );
      })}
      <button onClick={onAdd} style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 10, border: "1px dashed #cbd5e1", background: "transparent", color: "#3b82f6", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
        + Khách hàng mới
      </button>
    </div>
  );
}
