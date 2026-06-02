# Shadcn/UI Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate all UI components from raw inline styles to Tailwind CSS + Shadcn/UI component library.

**Architecture:** Install Tailwind v4 via the official Vite plugin, initialize Shadcn which sets up CSS variables and the `cn()` utility, then migrate each component file one at a time — simplest first. PrintView is intentionally excluded (it renders inside a print iframe where Tailwind classes are not available).

**Tech Stack:** Tailwind CSS v4 (`@tailwindcss/vite`), Shadcn/UI (`shadcn@latest`), `clsx`, `tailwind-merge`, React 19, Vite 6, TypeScript strict.

---

## Branch

All work goes on a new branch cut from `refactor/split-app`:

```bash
git checkout refactor/split-app
git checkout -b refactor/shadcn
```

---

## File Map

| File | Action | Notes |
|------|--------|-------|
| `vite.config.ts` | Modify | Add Tailwind Vite plugin + `@` path alias |
| `tsconfig.app.json` | Modify | Add `baseUrl` + `paths` for `@/*` |
| `src/index.css` | Create | Tailwind entry point |
| `src/main.tsx` | Modify | Import `index.css` |
| `src/lib/utils.ts` | Modify | Add `cn()` helper alongside existing exports |
| `components.json` | Create (generated) | Shadcn config |
| `src/components/ui/` | Create (generated) | Shadcn primitive components |
| `src/components/StatCard.tsx` | Rewrite | → Shadcn `Card` |
| `src/components/CostBreakdown.tsx` | Rewrite | → Shadcn `Button` + `Input` |
| `src/components/BulkAnalysis.tsx` | Rewrite | → Shadcn `Select` + `Table` + `Badge` |
| `src/components/QuoteTable.tsx` | Rewrite | → Shadcn `Table` + `Input` + `Button` + `Badge` |
| `src/components/OverviewView.tsx` | Rewrite | → Shadcn `Table` + `Badge` |
| `src/components/Sidebar.tsx` | Rewrite | → Tailwind classes (no Shadcn primitives, dark theme) |
| `src/App.tsx` | Rewrite | → Shadcn `Tabs` + `Input` + `Button` |
| `src/components/PrintView.tsx` | **No change** | Inline styles required — renders in print iframe |
| `src/components/QuoteCharts.tsx` | **No change** | Recharts manages its own styles |

---

## Task 1: Install Tailwind CSS v4 + Configure Path Alias

**Files:**
- Modify: `vite.config.ts`
- Modify: `tsconfig.app.json`
- Create: `src/index.css`
- Modify: `src/main.tsx`

- [ ] **Step 1: Install dependencies**

```bash
npm install -D tailwindcss @tailwindcss/vite @types/node
```

- [ ] **Step 2: Update `vite.config.ts`**

```ts
import path from "path";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Update `tsconfig.app.json`** — add `baseUrl` and `paths` inside `compilerOptions`

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["vite/client"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create `src/index.css`**

```css
@import "tailwindcss";
```

- [ ] **Step 5: Import CSS in `src/main.tsx`**

Add as the first import:
```ts
import "./index.css";
```

Full `src/main.tsx`:
```tsx
import "./index.css";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import SharePage from './SharePage';

const shareId = new URLSearchParams(window.location.search).get('share');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {shareId ? <SharePage quoteId={shareId} /> : <App />}
  </StrictMode>,
);
```

- [ ] **Step 6: Verify build passes**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add vite.config.ts tsconfig.app.json src/index.css src/main.tsx package.json package-lock.json
git commit -m "feat: install Tailwind CSS v4 and configure path alias"
```

---

## Task 2: Initialize Shadcn

**Files:**
- Create: `components.json` (generated)
- Create: `src/components/ui/` (generated)
- Modify: `src/lib/utils.ts` (add `cn` helper)

- [ ] **Step 1: Run Shadcn init**

```bash
npx shadcn@latest init
```

When prompted:
- **Style:** Default
- **Base color:** Slate
- **CSS variables:** Yes
- **Utils path:** `src/lib/utils.ts` (type this manually if asked)

- [ ] **Step 2: Merge `src/lib/utils.ts`**

