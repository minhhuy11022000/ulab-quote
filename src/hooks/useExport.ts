import { useState, useCallback } from "react";
import type { Quote } from "../types";
import { PRINT_AREA_ID, PRINT_IFRAME_ID } from "../lib/constants";

export function useExport(activeQuote: Quote) {
  const [showPrint, setShowPrint] = useState(false);

  const handleExport = useCallback((mode = "print") => {
    setShowPrint(true);
    setTimeout(() => {
      const el = document.getElementById(PRINT_AREA_ID);
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

      const existing = document.getElementById(PRINT_IFRAME_ID);
      if (existing) existing.remove();
      const iframe = document.createElement("iframe") as HTMLIFrameElement;
      iframe.id = PRINT_IFRAME_ID;
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

  return { handleExport, showPrint };
}
