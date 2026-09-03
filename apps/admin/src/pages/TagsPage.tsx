import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Input, Button, ConfirmDialog, EmptyState } from "@codevault/ui";
import { adminService } from "../services/admin.service";
import { ApiError } from "../lib/api";

export function TagsPage() {
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const tags = useQuery({ queryKey: ["admin", "tags", q], queryFn: () => adminService.tags(q) });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "tags"] });
  }

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => adminService.renameTag(id, name),
    onSuccess: () => {
      toast.success("تم تحديث الوسم");
      setEditingId(null);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر تحديث الوسم"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteTag(id),
    onSuccess: () => {
      toast.success("تم حذف الوسم");
      setDeleteId(null);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر حذف الوسم"),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">إدارة الوسوم (Tags)</h1>

      <div className="mt-4 max-w-sm">
        <Input placeholder="ابحث عن وسم..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-bg-elevated text-text-secondary">
            <tr>
              <th className="px-4 py-3 text-right font-medium">الاسم</th>
              <th className="px-4 py-3 text-right font-medium">مستخدم في</th>
              <th className="px-4 py-3 text-right font-medium">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {tags.data?.map((tag) => (
              <tr key={tag.id} className="border-t border-border">
                <td className="px-4 py-3">
                  {editingId === tag.id ? (
                    <Input
                      autoFocus
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameMutation.mutate({ id: tag.id, name: draftName });
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="h-8 max-w-48"
                    />
                  ) : (
                    <span className="font-medium text-text">{tag.name}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {(tag._count?.codeTags ?? 0) + (tag._count?.promptTags ?? 0)} عنصر
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {editingId === tag.id ? (
                      <Button size="sm" onClick={() => renameMutation.mutate({ id: tag.id, name: draftName })}>
                        حفظ
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingId(tag.id);
                          setDraftName(tag.name);
                        }}
                      >
                        تعديل
                      </Button>
                    )}
                    <Button variant="danger" size="sm" onClick={() => setDeleteId(tag.id)}>
                      حذف
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!tags.isLoading && tags.data?.length === 0 && (
          <div className="p-6">
            <EmptyState title="لا توجد وسوم" />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="حذف هذا الوسم؟"
        danger
        confirmLabel="حذف"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
