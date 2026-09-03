import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Label, Textarea, FieldError, TagsInput, Button } from "@codevault/ui";
import { Input, Select } from "../components/fields";
import { AI_MODELS } from "@codevault/config";
import { contentService } from "../services/content.service";
import { adminService } from "../services/admin.service";
import { projectsService } from "../services/projects.service";
import { ApiError } from "../lib/api";

const variableSchema = z.object({
  key: z.string().min(1, "مطلوب"),
  label: z.string().min(1, "مطلوب"),
  defaultValue: z.string().optional(),
});

const schema = z.object({
  title: z.string().min(3, "العنوان قصير جدًا").max(120),
  description: z.string().min(10, "الوصف قصير جدًا").max(500),
  aiModel: z.string().optional(),
  categorySlug: z.string().optional(),
  projectId: z.string().optional(),
  previewImageUrl: z.union([z.string().url("رابط الصورة غير صحيح"), z.literal("")]).optional(),
  content: z.string().min(1, "نص البرومبت مطلوب"),
  variables: z.array(variableSchema),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});
type FormValues = z.infer<typeof schema>;

export function NewPromptPage() {
  const navigate = useNavigate();
  const [tags, setTags] = useState<string[]>([]);
  const categories = useQuery({ queryKey: ["admin", "categories"], queryFn: adminService.categories });
  const projects = useQuery({ queryKey: ["admin", "projects"], queryFn: () => projectsService.list({ limit: 100 }) });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { visibility: "PUBLIC", variables: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variables" });

  async function onSubmit(values: FormValues) {
    try {
      const created = await contentService.createPrompt({ ...values, tags });
      toast.success("تم نشر البرومبت بنجاح");
      navigate(`/prompts?highlight=${created.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذر نشر البرومبت");
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-text">إضافة برومبت جديد</h1>
      <p className="mt-1 text-sm text-text-secondary">يُنشر باسم حسابك الحالي ويظهر فورًا في المكتبة العامة.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <div>
          <Label>العنوان</Label>
          <Input placeholder="مثال: Senior Code Reviewer Prompt" {...register("title")} />
          <FieldError message={errors.title?.message} />
        </div>

        <div>
          <Label>الوصف</Label>
          <Textarea rows={3} placeholder="وصف مختصر لهدف البرومبت" {...register("description")} />
          <FieldError message={errors.description?.message} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>النموذج المستهدف</Label>
            <Select {...register("aiModel")}>
              <option value="">غير محدد</option>
              {AI_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
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
          <Label>المشروع (اختياري)</Label>
          <Select {...register("projectId")}>
            <option value="">بدون مشروع</option>
            {projects.data?.items.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
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
          <Label>نص البرومبت</Label>
          <Textarea
            rows={10}
            className="font-mono"
            placeholder={"استخدم {{VARIABLE}} لتعريف متغير قابل للتعديل"}
            {...register("content")}
          />
          <FieldError message={errors.content?.message} />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label>المتغيرات (Variables)</Label>
            <button
              type="button"
              onClick={() => append({ key: "", label: "", defaultValue: "" })}
              className="text-xs text-accent hover:underline"
            >
              + إضافة متغير
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 gap-2 rounded-lg border border-border p-3 sm:grid-cols-4">
                <Input placeholder="KEY (مثال: ROLE)" {...register(`variables.${index}.key`)} />
                <Input placeholder="التسمية المعروضة" {...register(`variables.${index}.label`)} />
                <Input placeholder="القيمة الافتراضية" {...register(`variables.${index}.defaultValue`)} />
                <Button type="button" variant="danger" size="sm" onClick={() => remove(index)}>
                  حذف
                </Button>
              </div>
            ))}
          </div>
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
            نشر البرومبت
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}
