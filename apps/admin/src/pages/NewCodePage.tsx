import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Label, Textarea, FieldError, TagsInput, Button } from "@codevault/ui";
import { Input, Select } from "../components/fields";
import { LANGUAGES, FRAMEWORKS } from "@codevault/config";
import { contentService } from "../services/content.service";
import { adminService } from "../services/admin.service";
import { ApiError } from "../lib/api";
import { useState } from "react";

const schema = z.object({
  title: z.string().min(3, "العنوان قصير جدًا").max(120),
  description: z.string().min(10, "الوصف قصير جدًا").max(500),
  language: z.string().min(1, "اختر لغة البرمجة"),
  framework: z.string().optional(),
  categorySlug: z.string().optional(),
  previewImageUrl: z.union([z.string().url("رابط الصورة غير صحيح"), z.literal("")]).optional(),
  content: z.string().min(1, "الكود مطلوب"),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});
type FormValues = z.infer<typeof schema>;

export function NewCodePage() {
  const navigate = useNavigate();
  const [tags, setTags] = useState<string[]>([]);
  const categories = useQuery({ queryKey: ["admin", "categories"], queryFn: adminService.categories });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { visibility: "PUBLIC" } });

  async function onSubmit(values: FormValues) {
    try {
      const created = await contentService.createCode({ ...values, tags });
      toast.success("تم نشر الكود بنجاح");
      navigate(`/codes?highlight=${created.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذر نشر الكود");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-text">إضافة كود جديد</h1>
      <p className="mt-1 text-sm text-text-secondary">يُنشر باسم حسابك الحالي ويظهر فورًا في المكتبة العامة.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <div>
          <Label>العنوان</Label>
          <Input placeholder="مثال: JWT Authentication Middleware" {...register("title")} />
          <FieldError message={errors.title?.message} />
        </div>

        <div>
          <Label>الوصف</Label>
          <Textarea rows={3} placeholder="وصف مختصر لما يفعله الكود" {...register("description")} />
          <FieldError message={errors.description?.message} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>لغة البرمجة</Label>
            <Select {...register("language")}>
              <option value="">اختر اللغة</option>
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
            <FieldError message={errors.language?.message} />
          </div>
          <div>
            <Label>Framework / Technology</Label>
            <Select {...register("framework")}>
              <option value="">بدون</option>
              {FRAMEWORKS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>التصنيف</Label>
            <Select {...register("categorySlug")}>
              <option value="">بدون تصنيف</option>
              {categories.data?.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label>Tags</Label>
          <TagsInput value={tags} onChange={setTags} />
        </div>

        <div>
          <Label>رابط صورة توضيحية (اختياري)</Label>
          <Input placeholder="https://example.com/preview.png" dir="ltr" {...register("previewImageUrl")} />
          <FieldError message={errors.previewImageUrl?.message} />
        </div>

        <div>
          <Label>الكود</Label>
          <Controller
            control={control}
            name="content"
            render={({ field }) => (
              <Textarea rows={14} className="font-mono" placeholder="الصق الكود هنا..." {...field} />
            )}
          />
          <FieldError message={errors.content?.message} />
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
            نشر الكود
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}
