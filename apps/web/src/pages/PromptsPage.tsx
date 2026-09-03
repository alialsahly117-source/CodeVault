import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "../features/search/SearchBar";
import { PromptCard } from "../features/prompts/PromptCard";
import { CardSkeleton, EmptyState, ErrorState, FilterBar, Select, Pagination } from "@codevault/ui";
import { SORT_OPTIONS } from "@codevault/config";
import { promptsService } from "../services/content.service";
import { categoriesService } from "../services/categories.service";

export function PromptsPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const sort = (params.get("sort") as never) || "newest";
  const page = Number(params.get("page")) || 1;

  function update(patch: Record<string, string>) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    if (!("page" in patch)) next.delete("page");
    setParams(next, { replace: true });
  }

  const categories = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });
  const prompts = useQuery({
    queryKey: ["prompts", { q, category, sort, page }],
    queryFn: () => promptsService.list({ q, category, sort, page, limit: 12 }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-text sm:text-3xl">مكتبة البرومبتات</h1>
      <p className="mt-2 text-text-secondary">اكتشف برومبتات جاهزة ومحسنة للبرمجة والذكاء الاصطناعي والعمل والإنتاجية.</p>

      <div className="mt-6 max-w-2xl">
        <SearchBar />
      </div>

      <div className="mt-6">
        <FilterBar>
          <Select value={category} onChange={(e) => update({ category: e.target.value })} className="w-48">
            <option value="">كل التصنيفات</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={sort} onChange={(e) => update({ sort: e.target.value })} className="w-44">
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Select>
        </FilterBar>
      </div>

      <div className="mt-8">
        {prompts.isError && <ErrorState message="تعذر تحميل البرومبتات. حاول مرة أخرى." />}

        {prompts.isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!prompts.isLoading && !prompts.isError && prompts.data?.items.length === 0 && (
          <EmptyState title="لا توجد برومبتات مطابقة" description="جرّب تغيير الفلاتر أو كلمة البحث." />
        )}

        {!prompts.isLoading && !prompts.isError && !!prompts.data?.items.length && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {prompts.data.items.map((p) => (
                <PromptCard key={p.id} prompt={p} />
              ))}
            </div>
            <Pagination
              page={prompts.data.page}
              pages={prompts.data.pages}
              onChange={(p) => update({ page: String(p) })}
            />
          </>
        )}
      </div>
    </div>
  );
}
