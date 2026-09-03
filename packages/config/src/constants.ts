export const LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "PHP",
  "Java",
  "C#",
  "C++",
  "Dart",
  "SQL",
  "HTML",
  "CSS",
];

export const FRAMEWORKS = ["React", "Next.js", "Node.js", "Flutter", "Laravel", "FastAPI"];

export const AI_MODELS = ["ChatGPT", "Gemini", "Claude", "غير محدد"];

export const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "newest", label: "الأحدث" },
  { value: "most_copied", label: "الأكثر نسخًا" },
  { value: "most_used", label: "الأكثر استخدامًا" },
  { value: "most_liked", label: "الأكثر إعجابًا" },
  { value: "top_rated", label: "الأعلى تقييمًا" },
];

export const REPORT_REASONS: { value: string; label: string }[] = [
  { value: "SPAM", label: "محتوى مزعج (Spam)" },
  { value: "MALICIOUS_CODE", label: "كود ضار" },
  { value: "COPYRIGHT", label: "انتهاك حقوق ملكية" },
  { value: "INAPPROPRIATE", label: "محتوى غير لائق" },
  { value: "OTHER", label: "سبب آخر" },
];

export const ROLE_LABELS: Record<string, string> = {
  USER: "مستخدم",
  EDITOR: "محرر",
  MODERATOR: "مشرف مراجعة",
  ADMIN: "مشرف عام",
};

export const CONTENT_STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "منشور",
  HIDDEN: "مخفي",
  PENDING: "قيد المراجعة",
};

export const REPORT_STATUS_LABELS: Record<string, string> = {
  OPEN: "مفتوح",
  REVIEWED: "تمت المراجعة",
  DISMISSED: "مرفوض",
  ACTION_TAKEN: "تم اتخاذ إجراء",
};

export const USER_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "نشط",
  SUSPENDED: "موقوف",
  BANNED: "محظور",
};
