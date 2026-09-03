import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { searchService } from "../../services/search.service";
import { useDebounce } from "../../hooks/useDebounce";
import { Button } from "@codevault/ui";

export function SearchBar({ large }: { large?: boolean }) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const debounced = useDebounce(value, 250);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["search-suggest", debounced],
    queryFn: () => searchService.suggest(debounced),
    enabled: debounced.trim().length >= 2,
  });

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setFocused(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    setFocused(false);
    navigate(`/explore${value.trim() ? `?q=${encodeURIComponent(value.trim())}` : ""}`);
  }

  const showSuggestions =
    focused && debounced.length >= 2 && data && (data.codes.length || data.prompts.length || data.tags.length);

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={submit} className="flex w-full items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="ابحث عن كود أو Prompt..."
          className={`min-w-0 flex-1 rounded-xl border border-border bg-bg-elevated px-4 text-text placeholder:text-text-muted outline-none focus:border-accent ${
            large ? "h-14 text-base" : "h-11 text-sm"
          }`}
        />
        <Button type="submit" size={large ? "lg" : "md"} className="shrink-0">
          بحث
        </Button>
      </form>

      {showSuggestions && (
        <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border bg-bg-card shadow-xl">
          {data!.codes.length > 0 && (
            <div className="border-b border-border p-2">
              <p className="px-2 py-1 text-xs font-medium text-text-muted">أكواد</p>
              {data!.codes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(`/codes/${c.id}`)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-right text-sm text-text hover:bg-bg-hover"
                >
                  <span>{c.title}</span>
                  <span className="font-mono text-xs text-text-muted">{c.language}</span>
                </button>
              ))}
            </div>
          )}
          {data!.prompts.length > 0 && (
            <div className="border-b border-border p-2">
              <p className="px-2 py-1 text-xs font-medium text-text-muted">برومبتات</p>
              {data!.prompts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/prompts/${p.id}`)}
                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-right text-sm text-text hover:bg-bg-hover"
                >
                  <span>{p.title}</span>
                  {p.aiModel && <span className="font-mono text-xs text-text-muted">{p.aiModel}</span>}
                </button>
              ))}
            </div>
          )}
          {data!.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3">
              {data!.tags.map((t) => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/explore?q=${encodeURIComponent(t.name)}`)}
                  className="rounded-md border border-border px-2 py-1 text-xs text-text-secondary hover:border-accent hover:text-accent"
                >
                  #{t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