Shadcn will add `cn` to utils.ts, possibly overwriting existing exports. Ensure the file has **both** — all original exports plus `cn`:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmt = (n: number) => Math.round(n).toLocaleString("vi-VN") + " đ";
export const fmtM = (n: number) => {
  const abs = Math.abs(n);
  if (abs >= 1e9) return (n / 1e9).toFixed(1) + " tỷ";
  if (abs >= 1e6) return (n / 1e6).toFixed(1) + " tr";
  if (abs >= 1e3) return (n / 1e3).toFixed(0) + "k";
  return Math.round(n).toLocaleString("vi-VN");
};
export const fmtShort = (n: number) => Math.round(n).toLocaleString("vi-VN");
export const pct = (n: number) => (n * 100).toFixed(1) + "%";
export const genId = () => crypto.randomUUID();

export const BULK_TIERS = [
  { label: "-50%", factor: 0.5, costDelta: 0.10 },
  { label: "-25%", factor: 0.75, costDelta: 0.05 },
  { label: "Gốc", factor: 1, costDelta: 0 },
  { label: "+25%", factor: 1.25, costDelta: -0.03 },
  { label: "+50%", factor: 1.5, costDelta: -0.05 },
  { label: "+100%", factor: 2, costDelta: -0.08 },
] as const;
```

- [ ] **Step 3: Add required Shadcn components for the full migration**

```bash
npx shadcn@latest add button input card badge table tabs select
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: initialize Shadcn/UI with Button, Input, Card, Badge, Table, Tabs, Select"
```

---

## Task 3: Migrate StatCard

**Files:**
- Rewrite: `src/components/StatCard.tsx`

**Before:** Custom div with color-coded inline styles for 4 variants.
**After:** Shadcn `Card` with Tailwind color classes.

- [ ] **Step 1: Rewrite `src/components/StatCard.tsx`**

```tsx
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const colorMap = {
  blue:   { card: "border-blue-200 bg-blue-50",   value: "text-blue-700" },
  orange: { card: "border-orange-200 bg-orange-50", value: "text-orange-700" },
  green:  { card: "border-green-200 bg-green-50",  value: "text-green-700" },
  purple: { card: "border-purple-200 bg-purple-50", value: "text-purple-700" },
} as const;

interface Props {
  label: string;
  value: string;
  sub?: string;
  color: keyof typeof colorMap;
}

