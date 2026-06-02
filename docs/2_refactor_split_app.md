# Refactor: Split App

Branch: `refactor/split-app` off `origin/main`

## Problem

Two files are doing too much:

- `App.tsx` (268 lines) — layout, quote table, bulk analysis, and header logic all mixed together
- `useQuotes.ts` (247 lines) — persistence, CRUD, calculations, export, and UI state all in one hook

## Goal

Split into focused, single-responsibility files so that:
- Each file is easy to understand and test in isolation
- `App.tsx` becomes a thin layout/orchestration layer (~80 lines)
- `useQuotes.ts` handles only CRUD and UI state (~120 lines)

---

## New Files

### `src/hooks/usePersistence.ts` (~60 lines)
Extracted from `useQuotes`:
- Supabase load on mount
- Debounced auto-save effect (400ms)
- `saveStatus: "idle" | "saving" | "saved"`
- `loaded: boolean`

Signature:
```ts
usePersistence(quotes: Quote[], loaded: boolean): { saveStatus, loaded }
```

### `src/hooks/useExport.ts` (~50 lines)
Extracted from `useQuotes`:
- `handleExport(mode)` — print or download HTML
- `showPrint: boolean`

Signature:
```ts
useExport(activeQuote: Quote, calculated: CalcRow[], totals: Totals): { handleExport, showPrint }
```

### `src/components/QuoteTable.tsx` (~100 lines)
Extracted from `App.tsx`:
- Margin selector buttons (25%–50%)
- Full pricing table (thead, tbody rows, tfoot)
- Expand/collapse cost rows via `CostBreakdown`
- "+ Thêm sản phẩm" button

Props:
```ts
{ calculated, expandedRows, gm, activeQuote, totals,
  updateItem, updateCosts, addCostLine, removeCostLine,
  removeItem, toggleExpand, addItem }
```

### `src/components/BulkAnalysis.tsx` (~50 lines)
Extracted from `App.tsx`:
- Product selector dropdown
- Bulk quantity scaling table
- Footnote with assumptions

Props:
```ts
{ bulkData, bulkItem, setBulkItem, activeQuote, calculated }
```

---

## What Stays

| File | Responsibility | Est. lines |
|------|---------------|-----------|
| `App.tsx` | Layout, header, client name bar, stat cards, tab switcher, formula note | ~80 |
| `useQuotes.ts` | Quote & item CRUD, UI state, calculations | ~120 |
| `usePersistence.ts` | Supabase load/save, saveStatus | ~60 |
| `useExport.ts` | handleExport, showPrint | ~50 |
| `QuoteTable.tsx` | Pricing table UI | ~100 |
| `BulkAnalysis.tsx` | Bulk analysis tab UI | ~50 |

---

## Execution Order

1. Extract `useExport` — no shared state, fully self-contained
2. Extract `usePersistence` — depends on `quotes` and `loaded` shape
3. Update `useQuotes` to compose both new hooks
4. Extract `BulkAnalysis` — simpler component
5. Extract `QuoteTable` — largest, most prop-heavy
6. Clean up `App.tsx`

Each step: extract → `npm run build` → verify no regressions before moving on.
