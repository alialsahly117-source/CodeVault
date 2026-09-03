import { useState } from "react";
import toast from "react-hot-toast";
import { REPORT_REASONS } from "@codevault/config";
import { Button, Select, Textarea } from "@codevault/ui";

export function ReportDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void>;
}) {
  const [reason, setReason] = useState(REPORT_REASONS[0].value);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit() {
    setLoading(true);
    try {
      await onSubmit(reason, details);
      toast.success("تم إرسال البلاغ، شكرًا لك.");
      setDetails("");
      onClose();
    } catch {
      toast.error("تعذر إرسال البلاغ.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-bg-card p-5">
        <h3 className="text-base font-semibold text-text">الإبلاغ عن هذا المحتوى</h3>
        <div className="mt-4">
          <Select value={reason} onChange={(e) => setReason(e.target.value)}>
            {REPORT_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
          <Textarea
            className="mt-3"
            rows={3}
            placeholder="تفاصيل إضافية (اختياري)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            إلغاء
          </Button>
          <Button variant="danger" size="sm" disabled={loading} onClick={handleSubmit}>
            إرسال البلاغ
          </Button>
        </div>
      </div>
    </div>
  );
}
