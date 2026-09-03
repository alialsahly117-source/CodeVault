import { Button } from "./Button";

export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;

  const items: (number | "...")[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) items.push(i);
    else if (items[items.length - 1] !== "...") items.push("...");
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        السابق
      </Button>
      {items.map((it, idx) =>
        it === "..." ? (
          <span key={`dots-${idx}`} className="px-2 text-text-muted">
            …
          </span>
        ) : (
          <button
            key={it}
            onClick={() => onChange(it)}
            className={`h-8 min-w-8 rounded-md px-2 text-sm font-medium ${
              it === page ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-hover"
            }`}
          >
            {it}
          </button>
        )
      )}
      <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        التالي
      </Button>
    </div>
  );
}
