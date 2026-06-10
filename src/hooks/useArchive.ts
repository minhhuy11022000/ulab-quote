import { useState, useEffect, useCallback } from "react";
import type { Quote } from "../types";
import { supabase } from "../supabase";
import { QUOTES_TABLE, ARCHIVED_QUOTES_TABLE } from "../lib/constants";

interface Params {
  quotes: Quote[];
  activeId: string;
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  setActiveId: (id: string) => void;
}

export function useArchive({ quotes, activeId, setQuotes, setActiveId }: Params) {
  const [archivedQuotes, setArchivedQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from(ARCHIVED_QUOTES_TABLE)
        .select("id, client_name, data")
        .order("archived_at", { ascending: false });
      if (error) {
        console.error("Failed to load archived quotes:", error);
        return;
      }
      if (data) {
        const parsed: Quote[] = data.map((row: { id: string; client_name: string | null; data: Omit<Quote, "clientName"> }) => ({
          ...row.data,
          clientName: row.client_name ?? "",
        }));
        setArchivedQuotes(parsed);
      }
    };
    load();
  }, []);

  const archiveQuote = useCallback(async (id: string) => {
    const q = quotes.find(x => x.id === id);
    if (!q) return;
    if (!confirm(`Lưu trữ khách hàng "${q.clientName}"?`)) return;

    const { clientName, ...rest } = q;
    const now = new Date().toISOString();

    // 1. DB first — only update state if this succeeds
    const { error: insertError } = await supabase
      .from(ARCHIVED_QUOTES_TABLE)
      .insert({
        id,
        client_name: clientName,
        data: rest,
        created_at: q.createdAt,
        updated_at: now,
        archived_at: now,
      });
    if (insertError) {
      console.error("Failed to insert into archived_quotes:", insertError);
      return;
    }

    const { error: deleteError } = await supabase
      .from(QUOTES_TABLE)
      .delete()
      .eq("id", id);
    if (deleteError) {
      console.error("Failed to delete from quotes:", deleteError);
      return;
    }

    // 2. State only after DB success
    const next = quotes.filter(x => x.id !== id);
    if (id === activeId && next.length) setActiveId(next[0].id);
    setQuotes(next);
    setArchivedQuotes(prev => [q, ...prev]);
  }, [quotes, activeId, setQuotes, setActiveId]);

  const restoreQuote = useCallback(async (id: string) => {
    const q = archivedQuotes.find(x => x.id === id);
    if (!q) return;

    const { clientName, ...rest } = q;

    // 1. DB first — only update state if this succeeds
    const { error: insertError } = await supabase
      .from(QUOTES_TABLE)
      .insert({ id, client_name: clientName, data: rest });
    if (insertError) {
      console.error("Failed to restore quote to quotes:", insertError);
      return;
    }

    const { error: deleteError } = await supabase
      .from(ARCHIVED_QUOTES_TABLE)
      .delete()
      .eq("id", id);
    if (deleteError) {
      console.error("Failed to delete from archived_quotes:", deleteError);
      return;
    }

    // 2. State only after DB success
    setQuotes(prev => [...prev, q]);
    setArchivedQuotes(prev => prev.filter(x => x.id !== id));
  }, [archivedQuotes, setQuotes]);

  return { archiveQuote, restoreQuote, archivedQuotes };
}
