import type { CostLine } from "../types";
import { fmt } from "../lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  costs: CostLine[];
  onChange: (costs: CostLine[]) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}

export function CostBreakdown({ costs, onChange, onAdd, onRemove }: Props) {
  return (
    <tr>
      <td colSpan={12} className="p-0">
        <div className="bg-slate-50 rounded-xl px-4 py-3 mb-2 mx-0 border border-slate-200">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Chi tiết giá vốn</div>
          <div className="flex flex-wrap gap-2">
            {costs.map((c, i) => (
              <div key={i} className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 border border-slate-200">
                <Input
                  value={c.label}
                  onChange={e => { const n = [...costs]; n[i] = { ...n[i], label: e.target.value }; onChange(n); }}
                  className="w-32 h-auto border-none shadow-none text-xs text-slate-600 bg-transparent p-0 focus-visible:ring-0"
                  placeholder="Tên..."
                />
                <Input
                  type="number"
                  value={c.value || ""}
                  onChange={e => { const n = [...costs]; n[i] = { ...n[i], value: +e.target.value }; onChange(n); }}
                  className="w-20 h-auto border-none shadow-none text-xs font-semibold text-slate-900 bg-transparent p-0 text-right focus-visible:ring-0"
                  placeholder="0"
                  step="100"
                />
                <span className="text-[10px] text-slate-400">đ</span>
                {costs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onRemove(i)}
                    className="text-red-500 opacity-50 hover:opacity-100 hover:bg-transparent hover:text-red-500"
                  >
                    ×
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={onAdd}
              className="h-auto py-1 px-2.5 border-dashed text-blue-500 text-xs font-medium"
            >
              + Thêm
            </Button>
          </div>
          <div className="mt-2 text-xs font-semibold text-slate-900">
            Tổng: {fmt(costs.reduce((s, c) => s + (c.value || 0), 0))}
          </div>
        </div>
      </td>
    </tr>
  );
}
