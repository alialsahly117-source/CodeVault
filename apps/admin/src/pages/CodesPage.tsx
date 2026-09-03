import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button, ConfirmDialog, Pagination, EmptyState, Input, Select, formatDate } from "@codevault/ui";
import { CONTENT_STATUS_LABELS } from "@codevault/config";
import type { ContentStatus } from "@codevault/types";
import { adminService } from "../services/admin.service";
import { ApiError } from "../lib/api";

const WEB_URL = import.meta.env.VITE_WEB_URL || "http://localhost:5173";

export function CodesPage() {
  const [params, setParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const status = params.get("status") || "";
  const q = params.get("q") || "";
  const queryClient = useQueryClient();

  const codes = useQuery({
    queryKey: ["admin", "codes", page, status],
    queryFn: () => adminService.codes(page, status),
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "codes"] });
  }

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContentStatus }) => adminService.moderateCode(id, status),
    onSuccess: () => {
      toast.success("تم تحديث حالة الكود");
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر تحديث الحالة"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCode(id),
    onSuccess: () => {
      toast.success("تم حذف الكود");
      setDeleteId(null);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر حذف الكود"),
  });

  const visible = q ? codes.data?.items.filter((c) => c.title.toLowerCase().includes(q.toLowerCase())) : codes.data?.items;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-text">إدارة الأكواد</h1>
        <Link to="/codes/new">
          <Button size="sm">+ إضافة كود</Button>
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          placeholder="بحث بالعنوان..."
          defaultValue={q}
          onChange={(e) =>
            setParams(e.target.value ? { status, q: e.target.value } : { status }, { replace: true })
          }
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
            {visible?.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <span className="font-medium text-text">{c.title}</span>
                  <div className="font-mono text-xs text-text-muted">{c.language}</div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{c.author?.profile?.displayName}</td>
                <td className="px-4 py-3 text-text-secondary">{c.category?.name || "—"}</td>
                <td className="px-4 py-3">
                  <select
                    value={c.status}
                    onChange={(e) => statusMutation.mutate({ id: c.id, status: e.target.value as ContentStatus })}
                    className="rounded-md border border-border bg-bg-elevated px-2 py-1 text-xs text-text"
                  >
                    {Object.entries(CONTENT_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-text-secondary">{formatDate(c.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <a href={`${WEB_URL}/codes/${c.id}`} target="_blank" rel="noreferrer">
                      <Button variant="secondary" size="sm">
                        عرض
                      </Button>
                    </a>
                    <Button variant="danger" size="sm" onClick={() => setDeleteId(c.id)}>
                      حذف
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!codes.isLoading && visible?.length === 0 && (
          <div className="p-6">
            <EmptyState title="لا توجد أكواد" />
          </div>
        )}
      </div>

      {codes.data && <Pagination page={codes.data.page} pages={codes.data.pages} onChange={setPage} />}

      <ConfirmDialog
        open={!!deleteId}
        title="حذف هذا الكود؟"
        danger
        confirmLabel="حذف"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
