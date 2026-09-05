import { z } from "zod";
import { checkPassword } from "../lib/passwordPolicy.js";
import { optionalHttpsUrl } from "./fields.js";

// 72 bytes is bcrypt's own limit — anything past it is silently ignored by
// the hash, so accepting longer input would be misleading rather than safer.
const passwordField = z
  .string()
  .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
  .max(72, "كلمة المرور طويلة جدًا");

export const registerSchema = z
  .object({
    email: z.string().email("بريد إلكتروني غير صحيح"),
    password: passwordField,
    displayName: z.string().min(2, "الاسم قصير جدًا").max(50),
  })
  .superRefine((data, ctx) => {
    const problem = checkPassword(data.password, data.email);
    if (problem) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: problem.message });
    }
  });

export const loginSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("بريد إلكتروني غير صحيح"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(10),
    password: passwordField,
  })
  .superRefine((data, ctx) => {
    const problem = checkPassword(data.password);
    if (problem) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["password"], message: problem.message });
    }
  });

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(300).optional(),
  avatarUrl: optionalHttpsUrl,
});
