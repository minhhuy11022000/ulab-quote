import type { Quote, Item, CostLine, CalcRow, Totals } from "../types";
import { fmt, pct } from "../lib/utils";
import { cn } from "@/lib/utils";
import { MARGIN_OPTIONS } from "../lib/constants";
import { CostBreakdown } from "./CostBreakdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  calculated: CalcRow[];
  expandedRows: Record<number, boolean>;
  gm: number;
  activeQuote: Quote;
  totals: Totals;
  setGlobalMargin: (m: number) => void;
  updateItem: (itemId: number, field: keyof Item, val: Item[keyof Item]) => void;
  updateCosts: (itemId: number, newCosts: CostLine[]) => void;
  addCostLine: (itemId: number) => void;
  removeCostLine: (itemId: number, idx: number) => void;
  removeItem: (itemId: number) => void;
  toggleExpand: (id: number) => void;
  addItem: () => void;
}

export function QuoteTable({
  calculated, expandedRows, gm, activeQuote, totals,
  setGlobalMargin, updateItem, updateCosts, addCostLine,
  removeCostLine, removeItem, toggleExpand, addItem,
}: Props) {
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-500">Target Margin (giá ĐX):</span>
        {MARGIN_OPTIONS.map(m => (
          <Button
            key={m}
            size="xs"
            variant={activeQuote.globalMargin === m ? "default" : "outline"}
            onClick={() => setGlobalMargin(m)}
          >
            {m}%
          </Button>
        ))}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide w-8 pl-4">#</TableHead>
            <TableHead className="w-9"></TableHead>
            <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-left min-w-36">Sản phẩm</TableHead>
            <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right w-16">SL</TableHead>
            <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right w-24">Giá vốn</TableHead>
            <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Tổng vốn</TableHead>
            <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Giá ĐX ({activeQuote.globalMargin}%)</TableHead>
            <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right w-28">Giá bán ✏️</TableHead>
            <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Doanh thu</TableHead>
            <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-right">Lợi nhuận</TableHead>
            <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide text-center w-16">Margin</TableHead>
            <TableHead className="w-7"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {calculated.map((row, i) => {
            const isExp = expandedRows[row.id];
            const marginOk = row.actualMargin >= gm;
            const marginLow = row.actualMargin < gm * 0.8;
            return [
              <TableRow key={row.id} className={cn(!isExp && "border-b")}>
                <TableCell className="pl-4 text-muted-foreground font-semibold">{i + 1}</TableCell>
                <TableCell className="px-1">
                  <Button
                    variant="outline"
                    size="icon-xs"
                    onClick={() => toggleExpand(row.id)}
                    className={cn("text-[12px]", isExp && "bg-blue-50 border-blue-200 text-blue-500")}
                  >
                    {isExp ? "▼" : "▶"}
                  </Button>
                </TableCell>
                <TableCell className="px-2">
                  <Input
                    value={row.name}
                    onChange={e => updateItem(row.id, "name", e.target.value)}
                    className="border-none shadow-none bg-transparent font-semibold text-slate-900 p-0 h-auto focus-visible:ring-0 text-sm"
                    placeholder="Tên SP..."
                  />
                </TableCell>
                <TableCell className="px-2">
                  <Input
                    type="number"
                    value={row.qty}
                    onChange={e => updateItem(row.id, "qty", +e.target.value)}
                    className="w-16 text-right border-transparent focus:border-blue-300 rounded-md p-1 h-auto bg-transparent focus-visible:ring-0 text-sm"
                    min="0"
                  />
                </TableCell>
                <TableCell className="text-right text-slate-600 font-medium">{fmt(row.unitCost)}</TableCell>
                <TableCell className="text-right text-slate-500">{fmt(row.totalCost)}</TableCell>
                <TableCell className="text-right text-muted-foreground text-xs">{fmt(row.suggestedPrice)}</TableCell>
                <TableCell className="px-1">
                  <Input
                    type="number"
                    value={row.priceOverride !== null ? row.priceOverride : row.suggestedPrice}
                    onChange={e => { const v = +e.target.value; updateItem(row.id, "priceOverride", v === row.suggestedPrice ? null : v); }}
                    className={cn(
                      "w-24 text-right h-8 rounded-lg text-sm font-bold focus-visible:ring-0",
                      row.isOverridden
                        ? "border-amber-400 bg-amber-50 text-amber-600 focus:border-blue-400"
                        : "border-slate-200 bg-white text-blue-600"
                    )}
                    step="100"
                    min="0"
                  />
                </TableCell>
                <TableCell className="text-right text-slate-700">{fmt(row.totalRev)}</TableCell>
                <TableCell className={cn("text-right font-semibold", row.profit >= 0 ? "text-emerald-600" : "text-red-500")}>{fmt(row.profit)}</TableCell>
                <TableCell className="text-center">
                  <Badge className={cn(
                    "text-[11px]",
                    marginLow ? "bg-red-50 text-red-600 border-transparent" :
                    marginOk ? "bg-emerald-50 text-emerald-700 border-transparent" :
                    "bg-amber-50 text-amber-600 border-transparent"
                  )}>
                    {pct(row.actualMargin)}
                  </Badge>
                </TableCell>
                <TableCell className="text-center px-1">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeItem(row.id)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 opacity-40 hover:opacity-100"
                  >
                    ×
                  </Button>
                </TableCell>
              </TableRow>,
              isExp && <CostBreakdown key={`cost-${row.id}`} costs={row.costs} onChange={c => updateCosts(row.id, c)} onAdd={() => addCostLine(row.id)} onRemove={idx => removeCostLine(row.id, idx)} />,
            ];
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5} className="pl-4 text-slate-600">TỔNG CỘNG ({calculated.length} SP)</TableCell>
            <TableCell className="text-right text-slate-600">{fmt(totals.totalCost)}</TableCell>
            <TableCell colSpan={2}></TableCell>
            <TableCell className="text-right text-blue-600">{fmt(totals.totalRev)}</TableCell>
            <TableCell className="text-right text-emerald-600">{fmt(totals.profit)}</TableCell>
            <TableCell className="text-center">
              <Badge className="bg-purple-50 text-purple-700 border-transparent text-[11px]">{pct(totals.margin)}</Badge>
            </TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <div className="px-4 py-2.5 border-t border-slate-100">
        <Button variant="ghost" size="sm" onClick={addItem} className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 font-semibold">
          + Thêm sản phẩm
        </Button>
      </div>
    </div>
  );
}
