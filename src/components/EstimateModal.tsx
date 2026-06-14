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
