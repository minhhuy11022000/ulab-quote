import { useState, useCallback, useMemo, useEffect } from "react";
import type { Quote, Item, CostLine, CalcRow, Totals } from "../types";
import { genId, BULK_TIERS } from "../lib/utils";
import { calcRow, calcQuoteTotals, createQuote } from "../lib/calc";
import { INITIAL_QUOTES } from "../lib/mockData";

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [activeId, setActiveId] = useState(INITIAL_QUOTES[0].id);
  const [view, setView] = useState("detail");
  const [loaded, setLoaded] = useState(false);
  const [subTab, setSubTab] = useState("quote");
  const [bulkItem, setBulkItem] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [showPrint, setShowPrint] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ulab:quotes");
      if (raw) {
        const parsed: Quote[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length) {
          setQuotes(parsed);
          const a = localStorage.getItem("ulab:active");
          if (a && parsed.find(q => q.id === a)) setActiveId(a);
          else setActiveId(parsed[0].id);
        }
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem("ulab:quotes", JSON.stringify(quotes));
        localStorage.setItem("ulab:active", activeId || "");
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [quotes, activeId, loaded]);

  useEffect(() => { setBulkItem(0); setExpandedRows({}); }, [activeId]);

  const activeQuote = useMemo(
    () => quotes.find(q => q.id === activeId) ?? quotes[0],
    [quotes, activeId]
  );

  const updateActiveQuote = useCallback((updater: (q: Quote) => Quote) => {
    setQuotes(prev => prev.map(q => q.id === activeId ? updater(q) : q));
  }, [activeId]);

  const setClientName = useCallback((name: string) =>
    updateActiveQuote(q => ({ ...q, clientName: name })), [updateActiveQuote]);

  const setGlobalMargin = useCallback((m: number) =>
    updateActiveQuote(q => ({ ...q, globalMargin: m })), [updateActiveQuote]);

  const updateItem = useCallback((itemId: number, field: keyof Item, val: Item[keyof Item]) => {
    updateActiveQuote(q => ({ ...q, items: q.items.map(it => it.id === itemId ? { ...it, [field]: val } : it) }));
  }, [updateActiveQuote]);

  const updateCosts = useCallback((itemId: number, newCosts: CostLine[]) => {
    updateActiveQuote(q => ({ ...q, items: q.items.map(it => it.id === itemId ? { ...it, costs: newCosts } : it) }));
  }, [updateActiveQuote]);

  const addCostLine = useCallback((itemId: number) => {
    updateActiveQuote(q => ({ ...q, items: q.items.map(it => it.id === itemId ? { ...it, costs: [...it.costs, { label: "", value: 0 }] } : it) }));
  }, [updateActiveQuote]);

  const removeCostLine = useCallback((itemId: number, idx: number) => {
    updateActiveQuote(q => ({ ...q, items: q.items.map(it => it.id === itemId ? { ...it, costs: it.costs.filter((_, i) => i !== idx) } : it) }));
  }, [updateActiveQuote]);

  const addItem = useCallback(() => {
    updateActiveQuote(q => ({
      ...q,
      items: [...q.items, { id: q.nextId, name: "", qty: 100, costs: [{ label: "Phôi", value: 0 }], margin: q.globalMargin / 100, priceOverride: null }],
      nextId: q.nextId + 1,
    }));
  }, [updateActiveQuote]);

  const removeItem = useCallback((itemId: number) =>
    updateActiveQuote(q => ({ ...q, items: q.items.filter(it => it.id !== itemId) })),
    [updateActiveQuote]);

  const toggleExpand = useCallback((id: number) =>
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] })), []);

  const addQuote = useCallback(() => {
    const newQ = createQuote(`Khách hàng ${quotes.length + 1}`);
    setQuotes(prev => [...prev, newQ]);
    setActiveId(newQ.id);
    setView("detail");
  }, [quotes.length]);

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

  const duplicateQuote = useCallback((id: string) => {
    const q = quotes.find(x => x.id === id);
    if (!q) return;
    const copy: Quote = { ...q, id: genId(), clientName: q.clientName + " (copy)", createdAt: new Date().toISOString() };
    setQuotes(prev => {
      const idx = prev.findIndex(x => x.id === id);
      return [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)];
    });
    setActiveId(copy.id);
    setView("detail");
  }, [quotes]);

  const switchQuote = useCallback((id: string) => { setActiveId(id); setView("detail"); }, []);

  const gm = activeQuote ? activeQuote.globalMargin / 100 : 0.35;

  const calculated = useMemo<CalcRow[]>(
    () => activeQuote?.items.map(it => ({ ...it, ...calcRow(it, gm) })) ?? [],
    [activeQuote, gm]
  );

  const totals = useMemo<Totals>(
    () => activeQuote ? calcQuoteTotals(activeQuote) : { totalCost: 0, totalRev: 0, profit: 0, margin: 0 },
    [activeQuote]
  );

  const bulkData = useMemo(() => {
    const base = calculated[bulkItem];
    if (!base) return [];
    return BULK_TIERS.map(tier => {
      const nQ = Math.round(base.qty * tier.factor);
      const nC = Math.round(base.unitCost * (1 - tier.costDelta));
      const nP = Math.ceil(nC / (1 - gm) / 100) * 100;
      return { ...tier, nQ, nC, nP, nTC: nQ * nC, nTR: nQ * nP, nPr: nQ * nP - nQ * nC };
    });
  }, [calculated, bulkItem, gm]);

  const handleExport = useCallback((mode = "print") => {
    setShowPrint(true);
    setTimeout(() => {
      const el = document.getElementById("print-area");
      if (!el) { setShowPrint(false); return; }
      const safeName = (activeQuote.clientName || "BaoGia").replace(/[^\wÀ-ỹ\s-]/g, "").trim();
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ULAB Báo Giá - ${safeName}</title><style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');body{margin:0;font-family:'Inter',system-ui,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}@media print{@page{margin:10mm}body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body>${el.innerHTML}</body></html>`;

      if (mode === "download") {
        const blob = new Blob([html], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ULAB-BaoGia-${safeName}-${new Date().toISOString().slice(0, 10)}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setShowPrint(false);
        return;
      }

      const existing = document.getElementById("ulab-print-iframe");
      if (existing) existing.remove();
      const iframe = document.createElement("iframe") as HTMLIFrameElement;
      iframe.id = "ulab-print-iframe";
      iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (err) {
            console.error("Print failed, falling back to download:", err);
            handleExport("download");
          }
          setShowPrint(false);
        }, 500);
      };
      document.body.appendChild(iframe);
      iframe.srcdoc = html;
    }, 100);
  }, [activeQuote]);

  return {
    quotes, activeId, view, setView, subTab, setSubTab,
    bulkItem, setBulkItem, expandedRows, showPrint,
    activeQuote, calculated, totals, bulkData, gm,
    setClientName, setGlobalMargin,
    updateItem, updateCosts, addCostLine, removeCostLine,
    addItem, removeItem, toggleExpand,
    addQuote, deleteQuote, duplicateQuote, switchQuote,
    handleExport,
  };
}
