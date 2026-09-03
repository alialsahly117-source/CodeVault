import { z } from "zod";

export const createCodeSchema = z.object({
  title: z.string().min(3, "العنوان قصير جدًا").max(120),
  description: z.string().min(10, "الوصف قصير جدًا").max(500),
  content: z.string().min(1, "الكود مطلوب"),
  language: z.string().min(1, "اللغة مطلوبة"),
  framework: z.string().max(60).optional(),
  categorySlug: z.string().optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

export const updateCodeSchema = createCodeSchema.partial();

export const variableSchema = z.object({
  key: z.string().min(1).max(40),
  label: z.string().min(1).max(80),
  defaultValue: z.string().max(500).optional(),
});

export const createPromptSchema = z.object({
  title: z.string().min(3, "العنوان قصير جدًا").max(120),
  description: z.string().min(10, "الوصف قصير جدًا").max(500),
  content: z.string().min(1, "نص البرومبت مطلوب"),
  categorySlug: z.string().optional(),
  aiModel: z.string().max(60).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  variables: z.array(variableSchema).max(20).optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
});

export const updatePromptSchema = createPromptSchema.partial();

export const reportSchema = z.object({
  reason: z.enum(["SPAM", "MALICIOUS_CODE", "COPYRIGHT", "INAPPROPRIATE", "OTHER"]),
  details: z.string().max(500).optional(),
});

export const listQuerySchema = z.object({
  q: z.string().max(100).optional(),
  type: z.enum(["all", "codes", "prompts"]).optional(),
  language: z.string().optional(),
  framework: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["newest", "most_copied", "most_used", "most_liked", "top_rated"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
