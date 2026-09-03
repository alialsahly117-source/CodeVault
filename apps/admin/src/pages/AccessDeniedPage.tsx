import { Button } from "@codevault/ui";
import { useAuth } from "../features/auth/AuthContext";
import { authService } from "../services/auth.service";

export function AccessDeniedPage() {
  const { user, refetch } = useAuth();

  async function handleLogout() {
    await authService.logout();
    refetch();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14.18A2 2 0 003.82 21h16.36a2 2 0 001.71-3.96L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <h1 className="mt-4 text-xl font-bold text-text">لا تملك صلاحية الوصول</h1>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">
        {user
          ? `حساب "${user.email}" ليس لديه صلاحية الدخول إلى لوحة التحكم. هذه اللوحة مخصصة لفريق العمل (محرر، مشرف مراجعة، مشرف عام) فقط.`
          : "الرجاء تسجيل الدخول بحساب يملك صلاحية الوصول."}
      </p>
      {user && (
        <Button variant="secondary" className="mt-6" onClick={handleLogout}>
          تسجيل الخروج
        </Button>
      )}
    </div>
  );
}
