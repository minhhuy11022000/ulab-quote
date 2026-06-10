# ulab-quote: Archive Feature Implementation Plan (Refactored)

**Status**: Ready for Implementation  
**Branch**: `feat/add-supabase`  
**Pattern**: Soft delete with separate archive table + separate ArchiveView component  
**Architecture**: Matches current project structure (components extracted)

---

## Overview

### What We're Adding
- Soft delete functionality (instead of permanent deletion)
- Archive view to see deleted quotes (NEW: separate component)
- One-click restore from archive
- Read-only archive (no editing archived quotes)
- Updated CLAUDE.md to reflect actual architecture

### Key Difference from Previous Plan
- ✅ **Extracts ArchiveView to `src/components/ArchiveView.tsx`** (separate file)
- ✅ **Keeps App.tsx clean** (only state & handlers, no inline components)
- ✅ **Matches your current pattern** (like OverviewView, PrintView, etc.)
- ✅ Better maintainability and testability

---

## Database Schema

### Add `archived_quotes` Table

```sql
CREATE TABLE archived_quotes (
  id text PRIMARY KEY,
  client_name text,
  data jsonb NOT NULL,
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz DEFAULT now()
);

-- Index for faster queries
CREATE INDEX archived_quotes_archived_at_idx ON archived_quotes(archived_at DESC);
```

---

## Implementation Steps

### Step 1: Update CLAUDE.md

**Location**: Update the "File Structure" section (around line 13)

**Replace:**
```md
```
src/
  App.tsx         — main app (all types, components, and logic in one file)
  SharePage.tsx   — read-only public share view (fetches from shared_quotes table)
  supabase.ts     — Supabase client (uses VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY)
  main.tsx        — entry point; routes to SharePage if ?share= param present, else App
```
```

**With:**
```md
```
src/
  App.tsx              — main app (state, handlers, view switching)
  SharePage.tsx        — read-only public share view (fetches from shared_quotes table)
  supabase.ts          — Supabase client (uses VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY)
  main.tsx             — entry point; routes to SharePage if ?share= param present, else App
  
  components/
    OverviewView.tsx   — dashboard view (all quotes summary)
    PrintView.tsx      — print layout for PDF export
    CostBreakdown.tsx  — cost details table
    QuoteCharts.tsx    — visualization/analytics
    Sidebar.tsx        — navigation and quote list
    StatCard.tsx       — summary statistics cards
    ArchiveView.tsx    — archived quotes view (read-only, with restore button)
```
```

**Also add** after "Key Behaviors" section (around line 84):

```md
- **Delete quote**: removes from React state AND archives to `archived_quotes` table, deletes from `quotes` table
- **Restore quote**: moves quote from archive back to active quotes, syncs both tables
- **Archive view**: read-only display of deleted quotes with restore functionality
```

---

### Step 2: Create ArchiveView Component

**Create new file**: `src/components/ArchiveView.tsx`

```typescript
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
```

**Why this structure:**
- ✅ Uses Tailwind CSS v4 utility classes — no inline `style` props
- ✅ Uses Shadcn/UI primitives: `Table`, `Badge`, `Button`
- ✅ Hover effects match your design patterns
- ✅ TypeScript typed props
- ✅ Proper imports from types and lib

---

### Step 3: Update App.tsx - Add State

**Location**: After existing state declarations (around line 20)

```typescript
const [archivedQuotes, setArchivedQuotes] = useState<Quote[]>([]);

// Update view type to include "archive":
const [view, setView] = useState<"detail" | "overview" | "archive">("detail");
```

---

### Step 4: Load Archived Quotes on Mount

**Location**: Add after existing Supabase load effect (around line 40)

```typescript
// Load archived quotes from Supabase
useEffect(() => {
  const loadArchived = async () => {
    try {
      const { data, error } = await supabase
        .from("archived_quotes")
        .select("*")
        .order("archived_at", { ascending: false });

      if (error) throw error;
      if (data) {
        // Parse quote_data from archived rows
        setArchivedQuotes(data.map(row => row.data));
      }
    } catch (err) {
      console.error("Failed to load archived quotes:", err);
    }
  };

  loadArchived();
}, []);
```

---

### Step 5: Update deleteQuote Handler

**Location**: Find existing `deleteQuote` function (around line 103)

**Replace:**
```typescript
const deleteQuote = useCallback((id: string) => {
  const q = quotes.find(x => x.id === id);
  if (!q) return;
  if (!confirm(`Xoá khách hàng "${q.clientName}"? Hành động này không thể hoàn tác.`)) return;
  setQuotes(prev => {
    const next = prev.filter(x => x.id !== id);
    if (id === activeId && next.length) setActiveId(next[0].id);
    return next;
  });
}, [quotes, activeId]);
```

