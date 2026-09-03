import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { authService } from "../services/auth.service";
import { useAuth } from "../features/auth/AuthContext";
import { Input, Label, FieldError, Button } from "@codevault/ui";
import { ApiError } from "../lib/api";

const schema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { refetch } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "google_not_configured") {
      toast.error("تسجيل الدخول عبر Google غير مُفعّل حاليًا على هذا الخادم.");
    } else if (error === "google") {
      toast.error("تعذر تسجيل الدخول عبر Google.");
    }
  }, [searchParams]);

  async function onSubmit(values: FormValues) {
    try {
      await authService.login(values);
      refetch();
      toast.success("تم تسجيل الدخول بنجاح");
      const from = (location.state as { from?: string })?.from || "/";
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذر تسجيل الدخول");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-text">تسجيل الدخول</h1>
      <p className="mt-1 text-sm text-text-secondary">مرحبًا بعودتك إلى CodeVault.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <div>
          <Label>البريد الإلكتروني</Label>
          <Input type="email" placeholder="you@example.com" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label>كلمة المرور</Label>
            <Link to="/forgot-password" className="text-xs text-accent hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>
          <Input type="password" placeholder="••••••••" {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          تسجيل الدخول
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-text-muted">
        <div className="h-px flex-1 bg-border" />
        أو
        <div className="h-px flex-1 bg-border" />
      </div>

      <a href={`${import.meta.env.VITE_API_URL || "/api"}/auth/google`}>
        <Button variant="secondary" size="lg" className="w-full" type="button">
          المتابعة عبر Google
        </Button>
      </a>

      <p className="mt-6 text-center text-sm text-text-secondary">
        ليس لديك حساب؟{" "}
        <Link to="/register" className="text-accent hover:underline">
          إنشاء حساب
        </Link>
      </p>
    </div>
  );
}
