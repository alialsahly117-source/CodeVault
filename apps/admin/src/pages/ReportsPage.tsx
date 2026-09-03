import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Select, Button, ConfirmDialog, EmptyState, formatDate } from "@codevault/ui";
import { REPORT_REASONS, REPORT_STATUS_LABELS } from "@codevault/config";
import type { ReportStatus } from "@codevault/types";
import { adminService } from "../services/admin.service";
import { ApiError } from "../lib/api";

const WEB_URL = import.meta.env.VITE_WEB_URL || "http://localhost:5173";

type ConfirmAction = { id: string; kind: "hide" | "delete" | "ban" } | null;

export function ReportsPage() {
  const [status, setStatus] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const queryClient = useQueryClient();

  const reports = useQuery({ queryKey: ["admin", "reports", status], queryFn: () => adminService.reports(status) });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReportStatus }) => adminService.updateReportStatus(id, status),
    onSuccess: () => {
      toast.success("تم تحديث حالة البلاغ");
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر تحديث الحالة"),
  });

  const hideMutation = useMutation({
    mutationFn: (id: string) => adminService.hideReportedContent(id),
    onSuccess: () => {
      toast.success("تم إخفاء المحتوى");
      setConfirmAction(null);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر إخفاء المحتوى"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteReportedContent(id),
    onSuccess: () => {
      toast.success("تم حذف المحتوى");
      setConfirmAction(null);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر حذف المحتوى"),
  });

  const banMutation = useMutation({
    mutationFn: (id: string) => adminService.banReportedUser(id),
    onSuccess: () => {
      toast.success("تم حظر المستخدم");
      setConfirmAction(null);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر حظر المستخدم"),
  });

  function runConfirmed() {
    if (!confirmAction) return;
    if (confirmAction.kind === "hide") hideMutation.mutate(confirmAction.id);
    if (confirmAction.kind === "delete") deleteMutation.mutate(confirmAction.id);
    if (confirmAction.kind === "ban") banMutation.mutate(confirmAction.id);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">البلاغات (Moderation)</h1>

      <div className="mt-4 w-48">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">كل الحالات</option>
          {Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {reports.data?.length === 0 && <EmptyState title="لا توجد بلاغات" />}
        {reports.data?.map((r) => {
          const item = r.itemType === "CODE" ? r.code : r.prompt;
          const link = r.itemType === "CODE" ? `${WEB_URL}/codes/${item?.id}` : `${WEB_URL}/prompts/${item?.id}`;
          const resolved = r.status === "ACTION_TAKEN" || r.status === "DISMISSED";
          return (
            <div key={r.id} className="rounded-xl border border-border bg-bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {item ? (
                    <a href={link} target="_blank" rel="noreferrer" className="font-medium text-text hover:text-accent">
                      {item.title}
                    </a>
                  ) : (
                    <span className="font-medium text-text-muted">عنصر محذوف</span>
                  )}
                  <p className="mt-1 text-xs text-text-muted">
                    بلّغ عنه {r.reporter?.profile?.displayName} · {formatDate(r.createdAt)}
                  </p>
                  <p className="mt-2 text-sm text-text-secondary">
                    السبب: {REPORT_REASONS.find((x) => x.value === r.reason)?.label || r.reason}
                  </p>
                  {r.details && <p className="mt-1 text-sm text-text-muted">{r.details}</p>}
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    resolved ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  }`}
                >
                  {REPORT_STATUS_LABELS[r.status]}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
                <Button variant="secondary" size="sm" onClick={() => statusMutation.mutate({ id: r.id, status: "REVIEWED" })}>
                  تمت المراجعة
                </Button>
                <Button variant="ghost" size="sm" onClick={() => statusMutation.mutate({ id: r.id, status: "DISMISSED" })}>
                  رفض البلاغ
                </Button>
                {item && (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => setConfirmAction({ id: r.id, kind: "hide" })}>
                      إخفاء المحتوى
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setConfirmAction({ id: r.id, kind: "delete" })}>
                      حذف المحتوى
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => setConfirmAction({ id: r.id, kind: "ban" })}>
                      حظر المستخدم
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        danger
        title={
          confirmAction?.kind === "hide"
            ? "إخفاء هذا المحتوى؟"
            : confirmAction?.kind === "delete"
              ? "حذف هذا المحتوى نهائيًا؟"
              : "حظر صاحب هذا المحتوى؟"
        }
        confirmLabel="تأكيد"
        onCancel={() => setConfirmAction(null)}
        onConfirm={runConfirmed}
      />
    </div>
  );
}
