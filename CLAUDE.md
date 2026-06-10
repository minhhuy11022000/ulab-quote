# ULAB Báo Giá — Project Guide

Internal quote management tool for ULAB (merchandise & custom apparel). Manages pricing for multiple clients, calculates margins, and generates shareable PDF-ready quotes.

## Getting Started (after cloning)

```bash
npm install

# Create .env.local with:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_PUBLISHABLE_KEY=...   ← not ANON_KEY

npm run dev
```

The app loads real data from Supabase on startup. Without valid env vars it falls back to `INITIAL_QUOTES` in `src/lib/mockData.ts`.

## Stack

- **Vite + React 19 + TypeScript** (strict mode)
- **Tailwind CSS v4** (`@tailwindcss/vite`) + **Shadcn/UI** (radix-nova preset) for styling
- **Supabase** (`@supabase/supabase-js`) for data persistence and share links
- **No router** — URL query param `?share=<uuid>` used for share page routing (handled in `main.tsx`)
- Deployed on **Vercel**, only on `main` branch

## File Structure

```
src/
  App.tsx                   — layout + orchestration
  SharePage.tsx             — read-only public share view (fetches from shared_quotes table)
  supabase.ts               — Supabase client (uses VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY)
  main.tsx                  — entry point; routes to SharePage if ?share= param present, else App
  index.css                 — Tailwind imports + Shadcn CSS variable theme (oklch)
  types.ts                  — shared types: Quote, Item, CostLine, CalcRow, Totals

  hooks/
    useQuotes.ts            — all quote CRUD, UI state, composes usePersistence + useExport + useUndoDelete
    usePersistence.ts       — Supabase load on mount + debounced auto-save (400ms)
    useExport.ts            — print / download HTML export
    useUndoDelete.ts        — 10s undo delete logic; commits Supabase delete on timeout or unmount

  components/
    Sidebar.tsx             — dark sidebar with quote list + toggle tab
    StatCard.tsx            — gradient stat card (Tailwind bg-linear-to-br)
    QuoteTable.tsx          — pricing table (Shadcn Table + Input + Button + Badge)
    CostBreakdown.tsx       — per-item cost line editor (Shadcn Input + Button)
    BulkAnalysis.tsx        — quantity scaling scenarios (Shadcn Select + Table + Badge)
    OverviewView.tsx        — cross-client summary (Shadcn Table + Badge + StatCard)
    DeleteToast.tsx         — 10s undo toast shown after quote deletion
    PrintView.tsx           — print-ready layout (inline styles only — rendered in iframe)
    QuoteCharts.tsx         — Recharts bar/line chart (unchanged)
    ui/                     — Shadcn primitives: button, input, card, badge, table, tabs, select

  lib/
    utils.ts                — fmt, fmtM, fmtShort, pct, genId, BULK_TIERS, cn()
    constants.ts            — ACTIVE_ID_KEY, QUOTES_TABLE, SAVE_DEBOUNCE_MS, MARGIN_OPTIONS, etc.
    calc.ts                 — calcRow, calcQuoteTotals, createQuote
    mockData.ts             — INITIAL_QUOTES (fallback before Supabase loads)
```

## Core Data Types

All types live in `src/types.ts`.

```ts
type CostLine = { label: string; value: number };

type Item = {
  id: number;
  name: string;
  qty: number;
  costs: CostLine[];       // array of labeled cost components
  margin: number;          // decimal, e.g. 0.35 (NOT percentage)
  priceOverride: number | null;
}

type Quote = {
  id: string;          // genId() — crypto.randomUUID()
  clientName: string;
  items: Item[];
  globalMargin: number;  // percentage integer, e.g. 35 (means 35%)
  nextId: number;        // auto-increment for item IDs
  createdAt: string;     // ISO string
  shareId?: string;      // UUID of the shared_quotes row, if ever saved
}

type CalcRow = Item & {  // returned by calcRow()
  unitCost: number; totalCost: number;
  suggestedPrice: number; finalPrice: number;
  totalRev: number; profit: number;
  actualMargin: number; isOverridden: boolean;
}

type Totals = { totalCost: number; totalRev: number; profit: number; margin: number; }
```

**Important distinction**: `globalMargin` is stored as an integer (35), but each item's `margin` is stored as a decimal (0.35). When applying global margin to items: `margin = globalMargin / 100`.

## Pricing Formula

```
suggestedPrice = ceil(unitCost / (1 - margin) / 100) * 100
finalPrice     = priceOverride ?? suggestedPrice
actualMargin   = (finalPrice - unitCost) / finalPrice
```

`suggestedPrice` rounds up to the nearest 100đ. If `unitCost === 0`, `suggestedPrice === 0`.

## Supabase Tables

