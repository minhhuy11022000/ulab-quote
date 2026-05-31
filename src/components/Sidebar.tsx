import type { Quote } from '../types';
import { calcQuoteTotals } from '../lib/calc';
import { fmtM, pct } from '../lib/utils';

export const SIDEBAR_PCT = '20%'; // for position:fixed (% = viewport-relative)

export function Sidebar({
  quotes,
  activeId,
  view,
  sidebarOpen,
  onToggleSidebar,
  onSwitch,
  onAdd,
  onDelete,
  onDuplicate,
  onOverview,
}: {
  quotes: Quote[];
  activeId: string;
  view: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onSwitch: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onOverview: () => void;
}) {
  return (
    <>
      {/* Single toggle tab — slides with the sidebar edge */}
      <button
        onClick={onToggleSidebar}
        style={{
          position: 'fixed',
          left: sidebarOpen ? SIDEBAR_PCT : 0,
          top: 88,
          zIndex: 101,
          transition: 'left 0.25s cubic-bezier(.4,0,.2,1)',
          width: 20,
          height: 56,
          borderRadius: '0 8px 8px 0',
          background: 'linear-gradient(135deg,#3b82f6,#2563eb)',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 700,
          boxShadow: '2px 2px 10px rgba(59,130,246,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {sidebarOpen ? '‹' : '›'}
      </button>

      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: sidebarOpen ? SIDEBAR_PCT : 0,
          background: '#0f172a',
          color: '#fff',
          zIndex: 99,
          transition: 'width 0.25s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden',
          boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.2)' : 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '20px 16px 12px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <div
            style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                U
              </div>
              <span
                style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5 }}
              >
                ULAB
              </span>
            </div>
          </div>

          <button
            onClick={onOverview}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 10,
              border: 'none',
              marginBottom: 8,
              background:
                view === 'overview' ? 'rgba(59,130,246,0.2)' : 'transparent',
              color: view === 'overview' ? '#60a5fa' : '#94a3b8',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 15 }}>📊</span> Tổng quan
          </button>

          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: '#475569',
              textTransform: 'uppercase',
              letterSpacing: 1,
              padding: '12px 12px 6px',
              borderTop: '1px solid #1e293b',
            }}
          >
            Khách hàng
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {quotes.map((q) => {
              const active = q.id === activeId && view === 'detail';
              const t = calcQuoteTotals(q);
              return (
                <div
                  key={q.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    cursor: 'pointer',
                    background: active
                      ? 'rgba(59,130,246,0.15)'
                      : 'transparent',
                    borderLeft: active
                      ? '3px solid #3b82f6'
                      : '3px solid transparent',
                  }}
                  onClick={() => onSwitch(q.id)}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: active ? '#60a5fa' : '#e2e8f0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {q.clientName || 'Không tên'}
                    </span>
                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate(q.id);
                        }}
                        title='Nhân bản'
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          fontSize: 11,
                          padding: '2px 4px',
                        }}
                      >
                        ⎘
                      </button>
                      {quotes.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(q.id);
                          }}
                          title='Xoá'
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#64748b',
                            cursor: 'pointer',
                            fontSize: 14,
                            padding: '2px 4px',
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      marginTop: 4,
                      fontSize: 10,
                      color: '#64748b',
                    }}
                  >
                    <span>{q.items.length} SP</span>
                    <span>·</span>
                    <span style={{ color: '#059669' }}>{fmtM(t.profit)}</span>
                    <span>·</span>
                    <span style={{ color: '#8b5cf6' }}>{pct(t.margin)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onAdd}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px dashed #334155',
              background: 'transparent',
              color: '#60a5fa',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
              marginTop: 8,
            }}
          >
            + Khách hàng mới
          </button>
        </div>
      </div>
    </>
  );
}
