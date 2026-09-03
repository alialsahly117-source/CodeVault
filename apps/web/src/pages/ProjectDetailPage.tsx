import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, Skeleton, EmptyState, formatDate } from "@codevault/ui";
import { projectsService } from "../services/projects.service";
import { CodeCard } from "../features/codes/CodeCard";
import { PromptCard } from "../features/prompts/PromptCard";
import { usePageMeta } from "../hooks/usePageMeta";

export function ProjectDetailPage() {
  const { slug = "" } = useParams();
  const { data: project, isLoading, isError } = useQuery({
    queryKey: ["project", slug],
    queryFn: () => projectsService.get(slug),
  });

  usePageMeta(project?.title || "مشروع", project?.description);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="mt-4 h-20 w-full" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <ErrorState message="لم يتم العثور على هذا المشروع." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-text sm:text-3xl">{project.title}</h1>
      <p className="mt-2 text-text-secondary">{project.description}</p>
      <div className="mt-2 text-xs text-text-muted">
        بواسطة {project.author?.profile?.displayName} · {formatDate(project.createdAt)}
      </div>

      {project.previewImageUrl && (
        <div className="mt-6 overflow-hidden rounded-xl border border-border">
          <img src={project.previewImageUrl} alt={project.title} className="max-h-[480px] w-full object-cover" />
        </div>
      )}

      {project.instructions && (
        <div className="mt-6 rounded-xl border border-border bg-bg-elevated p-4">
          <h2 className="mb-2 text-sm font-semibold text-text">طريقة التعريف والتشغيل</h2>
          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-text-secondary">
            {project.instructions}
          </pre>
        </div>
      )}

      {!!project.codes?.length && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-text">الأكواد ({project.codes.length})</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {project.codes.map((c) => (
              <CodeCard key={c.id} code={c} />
            ))}
          </div>
        </div>
      )}

      {!!project.prompts?.length && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-text">البرومبتات ({project.prompts.length})</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {project.prompts.map((p) => (
              <PromptCard key={p.id} prompt={p} />
            ))}
          </div>
        </div>
      )}

      {!project.codes?.length && !project.prompts?.length && (
        <div className="mt-8">
          <EmptyState title="لا يوجد محتوى مرتبط بهذا المشروع بعد" />
        </div>
      )}
    </div>
  );
}
