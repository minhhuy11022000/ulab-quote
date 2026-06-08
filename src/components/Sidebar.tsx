import type { Quote } from '../types';
import { calcQuoteTotals } from '../lib/calc';
import { fmtM, pct } from '../lib/utils';
import { cn } from '@/lib/utils';

export const SIDEBAR_PCT = '20%';

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
      {/* Toggle tab — slides with sidebar edge */}
      <button
        onClick={onToggleSidebar}
        className="fixed top-22 z-101 flex items-center justify-center w-5 h-14 rounded-r-lg bg-linear-to-br from-blue-500 to-blue-600 text-white text-[13px] font-bold shadow-[2px_2px_10px_rgba(59,130,246,0.35)] border-none cursor-pointer"
        style={{
          left: sidebarOpen ? SIDEBAR_PCT : 0,
          transition: 'left 0.25s cubic-bezier(.4,0,.2,1)',
        }}
      >
        {sidebarOpen ? '‹' : '›'}
      </button>

      {/* Sidebar panel */}
      <div
        className="fixed left-0 top-0 bottom-0 bg-slate-950 text-white z-99 flex flex-col overflow-hidden"
        style={{
          width: sidebarOpen ? SIDEBAR_PCT : 0,
          boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,0.2)' : 'none',
          transition: 'width 0.25s cubic-bezier(.4,0,.2,1)',
        }}
      >
        <div className="w-full box-border px-4 pt-5 pb-3 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7.5 h-7.5 rounded-lg bg-linear-to-br from-blue-500 to-violet-500 flex items-center justify-center font-extrabold text-xs">
              U
            </div>
            <span className="text-base font-extrabold tracking-tight">ULAB</span>
          </div>

          {/* Overview button */}
          <button
            onClick={onOverview}
            className={cn(
              'w-full px-3 py-2.5 rounded-xl border-none mb-2 font-semibold text-[13px] cursor-pointer text-left flex items-center gap-2',
              view === 'overview'
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-transparent text-slate-400'
            )}
          >
            <span className="text-[15px]">📊</span> Tổng quan
          </button>

          {/* Section label */}
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 py-3 border-t border-slate-800">
            Khách hàng
          </div>

          {/* Quote list */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-0.5">
            {quotes.map((q) => {
              const active = q.id === activeId && view === 'detail';
              const t = calcQuoteTotals(q);
              return (
                <div
                  key={q.id}
                  className={cn(
                    'px-3 py-2.5 rounded-xl cursor-pointer border-l-[3px]',
                    active
                      ? 'bg-blue-500/15 border-blue-500'
                      : 'bg-transparent border-transparent'
                  )}
                  onClick={() => onSwitch(q.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      'text-[13px] font-semibold overflow-hidden text-ellipsis whitespace-nowrap flex-1 min-w-0',
                      active ? 'text-blue-400' : 'text-slate-200'
                    )}>
                      {q.clientName || 'Không tên'}
                    </span>
                    <div className="flex gap-0.5 shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); onDuplicate(q.id); }}
                        title="Nhân bản"
                        className="bg-transparent border-none text-slate-500 cursor-pointer text-[11px] px-1 py-0.5"
                      >
                        ⎘
                      </button>
                      {quotes.length > 1 && (
                        <button
                          onClick={e => { e.stopPropagation(); onDelete(q.id); }}
                          title="Xoá"
                          className="bg-transparent border-none text-slate-500 cursor-pointer text-sm px-1 py-0.5 leading-none"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1 text-[10px] text-slate-500">
                    <span>{q.items.length} SP</span>
                    <span>·</span>
                    <span className="text-emerald-500">{fmtM(t.profit)}</span>
                    <span>·</span>
                    <span className="text-violet-400">{pct(t.margin)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add new quote */}
          <button
            onClick={onAdd}
            className="w-full box-border px-3 py-2.5 rounded-xl border border-dashed border-slate-700 bg-transparent text-blue-400 font-semibold text-xs cursor-pointer mt-2"
          >
            + Khách hàng mới
          </button>
        </div>
      </div>
    </>
  );
}
