import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Label, Textarea, FieldError, Button } from "@codevault/ui";
import { Input, Select } from "../components/fields";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api";

const schema = z.object({
  title: z.string().min(3, "العنوان قصير جدًا").max(120),
  description: z.string().min(10, "الوصف قصير جدًا").max(1000),
  instructions: z.string().max(5000).optional(),
  previewImageUrl: z.union([z.string().url("رابط الصورة غير صحيح"), z.literal("")]).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});
type FormValues = z.infer<typeof schema>;

export function NewProjectPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { visibility: "PUBLIC" } });

  async function onSubmit(values: FormValues) {
    try {
      const created = await projectsService.create(values);
      toast.success("تم إنشاء المشروع");
      navigate(`/projects?highlight=${created.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذر إنشاء المشروع");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-text">مشروع جديد</h1>
      <p className="mt-1 text-sm text-text-secondary">
        يجمع المشروع مجموعة أكواد وبرومبتات مرتبطة ببعضها — ستتمكن من ربط أي كود أو برومبت به عند إنشائه.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <div>
          <Label>عنوان المشروع</Label>
          <Input placeholder="مثال: نظام إدارة مهام كامل" {...register("title")} />
          <FieldError message={errors.title?.message} />
        </div>

        <div>
          <Label>الوصف</Label>
          <Textarea rows={3} placeholder="وصف مختصر عن المشروع" {...register("description")} />
          <FieldError message={errors.description?.message} />
        </div>

        <div>
          <Label>طريقة التعريف بالكود / ماذا يفعل / طريقة التشغيل (اختياري)</Label>
          <Textarea
            rows={8}
            className="font-mono"
            placeholder={"اشرح هنا ماذا يفعل المشروع وخطوات تشغيله خطوة بخطوة..."}
            {...register("instructions")}
          />
          <FieldError message={errors.instructions?.message} />
        </div>

        <div>
          <Label>رابط صورة توضيحية (اختياري)</Label>
          <Input placeholder="https://example.com/preview.png" dir="ltr" {...register("previewImageUrl")} />
          <FieldError message={errors.previewImageUrl?.message} />
        </div>

        <div>
          <Label>الظهور (Visibility)</Label>
          <Select {...register("visibility")}>
            <option value="PUBLIC">عام (يظهر للجميع)</option>
            <option value="PRIVATE">خاص</option>
          </Select>
        </div>

        <div className="mt-2 flex gap-3">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            إنشاء المشروع
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}
