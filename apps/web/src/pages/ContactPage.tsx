import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Input, Label, Textarea, FieldError, Button } from "@codevault/ui";
import { usePageMeta } from "../hooks/usePageMeta";

const CONTACT_EMAIL = "alialsahly.ai@gmail.com";

const schema = z.object({
  name: z.string().min(2, "الاسم قصير جدًا").max(80),
  email: z.string().email("بريد إلكتروني غير صحيح"),
  subject: z.string().min(3, "الموضوع قصير جدًا").max(120),
  message: z.string().min(10, "الرسالة قصيرة جدًا").max(2000),
});
type FormValues = z.infer<typeof schema>;

export function ContactPage() {
  usePageMeta("تواصل معنا", "تواصل مع فريق CodeVault عبر البريد الإلكتروني لأي استفسار أو اقتراح أو بلاغ.");
  const [copied, setCopied] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function handleCopyEmail() {
    await navigator.clipboard.writeText(CONTACT_EMAIL);
    setCopied(true);
    toast.success("تم نسخ البريد الإلكتروني");
    setTimeout(() => setCopied(false), 2000);
  }

  function onSubmit(values: FormValues) {
    const subject = `[CodeVault] ${values.subject}`;
    const body = `الاسم: ${values.name}\nالبريد الإلكتروني: ${values.email}\n\n${values.message}`;
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    toast.success("سيتم فتح برنامج البريد الإلكتروني لإرسال رسالتك");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-text sm:text-3xl">تواصل معنا</h1>
      <p className="mt-2 text-text-secondary">
        لأي استفسار أو اقتراح أو مشكلة تقنية، راسلنا مباشرة أو استخدم النموذج أدناه.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-bg-card p-4">
        <span className="font-mono text-sm text-text" dir="ltr">
          {CONTACT_EMAIL}
        </span>
        <Button variant="secondary" size="sm" onClick={handleCopyEmail}>
          {copied ? "تم النسخ ✓" : "نسخ البريد"}
        </Button>
        <a href={`mailto:${CONTACT_EMAIL}`}>
          <Button size="sm">فتح برنامج البريد</Button>
        </a>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>الاسم</Label>
            <Input placeholder="اسمك الكامل" {...register("name")} />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <Label>بريدك الإلكتروني</Label>
            <Input type="email" placeholder="you@example.com" {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
        </div>

        <div>
          <Label>الموضوع</Label>
          <Input placeholder="موضوع الرسالة" {...register("subject")} />
          <FieldError message={errors.subject?.message} />
        </div>

        <div>
          <Label>الرسالة</Label>
          <Textarea rows={6} placeholder="اكتب رسالتك هنا..." {...register("message")} />
          <FieldError message={errors.message?.message} />
        </div>

        <Button type="submit" size="lg" className="w-full sm:w-fit sm:px-10">
          إرسال عبر البريد الإلكتروني
        </Button>
      </form>
    </div>
  );
}
