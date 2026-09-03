import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, Pagination, formatDate } from "@codevault/ui";
import { adminService } from "../services/admin.service";

const ACTION_LABELS: Record<string, string> = {
  change_role: "تغيير صلاحية",
  change_status: "تغيير حالة حساب",
  delete_user: "حذف مستخدم",
  moderate_code: "مراجعة كود",
  delete_code: "حذف كود",
  moderate_prompt: "مراجعة برومبت",
  delete_prompt: "حذف برومبت",
  create_category: "إنشاء تصنيف",
  update_category: "تعديل تصنيف",
  delete_category: "حذف تصنيف",
  update_tag: "تعديل وسم",
  delete_tag: "حذف وسم",
  update_report: "تحديث بلاغ",
  update_settings: "تعديل الإعدادات",
};

export function LogsPage() {
  const [page, setPage] = useState(1);
  const logs = useQuery({ queryKey: ["admin", "logs", page], queryFn: () => adminService.logs(page) });

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">سجل نشاط المشرفين (Audit Log)</h1>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-bg-elevated text-text-secondary">
            <tr>
              <th className="px-4 py-3 text-right font-medium">المشرف</th>
              <th className="px-4 py-3 text-right font-medium">الإجراء</th>
              <th className="px-4 py-3 text-right font-medium">الهدف</th>
              <th className="px-4 py-3 text-right font-medium">IP</th>
              <th className="px-4 py-3 text-right font-medium">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {logs.data?.items.map((log) => (
              <tr key={log.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-text">{log.admin?.profile?.displayName}</td>
                <td className="px-4 py-3">
                  <span className="rounded-md border border-border bg-bg-elevated px-2 py-1 font-mono text-xs text-accent">
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {log.targetType ? `${log.targetType} · ${log.targetId?.slice(0, 10)}…` : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-text-muted">{log.ip || "—"}</td>
                <td className="px-4 py-3 text-text-secondary">{formatDate(log.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logs.isLoading && logs.data?.items.length === 0 && (
          <div className="p-6">
            <EmptyState title="لا يوجد نشاط بعد" />
          </div>
        )}
      </div>

      {logs.data && <Pagination page={logs.data.page} pages={logs.data.pages} onChange={setPage} />}
    </div>
  );
}
