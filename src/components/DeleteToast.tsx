import { DELETE_UNDO_DURATION_MS as DURATION_MS } from "../lib/constants";

interface Props {
  name: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function DeleteToast({ name, onUndo, onDismiss }: Props) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl overflow-hidden bg-slate-900 text-slate-100 px-4 pb-3.75 pt-3 shadow-2xl min-w-75 max-w-115">
      <style>{`
        @keyframes toast-shrink {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>

      <span className="flex-1 text-[13px]">
        Đã xoá <strong>"{name || "Không tên"}"</strong>
      </span>

      <button
        onClick={onUndo}
        className="shrink-0 rounded-lg bg-blue-500 px-3.5 py-1.5 text-[13px] font-semibold text-white cursor-pointer border-none whitespace-nowrap hover:bg-blue-400"
      >
        Hoàn tác
      </button>

      <button
        onClick={onDismiss}
        className="text-slate-500 hover:text-slate-300 text-lg leading-none cursor-pointer border-none bg-transparent px-0.5"
      >
        ×
      </button>

      <div className="absolute bottom-0 left-0 right-0 h-0.75 bg-white/10">
        <div
          className="h-full w-full bg-blue-500 origin-left"
          style={{ animation: `toast-shrink ${DURATION_MS}ms linear forwards` }}
        />
      </div>
    </div>
  );
}
