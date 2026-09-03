import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Button, ConfirmDialog, Pagination, EmptyState, formatDate } from "@codevault/ui";
import { Input } from "../components/fields";
import { ROLE_LABELS, USER_STATUS_LABELS } from "@codevault/config";
import type { Role, UserStatus } from "@codevault/types";
import { adminService } from "../services/admin.service";
import { useAuth } from "../features/auth/AuthContext";
import { ApiError } from "../lib/api";

export function UsersPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const users = useQuery({ queryKey: ["admin", "users", q, page], queryFn: () => adminService.users(q, page) });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
  }

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => adminService.changeRole(id, role),
    onSuccess: () => {
      toast.success("تم تحديث الصلاحية");
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر تحديث الصلاحية"),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: UserStatus }) => adminService.changeStatus(id, status),
    onSuccess: () => {
      toast.success("تم تحديث حالة الحساب");
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر تحديث الحالة"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteUser(id),
    onSuccess: () => {
      toast.success("تم حذف المستخدم");
      setDeleteId(null);
      invalidate();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "تعذر حذف المستخدم"),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">إدارة المستخدمين</h1>
      <div className="mt-4 max-w-sm">
        <Input
          placeholder="ابحث بالاسم أو البريد الإلكتروني..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-bg-elevated text-text-secondary">
            <tr>
              <th className="px-4 py-3 text-right font-medium">المستخدم</th>
              <th className="px-4 py-3 text-right font-medium">الصلاحية</th>
              <th className="px-4 py-3 text-right font-medium">الحالة</th>
              <th className="px-4 py-3 text-right font-medium">تاريخ الانضمام</th>
              <th className="px-4 py-3 text-right font-medium">آخر دخول</th>
              {isAdmin && <th className="px-4 py-3 text-right font-medium">إجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {users.data?.items.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="font-medium text-text">{u.profile?.displayName}</div>
                  <div className="text-xs text-text-muted">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  {isAdmin ? (
                    <select
                      value={u.role}
                      onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value as Role })}
                      className="rounded-md border border-border bg-bg-elevated px-2 py-1 text-xs text-text"
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-xs text-text-secondary">{ROLE_LABELS[u.role]}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      u.status === "BANNED"
                        ? "bg-danger/10 text-danger"
                        : u.status === "SUSPENDED"
                          ? "bg-warning/10 text-warning"
                          : "bg-success/10 text-success"
                    }`}
                  >
                    {u.status ? USER_STATUS_LABELS[u.status] : "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{formatDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {u.lastLoginAt ? formatDate(u.lastLoginAt) : "لم يسجّل الدخول بعد"}
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {u.status !== "SUSPENDED" && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => statusMutation.mutate({ id: u.id, status: "SUSPENDED" })}
                        >
                          إيقاف
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          statusMutation.mutate({ id: u.id, status: u.status === "BANNED" ? "ACTIVE" : "BANNED" })
                        }
                      >
                        {u.status === "BANNED" ? "إلغاء الحظر" : "حظر"}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteId(u.id)}>
                        حذف
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!users.isLoading && users.data?.items.length === 0 && (
          <div className="p-6">
            <EmptyState title="لا يوجد مستخدمون مطابقون" />
          </div>
        )}
      </div>

      {users.data && <Pagination page={users.data.page} pages={users.data.pages} onChange={setPage} />}

      <ConfirmDialog
        open={!!deleteId}
        title="حذف هذا المستخدم؟"
        description="سيتم حذف الحساب وكل بياناته نهائيًا."
        danger
        confirmLabel="حذف"
        onCancel={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}
