import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { Quote, Item, CostLine, CalcRow, Totals } from "../types";
import { genId, BULK_TIERS } from "../lib/utils";
import { ACTIVE_ID_KEY, QUOTES_TABLE, DEFAULT_GLOBAL_MARGIN, DEFAULT_ITEM_QTY, DEFAULT_COST_LABEL, DELETE_UNDO_DURATION_MS } from "../lib/constants";
import { calcRow, calcQuoteTotals, createQuote } from "../lib/calc";
import { INITIAL_QUOTES } from "../lib/mockData";
import { supabase } from "../supabase";
import { usePersistence } from "./usePersistence";
import { useExport } from "./useExport";

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>(INITIAL_QUOTES);
  const [activeId, setActiveId] = useState(INITIAL_QUOTES[0].id);
  const [view, setView] = useState("detail");
  const [subTab, setSubTab] = useState("quote");
  const [bulkItem, setBulkItem] = useState(0);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [pendingDelete, setPendingDelete] = useState<{ quote: Quote; idx: number } | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingIdRef = useRef<string | null>(null);

  const { saveStatus, loaded } = usePersistence(quotes, (parsed, savedActiveId) => {
    setQuotes(parsed);
    if (savedActiveId && parsed.find(q => q.id === savedActiveId)) {
      setActiveId(savedActiveId);
    } else {
      setActiveId(parsed[0].id);
    }
  });

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(ACTIVE_ID_KEY, activeId);
  }, [activeId, loaded]);

  useEffect(() => { setBulkItem(0); setExpandedRows({}); }, [activeId]);

  const activeQuote = useMemo(
    () => quotes.find(q => q.id === activeId) ?? quotes[0],
    [quotes, activeId]
  );

  const { handleExport, showPrint } = useExport(activeQuote);

  const updateActiveQuote = useCallback((updater: (q: Quote) => Quote) => {
    setQuotes(prev => prev.map(q => q.id === activeId ? updater(q) : q));
  }, [activeId]);

  const setClientName = useCallback((name: string) =>
    updateActiveQuote(q => ({ ...q, clientName: name })), [updateActiveQuote]);

  const setGlobalMargin = useCallback((m: number) =>
    updateActiveQuote(q => ({ ...q, globalMargin: m })), [updateActiveQuote]);

  const setShareId = useCallback((id: string) =>
    updateActiveQuote(q => ({ ...q, shareId: id })), [updateActiveQuote]);

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
      items: [...q.items, { id: q.nextId, name: "", qty: DEFAULT_ITEM_QTY, costs: [{ label: DEFAULT_COST_LABEL, value: 0 }], margin: q.globalMargin / 100, priceOverride: null }],
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

  const commitDelete = (id: string) => {
    supabase.from(QUOTES_TABLE).delete().eq("id", id)
      .then(({ error }) => { if (error) console.error("Failed to delete from Supabase:", error); });
  };

  useEffect(() => () => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      if (pendingIdRef.current) commitDelete(pendingIdRef.current);
    }
  }, []);

  const deleteQuote = useCallback((id: string) => {
    const q = quotes.find(x => x.id === id);
    if (!q) return;
    if (!confirm(`Xoá khách hàng "${q.clientName}"?`)) return;
    const idx = quotes.findIndex(x => x.id === id);

    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current);
      if (pendingIdRef.current) commitDelete(pendingIdRef.current);
    }

    setQuotes(prev => {
      const next = prev.filter(x => x.id !== id);
      if (id === activeId && next.length) setActiveId(next[0].id);
      return next;
    });

    pendingIdRef.current = id;
    setPendingDelete({ quote: q, idx });
    deleteTimerRef.current = setTimeout(() => {
      setPendingDelete(null);
      pendingIdRef.current = null;
      deleteTimerRef.current = null;
      commitDelete(id);
    }, DELETE_UNDO_DURATION_MS);
  }, [quotes, activeId]);

  const undoDelete = useCallback(() => {
    if (!pendingDelete || !deleteTimerRef.current) return;
    clearTimeout(deleteTimerRef.current);
    deleteTimerRef.current = null;
    pendingIdRef.current = null;
    setQuotes(prev => {
      const next = [...prev];
      next.splice(pendingDelete.idx, 0, pendingDelete.quote);
      return next;
    });
    setActiveId(pendingDelete.quote.id);
    setPendingDelete(null);
  }, [pendingDelete]);

  const dismissDelete = useCallback(() => setPendingDelete(null), []);

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

  const gm = activeQuote ? activeQuote.globalMargin / 100 : DEFAULT_GLOBAL_MARGIN / 100;

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

  return {
    quotes, activeId, view, setView, subTab, setSubTab,
    bulkItem, setBulkItem, expandedRows, showPrint,
    activeQuote, calculated, totals, bulkData, gm,
    setClientName, setGlobalMargin, setShareId,
    updateItem, updateCosts, addCostLine, removeCostLine,
    addItem, removeItem, toggleExpand,
    addQuote, deleteQuote, duplicateQuote, switchQuote,
    pendingDelete, undoDelete, dismissDelete,
    handleExport, saveStatus, loaded,
  };
}
