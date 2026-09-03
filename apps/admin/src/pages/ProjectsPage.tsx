import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button, ConfirmDialog, EmptyState } from "@codevault/ui";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api";

export function ProjectsPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const projects = useQuery({ queryKey: ["admin", "projects"], queryFn: () => projectsService.list({ limit: 50 }) });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsService.remove(id),
    onSuccess: () => {
      toast.success("تم حذف المشروع");
      setDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر حذف المشروع"),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text">المشاريع</h1>
        <Link to="/projects/new">
          <Button>+ مشروع جديد</Button>
        </Link>
      </div>

      {!projects.data?.items.length && !projects.isLoading && (
        <div className="mt-6">
          <EmptyState title="لا توجد مشاريع بعد" description="أنشئ أول مشروع واربط به الأكواد والبرومبتات." />
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.data?.items.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-bg-card p-4">
            <div className="text-sm font-semibold text-text">{p.title}</div>
            <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{p.description}</p>
            <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
              <span>
                {p._count?.codes ?? 0} كود · {p._count?.prompts ?? 0} برومبت
              </span>
              <Button variant="danger" size="sm" onClick={() => setDeleteId(p.id)}>
                حذف
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="حذف هذا المشروع؟"
        description="لن يتم حذف الأكواد والبرومبتات المرتبطة به، فقط ستُفصل عن المشروع."
        danger
        confirmLabel="حذف"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
