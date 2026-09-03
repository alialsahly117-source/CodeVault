import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { promptsService } from "../services/content.service";
import { useAuth } from "../features/auth/AuthContext";
import { ReportDialog } from "../features/reports/ReportDialog";
import {
  ConfirmDialog,
  Badge,
  Button,
  Input,
  Label,
  ErrorState,
  Skeleton,
  formatDate,
  formatNumber,
} from "@codevault/ui";
import { usePageMeta } from "../hooks/usePageMeta";

export function PromptDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const { data: prompt, isLoading, isError } = useQuery({
    queryKey: ["prompt", id],
    queryFn: () => promptsService.get(id),
  });

  usePageMeta(prompt?.title || "برومبت", prompt?.description);

  const rendered = useMemo(() => {
    if (!prompt) return "";
    let text = prompt.content;
    (prompt.variables || []).forEach((v) => {
      const value = values[v.key] ?? v.defaultValue ?? `{{${v.key}}}`;
      text = text.split(`{{${v.key}}}`).join(value);
    });
    return text;
  }, [prompt, values]);

  const likeMutation = useMutation({
    mutationFn: () => promptsService.like(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["prompt", id] }),
  });

  const saveMutation = useMutation({
    mutationFn: () => promptsService.save(id),
    onSuccess: (res) => {
      toast.success(res.saved ? "تم الحفظ في مكتبتك" : "تمت إزالة الحفظ");
      queryClient.invalidateQueries({ queryKey: ["prompt", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => promptsService.remove(id),
    onSuccess: () => {
      toast.success("تم حذف البرومبت");
      navigate("/prompts");
    },
  });

  async function handleCopy() {
    await navigator.clipboard.writeText(rendered);
    toast.success("تم نسخ البرومبت!");
    promptsService.copy(id).catch(() => {});
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: prompt?.title, url });
        return;
      } catch {
        /* cancelled */
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
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  if (isError || !prompt) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <ErrorState message="لم يتم العثور على هذا البرومبت." />
      </div>
    );
  }

  const canManage = user && (user.id === prompt.authorId || user.role === "ADMIN");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text sm:text-3xl">{prompt.title}</h1>
          {prompt.aiModel && <p className="mt-1 font-mono text-sm text-text-muted">{prompt.aiModel}</p>}
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(`/prompts/${id}/edit`)}>
              تعديل
            </Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              حذف
            </Button>
          </div>
        )}
      </div>

      <p className="mt-4 text-text-secondary">{prompt.description}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {prompt.tags.map(({ tag }) => (
          <Badge key={tag.id}>{tag.name}</Badge>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-muted">
        <span>
          بواسطة{" "}
          <Link to="#" className="text-text-secondary hover:text-accent">
            {prompt.author?.profile?.displayName}
          </Link>
        </span>
        <span>·</span>
        <span>{formatDate(prompt.createdAt)}</span>
        <span>·</span>
        <span>{formatNumber(prompt.copyCount)} نسخة</span>
        <span>·</span>
        <span>{formatNumber(prompt.likeCount)} إعجاب</span>
      </div>

      {!!prompt.variables?.length && (
        <div className="mt-6 rounded-xl border border-border bg-bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-text">متغيرات البرومبت</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {prompt.variables.map((v) => (
              <div key={v.key}>
                <Label>{v.label}</Label>
                <Input
                  placeholder={v.defaultValue || v.key}
                  value={values[v.key] ?? ""}
                  onChange={(e) => setValues((old) => ({ ...old, [v.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-border bg-bg-elevated p-4">
        <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-text">{rendered}</pre>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={handleCopy}>نسخ البرومبت</Button>
        <Button
          variant={prompt.liked ? "primary" : "secondary"}
          onClick={() => requireAuth(() => likeMutation.mutate())}
        >
          {prompt.liked ? "أعجبني ✓" : "إعجاب"}
        </Button>
        <Button
          variant={prompt.saved ? "primary" : "secondary"}
          onClick={() => requireAuth(() => saveMutation.mutate())}
        >
          {prompt.saved ? "محفوظ ✓" : "حفظ"}
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
        onSubmit={(reason, details) => promptsService.report(id, reason, details)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="حذف هذا البرومبت؟"
        description="لا يمكن التراجع عن هذا الإجراء."
        danger
        confirmLabel="حذف"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}
