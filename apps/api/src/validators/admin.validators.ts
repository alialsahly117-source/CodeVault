import { z } from "zod";

export const changeRoleSchema = z.object({
  role: z.enum(["USER", "EDITOR", "MODERATOR", "ADMIN"]),
});

export const banUserSchema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]),
});

export const moderateContentSchema = z.object({
  status: z.enum(["PUBLISHED", "HIDDEN", "PENDING"]),
});

export const reportStatusSchema = z.object({
  status: z.enum(["OPEN", "REVIEWED", "DISMISSED", "ACTION_TAKEN"]),
});

export const upsertCategorySchema = z.object({
  name: z.string().min(2).max(60),
  type: z.enum(["PROGRAMMING", "AI", "PROMPT_TYPE", "GENERAL"]).default("GENERAL"),
  parentId: z.string().optional().nullable(),
});
