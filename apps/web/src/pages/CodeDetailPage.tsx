import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { codesService } from "../services/content.service";
import { useAuth } from "../features/auth/AuthContext";
import { CodeViewer } from "../features/codes/CodeViewer";
import { ReportDialog } from "../features/reports/ReportDialog";
import { ConfirmDialog, Badge, Button, ErrorState, Skeleton, formatDate, formatNumber } from "@codevault/ui";
import { usePageMeta } from "../hooks/usePageMeta";
import { downloadCodeFile } from "../lib/download";

export function CodeDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: code, isLoading, isError } = useQuery({
    queryKey: ["code", id],
    queryFn: () => codesService.get(id),
  });

  usePageMeta(code?.title || "كود", code?.description);

  const likeMutation = useMutation({
    mutationFn: () => codesService.like(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["code", id] }),
  });

  const saveMutation = useMutation({
    mutationFn: () => codesService.save(id),
    onSuccess: (res) => {
      toast.success(res.saved ? "تم الحفظ في مكتبتك" : "تمت إزالة الحفظ");
      queryClient.invalidateQueries({ queryKey: ["code", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => codesService.remove(id),
    onSuccess: () => {
      toast.success("تم حذف الكود");
      navigate("/codes");
    },
  });

  async function handleCopy() {
    if (!code) return;
    await navigator.clipboard.writeText(code.content);
    toast.success("تم نسخ الكود!");
    codesService.copy(id).catch(() => {});
  }

  function handleDownload() {
    if (!code) return;
    downloadCodeFile(code.title, code.language, code.content);
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: code?.title, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await navigator.clipboard.writeText(url);
    toast.success("تم نسخ رابط المشاركة");
  }

  function requireAuth(action: () => void) {
    if (!isAuthenticated) {
      toast.error("الرجاء تسجيل الدخول أولاً");
      navigate("/login");
      return;
    }
    action();
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-4 h-20 w-full" />
        <Skeleton className="mt-6 h-96 w-full" />
      </div>
    );
  }

  if (isError || !code) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <ErrorState message="لم يتم العثور على هذا الكود." />
      </div>
    );
  }

  const canManage = user && (user.id === code.authorId || user.role === "ADMIN");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">{code.title}</h1>
          <p className="mt-1 font-mono text-sm text-text-muted">
            {code.language}
            {code.framework ? ` • ${code.framework}` : ""}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/codes/${id}/edit`)}>
              تعديل
            </Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              حذف
            </Button>
          </div>
        )}
      </div>

      <p className="mt-4 text-text-secondary">{code.description}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {code.tags.map(({ tag }) => (
          <Badge key={tag.id}>{tag.name}</Badge>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-muted">
        <span>
          بواسطة{" "}
          <Link to="#" className="text-text-secondary hover:text-accent">
            {code.author?.profile?.displayName}
          </Link>
        </span>
        <span>·</span>
        <span>{formatDate(code.createdAt)}</span>
        <span>·</span>
        <span>{formatNumber(code.copyCount)} نسخة</span>
        <span>·</span>
        <span>{formatNumber(code.likeCount)} إعجاب</span>
        {code.project && (
          <>
            <span>·</span>
            <span>
              جزء من مشروع{" "}
              <Link to={`/projects/${code.project.slug}`} className="text-accent hover:underline">
                {code.project.title}
              </Link>
            </span>
          </>
        )}
      </div>

      {!!code.libraries?.length && (
        <div className="mt-4">
          <h3 className="mb-1.5 text-xs font-semibold text-text-muted">المكتبات المطلوبة</h3>
          <div className="flex flex-wrap gap-1.5">
            {code.libraries.map((lib) => (
              <Badge key={lib}>{lib}</Badge>
            ))}
          </div>
        </div>
      )}

      {code.previewImageUrl && (
        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <img src={code.previewImageUrl} alt={code.title} className="max-h-[480px] w-full object-cover" />
        </div>
      )}

      <div className="mt-6">
        <CodeViewer code={code.content} language={code.language} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={handleCopy}>نسخ الكود</Button>
        <Button variant="secondary" onClick={handleDownload}>
          تحميل كملف
        </Button>
        <Button
          variant={code.liked ? "primary" : "secondary"}
          onClick={() => requireAuth(() => likeMutation.mutate())}
        >
          {code.liked ? "أعجبني ✓" : "إعجاب"}
        </Button>
        <Button
          variant={code.saved ? "primary" : "secondary"}
          onClick={() => requireAuth(() => saveMutation.mutate())}
        >
          {code.saved ? "محفوظ ✓" : "حفظ"}
        </Button>
        <Button variant="secondary" onClick={handleShare}>
          مشاركة
        </Button>
        {isAuthenticated && (
          <Button variant="ghost" onClick={() => setReportOpen(true)}>
            إبلاغ
          </Button>
        )}
      </div>

      <ReportDialog
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={(reason, details) => codesService.report(id, reason, details)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="حذف هذا الكود؟"
        description="لا يمكن التراجع عن هذا الإجراء."
        danger
        confirmLabel="حذف"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
