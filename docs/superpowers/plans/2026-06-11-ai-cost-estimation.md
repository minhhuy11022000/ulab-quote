# AI Cost Estimation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "✨ AI" button that opens a modal where the user pastes a free-form Vietnamese description of order items; Groq AI parses it into structured JSON and creates a new Quote instance in the app.

**Architecture:** `src/lib/ai.ts` owns the Groq API call, prompt, and typed response. `EstimateModal` owns the textarea/loading/error UI and fires an `onImport` callback on success. `useQuotes` gets a new `importEstimatedQuote` handler that maps the typed response to a full `Quote` and inserts it into state. Entry point is a new "✨ AI" button in `App.tsx`'s header.

**Tech Stack:** Vite + React 19, TypeScript strict, Tailwind v4, Shadcn/UI (`Dialog`, `Textarea` — must be added), Groq API (`llama-3.3-70b-versatile`) via native `fetch` (no new npm packages), `VITE_GROQ_API_KEY` env var.

> **Security note:** `VITE_*` env vars are embedded in the browser bundle. Acceptable for this private internal tool — do not use this key for anything sensitive or public-facing.

> **Why Groq instead of Gemini:** Gemini's free tier quota is 0 when any billing account is attached to the Google account, even on new projects. Groq offers a genuinely free tier (30 RPM, 14,400 req/day) with no billing required — sign up at console.groq.com with email only.

---

### Task 1: Add Shadcn Dialog + Textarea and register Groq API key

**Files:**
- Modify: `.env.local` (user action)
- Create: `src/components/ui/dialog.tsx` (via Shadcn CLI)
- Create: `src/components/ui/textarea.tsx` (via Shadcn CLI)

- [ ] **Step 1: Add Groq API key to `.env.local`**

  Sign up at **console.groq.com** → API Keys → Create API Key. Then add to `.env.local`:
  ```
  VITE_GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
  ```

- [ ] **Step 2: Install Shadcn Dialog and Textarea components**

  ```bash
  npx shadcn@latest add dialog textarea
  ```

  Expected: `src/components/ui/dialog.tsx` and `src/components/ui/textarea.tsx` created.

  > **Gotcha:** The Shadcn CLI may overwrite `src/components/ui/button.tsx` and generate incorrect import paths (`src/lib/utils` instead of `@/lib/utils`). After running the command, check all modified files and fix any `src/lib/utils` or `src/components/ui/button` imports to use `@/` prefix.

- [ ] **Step 3: Verify build still passes**

  ```bash
  npm run build
  ```

  Expected: exits 0 with no type errors.

---

### Task 2: AI service layer

**Files:**
- Create: `src/lib/ai.ts`

- [ ] **Step 1: Create `src/lib/ai.ts`**

  ```typescript
  import type { CostLine } from "../types";

  const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
  const MODEL = "llama-3.3-70b-versatile";

  export type AIEstimate = {
    clientName: string;
    items: Array<{
      name: string;
      qty: number;
      costs: CostLine[];
    }>;
  };

  const SYSTEM_PROMPT = `You are a cost estimation assistant for a Vietnamese merchandise and custom apparel business.

  Extract order information from the user's free-form text and return ONLY valid JSON with this exact shape:
  {
    "clientName": "<string: infer from context, or 'Khách hàng mới' if not mentioned>",
    "items": [
      {
        "name": "<string: product name in Vietnamese>",
        "qty": <integer: quantity, default 100 if not stated>,
        "costs": [
          { "label": "<string: cost component name>", "value": <number: cost in VND> }
        ]
      }
    ]
  }

  Rules:
  - All money values are in VND. "45k", "45.000", "45,000" → 45000.
  - If only one total cost per item is given, use a single cost line labeled "Phôi".
  - Split into multiple cost lines when the user names components (e.g. phôi, in, thêu, vận chuyển).
  - Quantity defaults to 100 when not stated.
  - Return nothing outside the JSON object.`;

  export async function estimateCosts(userInput: string): Promise<AIEstimate> {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
    if (!apiKey) {
      throw new Error("VITE_GROQ_API_KEY chưa được cấu hình trong .env.local");
    }

    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userInput },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("Groq API error:", res.status, errText);
      throw new Error(`AI lỗi (${res.status}). Vui lòng thử lại.`);
    }

    const data = await res.json() as {
      choices?: Array<{ message: { content: string } }>;
    };

    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error("AI trả về phản hồi rỗng");
    console.log("AI raw response:", raw);

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.error("AI returned invalid JSON:", raw);
      throw new Error("AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.");
    }

    const estimate = parsed as AIEstimate;
    if (typeof estimate.clientName !== "string" || !Array.isArray(estimate.items)) {
      console.error("AI response shape mismatch:", parsed);
      throw new Error("Cấu trúc dữ liệu không đúng định dạng. Vui lòng thử lại.");
    }

    return estimate;
  }
  ```

- [ ] **Step 2: Verify build passes**

  ```bash
  npm run build
  ```

  Expected: exits 0.

---

### Task 3: EstimateModal component

**Files:**
- Create: `src/components/EstimateModal.tsx`

