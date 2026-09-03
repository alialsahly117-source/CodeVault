import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "../features/search/SearchBar";
import { CodeCard } from "../features/codes/CodeCard";
import { PromptCard } from "../features/prompts/PromptCard";
import { CardSkeleton, EmptyState, ErrorState, FilterBar, Select } from "@codevault/ui";
import { LANGUAGES, SORT_OPTIONS } from "@codevault/config";
import { codesService, promptsService } from "../services/content.service";
import { categoriesService } from "../services/categories.service";

type ItemType = "all" | "codes" | "prompts";

export function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const type = (params.get("type") as ItemType) || "all";
  const language = params.get("language") || "";
  const category = params.get("category") || "";
  const sort = (params.get("sort") as never) || "newest";

  function update(patch: Record<string, string>) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    setParams(next, { replace: true });
  }

  const categories = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });

  const codesQuery = useQuery({
    queryKey: ["explore-codes", { q, language, category, sort, type }],
    queryFn: () => codesService.list({ q, language, category, sort, limit: type === "all" ? 6 : 12 }),
    enabled: type === "all" || type === "codes",
  });

  const promptsQuery = useQuery({
    queryKey: ["explore-prompts", { q, category, sort, type }],
    queryFn: () => promptsService.list({ q, category, sort, limit: type === "all" ? 6 : 12 }),
    enabled: type === "all" || type === "prompts",
  });

  const isLoading = codesQuery.isLoading || promptsQuery.isLoading;
  const isError = codesQuery.isError || promptsQuery.isError;
  const isEmpty = useMemo(() => {
    const codesEmpty = !codesQuery.data || codesQuery.data.items.length === 0;
    const promptsEmpty = !promptsQuery.data || promptsQuery.data.items.length === 0;
    if (type === "codes") return codesEmpty;
    if (type === "prompts") return promptsEmpty;
    return codesEmpty && promptsEmpty;
  }, [type, codesQuery.data, promptsQuery.data]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-text sm:text-3xl">استكشف المكتبة</h1>
      <div className="mt-6 max-w-2xl">
        <SearchBar />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-border pb-4">
        {[
          { value: "all", label: "الكل" },
          { value: "codes", label: "أكواد" },
          { value: "prompts", label: "برومبتات" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => update({ type: t.value === "all" ? "" : t.value })}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              type === t.value ? "bg-accent text-white" : "bg-bg-elevated text-text-secondary hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <FilterBar>
          <Select value={language} onChange={(e) => update({ language: e.target.value })} className="w-40">
            <option value="">كل اللغات</option>
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
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
        {isError && <ErrorState message="تعذر تحميل النتائج. حاول مرة أخرى." />}

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {!isLoading && !isError && isEmpty && (
          <EmptyState title="لا توجد نتائج" description="جرّب كلمات بحث أو فلاتر مختلفة." />
        )}

        {!isLoading && !isError && !isEmpty && (
          <div className="flex flex-col gap-10">
            {(type === "all" || type === "codes") && !!codesQuery.data?.items.length && (
              <div>
                {type === "all" && <h2 className="mb-4 text-lg font-bold text-text">الأكواد</h2>}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {codesQuery.data.items.map((c) => (
                    <CodeCard key={c.id} code={c} />
                  ))}
                </div>
              </div>
            )}
            {(type === "all" || type === "prompts") && !!promptsQuery.data?.items.length && (
              <div>
                {type === "all" && <h2 className="mb-4 text-lg font-bold text-text">البرومبتات</h2>}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {promptsQuery.data.items.map((p) => (
                    <PromptCard key={p.id} prompt={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
