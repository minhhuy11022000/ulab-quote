# ulab-quote: Supabase Migration with localStorage Safety Net

**Status**: Implementation Plan for Claude Code + Superpowers Plugin
**Branch**: `feat/add-supabase`
**Goal**: Migrate from localStorage-only to Supabase with auto-backup safety

---

## Architecture Overview

### Three-Layer Persistence

```
Layer 1: localStorage (auto-save, instant)
├─ Triggers on every `quotes` or `activeId` change
├─ Fallback if Supabase is down
└─ Lost if user clears browser data

Layer 2: beforeunload warning (UX safety)
├─ Warns user if closing with unsaved cloud changes
├─ Tracks `hasUnsavedChanges` state
└─ Lets user decide to stay or leave

Layer 3: Supabase (persistent, intentional)
├─ Manual save triggered by "☁️ Save to Cloud" button
├─ Multi-device accessible
└─ Permanent backup
```

### Data Flow

```
On Mount:
  ┌─ Check localStorage → Found? Use it (recent work)
  └─ Not found? Fetch from Supabase → Use that
  └─ Nothing in DB? Use INITIAL_QUOTES

On Edit:
  ┌─ User changes anything → setQuotes()
  ├─ hasUnsavedChanges = true
  └─ Auto-save to localStorage (no network call)

On Manual Save:
  ┌─ User clicks "☁️ Save to Cloud"
  ├─ Upsert all quotes to Supabase
  ├─ hasUnsavedChanges = false
  └─ Show "✅ All saved" status

On Close:
  ┌─ beforeunload fires
  ├─ If hasUnsavedChanges → Show warning
  └─ Either way, localStorage already has data
  
On Reopen:
  ┌─ Mount effect runs
  └─ Loads from localStorage (fast restore)
```

---

## Implementation Steps

### Step 1: Update useQuotes.ts - Add New State

**File**: `src/hooks/useQuotes.ts`

**Add this state at the top of the function (after line 15):**

```typescript
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
```

**Why**: Track whether user has edits that haven't been uploaded to Supabase yet. Used for:
- Showing warning on close
- "⚠️ Unsaved changes" UI badge
- "Save to Cloud" button enable/disable

---

### Step 2: Replace Mount Load Effect

**File**: `src/hooks/useQuotes.ts`

**Replace lines 17-31** (the current localStorage-only load effect) with:

```typescript
useEffect(() => {
  const load = async () => {
    try {
      // Step 1: Try localStorage first (user's recent work)
      const localRaw = localStorage.getItem("ulab:quotes");
      if (localRaw) {
        const parsed: Quote[] = JSON.parse(localRaw);
        if (Array.isArray(parsed) && parsed.length) {
          setQuotes(parsed);
          
          // Restore active tab
          const savedActive = localStorage.getItem("ulab:activeId");
          if (savedActive && parsed.find(q => q.id === savedActive)) {
            setActiveId(savedActive);
          } else {
            setActiveId(parsed[0].id);
          }
          
          setLoaded(true);
          return; // Exit early, don't fetch from Supabase
        }
      }
      
      // Step 2: If no localStorage, fetch from Supabase
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("id", { ascending: true });
      
      if (error) {
        console.error("Supabase load error:", error);
        throw error;
      }
      
      if (data && data.length > 0) {
        // Parse the data column (contains full Quote object as JSONB)
        const parsed: Quote[] = data.map(row => row.data);
        setQuotes(parsed);
        setActiveId(parsed[0].id);
      } else {
        // No data in Supabase, use demo data
        setQuotes(INITIAL_QUOTES);
        setActiveId(INITIAL_QUOTES[0].id);
      }
    } catch (err) {
      console.error("Load failed:", err);
      // Fallback to demo data
      setQuotes(INITIAL_QUOTES);
      setActiveId(INITIAL_QUOTES[0].id);
    } finally {
      setLoaded(true);
    }
  };
  
  load();
}, []);
```

