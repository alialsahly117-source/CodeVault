import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Label, FieldError, Button } from "@codevault/ui";
import { Input } from "../components/fields";
import { authService } from "../services/auth.service";
import { useAuth } from "../features/auth/AuthContext";
import { ApiError } from "../lib/api";

const schema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});
type FormValues = z.infer<typeof schema>;

const codeSchema = z.object({
  token: z.string().min(6, "أدخل الرمز المكوّن من 6 أرقام").max(10, "رمز غير صحيح"),
});
type CodeValues = z.infer<typeof codeSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { refetch } = useAuth();
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const {
    register: registerCode,
    handleSubmit: handleCodeSubmit,
    formState: { errors: codeErrors, isSubmitting: isCodeSubmitting },
  } = useForm<CodeValues>({ resolver: zodResolver(codeSchema) });

  async function onSubmit(values: FormValues) {
    try {
      const result = await authService.login(values.email, values.password);
      if (result.requiresTwoFactor && result.pendingToken) {
        setPendingToken(result.pendingToken);
        return;
      }
      await refetch();
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذر تسجيل الدخول");
    }
  }

  async function onSubmitCode(values: CodeValues) {
    if (!pendingToken) return;
    try {
      await authService.twoFactorLogin(pendingToken, values.token);
      await refetch();
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "الرمز غير صحيح");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-bg-card p-6">
        <div className="mb-6 flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-text">
          <img src="/icon-192.png" alt="" className="h-12 w-12" />
          CodeVault Admin
        </div>

        {pendingToken ? (
          <>
            <h1 className="text-xl font-bold text-text">رمز التحقق</h1>
            <p className="mt-1 text-sm text-text-secondary">
              أدخل الرمز من تطبيق المصادقة، أو أحد رموز الاسترجاع الاحتياطية.
            </p>

            <form onSubmit={handleCodeSubmit(onSubmitCode)} className="mt-6 flex flex-col gap-4">
              <div>
                <Label>الرمز</Label>
                <Input
                  autoFocus
                  inputMode="numeric"
                  placeholder="123456"
                  {...registerCode("token")}
                />
                <FieldError message={codeErrors.token?.message} />
              </div>
              <Button type="submit" size="lg" disabled={isCodeSubmitting}>
                تأكيد
              </Button>
              <button
                type="button"
                onClick={() => setPendingToken(null)}
                className="text-sm text-text-secondary hover:text-text"
              >
                العودة لتسجيل الدخول
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold text-text">تسجيل دخول المشرفين</h1>
            <p className="mt-1 text-sm text-text-secondary">هذه اللوحة مخصصة لفريق العمل فقط.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
              <div>
                <Label>البريد الإلكتروني</Label>
                <Input type="email" placeholder="you@codevault.dev" {...register("email")} />
                <FieldError message={errors.email?.message} />
              </div>
              <div>
                <Label>كلمة المرور</Label>
                <Input type="password" placeholder="••••••••" {...register("password")} />
                <FieldError message={errors.password?.message} />
              </div>
              <Button type="submit" size="lg" disabled={isSubmitting}>
                تسجيل الدخول
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
