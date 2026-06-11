import { useMemo } from "react";
import type { Quote } from "@/types";
import { fmt } from "@/lib/utils";
import { calcQuoteTotals } from "@/lib/calc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ArchiveViewProps {
  quotes: Quote[];
  onRestore: (id: string) => void;
}

export function ArchiveView({ quotes, onRestore }: ArchiveViewProps) {
  const data = useMemo(
    () => quotes.map((q) => ({ ...q, totals: calcQuoteTotals(q) })),
    [quotes]
  );

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
        <span className="text-sm font-bold text-slate-900">
          📦 Lưu trữ Báo giá
        </span>
        <Badge variant="secondary" className="text-[11px]">
          {quotes.length} báo giá
        </Badge>
      </div>

      {quotes.length === 0 ? (
        <div className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
          <span className="text-3xl">📦</span>
          <p className="text-sm">Không có báo giá nào trong lưu trữ</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                Khách hàng
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                Ngày tạo
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">
                Chi phí
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">
                Doanh thu
              </TableHead>
              <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">
                Lợi nhuận
              </TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-semibold text-slate-900">
                  {q.clientName || "Không tên"}
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {new Date(q.createdAt).toLocaleDateString("vi-VN")}
                </TableCell>
                <TableCell className="text-right text-slate-500">
                  {fmt(q.totals.totalCost)}
                </TableCell>
                <TableCell className="text-right text-slate-500">
                  {fmt(q.totals.totalRev)}
                </TableCell>
                <TableCell className="text-right text-emerald-600 font-semibold">
                  {fmt(q.totals.profit)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRestore(q.id)}
                  >
                    Khôi phục
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