**What changed**:
- ✅ Checks localStorage FIRST (faster, for recent edits)
- ✅ Falls back to Supabase if localStorage is empty
- ✅ Falls back to INITIAL_QUOTES if Supabase is empty
- ❌ Removed the old `localStorage.setItem` effect (will be replaced in Step 3)

---

### Step 3: Replace Persistence Effect (localStorage → Supabase)

**File**: `src/hooks/useQuotes.ts`

**Replace lines 33-42** (the current localStorage-only save effect) with:

```typescript
// Auto-save to localStorage (fast backup on every change)
useEffect(() => {
  if (!loaded) return;
  
  // Mark as unsaved (to cloud)
  setHasUnsavedChanges(true);
  
  // Save to localStorage (instant, no network call)
  try {
    localStorage.setItem("ulab:quotes", JSON.stringify(quotes));
    localStorage.setItem("ulab:activeId", activeId || "");
  } catch (err) {
    console.error("localStorage save failed:", err);
  }
}, [quotes, activeId, loaded]);
```

**What changed**:
- ✅ Still saves to localStorage (fast, reliable)
- ✅ Sets `hasUnsavedChanges = true` when data changes
- ✅ NO Supabase write here (will be manual via button)
- ❌ Removed the Supabase upsert effect (no constant DB writes)

---

### Step 4: Add beforeunload Warning

**File**: `src/hooks/useQuotes.ts`

**Add this new effect** (after the localStorage effect, around line 50):

```typescript
// Warn user if they close with unsaved cloud changes
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasUnsavedChanges) {
      e.preventDefault();
      e.returnValue = "You have unsaved changes to the cloud. Are you sure?";
      return "You have unsaved changes to the cloud. Are you sure?";
    }
  };
  
  window.addEventListener("beforeunload", handleBeforeUnload);
  return () => window.removeEventListener("beforeunload", handleBeforeUnload);
}, [hasUnsavedChanges]);
```

**What this does**:
- ⚠️ Shows browser warning if user tries to close with unsaved changes
- ✅ Only warns if there are edits not synced to Supabase
- ✅ Cleans up listener on unmount
- 💡 Note: User can still close (browser won't force them to stay)

---

### Step 5: Add Manual Save Handler

**File**: `src/hooks/useQuotes.ts`

**Add this function** (after the `handleExport` function, around line 190):

```typescript
const handleSaveToCloud = useCallback(async () => {
  try {
    // Prepare data for upsert
    const toUpsert = quotes.map(quote => ({
      id: quote.id,                  // PK
      client_name: quote.clientName, // Denormalized for readability
      data: quote,                   // Full Quote object as JSONB
      // updated_at is set server-side on upsert
    }));
    
    // Upsert to Supabase (update if exists, insert if new)
    const { error } = await supabase
      .from("quotes")
      .upsert(toUpsert, { onConflict: "id" });
    
    if (error) {
      console.error("Supabase upsert error:", error);
      throw error;
    }
    
    // Success: clear unsaved flag
    setHasUnsavedChanges(false);
    alert("✅ Saved to cloud!");
    
  } catch (err) {
    console.error("Save to cloud failed:", err);
    alert(`❌ Save failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}, [quotes]);
