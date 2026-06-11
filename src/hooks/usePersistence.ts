import { useState, useEffect, useRef } from "react";
import type { Quote } from "../types";
import { supabase } from "../supabase";
import { ACTIVE_ID_KEY, TABLES, SAVE_DEBOUNCE_MS, SAVE_STATUS_DURATION_MS } from "../lib/constants";

export function usePersistence(
  quotes: Quote[],
  onLoad: (quotes: Quote[], savedActiveId: string | null) => void
) {
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from(TABLES.QUOTES)
          .select("data, client_name")
          .order("id", { ascending: true });

        if (!error && data && data.length > 0) {
          const parsed: Quote[] = data.map((row: { data: Omit<Quote, "clientName">; client_name: string | null }) => ({
            ...row.data,
            clientName: row.client_name ?? "",
          }));
          const savedActiveId = localStorage.getItem(ACTIVE_ID_KEY);
          onLoad(parsed, savedActiveId);
        }
      } catch (err) {
        console.error("Load failed:", err);
      } finally {
        setLoaded(true);
      }
    };
    load();
  // onLoad is stable because it captures only state setters (guaranteed stable by React)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }
    setSaveStatus("saving");
    const t = setTimeout(async () => {
      const { error } = await supabase
        .from(TABLES.QUOTES)
        .upsert(quotes.map(q => {
          const { clientName, ...rest } = q;
          return { id: q.id, client_name: clientName, data: rest };
        }), { onConflict: "id" });
      if (error) {
        console.error("Auto-save failed:", error);
        setSaveStatus("idle");
      } else {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), SAVE_STATUS_DURATION_MS);
      }
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [quotes, loaded]);

  return { saveStatus, loaded };
}
