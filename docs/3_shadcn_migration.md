# Shadcn/UI Migration

Branch: `refactor/shadcn` off `origin/main`

## Goal

Replace all hand-rolled inline-style components with Shadcn/UI primitives on top of Tailwind CSS v4.

## Why Shadcn

- Consistent, accessible primitives (Button, Input, Table, Badge, Tabs, Select, Card)
- Components are copy-pasted into `src/components/ui/` — full control, no black-box dependency
- Tailwind v4 (`@tailwindcss/vite`) is zero-config, no `tailwind.config.js` needed
- Works alongside existing inline styles in `PrintView` (print iframe)

## What Changes

| File | Change |
|------|--------|
| `vite.config.ts` | Add `@tailwindcss/vite` plugin + `@/*` path alias |
| `tsconfig.app.json` | Add `paths: { "@/*": ["./src/*"] }` |
| `src/index.css` | New file: `@import "tailwindcss"` + CSS variable theme |
| `src/main.tsx` | Import `./index.css` |
| `src/lib/utils.ts` | Add `cn()` helper (merged by shadcn init) |
| `src/components/ui/` | Generated Shadcn primitives (button, input, card, badge, table, tabs, select) |
| `src/components/StatCard.tsx` | → Shadcn `Card` |
| `src/components/CostBreakdown.tsx` | → Shadcn `Button` + `Input` |
| `src/components/BulkAnalysis.tsx` | → Shadcn `Select` + `Table` + `Badge` |
| `src/components/QuoteTable.tsx` | → Shadcn `Table` + `Input` + `Button` + `Badge` |
| `src/components/OverviewView.tsx` | → Shadcn `Table` + `Badge` |
| `src/components/Sidebar.tsx` | → Tailwind utility classes (dark theme) |
| `src/App.tsx` | → Shadcn `Tabs` + `Button` + `Input` |

## What Stays Unchanged

- `src/components/PrintView.tsx` — keeps inline styles (renders inside print iframe where Tailwind is absent)
- `src/components/QuoteCharts.tsx` — Recharts manages its own styles
- All hooks, types, constants, calc logic — no changes

## Setup Commands

```bash
npm install -D tailwindcss @tailwindcss/vite @types/node
npx shadcn@latest init
npx shadcn@latest add button input card badge table tabs select
```
