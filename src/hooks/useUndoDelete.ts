import { useState, useCallback, useEffect, useRef } from "react";
import type { Quote } from "../types";
import { supabase } from "../supabase";
import { TABLES, DELETE_UNDO_DURATION_MS } from "../lib/constants";

interface Params {
  quotes: Quote[];
  activeId: string;
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  setActiveId: (id: string) => void;
}

export function useUndoDelete({ quotes, activeId, setQuotes, setActiveId }: Params) {
  const [pendingDelete, setPendingDelete] = useState<{ quote: Quote; idx: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingIdRef = useRef<string | null>(null);

  const commitDelete = (id: string) => {
    supabase.from(TABLES.QUOTES).delete().eq("id", id)
      .then(({ error }) => { if (error) console.error("Failed to delete from Supabase:", error); });
  };

  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      if (pendingIdRef.current) commitDelete(pendingIdRef.current);
    }
  }, []);

  const deleteQuote = useCallback((id: string) => {
    const q = quotes.find(x => x.id === id);
    if (!q) return;
    if (!confirm(`Xoá khách hàng "${q.clientName}"?`)) return;
    const idx = quotes.findIndex(x => x.id === id);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      if (pendingIdRef.current) commitDelete(pendingIdRef.current);
    }

    setQuotes(prev => {
      const next = prev.filter(x => x.id !== id);
      if (id === activeId && next.length) setActiveId(next[0].id);
      return next;
    });

    pendingIdRef.current = id;
    setPendingDelete({ quote: q, idx });
    timerRef.current = setTimeout(() => {
      setPendingDelete(null);
      pendingIdRef.current = null;
      timerRef.current = null;
      commitDelete(id);
    }, DELETE_UNDO_DURATION_MS);
  }, [quotes, activeId, setQuotes, setActiveId]);

  const undoDelete = useCallback(() => {
    if (!pendingDelete || !timerRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
    pendingIdRef.current = null;
    setQuotes(prev => {
      const next = [...prev];
      next.splice(pendingDelete.idx, 0, pendingDelete.quote);
      return next;
    });
    setActiveId(pendingDelete.quote.id);
    setPendingDelete(null);
  }, [pendingDelete, setQuotes, setActiveId]);

  const dismissDelete = useCallback(() => setPendingDelete(null), []);

  return { deleteQuote, undoDelete, dismissDelete, pendingDelete };
}
