import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { promptsService } from "../services/content.service";
import { categoriesService } from "../services/categories.service";
import { AI_MODELS } from "@codevault/config";
import { Input, Label, Textarea, FieldError, Select, TagsInput, Button } from "@codevault/ui";
import { ApiError } from "../lib/api";
import { useAuth } from "../features/auth/AuthContext";

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
  content: z.string().min(1, "نص البرومبت مطلوب"),
  variables: z.array(variableSchema),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});
type FormValues = z.infer<typeof schema>;

export function NewPromptPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { isStaff } = useAuth();
  const [tags, setTags] = useState<string[]>([]);

  const categories = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });
  const existing = useQuery({
    queryKey: ["prompt", id],
    queryFn: () => promptsService.get(id as string),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { visibility: "PUBLIC", variables: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variables" });

  useEffect(() => {
    if (existing.data) {
      reset({
        title: existing.data.title,
        description: existing.data.description,
        aiModel: existing.data.aiModel || "",
        categorySlug: existing.data.category?.slug || "",
        content: existing.data.content,
        variables: existing.data.variables || [],
        visibility: existing.data.visibility,
      });
      setTags(existing.data.tags.map((t) => t.tag.name));
    }
  }, [existing.data, reset]);

  async function onSubmit(values: FormValues) {
    try {
      const payload = { ...values, tags };
      if (isEdit) {
        await promptsService.update(id as string, payload);
        toast.success("تم تحديث البرومبت");
        navigate(`/prompts/${id}`);
      } else {
        const created = await promptsService.create(payload);
        toast.success("تم نشر البرومبت");
        navigate(`/prompts/${created.id}`);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذر حفظ البرومبت");
    }
  }

  if (!isEdit && !isStaff) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-text">نشر البرومبتات قريبًا</h1>
        <p className="mt-2 text-sm text-text-secondary">
          نشر البرومبتات الخاصة بك متاح حاليًا لطاقم العمل فقط، وسيصبح متاحًا للجميع عبر اشتراك شهري قريبًا.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-text">{isEdit ? "تعديل البرومبت" : "إضافة برومبت جديد"}</h1>

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
          <Label>Tags</Label>
          <TagsInput value={tags} onChange={setTags} />
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
            <option value="PRIVATE">خاص (يظهر لك فقط)</option>
          </Select>
        </div>

        <div className="mt-2 flex gap-3">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isEdit ? "حفظ التعديلات" : "نشر البرومبت"}
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}