- [ ] **Step 1: Create `src/components/EstimateModal.tsx`**

  ```typescript
  import { useState } from "react";
  import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { Textarea } from "@/components/ui/textarea";
  import { estimateCosts, type AIEstimate } from "@/lib/ai";

  interface Props {
    open: boolean;
    onClose: () => void;
    onImport: (estimate: AIEstimate) => void;
  }

  export function EstimateModal({ open, onClose, onImport }: Props) {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleClose = () => {
      if (loading) return;
      setInput("");
      setError(null);
      onClose();
    };

    const handleSubmit = async () => {
      if (!input.trim() || loading) return;
      setLoading(true);
      setError(null);
      try {
        const estimate = await estimateCosts(input.trim());
        onImport(estimate);
        setInput("");
        onClose();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi không xác định");
      } finally {
        setLoading(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={v => !v && handleClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>✨ Ước tính chi phí bằng AI</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <p className="text-sm text-muted-foreground">
              Nhập danh sách sản phẩm, số lượng và giá vốn — AI sẽ tự động tạo báo giá.
            </p>
            <p className="text-xs text-slate-400 italic">
              Ví dụ: "Áo thun trắng 100 cái, phôi 45k, in logo 5k; Nón lưỡi trai 50 cái 80.000đ"
            </p>
            <Textarea
              placeholder={"Áo thun trắng 100 cái, phôi 45k, in logo 5k\nNón lưỡi trai 50 cái 80.000đ"}
              rows={6}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              className="resize-none text-sm"
            />
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Huỷ
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !input.trim()}
              className="bg-linear-to-br from-violet-500 to-violet-600 text-white border-none shadow-[0_2px_8px_rgba(139,92,246,0.3)]"
            >
              {loading ? "Đang xử lý..." : "✨ Tạo báo giá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  ```

- [ ] **Step 2: Verify build passes**

  ```bash
  npm run build
  ```

  Expected: exits 0.

---

### Task 4: Wire into useQuotes and App

**Files:**
- Modify: `src/hooks/useQuotes.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add `importEstimatedQuote` to `useQuotes.ts`**

  Add the import after existing imports:
  ```typescript
  import type { AIEstimate } from "../lib/ai";
  ```

  Add the handler after the `duplicateQuote` callback:
  ```typescript
  const importEstimatedQuote = useCallback((estimate: AIEstimate) => {
    const items: Item[] = estimate.items.map((ei, idx) => ({
      id: idx + 1,
      name: ei.name,
      qty: ei.qty,
      costs: ei.costs,
      margin: DEFAULT_GLOBAL_MARGIN / 100,
      priceOverride: null,
    }));
    const newQ = createQuote(estimate.clientName, items);
    setQuotes(prev => [...prev, newQ]);
    setActiveId(newQ.id);
    setView("detail");
  }, []);
  ```

  Add to the return object:
  ```typescript
  return {
    quotes, activeId, view, setView, subTab, setSubTab,
    bulkItem, setBulkItem, expandedRows, showPrint,
    activeQuote, calculated, totals, bulkData, gm,
    setClientName, setGlobalMargin, setShareId,
    updateItem, updateCosts, addCostLine, removeCostLine,
    addItem, removeItem, toggleExpand,
    addQuote, deleteQuote: archiveQuote, duplicateQuote, switchQuote,
    restoreQuote, archivedQuotes,
    handleExport, saveStatus, loaded,
    importEstimatedQuote,
  };
  ```

- [ ] **Step 2: Update `App.tsx`**

  Add import:
  ```typescript
  import { EstimateModal } from "./components/EstimateModal";
  ```

  Add state:
  ```typescript
  const [estimateOpen, setEstimateOpen] = useState(false);
  ```

  Destructure `importEstimatedQuote` from `useQuotes()`.

  Add "✨ AI" button before the "📦 Lưu trữ" button:
  ```typescript
  <Button variant="outline" onClick={() => setEstimateOpen(true)} title="Tạo báo giá bằng AI">
    ✨ AI
  </Button>
  ```

  Add modal after the `{showPrint && ...}` block:
  ```typescript
  <EstimateModal
    open={estimateOpen}
    onClose={() => setEstimateOpen(false)}
    onImport={importEstimatedQuote}
  />
  ```

- [ ] **Step 3: Verify build passes**

  ```bash
  npm run build
  ```

  Expected: exits 0 with no type errors.

- [ ] **Step 4: Manually test the feature**

  ```bash
  npm run dev
  ```

  1. Click "✨ AI" button — modal opens.
  2. Paste: `Áo thun trắng 100 cái, phôi 45k, in logo 5k; Nón lưỡi trai 50 cái 80.000đ`
  3. Click "✨ Tạo báo giá" — loading state appears, browser console logs the raw JSON response.
  4. Modal closes, new quote appears in sidebar with AI-inferred client name.
  5. Items and costs match the pasted input.
  6. Test error: remove `VITE_GROQ_API_KEY` from `.env.local`, restart dev server, submit — Vietnamese error message appears.
  7. Restore the key.
