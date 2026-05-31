# ULAB Báo Giá — Project Guide

Internal quote management tool for ULAB (merchandise & custom apparel). Manages pricing for multiple clients, calculates margins, and generates shareable PDF-ready quotes.

## Stack

- **Vite + React 19 + TypeScript** (strict mode)
- **Supabase** (`@supabase/supabase-js`) for data persistence and share links
- **No CSS framework** — all inline styles
- **No router** — URL query param `?share=<uuid>` used for share page routing (handled in `main.tsx`)
- Deployed on **Vercel**, only on `main` branch

## File Structure

```
src/
  App.tsx         — main app (all types, components, and logic in one file)
  SharePage.tsx   — read-only public share view (fetches from shared_quotes table)
  supabase.ts     — Supabase client (uses VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY)
  main.tsx        — entry point; routes to SharePage if ?share= param present, else App
```

## Core Data Types

```ts
type Quote = {
  id: string;          // genId() — timestamp36 + random
  clientName: string;
  items: Item[];
  globalMargin: number;  // percentage integer, e.g. 35 (means 35%)
  nextId: number;        // auto-increment for item IDs
  createdAt: string;     // ISO string
  shareId?: string;      // UUID of the shared_quotes row, if ever saved
}

type Item = {
  id: number;
  name: string;
  qty: number;
  costs: CostLine[];       // array of labeled cost components
  margin: number;          // decimal, e.g. 0.35 (NOT percentage)
  priceOverride: number | null;
}
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
| client_name | text | mirrors Quote.clientName for dashboard readability |
| data | jsonb | full Quote object |
| updated_at | timestamptz | set on every upsert |

All quotes are upserted together on every change (debounced 400ms). Ordered by `id` (creation order) on load.

### `shared_quotes` — read-only share snapshots
| column | type | notes |
|--------|------|-------|
| id | uuid PK | auto-generated |
| quote_data | jsonb | snapshot of Quote at save time |

When user clicks **💾 Save**: if `quote.shareId` exists → update that row; otherwise → insert and store the new UUID in `quote.shareId`. The share URL is `window.location.origin?share=<uuid>`.

## State & Persistence

- **Data**: loaded from Supabase `quotes` on mount; upserted back on every `quotes` state change (debounced 400ms)
- **Active tab**: stored in `localStorage` under `"ulab:activeId"` — written on every `activeId` change, read on mount to restore which client tab was open
- **Loading state**: `loading: true` until Supabase fetch resolves; shows spinner, blocks save effect

## Key Behaviors

- **"Apply all" margin button**: sets each item's `margin = globalMargin / 100`. Does NOT reset `priceOverride` — custom prices are preserved.
- **Price override detection**: `isOverridden = priceOverride !== null && priceOverride !== suggestedPrice`. Shown with amber border and background.
- **Delete quote**: removes from React state AND calls `supabase.from("quotes").delete().eq("id", id)`.
- **Duplicate quote**: new `genId()`, clientName + " (copy)", inserted adjacent to original in the array.
- **Bulk analysis tab**: simulates quantity scaling scenarios using `BULK_TIERS` factors; assumes economies-of-scale cost reductions.

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

## Things to Watch Out For

- `globalMargin` (integer) vs `item.margin` (decimal) — easy to mix up
- Supabase env var is `VITE_SUPABASE_PUBLISHABLE_KEY`, not the usual `VITE_SUPABASE_ANON_KEY`
- The save effect fires whenever `quotes` changes AND `loading === false` — ensure `loading` guard is present to avoid saving empty state on mount
- `SharePage.tsx` has its own local copies of all types and calc functions (intentionally isolated, read-only view)