**With:**
```typescript
const deleteQuote = useCallback((id: string) => {
  const q = quotes.find(x => x.id === id);
  if (!q) return;
  if (!confirm(`Xoá khách hàng "${q.clientName}"? Hành động này không thể hoàn tác.`)) return;

  // Remove from active state
  setQuotes(prev => {
    const next = prev.filter(x => x.id !== id);
    if (id === activeId && next.length) setActiveId(next[0].id);
    return next;
  });

  // Add to archive state
  setArchivedQuotes(prev => [...prev, q]);

  // Sync to Supabase: insert into archive
  supabase
    .from("archived_quotes")
    .insert([{
      id: q.id,
      client_name: q.clientName,
      data: q,
      created_at: q.createdAt,
      updated_at: new Date().toISOString(),
      archived_at: new Date().toISOString()
    }])
    .then(() => {
      // Remove from active table
      supabase
        .from("quotes")
        .delete()
        .eq("id", id)
        .catch(err => console.error("Delete from DB failed:", err));
    })
    .catch(err => console.error("Archive failed:", err));
}, [quotes, activeId]);
```

---

### Step 6: Add restoreQuote Handler

**Location**: Add after `deleteQuote` (around line 125)

```typescript
const restoreQuote = useCallback((id: string) => {
  const archived = archivedQuotes.find(q => q.id === id);
  if (!archived) return;

  // Move back to active state
  setQuotes(prev => [...prev, archived]);
  setArchivedQuotes(prev => prev.filter(q => q.id !== id));

  // Sync to Supabase
  supabase
    .from("quotes")
    .insert([{
      id: archived.id,
      client_name: archived.clientName,
      data: archived
    }])
    .then(() => {
      // Remove from archive table
      supabase
        .from("archived_quotes")
        .delete()
        .eq("id", id)
        .catch(err => console.error("Delete from archive failed:", err));
    })
    .catch(err => console.error("Restore failed:", err));
}, [archivedQuotes]);
```

---

### Step 7: Import ArchiveView in App.tsx

**Location**: At the top with other imports (around line 1)

```typescript
import { ArchiveView } from "./components/ArchiveView";
```

---

### Step 8: Update View Switching Logic

**Location**: Find main view conditional rendering (around line 250)

**Replace:**
```typescript
{view === "overview" ? (
  <OverviewView quotes={quotes} onSwitch={switchQuote} />
) : (
  // existing detail view
  <>
    {/* ... */}
  </>
)}
```

**With:**
```typescript
{view === "overview" ? (
  <OverviewView quotes={quotes} onSwitch={switchQuote} />
) : view === "archive" ? (
  <ArchiveView quotes={archivedQuotes} onRestore={restoreQuote} />
) : (
  // existing detail view
  <>
    {/* ... */}
  </>
)}
```

---

### Step 9: Add Archive Button to Header

**Location**: Find header buttons section (around line 60)

**Add this button** alongside existing export buttons:

```typescript
{view === "detail" && (
  <div style={{ display: "flex", gap: 6 }}>
    {/* Existing buttons */}
    
    {/* NEW: Archive button */}
    <button
      onClick={() => setView("archive")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#fff",
        color: "#64748b",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "9px 14px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s"
      }}
      title={`Xem ${archivedQuotes.length} báo giá đã xoá`}
    >
      📦 Lưu trữ ({archivedQuotes.length})
    </button>
  </div>
)}
```

**Or if in TabBar component**, add to tab buttons:

```typescript
<button
  onClick={() => onSetView("archive")}
  style={{
    background: view === "archive" ? "#3b82f6" : "#fff",
    color: view === "archive" ? "#fff" : "#64748b",
    border: view === "archive" ? "none" : "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "9px 14px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: view === "archive" ? "0 2px 8px rgba(59,130,246,0.3)" : "none"
  }}
  title={`${archiveCount} báo giá đã xoá`}
>
  📦 Lưu trữ ({archiveCount})
</button>
```

---

## Files to Modify/Create

```
src/
├── App.tsx                          (MODIFY)
│   ├── Add state: archivedQuotes
│   ├── Add effect: loadArchived
│   ├── Update: deleteQuote
│   ├── Add: restoreQuote
│   ├── Import: ArchiveView
│   ├── Update: view switching
│   └── Add: archive button
│
├── components/
│   └── ArchiveView.tsx              (NEW FILE)
│       ├── ArchiveView component
│       └── ArchiveCard sub-component
│
└── CLAUDE.md                        (UPDATE)
    └── Update file structure section
```

