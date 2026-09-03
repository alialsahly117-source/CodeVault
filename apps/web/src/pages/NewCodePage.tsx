import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { codesService } from "../services/content.service";
import { categoriesService } from "../services/categories.service";
import { projectsService } from "../services/projects.service";
import { LANGUAGES, FRAMEWORKS } from "@codevault/config";
import { Input, Label, Textarea, FieldError, Select, TagsInput, Button } from "@codevault/ui";
import { CodeViewer } from "../features/codes/CodeViewer";
import { ApiError } from "../lib/api";
import { useAuth } from "../features/auth/AuthContext";

const schema = z.object({
  title: z.string().min(3, "العنوان قصير جدًا").max(120),
  description: z.string().min(10, "الوصف قصير جدًا").max(500),
  language: z.string().min(1, "اختر لغة البرمجة"),
  framework: z.string().optional(),
  categorySlug: z.string().optional(),
  projectId: z.string().optional(),
  previewImageUrl: z.union([z.string().url("رابط الصورة غير صحيح"), z.literal("")]).optional(),
  content: z.string().min(1, "الكود مطلوب"),
  visibility: z.enum(["PUBLIC", "PRIVATE"]),
});
type FormValues = z.infer<typeof schema>;

export function NewCodePage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { isStaff } = useAuth();
  const [tags, setTags] = useState<string[]>([]);
  const [libraries, setLibraries] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);

  const categories = useQuery({ queryKey: ["categories"], queryFn: categoriesService.list });
  const projects = useQuery({ queryKey: ["projects"], queryFn: () => projectsService.list({ limit: 100 }) });
  const existing = useQuery({
    queryKey: ["code", id],
    queryFn: () => codesService.get(id as string),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { visibility: "PUBLIC" },
  });

  useEffect(() => {
    if (existing.data) {
      reset({
        title: existing.data.title,
        description: existing.data.description,
        language: existing.data.language,
        framework: existing.data.framework || "",
        categorySlug: existing.data.category?.slug || "",
        projectId: existing.data.projectId || "",
        previewImageUrl: existing.data.previewImageUrl || "",
        content: existing.data.content,
        visibility: existing.data.visibility,
      });
      setTags(existing.data.tags.map((t) => t.tag.name));
      setLibraries(existing.data.libraries || []);
    }
  }, [existing.data, reset]);

  async function onSubmit(values: FormValues) {
    try {
      const payload = { ...values, tags, libraries };
      if (isEdit) {
        await codesService.update(id as string, payload);
        toast.success("تم تحديث الكود");
        navigate(`/codes/${id}`);
      } else {
        const created = await codesService.create(payload);
        toast.success("تم نشر الكود");
        navigate(`/codes/${created.id}`);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "تعذر حفظ الكود");
    }
  }

  const content = watch("content") || "";
  const language = watch("language") || "javascript";

  if (!isEdit && !isStaff) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-text">نشر الأكواد قريبًا</h1>
        <p className="mt-2 text-sm text-text-secondary">
          نشر الأكواد الخاصة بك متاح حاليًا لطاقم العمل فقط، وسيصبح متاحًا للجميع عبر اشتراك شهري قريبًا.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-text">{isEdit ? "تعديل الكود" : "إضافة كود جديد"}</h1>

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
          <Label>المكتبات المطلوبة (اختياري)</Label>
          <TagsInput value={libraries} onChange={setLibraries} />
          <p className="mt-1 text-xs text-text-muted">مثال: react, express, prisma</p>
        </div>

        <div>
          <Label>رابط صورة توضيحية (اختياري)</Label>
          <Input
            placeholder="https://example.com/preview.png"
            dir="ltr"
            {...register("previewImageUrl")}
          />
          <FieldError message={errors.previewImageUrl?.message} />
          <p className="mt-1 text-xs text-text-muted">
            صورة تُظهر نتيجة تشغيل الكود، تُعرض في صفحة الكود.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label>الكود</Label>
            <button type="button" onClick={() => setPreview((v) => !v)} className="text-xs text-accent hover:underline">
              {preview ? "تعديل" : "معاينة"}
            </button>
          </div>
          {preview ? (
            <CodeViewer code={content} language={language} />
          ) : (
            <Controller
              control={control}
              name="content"
              render={({ field }) => (
                <Textarea
                  rows={14}
                  className="font-mono"
                  placeholder="الصق الكود هنا..."
                  {...field}
                />
              )}
            />
          )}
          <FieldError message={errors.content?.message} />
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
            {isEdit ? "حفظ التعديلات" : "نشر الكود"}
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate(-1)}>
            إلغاء
          </Button>
        </div>
      </form>
    </div>
  );
}
