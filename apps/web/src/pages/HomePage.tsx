import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "../features/search/SearchBar";
import { CodeCard } from "../features/codes/CodeCard";
import { PromptCard } from "../features/prompts/PromptCard";
import { CardSkeleton, formatNumber } from "@codevault/ui";
import { statsService } from "../services/stats.service";
import { codesService } from "../services/content.service";
import { promptsService } from "../services/content.service";
import { categoriesService } from "../services/categories.service";
import { usePageMeta } from "../hooks/usePageMeta";

export function HomePage() {
  usePageMeta("CodeVault — أكواد وبرومبتات جاهزة للمطورين", "مكتبة منظمة وقابلة للبحث لأكواد جاهزة وبرومبتات ذكاء اصطناعي احترافية.");
  const stats = useQuery({ queryKey: ["stats"], queryFn: statsService.get });
  const codes = useQuery({
    queryKey: ["codes", "home"],
    queryFn: () => codesService.list({ sort: "newest", limit: 3 }),
  });
  const prompts = useQuery({
    queryKey: ["prompts", "home"],
    queryFn: () => promptsService.list({ sort: "newest", limit: 3 }),
  });
  const categories = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });

  return (
    <div>
      <section className="border-b border-border px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold text-text sm:text-5xl">كل ما تحتاجه لبناء أسرع.</h1>
          <p className="mt-4 text-base text-text-secondary sm:text-lg">
            اكتشف أكوادًا جاهزة وبرومبتات احترافية للبرمجة والذكاء الاصطناعي، منظمة وقابلة للبحث والنسخ والاستخدام
            مباشرة.
          </p>
          <div className="mx-auto mt-8 max-w-xl">
            <SearchBar large />
          </div>

          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "أكواد", value: stats.data?.codes },
              { label: "برومبتات", value: stats.data?.prompts },
              { label: "مستخدمون", value: stats.data?.users },
              { label: "تصنيفات", value: stats.data?.categories },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border bg-bg-card py-4">
                <div className="text-2xl font-bold text-accent">{s.value !== undefined ? formatNumber(s.value) : "—"}</div>
                <div className="mt-1 text-xs text-text-secondary">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text">أحدث الأكواد</h2>
          <Link to="/codes" className="text-sm font-medium text-accent hover:underline">
            عرض الكل
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {codes.isLoading
            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
            : codes.data?.items.map((c) => <CodeCard key={c.id} code={c} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text">أحدث البرومبتات</h2>
          <Link to="/prompts" className="text-sm font-medium text-accent hover:underline">
            عرض الكل
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.isLoading
            ? Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)
            : prompts.data?.items.map((p) => <PromptCard key={p.id} prompt={p} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="mb-6 text-xl font-bold text-text">التصنيفات</h2>
        <div className="flex flex-wrap gap-3">
          {categories.data?.map((c) => (
            <Link
              key={c.id}
              to={`/explore?category=${c.slug}`}
              className="rounded-lg border border-border bg-bg-card px-4 py-2 text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
