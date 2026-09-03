import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button, ConfirmDialog, Pagination, EmptyState, Input, Select, formatDate } from "@codevault/ui";
import { CONTENT_STATUS_LABELS } from "@codevault/config";
import type { ContentStatus } from "@codevault/types";
import { adminService } from "../services/admin.service";
import { ApiError } from "../lib/api";

const WEB_URL = import.meta.env.VITE_WEB_URL || "http://localhost:5173";

export function PromptsPage() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const status = params.get("status") || "";
  const q = params.get("q") || "";
  const queryClient = useQueryClient();

  const prompts = useQuery({
    queryKey: ["admin", "prompts", page, status],
    queryFn: () => adminService.prompts(page, status),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "prompts"] });
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContentStatus }) => adminService.moderatePrompt(id, status),
    onSuccess: () => {
      toast.success("تم تحديث حالة البرومبت");
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر تحديث الحالة"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deletePrompt(id),
    onSuccess: () => {
      toast.success("تم حذف البرومبت");
      setDeleteId(null);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر حذف البرومبت"),
  });

  const visible = q
    ? prompts.data?.items.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()))
    : prompts.data?.items;

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">إدارة البرومبتات</h1>

      <div className="mt-4 flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          placeholder="بحث بالعنوان..."
          defaultValue={q}
          onChange={(e) => setParams(e.target.value ? { status, q: e.target.value } : { status }, { replace: true })}
        />
        <Select
          className="w-44"
          value={status}
          onChange={(e) => setParams(e.target.value ? { status: e.target.value } : {}, { replace: true })}
        >
          <option value="">كل الحالات</option>
          {Object.entries(CONTENT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-bg-elevated text-text-secondary">
            <tr>
              <th className="px-4 py-3 text-right font-medium">العنوان</th>
              <th className="px-4 py-3 text-right font-medium">الكاتب</th>
              <th className="px-4 py-3 text-right font-medium">التصنيف</th>
              <th className="px-4 py-3 text-right font-medium">الحالة</th>
              <th className="px-4 py-3 text-right font-medium">التاريخ</th>
              <th className="px-4 py-3 text-right font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {visible?.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-text">{p.title}</td>
                <td className="px-4 py-3 text-text-secondary">{p.author?.profile?.displayName}</td>
                <td className="px-4 py-3 text-text-secondary">{p.category?.name || "—"}</td>
                <td className="px-4 py-3">
                  <select
                    value={p.status}
                    onChange={(e) => statusMutation.mutate({ id: p.id, status: e.target.value as ContentStatus })}
                    className="rounded-md border border-border bg-bg-elevated px-2 py-1 text-xs text-text"
                  >
                    {Object.entries(CONTENT_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-text-secondary">{formatDate(p.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <a href={`${WEB_URL}/prompts/${p.id}`} target="_blank" rel="noreferrer">
                      <Button variant="secondary" size="sm">
                        عرض
                      </Button>
                    </a>
                    <Button variant="danger" size="sm" onClick={() => setDeleteId(p.id)}>
                      حذف
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!prompts.isLoading && visible?.length === 0 && (
          <div className="p-6">
            <EmptyState title="لا توجد برومبتات" />
          </div>
        )}
      </div>

      {prompts.data && <Pagination page={prompts.data.page} pages={prompts.data.pages} onChange={setPage} />}

      <ConfirmDialog
        open={!!deleteId}
        title="حذف هذا البرومبت؟"
        danger
        confirmLabel="حذف"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