---

## Testing Checklist

### Test 1: Delete Quote
- [ ] Open a quote in detail view
- [ ] Click delete (confirm)
- [ ] Quote removed from overview
- [ ] Quote appears in archive view
- [ ] Archive count increments (+1)

### Test 2: Restore Quote
- [ ] Switch to archive view
- [ ] Click restore on a quote (confirm)
- [ ] Quote moves back to active view
- [ ] Can see it in overview
- [ ] Archive count decrements (-1)

### Test 3: Supabase Sync
- [ ] Delete a quote:
  - [ ] Removed from `quotes` table
  - [ ] Added to `archived_quotes` table
- [ ] Restore a quote:
  - [ ] Removed from `archived_quotes` table
  - [ ] Added back to `quotes` table

### Test 4: Persistence
- [ ] Delete 2 quotes
- [ ] Refresh page
- [ ] Both still in archive (loaded from DB)
- [ ] Archive count shows 2

### Test 5: UI/UX
- [ ] Archive button shows count
- [ ] Archive view is read-only (no edit fields)
- [ ] Restore button is green and prominent
- [ ] Empty state message displays
- [ ] Quote summary (costs, revenue, profit) shows

### Test 6: Multiple Operations
- [ ] Delete quote A
- [ ] Delete quote B
- [ ] Restore quote A (should move back first)
- [ ] Delete quote A again
- [ ] Verify both in archive, most recent deletion first

---

## Code Summary

### Changes Required

| File | Type | Changes |
|------|------|---------|
| App.tsx | Modify | State, effects, 2 handlers, imports, view logic, button |
| ArchiveView.tsx | Create | New component (~150 lines) |
| CLAUDE.md | Update | File structure section |

### Complexity
- **Easy**: State additions and imports
- **Medium**: Handlers (combine delete + restore logic)
- **Easy**: View switching (copy existing pattern)

### Time Estimate
- Create ArchiveView.tsx: 10 min
- Update App.tsx: 15 min
- Test: 15 min
- **Total: ~40 minutes**

---

## Why This Approach is Better

✅ **Matches Your Current Pattern**:
- OverviewView, PrintView, CostBreakdown all separate components
- Now ArchiveView follows the same pattern

✅ **Better Maintainability**:
- App.tsx stays ~250 lines (focused on logic)
- ArchiveView.tsx is self-contained (~150 lines)
- Easy to test independently

✅ **Scalability**:
- If archive features grow (filter, search, bulk restore), keep it in ArchiveView
- App.tsx doesn't grow

✅ **Reusability**:
- ArchiveCard component can be used elsewhere
- Clear separation of concerns

✅ **Professional**:
- Follows component-based architecture
- Better for team collaboration

---

## Deployment Notes

### Database Migration
Run in Supabase SQL editor:
```sql
CREATE TABLE archived_quotes (
  id text PRIMARY KEY,
  client_name text,
  data jsonb NOT NULL,
  created_at timestamptz,
  updated_at timestamptz,
  archived_at timestamptz DEFAULT now()
);

CREATE INDEX archived_quotes_archived_at_idx 
ON archived_quotes(archived_at DESC);
```

### Build & Test
```bash
npm run build    # Verify TypeScript (make sure new component imports work)
npm run dev      # Test locally
```

### No Env Var Changes
- Uses existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## Future Enhancements

```typescript
// Can add to ArchiveView later:
- [ ] Search/filter archived quotes
- [ ] Bulk restore
- [ ] Sort by date archived
- [ ] Archive statistics
- [ ] Auto-delete after 30/60/90 days
- [ ] Export archived quotes as CSV
```

---

## Implementation Order

1. **Step 1**: Update CLAUDE.md (5 min)
2. **Step 2**: Create `src/components/ArchiveView.tsx` (10 min)
3. **Step 3-6**: Update App.tsx state and handlers (15 min)
4. **Step 7-9**: Add imports, view logic, button (10 min)
5. **Test**: Follow checklist (15 min)
6. **Build**: `npm run build` to verify types (5 min)

**Total: ~60 minutes**

---

## Ready to Implement?

This approach:
- ✅ Extracts ArchiveView as separate component
- ✅ Matches your current architecture
- ✅ Better than inline components
- ✅ Professional and scalable
- ✅ Easy to test and maintain

Follow steps 1-9 in order. Each step is isolated and testable.

Questions before starting? 🚀