### `quotes` — working data
| column | type | notes |
|--------|------|-------|
| id | text PK | same as Quote.id |
| client_name | text | stored separately for dashboard readability |
| data | jsonb | Quote object WITHOUT clientName (stored in column above) |
| updated_at | timestamptz | set on every upsert |

`clientName` is stored **only** in `client_name` column, never duplicated in `data`. On load: `clientName = row.client_name ?? ""`. On save: strip `clientName` from object, write to `client_name` separately.

### `shared_quotes` — read-only share snapshots
| column | type | notes |
|--------|------|-------|
| id | uuid PK | auto-generated |
| quote_data | jsonb | snapshot of Quote at save time |

## State & Persistence

- **Data**: loaded from Supabase `quotes` on mount; upserted on every `quotes` state change (debounced 400ms via `usePersistence`)
- **Active tab**: stored in `localStorage` under `"ulab:activeId"` — written on `activeId` change, read on mount
- **Loading state**: `loaded: false` until Supabase fetch resolves; blocks the save effect via `isInitialLoad` ref

## Key Behaviors

- **Delete quote**: optimistically removed from state; Supabase delete fires after a **10-second undo window** (`DeleteToast`). Undo restores the quote in its original position. Dismiss or timeout commits the delete.
- **Price override detection**: `isOverridden = priceOverride !== null`. Shown with amber border/background in `QuoteTable`.
- **Duplicate quote**: new `genId()`, clientName + " (copy)", inserted adjacent to original in the array.
- **Bulk analysis tab**: simulates quantity scaling scenarios using `BULK_TIERS` factors; assumes economies-of-scale cost reductions.
- **Margin selector**: buttons for `[25, 30, 35, 40, 45, 50]%` defined in `MARGIN_OPTIONS` constant.

## Styling Rules

- Use **Tailwind CSS v4** utility classes everywhere. Avoid inline `style` props except for dynamic/computed values (e.g. sidebar width, animation durations).
- Use **Shadcn/UI** primitives (`Button`, `Input`, `Table`, `Badge`, `Tabs`, `Select`, `Card`) instead of raw HTML elements.
- `PrintView` is the only exception — keeps inline styles because it renders inside a print iframe where Tailwind is unavailable.
- `QuoteCharts` is unchanged — Recharts manages its own styles.
- Path alias `@/*` → `src/*` (configured in `vite.config.ts` + `tsconfig.app.json`).

## Environment Variables

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...   # note: not ANON_KEY
```

## Vercel Config (`vercel.json`)

- Rewrites all routes to `/index.html` (SPA)
- `ignoreCommand` skips builds on branches other than `main`

## Development

```bash
npm run dev      # start dev server
npm run build    # tsc + vite build (use to verify types)
```

## Working with Claude

### Always do
- Use Tailwind v4 utility classes. When the IDE suggests a canonical form (e.g. `bg-gradient-to-br` → `bg-linear-to-br`, `top-[88px]` → `top-22`), apply it.
- Use `@/` imports for anything under `src/` (e.g. `@/components/ui/button`, `@/lib/utils`).
- Run `npm run build` after non-trivial changes to catch type errors before committing.
- Update this file (`CLAUDE.md`) when pushing commits that change the stack, file structure, or key behaviors.
- Vietnamese text will trigger spell-checker `Information` diagnostics — these are always safe to ignore.

### Never do
- Don't commit or push without the user explicitly asking.
- Don't add inline `style` props for things Tailwind can handle — exceptions are dynamic computed values (sidebar width during animation, print iframe offset).
- Don't modify `PrintView.tsx` to use Tailwind — it renders in a print iframe where Tailwind is absent.
- Don't duplicate `clientName` inside the `data` JSON column — it lives only in `client_name`.
- Don't remove the `isInitialLoad` ref guard in `usePersistence.ts` — it prevents overwriting Supabase with empty state on first render.

### Branch conventions
- Feature branches off `main`: `feat/<name>`
- Refactor branches: `refactor/<name>`
- Implementation plans live in `docs/superpowers/plans/`

### No test suite
There are no automated tests. Verify changes by running `npm run build` (type-check) and manually testing in `npm run dev`.

## Things to Watch Out For

- `globalMargin` (integer) vs `item.margin` (decimal) — easy to mix up
- Supabase env var is `VITE_SUPABASE_PUBLISHABLE_KEY`, not the usual `VITE_SUPABASE_ANON_KEY`
- `clientName` lives only in the `client_name` DB column — never in the `data` JSON. Load/save code in `usePersistence` handles the split.
- The save effect is guarded by `isInitialLoad` ref — removing it causes empty-state overwrite on mount
- `SharePage.tsx` has its own local copies of all types and calc functions (intentionally isolated, read-only view)
- `tsconfig.app.json` uses `"ignoreDeprecations": "5.0"` for `baseUrl` — the IDE may show a false warning because it uses a newer TypeScript than the project's installed 5.7.3
