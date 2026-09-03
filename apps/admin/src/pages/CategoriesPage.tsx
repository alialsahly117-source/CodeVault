import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Input, Select, Button, ConfirmDialog } from "@codevault/ui";
import { adminService } from "../services/admin.service";
import { ApiError } from "../lib/api";

const TYPE_LABEL: Record<string, string> = {
  PROGRAMMING: "برمجة",
  AI: "ذكاء اصطناعي",
  PROMPT_TYPE: "نوع برومبت",
  GENERAL: "عام",
};

export function CategoriesPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState("GENERAL");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const categories = useQuery({ queryKey: ["admin", "categories"], queryFn: adminService.categories });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
  }

  const createMutation = useMutation({
    mutationFn: () => adminService.createCategory({ name, type }),
    onSuccess: () => {
      toast.success("تم إنشاء التصنيف");
      setName("");
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر إنشاء التصنيف"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCategory(id),
    onSuccess: () => {
      toast.success("تم حذف التصنيف");
      setDeleteId(null);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر حذف التصنيف"),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">إدارة التصنيفات</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) createMutation.mutate();
        }}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-bg-card p-4"
      >
        <div className="min-w-40 flex-1">
          <label className="mb-1 block text-xs text-text-secondary">اسم التصنيف</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: Vue.js" />
        </div>
        <div className="w-44">
          <label className="mb-1 block text-xs text-text-secondary">النوع</label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {Object.entries(TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" disabled={createMutation.isPending}>
          إضافة
        </Button>
      </form>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.data?.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-lg border border-border bg-bg-card px-4 py-3"
          >
            <div>
              <div className="text-sm font-medium text-text">{c.name}</div>
              <div className="text-xs text-text-muted">
                {TYPE_LABEL[c.type]} · {c._count?.codes ?? 0} كود · {c._count?.prompts ?? 0} برومبت
              </div>
            </div>
            <Button variant="danger" size="sm" onClick={() => setDeleteId(c.id)}>
              حذف
            </Button>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="حذف هذا التصنيف؟"
        danger
        confirmLabel="حذف"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
