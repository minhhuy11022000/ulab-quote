import type { Quote, CalcRow } from "../types";
import { fmt } from "../lib/utils";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type BulkRow = {
  label: string;
  factor: number;
  costDelta: number;
  nQ: number;
  nC: number;
  nP: number;
  nTC: number;
  nTR: number;
  nPr: number;
};

interface Props {
  bulkData: BulkRow[];
  bulkItem: number;
  setBulkItem: (i: number) => void;
  activeQuote: Quote;
  calculated: CalcRow[];
}

export function BulkAnalysis({ bulkData, bulkItem, setBulkItem, activeQuote, calculated }: Props) {
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 bg-slate-50 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-500">Phân tích cho:</span>
        <Select value={String(bulkItem)} onValueChange={v => setBulkItem(Number(v))}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {activeQuote.items.map((it, i) => (
              <SelectItem key={it.id} value={String(i)}>{it.name || `SP ${i + 1}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {calculated[bulkItem] && (
          <span className="text-[11px] text-muted-foreground">Target margin {activeQuote.globalMargin}%</span>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {["Kịch bản", "SL mới", "Giá vốn mới", "Giá bán ĐX", "Tổng vốn", "Doanh thu", "Lợi nhuận"].map((h, i) => (
              <TableHead key={i} className={cn("text-[10px] font-semibold text-muted-foreground uppercase tracking-wide", i > 0 && "text-right")}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bulkData.map((r, i) => (
            <TableRow key={i} className={cn(r.factor === 1 && "bg-blue-50 font-bold")}>
              <TableCell>
                <Badge className={cn(
                  "text-[11px]",
                  r.factor === 1 ? "bg-blue-100 text-blue-700 border-transparent" :
                  r.factor > 1 ? "bg-emerald-50 text-emerald-700 border-transparent" :
                  "bg-amber-50 text-amber-700 border-transparent"
                )}>
                  {r.label}
                </Badge>
                {r.costDelta !== 0 && (
                  <span className="ml-2 text-[10px] text-muted-foreground">(vốn {r.costDelta > 0 ? "+" : ""}{(r.costDelta * 100).toFixed(0)}%)</span>
                )}
              </TableCell>
              <TableCell className="text-right">{r.nQ.toLocaleString("vi-VN")}</TableCell>
              <TableCell className="text-right">{fmt(r.nC)}</TableCell>
              <TableCell className="text-right font-semibold text-blue-600">{fmt(r.nP)}</TableCell>
              <TableCell className="text-right text-slate-500">{fmt(r.nTC)}</TableCell>
              <TableCell className="text-right">{fmt(r.nTR)}</TableCell>
              <TableCell className="text-right font-semibold text-emerald-600">{fmt(r.nPr)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-muted-foreground">
        <strong>Giả định:</strong> Khi tăng SL, giá vốn giảm nhờ economies of scale. Tỷ lệ là ước lượng — điều chỉnh theo báo giá thực tế từ NCC.
      </div>
    </div>
  );
}
