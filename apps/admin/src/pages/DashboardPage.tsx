import { useQuery } from "@tanstack/react-query";
import { EmptyState } from "@codevault/ui";
import { adminService } from "../services/admin.service";
import { StatCard } from "../features/StatCard";

const TYPE_ICON: Record<string, string> = { code: "💻", prompt: "📝", admin_log: "🛡️" };

export function DashboardPage() {
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: adminService.stats });
  const activity = useQuery({ queryKey: ["admin", "activity"], queryFn: adminService.activity });

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">لوحة القيادة</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="المستخدمون" value={stats.data?.totalUsers} />
        <StatCard label="الأكواد" value={stats.data?.totalCodes} />
        <StatCard label="البرومبتات" value={stats.data?.totalPrompts} />
        <StatCard label="بلاغات قيد الانتظار" value={stats.data?.pendingReports} accent />
        <StatCard label="النسخ" value={stats.data?.totalCopies} />
        <StatCard label="الإعجابات" value={stats.data?.totalLikes} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-text">النشاط الأخير</h2>
        <div className="rounded-xl border border-border bg-bg-card">
          {activity.isLoading && <div className="p-6 text-sm text-text-secondary">جارِ التحميل...</div>}
          {!activity.isLoading && activity.data?.length === 0 && (
            <div className="p-6">
              <EmptyState title="لا يوجد نشاط بعد" />
            </div>
          )}
          {activity.data?.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 px-5 py-3 text-sm ${idx !== 0 ? "border-t border-border" : ""}`}
            >
              <span className="text-base leading-none">{TYPE_ICON[item.type]}</span>
              <span className="flex-1 text-text-secondary">{item.text}</span>
              <span className="shrink-0 text-xs text-text-muted">
                {new Intl.DateTimeFormat("ar-EG", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }).format(
                  new Date(item.createdAt)
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