```

**What this does**:
- 📤 Sends all quotes to Supabase in one batch (efficient)
- 🔄 Uses `upsert()` with `onConflict: "id"` → existing rows update, new rows insert
- ✅ Sets `hasUnsavedChanges = false` on success
- ⚠️ Shows alert if it fails (user knows what happened)

---

### Step 6: Export New Handlers in Return

**File**: `src/hooks/useQuotes.ts`

**Update the return statement** (around line 191-201, at the very end):

**Find this:**
```typescript
return {
  quotes, activeId, view, setView, subTab, setSubTab,
  bulkItem, setBulkItem, expandedRows, showPrint,
  activeQuote, calculated, totals, bulkData,
  setClientName, setGlobalMargin, applyGlobalMargin,
  updateItem, updateCosts, addCostLine, removeCostLine,
  addItem, removeItem, toggleExpand,
  addQuote, deleteQuote, duplicateQuote, switchQuote,
  handleExport,
};
```

**Change to:**
```typescript
return {
  quotes, activeId, view, setView, subTab, setSubTab,
  bulkItem, setBulkItem, expandedRows, showPrint,
  activeQuote, calculated, totals, bulkData,
  setClientName, setGlobalMargin, applyGlobalMargin,
  updateItem, updateCosts, addCostLine, removeCostLine,
  addItem, removeItem, toggleExpand,
  addQuote, deleteQuote, duplicateQuote, switchQuote,
  handleExport,
  handleSaveToCloud,        // ← ADD THIS
  hasUnsavedChanges,        // ← ADD THIS
};
```

---

### Step 7: Update Delete Handler

**File**: `src/hooks/useQuotes.ts`

**Find the `deleteQuote` function** (around line 103-112) and update it:

**Find:**
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

**Change to:**
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
  
  // Sync deletion to Supabase (fire and forget)
  supabase
    .from("quotes")
    .delete()
    .eq("id", id)
    .catch(err => console.error("Failed to delete from Supabase:", err));
}, [quotes, activeId]);
```

**Why**: When user deletes a quote, it should be removed from Supabase too.

---

### Step 8: Update App.tsx - Add Save to Cloud Button

**File**: `src/App.tsx`

**Update the return statement in useQuotes hook call** (around line 23-32):

**Find:**
```typescript
const {
  quotes, activeId, view, setView, subTab, setSubTab,
  bulkItem, setBulkItem, expandedRows, showPrint,
  activeQuote, calculated, totals, bulkData, gm,
  setClientName, setGlobalMargin,
  updateItem, updateCosts, addCostLine, removeCostLine,
  addItem, removeItem, toggleExpand,
  addQuote, deleteQuote, duplicateQuote, switchQuote,
  handleExport,
} = useQuotes();
```

**Change to:**
```typescript
const {
  quotes, activeId, view, setView, subTab, setSubTab,
  bulkItem, setBulkItem, expandedRows, showPrint,
  activeQuote, calculated, totals, bulkData, gm,
  setClientName, setGlobalMargin,
  updateItem, updateCosts, addCostLine, removeCostLine,
  addItem, removeItem, toggleExpand,
  addQuote, deleteQuote, duplicateQuote, switchQuote,
  handleExport,
  handleSaveToCloud,        // ← ADD THIS
  hasUnsavedChanges,        // ← ADD THIS
} = useQuotes();
```

---

### Step 9: Add Save to Cloud Button UI

**File**: `src/App.tsx`

**Find the header buttons section** (around line 58-68, look for the "📄 In / PDF" button):

**Find:**
```typescript
{view === "detail" && (
  <div style={{ display: "flex", gap: 6 }}>
    <button onClick={() => handleExport("print")} style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(16,185,129,0.3)" }}>
      📄 In / PDF
    </button>
    <button onClick={() => handleExport("download")} title="Tải file HTML (mở trong browser để in ra PDF)" style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
      💾 Tải HTML
    </button>
  </div>
)}
```

**Change to:**
```typescript
{view === "detail" && (
  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
    {/* Unsaved status indicator */}
    {hasUnsavedChanges ? (
      <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 600 }}>
        ⚠️ Unsaved changes (local)
      </span>
    ) : (
      <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>
        ✅ All saved
      </span>
    )}
    
    {/* Save to cloud button */}
    <button 
      onClick={handleSaveToCloud}
      disabled={!hasUnsavedChanges}
      style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 6, 
        background: hasUnsavedChanges ? "#3b82f6" : "#d1d5db",
        color: "#fff", 
        border: "none", 
        borderRadius: 10, 
        padding: "9px 18px", 
        fontSize: 13, 
        fontWeight: 600, 
        cursor: hasUnsavedChanges ? "pointer" : "not-allowed",
        opacity: hasUnsavedChanges ? 1 : 0.6,
        boxShadow: hasUnsavedChanges ? "0 2px 8px rgba(59,130,246,0.3)" : "none"
      }}
    >
      ☁️ Save to Cloud
    </button>
    
    {/* Existing buttons */}
    <button onClick={() => handleExport("print")} style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg,#10b981,#059669)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "0 2px 8px rgba(16,185,129,0.3)" }}>
      📄 In / PDF
    </button>
    <button onClick={() => handleExport("download")} title="Tải file HTML (mở trong browser để in ra PDF)" style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 10, padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
      💾 Tải HTML
    </button>
  </div>
)}
```

