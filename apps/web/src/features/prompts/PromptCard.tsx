import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import type { Prompt } from "@codevault/types";
import { Badge, Button, formatNumber } from "@codevault/ui";
import { promptsService } from "../../services/content.service";

export function PromptCard({ prompt }: { prompt: Prompt }) {
  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(prompt.content);
    toast.success("تم النسخ!");
    promptsService.copy(prompt.id).catch(() => {});
  }

  return (
    <Link
      to={`/prompts/${prompt.id}`}
      className="group flex flex-col rounded-xl border border-border bg-bg-card p-5 transition-colors hover:border-border-strong"
    >
      <h3 className="line-clamp-1 text-base font-semibold text-text group-hover:text-accent">{prompt.title}</h3>
      {prompt.aiModel && <p className="mt-1 font-mono text-xs text-text-muted">{prompt.aiModel}</p>}
      <p className="mt-3 line-clamp-2 text-sm text-text-secondary">{prompt.description}</p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {prompt.tags.slice(0, 3).map(({ tag }) => (
          <Badge key={tag.id}>{tag.name}</Badge>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span>{formatNumber(prompt.copyCount)} نسخة</span>
          <span>·</span>
          <span>{formatNumber(prompt.likeCount)} إعجاب</span>
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
