import { useMemo } from "react";
import type { Quote } from "../types";
import { fmt, pct } from "../lib/utils";
import { cn } from "@/lib/utils";
import { calcQuoteTotals } from "../lib/calc";
import { StatCard } from "./StatCard";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  quotes: Quote[];
  onSwitch: (id: string) => void;
}

export function OverviewView({ quotes, onSwitch }: Props) {
  const data = useMemo(() => quotes.map(q => ({ ...q, totals: calcQuoteTotals(q) })), [quotes]);

  const grand = useMemo(() => {
    const t = data.reduce(
      (a, q) => ({ totalCost: a.totalCost + q.totals.totalCost, totalRev: a.totalRev + q.totals.totalRev, profit: a.profit + q.totals.profit, items: a.items + q.items.length }),
      { totalCost: 0, totalRev: 0, profit: 0, items: 0 }
    );
    return { ...t, margin: t.totalRev > 0 ? t.profit / t.totalRev : 0 };
  }, [data]);

  const sorted = [...data].sort((a, b) => b.totals.totalRev - a.totals.totalRev);

  return (
    <div>
      <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <StatCard label="Tổng chi phí" value={fmt(grand.totalCost)} sub={`${quotes.length} khách hàng`} color="orange" />
        <StatCard label="Tổng doanh thu" value={fmt(grand.totalRev)} color="blue" />
        <StatCard label="Tổng lợi nhuận" value={fmt(grand.profit)} color="green" />
        <StatCard label="Biên LN trung bình" value={pct(grand.margin)} sub={`${grand.items} sản phẩm`} color="purple" />
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 text-sm font-bold text-slate-900">
          So sánh các khách hàng{" "}
          <span className="text-[11px] font-medium text-muted-foreground ml-1.5">(sắp xếp theo doanh thu)</span>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              {["#", "Khách hàng", "Số SP", "Tổng vốn", "Doanh thu", "Lợi nhuận", "Biên LN", ""].map((h, i) => (
                <TableHead key={i} className={cn("text-[10px] font-semibold text-muted-foreground uppercase tracking-wide", i > 1 && "text-right")}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((q, i) => (
              <TableRow key={q.id} onClick={() => onSwitch(q.id)} className="cursor-pointer">
                <TableCell className="text-muted-foreground font-semibold">{i + 1}</TableCell>
                <TableCell className="font-semibold text-slate-900">{q.clientName || "Không tên"}</TableCell>
                <TableCell className="text-right text-slate-500">{q.items.length}</TableCell>
                <TableCell className="text-right text-slate-500">{fmt(q.totals.totalCost)}</TableCell>
                <TableCell className="text-right font-semibold text-blue-600">{fmt(q.totals.totalRev)}</TableCell>
                <TableCell className="text-right font-semibold text-emerald-600">{fmt(q.totals.profit)}</TableCell>
                <TableCell className="text-right">
                  <Badge className={cn(
                    "text-[11px]",
                    q.totals.margin >= q.globalMargin / 100
                      ? "bg-emerald-50 text-emerald-700 border-transparent"
                      : "bg-amber-50 text-amber-700 border-transparent"
                  )}>
                    {pct(q.totals.margin)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground text-base">›</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={2} className="text-slate-900">TỔNG ({quotes.length} khách hàng)</TableCell>
              <TableCell className="text-right text-slate-600">{grand.items}</TableCell>
              <TableCell className="text-right text-slate-600">{fmt(grand.totalCost)}</TableCell>
              <TableCell className="text-right text-blue-600">{fmt(grand.totalRev)}</TableCell>
              <TableCell className="text-right text-emerald-600">{fmt(grand.profit)}</TableCell>
              <TableCell className="text-right">
                <Badge className="bg-purple-50 text-purple-700 border-transparent text-[11px]">{pct(grand.margin)}</Badge>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="mt-3.5 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-800">
        💡 Click vào dòng bất kỳ để mở chi tiết báo giá của khách hàng đó
      </div>
    </div>
  );
}