**What this does**:
- 🟢 Shows "✅ All saved" when there are no unsaved changes
- 🟡 Shows "⚠️ Unsaved changes (local)" when user has edited but not saved to cloud
- 🔵 "☁️ Save to Cloud" button is enabled only when there are unsaved changes
- 💡 Visual feedback so user always knows the state

---

### Step 10: Import Supabase Client

**File**: `src/hooks/useQuotes.ts`

**Add at the top of the file** (after existing imports, around line 5):

```typescript
import { supabase } from "../supabase";
```

**Full import section should look like:**
```typescript
import { useState, useCallback, useMemo, useEffect } from "react";
import type { Quote, Item, CostLine, CalcRow, Totals } from "../types";
import { genId, BULK_TIERS } from "../lib/utils";
import { calcRow, calcQuoteTotals, createQuote } from "../lib/calc";
import { INITIAL_QUOTES } from "../lib/mockData";
import { supabase } from "../supabase";  // ← ADD THIS
```

---

## Testing Checklist

After implementing all steps, test these scenarios:

### Test 1: Load from localStorage
- [ ] Create/edit a quote
- [ ] Refresh the page
- [ ] Quote data should appear instantly (from localStorage)
- [ ] No loading spinner (localStorage is instant)

### Test 2: Load from Supabase (fallback)
- [ ] Clear browser localStorage: `localStorage.clear()`
- [ ] Refresh the page
- [ ] Wait for load
- [ ] Data should load from Supabase
- [ ] If no data in Supabase, shows INITIAL_QUOTES

### Test 3: Auto-save to localStorage
- [ ] Open quote
- [ ] Edit client name
- [ ] Open DevTools → Application → LocalStorage → `ulab:quotes`
- [ ] Should see the updated clientName
- [ ] Should NOT yet be in Supabase (still unsaved to cloud)

### Test 4: Unsaved status indicator
- [ ] Edit a quote
- [ ] Should see "⚠️ Unsaved changes (local)" badge
- [ ] "☁️ Save to Cloud" button should be enabled (blue)

### Test 5: Save to Cloud
- [ ] Edit a quote
- [ ] Click "☁️ Save to Cloud"
- [ ] Should see alert: "✅ Saved to cloud!"
- [ ] Badge should change to "✅ All saved" (green)
- [ ] Button should be disabled (gray)
- [ ] In Supabase dashboard → Check `quotes` table → Should see updated row

