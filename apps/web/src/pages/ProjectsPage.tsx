import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CardSkeleton, EmptyState, ErrorState } from "@codevault/ui";
import { projectsService } from "../services/projects.service";
import { usePageMeta } from "../hooks/usePageMeta";

export function ProjectsPage() {
  usePageMeta("المشاريع", "مشاريع كاملة تجمع أكوادًا وبرومبتات مرتبطة ببعضها، مع شرح طريقة التشغيل.");
  const projects = useQuery({ queryKey: ["projects", "public"], queryFn: () => projectsService.list({ limit: 24 }) });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-text sm:text-3xl">المشاريع</h1>
      <p className="mt-2 text-text-secondary">مشاريع كاملة تجمع أكوادًا وبرومبتات مرتبطة ببعضها.</p>

      <div className="mt-8">
        {projects.isError && <ErrorState message="تعذر تحميل المشاريع. حاول مرة أخرى." />}

        {projects.isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!projects.isLoading && !projects.isError && projects.data?.items.length === 0 && (
          <EmptyState title="لا توجد مشاريع بعد" />
        )}

        {!!projects.data?.items.length && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.data.items.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.slug}`}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-bg-card transition-colors hover:border-accent"
              >
                {p.previewImageUrl && (
                  <img src={p.previewImageUrl} alt={p.title} className="h-36 w-full object-cover" />
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-semibold text-text">{p.title}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-text-secondary">{p.description}</p>
                  <div className="mt-3 text-xs text-text-muted">
                    {p._count?.codes ?? 0} كود · {p._count?.prompts ?? 0} برومبت
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
