import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import type { Code } from "@codevault/types";
import { Badge, Button, formatNumber } from "@codevault/ui";
import { codesService } from "../../services/content.service";

export function CodeCard({ code }: { code: Code }) {
  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(code.content);
    toast.success("تم النسخ!");
    codesService.copy(code.id).catch(() => {});
  }

  return (
    <Link
      to={`/codes/${code.id}`}
      className="group flex flex-col rounded-xl border border-border bg-bg-card p-5 transition-colors hover:border-border-strong"
    >
      <h3 className="line-clamp-1 text-base font-semibold text-text group-hover:text-accent">{code.title}</h3>
      <p className="mt-1 font-mono text-xs text-text-muted">
        {code.language}
        {code.framework ? ` • ${code.framework}` : ""}
      </p>
      <p className="mt-3 line-clamp-2 text-sm text-text-secondary">{code.description}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(code.tags ?? []).slice(0, 3).map(({ tag }) => (
          <Badge key={tag.id}>{tag.name}</Badge>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span>{formatNumber(code.copyCount)} نسخة</span>
          <span>·</span>
          <span>{formatNumber(code.likeCount)} إعجاب</span>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            نسخ
          </Button>
        </div>
      </div>
    </Link>
  );
}