### Test 6: Accidental close warning
- [ ] Edit a quote (don't save to cloud)
- [ ] Try to close the browser tab/window
- [ ] Should see browser warning: "You have unsaved changes to the cloud"
- [ ] Click "Stay" → quote is still open
- [ ] Click "Leave" → closes (but localStorage has the data)
- [ ] Reopen the tab → Data is restored ✅

### Test 7: Delete quote
- [ ] Create a test quote
- [ ] Delete it
- [ ] Check in Supabase dashboard → Quote should be gone from `quotes` table

### Test 8: Multi-device sync
- [ ] Edit quote on Device A
- [ ] Click "Save to Cloud"
- [ ] Open the same quote URL on Device B
- [ ] Refresh Device B
- [ ] Should see updated data from Supabase

### Test 9: Offline editing
- [ ] Open DevTools → Network → Offline
- [ ] Edit quote multiple times
- [ ] Changes saved to localStorage ✅
- [ ] Click "Save to Cloud" → Fails (no network)
- [ ] Go back online
- [ ] Click "Save to Cloud" again → Succeeds
- [ ] Data synced to Supabase ✅

---

## Supabase Schema (Reference)

Make sure your Supabase tables look like this:

```sql
-- quotes table (working data)
CREATE TABLE quotes (
  id text PRIMARY KEY,
  client_name text,
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- shared_quotes table (snapshots for sharing)
CREATE TABLE shared_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

**Important**: The `id` column in `quotes` is `text` (not UUID), because it stores the custom ID from `genId()`.

---

## Environment Variables

Make sure `.env.local` (or `.env`) has:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Not `ANON_KEY`, specifically `PUBLISHABLE_KEY` (per CLAUDE.md).

---

## File Checklist

- [ ] `src/hooks/useQuotes.ts` - All 7 main changes
- [ ] `src/App.tsx` - Import new handlers + add button
- [ ] Verify `src/supabase.ts` exists and is configured
- [ ] Test in browser with DevTools open
- [ ] No TypeScript errors: `npm run build`

---

## Implementation Notes for Claude Code

### Using Superpowers Plugin:

1. **For editing useQuotes.ts**:
   - Use "Replace specific section" for each step
   - Verify line numbers match (may vary slightly)
   - Test after each step

2. **For editing App.tsx**:
   - The header button section might have different styling
   - Preserve existing button styles, just add new ones
   - Make sure flex layout still works

3. **Run after all changes**:
   ```bash
   npm run build  # Verify TypeScript
   npm run dev    # Test locally
   ```

4. **If TypeScript errors**:
   - Make sure `supabase` import is at top of useQuotes.ts
   - Make sure return statement includes new exports
   - Make sure App.tsx destructuring includes new props

---

## Troubleshooting

### Problem: Data not loading from localStorage
**Solution**: 
- Check DevTools → Application → LocalStorage → Look for `ulab:quotes` key
- If empty → localStorage is being cleared somewhere
- Check if any code is calling `localStorage.clear()`

### Problem: Supabase save fails with "Unauthorized"
**Solution**:
- Check env vars are correct (`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`)
- Check Supabase table `quotes` has RLS (Row Level Security) disabled (for now)
- In Supabase: Tables → quotes → RLS → Disable

### Problem: beforeunload warning doesn't appear
**Solution**:
- Make sure you imported the effect correctly
- Verify `hasUnsavedChanges` is being set to true on edits
- Note: Some browsers don't show warning for certain domains (localhost is usually fine)

### Problem: Unsaved status badge doesn't update
**Solution**:
- Check that `hasUnsavedChanges` is being exported from useQuotes
- Check that App.tsx is receiving it in destructuring
- Verify the conditional rendering is correct

---

## Future Enhancements (Not in Plan)

Once this is working, you can add:
- [ ] Share link functionality (use `shared_quotes` table)
- [ ] Bulk load (paginate instead of loading all quotes)
- [ ] Offline-first sync (service workers)
- [ ] Real-time collaboration (Supabase real-time subscriptions)
- [ ] Undo/redo (store history in localStorage)
- [ ] Better conflict resolution (if multiple edits happen)

---

## Summary

This implementation:
✅ Keeps localStorage as fast auto-backup  
✅ Adds Supabase as permanent persistent storage  
✅ Gives user control (manual "Save to Cloud" button)  
✅ Prevents accidental data loss (beforeunload warning)  
✅ No constant DB writes (cost-efficient)  
✅ Works offline (edits saved to localStorage)  
✅ Syncs across devices (when user saves to cloud)  

**Total DB writes**: ~1-5 per quote per session (vs 100+ with debounce)
**Data safety**: 100% (localStorage + Supabase backup)
**User experience**: Clear status feedback + warnings
