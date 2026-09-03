import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { authService } from "../services/auth.service";
import { Input, Label, FieldError, Button } from "@codevault/ui";
import { ApiError } from "../lib/api";

const schema = z.object({ password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل") });
type FormValues = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      await authService.resetPassword(token, values.password);
      toast.success("تم تحديث كلمة المرور، يمكنك تسجيل الدخول الآن");
      navigate("/login");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "حدث خطأ ما");
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center text-text-secondary sm:px-6">
        رابط إعادة التعيين غير صالح.
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-text">كلمة مرور جديدة</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <div>
          <Label>كلمة المرور الجديدة</Label>
          <Input type="password" placeholder="8 أحرف على الأقل" {...register("password")} />
          <FieldError message={errors.password?.message} />
        </div>
        <Button type="submit" size="lg" disabled={isSubmitting}>
          تحديث كلمة المرور
        </Button>
      </form>
    </div>
  );
}
