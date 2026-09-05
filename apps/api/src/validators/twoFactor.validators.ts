import { z } from "zod";

// 6 digits for a TOTP code, 10 hex characters for a backup code — both are
// valid wherever a user is asked to prove possession of a second factor.
const twoFactorToken = z
  .string()
  .trim()
  .min(6, "الرمز غير صحيح")
  .max(10, "الرمز غير صحيح");

export const enableTwoFactorSchema = z.object({
  secret: z.string().min(10),
  token: twoFactorToken,
});

export const disableTwoFactorSchema = z.object({
  password: z.string().optional(),
  token: twoFactorToken,
});

export const twoFactorLoginSchema = z.object({
  pendingToken: z.string().min(10),
  token: twoFactorToken,
});
