import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { authService } from "../services/auth.service";
import { useAuth } from "../features/auth/AuthContext";
import { Input, Label, FieldError, Button } from "@codevault/ui";
import { ApiError } from "../lib/api";

const schema = z.object({
  displayName: z.string().min(2, "الاسم قصير جدًا").max(50),
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});
type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { refetch } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await authService.register(values);
      refetch();
      toast.success("تم إنشاء الحساب بنجاح");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذر إنشاء الحساب");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-text">إنشاء حساب</h1>
      <p className="mt-1 text-sm text-text-secondary">انضم إلى CodeVault وابدأ بمشاركة إبداعاتك.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <div>
          <Label>الاسم</Label>
          <Input placeholder="اسمك الكامل" {...register("displayName")} />
          <FieldError message={errors.displayName?.message} />
        </div>
        <div>
          <Label>البريد الإلكتروني</Label>
          <Input type="email" placeholder="you@example.com" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label>كلمة المرور</Label>
          <Input type="password" placeholder="8 أحرف على الأقل" {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          إنشاء الحساب
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
        لديك حساب بالفعل؟{" "}
        <Link to="/login" className="text-accent hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  );
}