export function StatCard({ label, value, sub, color }: Props) {
  const c = colorMap[color];
  return (
    <Card className={cn("border", c.card)}>
      <CardContent className="pt-4 pb-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
        <p className={cn("text-2xl font-extrabold", c.value)}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Visual check**

```bash
npm run dev
```

Open the app. Confirm stat cards render with correct colors and layout.

- [ ] **Step 4: Commit**

```bash
git add src/components/StatCard.tsx
git commit -m "refactor: migrate StatCard to Shadcn Card"
```

---

## Task 4: Migrate CostBreakdown

**Files:**
- Rewrite: `src/components/CostBreakdown.tsx`

- [ ] **Step 1: Rewrite `src/components/CostBreakdown.tsx`**

```tsx
import type { CostLine } from "../types";
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
      <td colSpan={12} className="bg-slate-50 px-10 py-3 border-b border-slate-100">
        <div className="flex flex-col gap-2">
          {costs.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={c.label}
                onChange={e => onChange(costs.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                placeholder="Tên khoản..."
                className="w-44 h-8 text-xs"
              />
              <Input
                type="number"
                value={c.value}
                onChange={e => onChange(costs.map((x, j) => j === i ? { ...x, value: +e.target.value } : x))}
                className="w-32 h-8 text-xs text-right"
                min="0"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(i)}
                className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
              >
                ×
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdd}
            className="w-fit text-xs text-blue-500 hover:text-blue-700 hover:bg-blue-50 h-7 px-2"
          >
            + Thêm khoản
          </Button>
        </div>
      </td>
    </tr>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CostBreakdown.tsx
git commit -m "refactor: migrate CostBreakdown to Shadcn Button + Input"
```

---

## Task 5: Migrate BulkAnalysis

**Files:**
- Rewrite: `src/components/BulkAnalysis.tsx`

- [ ] **Step 1: Rewrite `src/components/BulkAnalysis.tsx`**

```tsx
import type { Quote, CalcRow } from "../types";
import { fmt } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type BulkRow = {
  label: string; factor: number; costDelta: number;
  nQ: number; nC: number; nP: number; nTC: number; nTR: number; nPr: number;
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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-600">Phân tích cho:</span>
        <Select value={String(bulkItem)} onValueChange={v => setBulkItem(+v)}>
          <SelectTrigger className="w-52 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {activeQuote.items.map((it, i) => (
              <SelectItem key={it.id} value={String(i)}>{it.name || `SP ${i + 1}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {calculated[bulkItem] && (
          <span className="text-xs text-slate-400">Target margin {activeQuote.globalMargin}%</span>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {["Kịch bản", "SL mới", "Giá vốn mới", "Giá bán ĐX", "Tổng vốn", "Doanh thu", "Lợi nhuận"].map((h, i) => (
              <TableHead key={i} className={i === 0 ? "text-left" : "text-right"}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bulkData.map((r, i) => (
            <TableRow key={i} className={r.factor === 1 ? "bg-blue-50 font-semibold" : ""}>
              <TableCell>
                <Badge variant={r.factor === 1 ? "default" : r.factor > 1 ? "secondary" : "outline"}>
                  {r.label}
                </Badge>
                {r.costDelta !== 0 && (
                  <span className="ml-2 text-xs text-slate-400">
                    (vốn {r.costDelta > 0 ? "+" : ""}{(r.costDelta * 100).toFixed(0)}%)
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">{r.nQ.toLocaleString("vi-VN")}</TableCell>
              <TableCell className="text-right">{fmt(r.nC)}</TableCell>
              <TableCell className="text-right font-semibold text-blue-600">{fmt(r.nP)}</TableCell>
              <TableCell className="text-right text-slate-500">{fmt(r.nTC)}</TableCell>
              <TableCell className="text-right">{fmt(r.nTR)}</TableCell>
              <TableCell className="text-right font-semibold text-green-600">{fmt(r.nPr)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
        <strong>Giả định:</strong> Khi tăng SL, giá vốn giảm nhờ economies of scale. Tỷ lệ là ước lượng — điều chỉnh theo báo giá thực tế từ NCC.
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/BulkAnalysis.tsx
git commit -m "refactor: migrate BulkAnalysis to Shadcn Select + Table + Badge"
```

---

## Task 6: Migrate QuoteTable

**Files:**
- Rewrite: `src/components/QuoteTable.tsx`

- [ ] **Step 1: Rewrite `src/components/QuoteTable.tsx`**

```tsx
import type { Quote, Item, CostLine, CalcRow, Totals } from "../types";
import { fmt, pct, cn } from "@/lib/utils";
import { MARGIN_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { CostBreakdown } from "./CostBreakdown";

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
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Margin selector */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-600">Target Margin (giá ĐX):</span>
        {MARGIN_OPTIONS.map(m => (
          <Button
            key={m}
            variant={activeQuote.globalMargin === m ? "default" : "outline"}
            size="sm"
            onClick={() => setGlobalMargin(m)}
            className="h-7 px-3 text-xs"
          >
            {m}%
          </Button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8 text-left pl-4">#</TableHead>
              <TableHead className="w-9 text-left"></TableHead>
              <TableHead className="min-w-36 text-left">Sản phẩm</TableHead>
              <TableHead className="w-16 text-right">SL</TableHead>
              <TableHead className="w-24 text-right">Giá vốn</TableHead>
              <TableHead className="text-right">Tổng vốn</TableHead>
              <TableHead className="text-right">Giá ĐX ({activeQuote.globalMargin}%)</TableHead>
              <TableHead className="w-28 text-right">Giá bán ✏️</TableHead>
              <TableHead className="text-right">Doanh thu</TableHead>
              <TableHead className="text-right">Lợi nhuận</TableHead>
              <TableHead className="w-16 text-center">Margin</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calculated.map((row, i) => {
              const isExp = expandedRows[row.id];
              const marginOk = row.actualMargin >= gm;
              const marginLow = row.actualMargin < gm * 0.8;
              return [
                <TableRow key={row.id} className={cn("hover:bg-slate-50/60", isExp && "border-b-0")}>
                  <TableCell className="pl-4 text-slate-400 font-semibold">{i + 1}</TableCell>
                  <TableCell className="pr-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExpand(row.id)}
                      className={cn("h-6 w-6 p-0 text-xs", isExp && "bg-blue-50 border-blue-200 text-blue-500")}
                    >
                      {isExp ? "▼" : "▶"}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <input
                      value={row.name}
                      onChange={e => updateItem(row.id, "name", e.target.value)}
                      className="w-full bg-transparent font-semibold text-slate-800 text-sm outline-none placeholder:text-slate-300"
                      placeholder="Tên SP..."
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <input
                      type="number"
                      value={row.qty}
                      onChange={e => updateItem(row.id, "qty", +e.target.value)}
                      className="w-16 text-right bg-transparent text-sm outline-none focus:border focus:border-blue-200 focus:rounded px-1"
                      min="0"
                    />
                  </TableCell>
                  <TableCell className="text-right text-slate-600 font-medium">{fmt(row.unitCost)}</TableCell>
                  <TableCell className="text-right text-slate-500">{fmt(row.totalCost)}</TableCell>
                  <TableCell className="text-right text-slate-400 text-xs">{fmt(row.suggestedPrice)}</TableCell>
                  <TableCell className="pr-1">
                    <input
                      type="number"
                      value={row.priceOverride !== null ? row.priceOverride : row.suggestedPrice}
                      onChange={e => {
                        const v = +e.target.value;
                        updateItem(row.id, "priceOverride", v === row.suggestedPrice ? null : v);
                      }}
                      className={cn(
                        "w-24 text-right text-sm font-bold rounded-lg px-2 py-1 outline-none border-[1.5px] transition-colors",
                        row.isOverridden
                          ? "border-amber-400 bg-amber-50 text-amber-600"
                          : "border-slate-200 bg-white text-blue-600 focus:border-blue-400"
                      )}
                      step="100"
                      min="0"
                    />
                  </TableCell>
                  <TableCell className="text-right text-slate-700">{fmt(row.totalRev)}</TableCell>
                  <TableCell className={cn("text-right font-semibold", row.profit >= 0 ? "text-green-600" : "text-red-500")}>
                    {fmt(row.profit)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-semibold",
                        marginLow ? "border-red-200 bg-red-50 text-red-600"
                          : marginOk ? "border-green-200 bg-green-50 text-green-600"
                          : "border-amber-200 bg-amber-50 text-amber-600"
                      )}
                    >
                      {pct(row.actualMargin)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(row.id)}
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 opacity-40 hover:opacity-100"
                    >
                      ×
                    </Button>
                  </TableCell>
                </TableRow>,
                isExp && (
                  <CostBreakdown
                    key={`cost-${row.id}`}
                    costs={row.costs}
                    onChange={c => updateCosts(row.id, c)}
                    onAdd={() => addCostLine(row.id)}
                    onRemove={idx => removeCostLine(row.id, idx)}
                  />
                ),
              ];
            })}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-slate-50 font-bold">
              <TableCell colSpan={5} className="pl-4 text-slate-600">TỔNG CỘNG ({calculated.length} SP)</TableCell>
              <TableCell className="text-right text-slate-600">{fmt(totals.totalCost)}</TableCell>
              <TableCell colSpan={2}></TableCell>
              <TableCell className="text-right text-blue-600">{fmt(totals.totalRev)}</TableCell>
              <TableCell className="text-right text-green-600">{fmt(totals.profit)}</TableCell>
              <TableCell className="text-center">
                <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs font-semibold" variant="outline">
                  {pct(totals.margin)}
                </Badge>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="px-4 py-2.5 border-t border-slate-100">
        <Button
          variant="ghost"
          size="sm"
          onClick={addItem}
          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 text-sm font-semibold"
        >
          + Thêm sản phẩm
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Visual check**

```bash
npm run dev
```

Verify: table renders, expand/collapse works, price override highlights amber, margin badge colors correct.

- [ ] **Step 4: Commit**

```bash
git add src/components/QuoteTable.tsx
git commit -m "refactor: migrate QuoteTable to Shadcn Table + Button + Input + Badge"
```

---

## Task 7: Migrate OverviewView

**Files:**
- Rewrite: `src/components/OverviewView.tsx`

- [ ] **Step 1: Rewrite `src/components/OverviewView.tsx`**

```tsx
import { useMemo } from "react";
import type { Quote } from "../types";
import { fmt, pct, cn } from "@/lib/utils";
import { calcQuoteTotals } from "../lib/calc";
import { StatCard } from "./StatCard";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard label="Tổng chi phí" value={fmt(grand.totalCost)} sub={`${quotes.length} khách hàng`} color="orange" />
        <StatCard label="Tổng doanh thu" value={fmt(grand.totalRev)} color="blue" />
        <StatCard label="Tổng lợi nhuận" value={fmt(grand.profit)} color="green" />
        <StatCard label="Biên LN trung bình" value={pct(grand.margin)} sub={`${grand.items} sản phẩm`} color="purple" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 text-sm font-bold text-slate-800">
          So sánh các khách hàng
          <span className="ml-2 text-xs font-medium text-slate-400">(sắp xếp theo doanh thu)</span>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {["#", "Khách hàng", "Số SP", "Tổng vốn", "Doanh thu", "Lợi nhuận", "Biên LN", ""].map((h, i) => (
                <TableHead key={i} className={i > 1 ? "text-right" : "text-left"}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((q, i) => (
              <TableRow key={q.id} onClick={() => onSwitch(q.id)} className="cursor-pointer hover:bg-slate-50/80">
                <TableCell className="text-slate-400 font-semibold">{i + 1}</TableCell>
                <TableCell className="font-semibold text-slate-800">{q.clientName || "Không tên"}</TableCell>
                <TableCell className="text-right text-slate-500">{q.items.length}</TableCell>
                <TableCell className="text-right text-slate-500">{fmt(q.totals.totalCost)}</TableCell>
                <TableCell className="text-right font-semibold text-blue-600">{fmt(q.totals.totalRev)}</TableCell>
                <TableCell className="text-right font-semibold text-green-600">{fmt(q.totals.profit)}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-semibold",
                      q.totals.margin >= q.globalMargin / 100
                        ? "border-green-200 bg-green-50 text-green-600"
                        : "border-amber-200 bg-amber-50 text-amber-600"
                    )}
                  >
                    {pct(q.totals.margin)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-slate-400 text-base">›</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="font-bold bg-slate-50">
              <TableCell colSpan={2} className="text-slate-800">TỔNG ({quotes.length} khách hàng)</TableCell>
              <TableCell className="text-right text-slate-600">{grand.items}</TableCell>
              <TableCell className="text-right text-slate-600">{fmt(grand.totalCost)}</TableCell>
              <TableCell className="text-right text-blue-600">{fmt(grand.totalRev)}</TableCell>
              <TableCell className="text-right text-green-600">{fmt(grand.profit)}</TableCell>
              <TableCell className="text-right">
                <Badge variant="outline" className="border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold">
                  {pct(grand.margin)}
                </Badge>
              </TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="mt-4 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
        💡 Click vào dòng bất kỳ để mở chi tiết báo giá của khách hàng đó
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/OverviewView.tsx
git commit -m "refactor: migrate OverviewView to Shadcn Table + Badge"
```

---

## Task 8: Migrate Sidebar

**Files:**
- Rewrite: `src/components/Sidebar.tsx`

The Sidebar uses a dark theme. Keep the dark background colors as Tailwind classes. No Shadcn primitives needed — dark-themed buttons don't match Shadcn's default variants cleanly.

- [ ] **Step 1: Read current `src/components/Sidebar.tsx` in full**

Read the file to understand all props and internal structure before rewriting.

- [ ] **Step 2: Rewrite `src/components/Sidebar.tsx`**

Replace all `style={{...}}` with Tailwind classes. Keep the same props interface and `SIDEBAR_PCT` export. The dark sidebar background is `bg-slate-900`, text is `text-slate-100`, active item is `bg-blue-600`.

Key class mappings from current inline styles:
- Sidebar container: `fixed top-0 left-0 h-full bg-slate-900 text-slate-100 flex flex-col overflow-hidden transition-all duration-300 z-50`
- Toggle button: `absolute -right-3 top-6 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center cursor-pointer text-xs`
- Section label: `text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-4 py-2`
- Quote item (inactive): `flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-800 transition-colors`
- Quote item (active): `bg-blue-600 hover:bg-blue-600`
- Client name: `text-sm font-semibold text-slate-100 truncate`
- Stats line: `text-[11px] text-slate-400 mt-0.5`
- Add button: `flex items-center gap-2 px-4 py-3 text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 cursor-pointer transition-colors border-t border-slate-800`

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Visual check**

```bash
npm run dev
```

Verify: sidebar toggles, active item highlighted blue, quote list scrollable, add/delete/duplicate work.

- [ ] **Step 5: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "refactor: migrate Sidebar to Tailwind classes"
```

---

## Task 9: Migrate App.tsx

**Files:**
- Rewrite: `src/App.tsx`

Replace inline styles in the main layout, header, client name bar, stat card grid, sub-tab switcher, and formula footer with Tailwind classes + Shadcn Tabs and Input.

- [ ] **Step 1: Rewrite `src/App.tsx`**

```tsx
import { useState } from "react";
import { useQuotes } from "./hooks/useQuotes";
import { fmt, pct } from "@/lib/utils";
import { Sidebar, SIDEBAR_PCT } from "./components/Sidebar";
import { StatCard } from "./components/StatCard";
import { OverviewView } from "./components/OverviewView";
import { PrintView } from "./components/PrintView";
import { QuoteTable } from "./components/QuoteTable";
import { BulkAnalysis } from "./components/BulkAnalysis";
import { QuoteCharts } from "./components/QuoteCharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const {
    quotes, activeId, view, setView, subTab, setSubTab,
    bulkItem, setBulkItem, expandedRows, showPrint,
    activeQuote, calculated, totals, bulkData, gm,
    setClientName, setGlobalMargin,
    updateItem, updateCosts, addCostLine, removeCostLine,
    addItem, removeItem, toggleExpand,
    addQuote, deleteQuote, duplicateQuote, switchQuote,
    handleExport, saveStatus, loaded,
  } = useQuotes();

  if (!loaded) return (
    <div className="flex items-center justify-center min-h-screen font-sans text-slate-400 text-sm">
      Đang tải dữ liệu...
    </div>
  );

  if (!activeQuote) return null;

  const sideW = sidebarOpen ? `calc(${SIDEBAR_PCT} + 20px)` : "20px";

  return (
    <div className="font-sans bg-slate-50 min-h-screen">
      <Sidebar
        quotes={quotes} activeId={activeId} view={view}
        sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        onSwitch={switchQuote} onAdd={addQuote} onDelete={deleteQuote}
        onDuplicate={duplicateQuote} onOverview={() => setView("overview")}
      />

      <div style={{ marginLeft: sideW, transition: "margin-left 0.25s cubic-bezier(.4,0,.2,1)" }} className="p-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between mb-4 gap-2">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 m-0">
              {view === "overview" ? "📊 Tổng quan" : activeQuote.clientName || "Báo giá"}
            </h1>
            <p className="text-xs text-slate-400 m-0">
              {view === "overview"
                ? "So sánh tất cả khách hàng"
                : `${activeQuote.items.length} sản phẩm · Tạo: ${new Date(activeQuote.createdAt).toLocaleDateString("vi-VN")}`}
            </p>
          </div>
          {view === "detail" && (
            <div className="flex items-center gap-2">
              {saveStatus !== "idle" && (
                <span className={`text-xs font-semibold ${saveStatus === "saving" ? "text-slate-400" : "text-emerald-500"}`}>
                  {saveStatus === "saving" ? "Đang lưu..." : "✅ Đã lưu"}
                </span>
              )}
              <Button onClick={() => handleExport("print")} className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5">
                📄 In / PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport("download")} title="Tải file HTML">
                💾 Tải HTML
              </Button>
            </div>
          )}
        </div>

        {view === "overview" ? (
          <OverviewView quotes={quotes} onSwitch={switchQuote} />
        ) : (
          <>
            {/* Client name */}
            <div className="flex flex-wrap items-center gap-2.5 mb-3.5 px-3.5 py-2.5 bg-white rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500">Khách hàng:</span>
              <Input
                value={activeQuote.clientName}
                onChange={e => setClientName(e.target.value)}
                className="flex-1 min-w-44 h-8 text-sm font-bold text-slate-800 border-slate-200"
                placeholder="Tên khách hàng..."
              />
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatCard label="Tổng doanh thu" value={fmt(totals.totalRev)} color="blue" />
              <StatCard label="Tổng chi phí" value={fmt(totals.totalCost)} color="orange" />
              <StatCard label="Lợi nhuận gộp" value={fmt(totals.profit)} color="green" />
              <StatCard label="Biên LN trung bình" value={pct(totals.margin)} sub={`Target: ${activeQuote.globalMargin}%`} color="purple" />
            </div>

            <QuoteCharts calculated={calculated} />

            {/* Sub-tabs */}
            <Tabs value={subTab} onValueChange={setSubTab} className="mb-4">
              <TabsList>
                <TabsTrigger value="quote">Báo giá</TabsTrigger>
                <TabsTrigger value="bulk">Phân tích SL</TabsTrigger>
              </TabsList>
            </Tabs>

            {subTab === "quote" && (
              <QuoteTable
                calculated={calculated} expandedRows={expandedRows} gm={gm}
                activeQuote={activeQuote} totals={totals} setGlobalMargin={setGlobalMargin}
                updateItem={updateItem} updateCosts={updateCosts}
                addCostLine={addCostLine} removeCostLine={removeCostLine}
                removeItem={removeItem} toggleExpand={toggleExpand} addItem={addItem}
              />
            )}

            {subTab === "bulk" && (
              <BulkAnalysis
                bulkData={bulkData} bulkItem={bulkItem} setBulkItem={setBulkItem}
                activeQuote={activeQuote} calculated={calculated}
              />
            )}

            <div className="mt-3.5 px-4 py-2.5 bg-white rounded-xl border border-slate-100 text-xs text-slate-400">
              <span className="font-semibold text-slate-500">Công thức:</span> Giá ĐX = Giá vốn ÷ (1 − Target Margin) → Làm tròn lên 100đ ·{" "}
              <span className="text-blue-500">Giá bán ✏️</span> = tuỳ chỉnh tay,{" "}
              <span className="text-amber-500">viền vàng</span> = đã override · 💾 Dữ liệu tự động lưu
            </div>
          </>
        )}
      </div>

      {showPrint && (
        <div className="fixed left-[-9999px] top-0">
          <PrintView calculated={calculated} totals={totals} clientName={activeQuote.clientName} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Full visual check**

```bash
npm run dev
```

Verify golden paths:
- Sidebar toggle works
- Switching between quotes works
- Detail view: client name input, stat cards, charts, table, bulk tab all render
- Overview view renders
- Print/download buttons work
- Save status indicator shows

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "refactor: migrate App.tsx to Tailwind + Shadcn Tabs + Button + Input"
```

---

## Task 10: Cleanup + Final Push

- [ ] **Step 1: Search for any remaining `style={{` in non-PrintView components**

```bash
grep -rn "style={{" src/components src/App.tsx src/hooks --include="*.tsx" --include="*.ts" | grep -v PrintView
```

Address any stragglers found.

- [ ] **Step 2: Remove unused imports**

```bash
npm run build 2>&1 | grep "unused\|declared but"
```

Fix any TypeScript warnings about unused imports.

- [ ] **Step 3: Final build**

```bash
npm run build
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 4: Push branch**

```bash
git push -u origin refactor/shadcn
```

---

## Notes

- **PrintView is excluded** — it renders HTML in an isolated print iframe. Tailwind's CSS won't be present there. Keep its inline styles.
- **QuoteCharts is excluded** — Recharts manages its own SVG styles.
- **`marginLeft` in App.tsx** — kept as a `style` prop (not Tailwind) because the value is dynamic (`sideW` is a JavaScript string). Dynamic values can't use static Tailwind classes.
- **Shadcn Badge variants** will need visual review — `default`, `secondary`, and `outline` may need custom className overrides to match the original color semantics.
