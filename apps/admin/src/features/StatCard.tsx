import { formatNumber } from "@codevault/ui";

export function StatCard({ label, value, accent }: { label: string; value?: number; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <div className={`text-2xl font-bold ${accent ? "text-accent" : "text-text"}`}>
        {value !== undefined ? formatNumber(value) : "—"}
      </div>
      <div className="mt-1 text-sm text-text-secondary">{label}</div>
    </div>
  );
}
