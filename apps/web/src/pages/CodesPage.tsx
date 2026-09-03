import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "../features/search/SearchBar";
import { CodeCard } from "../features/codes/CodeCard";
import { CardSkeleton, EmptyState, ErrorState, FilterBar, Select, Pagination } from "@codevault/ui";
import { LANGUAGES, FRAMEWORKS, SORT_OPTIONS } from "@codevault/config";
import { codesService } from "../services/content.service";
import { categoriesService } from "../services/categories.service";

export function CodesPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const language = params.get("language") || "";
  const framework = params.get("framework") || "";
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
  const codes = useQuery({
    queryKey: ["codes", { q, language, framework, category, sort, page }],
    queryFn: () => codesService.list({ q, language, framework, category, sort, page, limit: 12 }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-text sm:text-3xl">مكتبة الأكواد</h1>
      <p className="mt-2 text-text-secondary">أكواد جاهزة وقابلة لإعادة الاستخدام لمختلف لغات البرمجة والتقنيات.</p>

      <div className="mt-6 max-w-2xl">
        <SearchBar />
      </div>

      <div className="mt-6">
        <FilterBar>
          <Select value={language} onChange={(e) => update({ language: e.target.value })} className="w-40">
            <option value="">كل اللغات</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </Select>
          <Select value={framework} onChange={(e) => update({ framework: e.target.value })} className="w-40">
            <option value="">كل التقنيات</option>
            {FRAMEWORKS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
          <Select value={category} onChange={(e) => update({ category: e.target.value })} className="w-44">
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
        {codes.isError && <ErrorState message="تعذر تحميل الأكواد. حاول مرة أخرى." />}

        {codes.isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!codes.isLoading && !codes.isError && codes.data?.items.length === 0 && (
          <EmptyState title="لا توجد أكواد مطابقة" description="جرّب تغيير الفلاتر أو كلمة البحث." />
        )}

        {!codes.isLoading && !codes.isError && !!codes.data?.items.length && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {codes.data.items.map((c) => (
                <CodeCard key={c.id} code={c} />
              ))}
            </div>
            <Pagination page={codes.data.page} pages={codes.data.pages} onChange={(p) => update({ page: String(p) })} />
          </>
        )}
      </div>
    </div>
  );
}
