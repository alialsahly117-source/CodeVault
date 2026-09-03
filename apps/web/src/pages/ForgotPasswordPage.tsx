import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { authService } from "../services/auth.service";
import { Input, Label, FieldError, Button } from "@codevault/ui";
import { ApiError } from "../lib/api";

const schema = z.object({ email: z.string().email("بريد إلكتروني غير صحيح") });
type FormValues = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await authService.forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حدث خطأ ما");
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-text">إعادة تعيين كلمة المرور</h1>
      <p className="mt-1 text-sm text-text-secondary">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين.</p>

      {sent ? (
        <div className="mt-6 rounded-lg border border-border bg-bg-card p-4 text-sm text-text-secondary">
          إذا كان البريد الإلكتروني مسجلاً لدينا، فستصلك رسالة تحتوي على رابط إعادة التعيين خلال دقائق.
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
          <div>
            <Label>البريد الإلكتروني</Label>
            <Input type="email" placeholder="you@example.com" {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            إرسال رابط إعادة التعيين
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-text-secondary">
        تذكرت كلمة المرور؟{" "}
        <Link to="/login" className="text-accent hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  );
}
